const execa = require('execa');
const isReachable = require('is-reachable');
const path = require('path');
const fs = require('fs');

const TracerbenchExecutable = path.resolve(
  __dirname,
  '../node_modules/tracerbench/bin/run'
);

function parseMarkers(markerStr) {
  let markers = markerStr.split(',');
  let phases = [];

  if (markers[0] !== 'navigationStart') {
    markers.unshift('navigationStart');
  }

  for (let i = 0; i < markers.length; i++) {
    let name = markers[i];
    let nextMarker = i === markers.length - 1 ? 'Test End' : markers[i + 1];
    let phaseName = `Phase [${name}] => [${nextMarker}]`;

    phases.push({ label: phaseName, start: name });
  }

  return phases;
}

async function execWithLog(cmd) {
  console.log(`\n🟡 ${cmd}\n`);
  let exe = execa.command(cmd, { shell: 'bash' });
  exe.stdout.pipe(process.stdout);
  exe.stderr.pipe(process.stderr);

  try {
    let result = await exe;
    return result;
  } catch (e) {
    throw e;
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForServer(url, _tries = 0) {
  if (_tries === 0) {
    console.groupCollapsed(`checking reachable ${url}`);
  }
  if (await isReachable(url)) {
    console.groupEnd();
    return true;
  }
  if (_tries > 500) {
    console.groupEnd();
    throw new Error(
      `Timeout Exceeded (${
        (_tries * 500) / 1000
      }s): Unable to reach server at ${url} for performance analysis`
    );
  }
  await sleep(500);
  await waitForServer(url, _tries + 1);
}

async function getShaForRef(ref) {
  let { stdout } = await execWithLog(`git rev-parse --short=8 ${ref}`);

  return stdout;
}

async function getRefForHEAD() {
  try {
    let { stdout } = await execWithLog(
      `git symbolic-ref -q --short HEAD || git describe --tags --exact-match`
    );

    return stdout;
  } catch (e) {
    return await getShaForRef('HEAD');
  }
}

// eases usage if not being used by GithubAction by providing the same defaults
async function normalizeConfig(config = {}) {
  async function val(v) {
    if (typeof v === 'function') {
      return await v();
    }
    return v;
  }
  async function add(prop, value) {
    config[prop] = config[prop] !== undefined ? config[prop] : await val(value);
  }

  await add('build-control', true);
  await add('build-experiment', true);
  await add('control-dist', 'dist-control');
  await add('experiment-dist', 'dist-experiment');

  if (config['build-control'] || config['build-experiment']) {
    await add('use-yarn', true);
  }

  if (config['build-control']) {
    await add('control-sha', () =>
      config['build-control'] ? getShaForRef('origin/master') : ''
    );
    await add(
      'control-build-command',
      `yarn build -e production --output-path ${config['control-dist']}`
    );
  }

  if (config['build-experiment']) {
    await add('experiment-sha', () => getShaForRef('HEAD'));
    await add('experiment-ref', () => getRefForHEAD());
    await add(
      'experiment-build-command',
      `yarn build -e production --output-path ${config['experiment-dist']}`
    );
  }

  await add(
    'control-serve-command',
    `yarn start --path=${config['control-dist']} --port=4200`
  );
  await add(
    'experiment-serve-command',
    `yarn start --path=${config['experiment-dist']} --port=4201`
  );
  await add('control-url', 'http://localhost:4200');
  await add('experiment-url', 'http://localhost:4201');

  await add('fidelity', 'low');
  await add('markers', 'domComplete');
  await add('runtime-stats', false);
  await add('report', true);
  await add('headless', true);
  await add('regression-threshold', 50);

  if (config['build-control'] || config['build-experiment']) {
    await add('clean-after-analyze', () => {
      // if we have a meaningful ref we will default to cleaning up
      // else default to not cleaning up since likely this is CI merge commit
      return config['experiment-ref'] !== config['experiment-sha'];
    });
  }

  console.log('Running With the following Configuration');
  console.log(config);

  return config;
}

function buildCompareCommand(config) {
  let jsonConfig = {
    experimentURL: config['experiment-url'],
    controlURL: config['control-url'],
    regressionThreshold: config['regression-threshold'],
    fidelity: config.fidelity,
    markers: parseMarkers(config.markers),
    debug: true,
    headless: config.headless,
    runtimeStats: config['runtime-stats'],
    report: config.report,
  };
  let tmpFile = './generated-tracerbench-config.tmp.json';

  fs.writeFileSync(tmpFile, JSON.stringify(jsonConfig, null, 2));

  let cmd = `${TracerbenchExecutable} compare --config=${tmpFile}`;

  return cmd;
}

async function getDistForVariant(config, variant) {
  let shouldBuild = config[`build-${variant}`];

  if (shouldBuild) {
    let sha = config[`${variant}-sha`];
    let cmd = config[`${variant}-build-command`];

    await execWithLog(`git checkout ${sha}`);
    await execWithLog(`${config['use-yarn'] ? 'yarn' : 'npm'} install`);
    await execWithLog(cmd);
  }

  return config[`${variant}-dist`];
}

async function startServer(config, variant) {
  let cmd = config[`${variant}-serve-command`];
  let url = config[`${variant}-url`];

  console.log(`\n🔶Starting Server (${variant}): ${cmd}\n`);
  let server = execa.command(cmd, { shell: 'bash' });
  server.stdout.pipe(process.stdout);
  server.stderr.pipe(process.stderr);
  await waitForServer(url);
  console.log(`\n🟢Server Started\n`);

  return { server };
}

async function main(srcConfig) {
  let error;
  let config;
  let exitCode;
  try {
    let { stdout: nodeVersion } = await execWithLog(`node --version`);
    console.log(`Running on node: ${nodeVersion}`);
    config = await normalizeConfig(srcConfig);
    await getDistForVariant(config, 'control');
    await getDistForVariant(config, 'experiment');

    let { server: controlServer } = await startServer(config, 'control');
    let { server: experimentServer } = await startServer(config, 'experiment');

    let result = await execWithLog(buildCompareCommand(config));
    exitCode = result.exitCode || 0;

    if (
      exitCode === 0 &&
      result.stdout.indexOf(
        'Regression found exceeding the set regression threshold'
      ) !== -1
    ) {
      exitCode = 1;
    }

    console.log(`🟡 Analysis Complete, killing servers`);

    await controlServer.kill('SIGTERM', {
      forceKillAfterTimeout: 10000,
    });

    console.log(`Control Server Killed`);

    await experimentServer.kill('SIGTERM', {
      forceKillAfterTimeout: 10000,
    });

    console.log(`Experiment Server Killed`);
  } catch (e) {
    error = e;
  }

  // leave the user in a nice end state
  if (config && config['clean-after-analyze']) {
    try {
      console.log(
        `🟡 Restoring User to a Clean State for: ${config['experiment-ref']}`
      );
      await execWithLog(`git checkout ${config['experiment-ref']}`);
      // clean untracked files
      await execWithLog(`git clean -fdx`);
      // clean tracked files
      await execWithLog(`git add -A`);
      await execWithLog(`git reset --hard HEAD`);
      // install! :)
      await execWithLog(config['use-yarn'] ? 'yarn install' : 'npm install');
    } catch (e) {
      if (error) {
        throw error;
      }
      throw e;
    }
  }

  if (error) {
    throw error;
  } else if (exitCode > 0) {
    throw new Error('Regression Detected');
  }
}

module.exports = main;
