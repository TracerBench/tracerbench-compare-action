const execa = require('execa');
const isReachable = require('is-reachable');

async function execWithLog(cmd) {
  console.groupCollapsed(`\n🟡 ${cmd}\n`);
  let exe = execa.command(cmd);
  exe.stdout.pipe(process.stdout);
  exe.stderr.pipe(process.stderr);

  let result = await exe;
  console.groupEnd();
  return result;
}

function sleep(ms) {
  return new Promise(resolve => {
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
    throw new Error(`Timeout Exceeded (${(_tries * 500) / 1000}s): Unable to reach server at ${url} for performance analysis`);
  }
  await sleep(500);
  await waitForServer(url, _tries + 1);
}

async function getShaForRef(ref) {
  let { stdout } = await execWithLog(`git rev-parse --short=8 ${ref}`);

  return stdout;
}

async function getRefForHEAD() {
  let { stdout } = await execWithLog(`git symbolic-ref -q --short HEAD || git describe --tags --exact-match`);

  return stdout;
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

    await add('use-yarn', true);
    await add('control-sha', () => getShaForRef('origin/master'));
    await add('experiment-sha', () => getShaForRef('HEAD'));
    await add ('experiment-ref', () => getRefForHEAD())
    await add('build-control', true);
    await add('build-experiment', true);
    await add('control-dist', 'dist-control');
    await add('experiment-dist', 'dist-experiment');
    await add('control-build-command', `ember build -e production --output-path ${config['control-dist']}`);
    await add('experiment-build-command', `ember build -e production --output-path ${config['experiment-dist']}`);
    await add('control-serve-command', `ember s --path=${config['control-dist']}`);
    await add('experiment-serve-command', `ember s --path=${config['experiment-dist']} --port=4201`);
    await add('control-url', 'http://localhost:4200?tracerbench=true');
    await add('experiment-url', 'http://localhost:4201?tracerbench=true');
    await add('fidelity', 'low');
    await add('markers', 'domComplete');
    await add('runtime-stats', false);
    await add('report', true);
    await add('headless', true);
    await add('regression-threshold', 50);
    await add('clean-after-analyze', false);

    return config;
}

function buildCompareCommand(config) {
  let cmd = `${config['use-yarn'] ? 'yarn' : 'npm' } run tracerbench compare` +
    ` --experimentURL=${config['experiment-url']}` +
    ` --controlURL=${config['control-url']}` +
    ` --regressionThreshold=${config['regression-threshold']}` +
    ` --fidelity=${config.fidelity}` +
    ` --markers=${config.markers}`;

  if (config.headless) {
      cmd += ` --headless`;
  }

  if (config['runtime-stats']) {
    cmd += ` --runtimeStats`;
  }

  if (config.report) {
    cmd += ` --report`;
  }

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
    let server = execa.command(cmd);
    await waitForServer(url);
    console.log(`\n🟢Server Started\n`);
    
    return { server };
}

async function main(srcConfig) {
    const config = await normalizeConfig(srcConfig);
    await getDistForVariant(config, 'control');
    await getDistForVariant(config, 'experiment');

    let { server: controlServer } = await startServer(config, 'control');
    let { server: experimentServer } = await startServer(config, 'experiment');

    await execWithLog(config['use-yarn'] ? 'yarn add tracerbench@3 -W' : 'npm install tracerbench@3');
    await execWithLog(buildCompareCommand(config));

    console.log(`🟡 Analysis Complete, killing servers`);

    await controlServer.kill();
    await experimentServer.kill();

    // leave the user in a nice end state
    if (config['clean-after-analyze']) {
      console.log(`🟡 Restoring User to a Clean State for: ${config['experiment-ref']}`);
      await execWithLog(`git clean -fdx`);
      await execWithLog(`git checkout ${config['experiment-ref']}`);
      await execWithLog(config['use-yarn'] ? 'yarn install' : 'npm install');
    }
}

module.exports = main;
