const execa = require('execa');
const isReachable = require('is-reachable');

async function execWithLog(cmd) {
  console.log(`\n🟨Executing Command: ${cmd}\n`);
  let exe = execa.command(cmd);
  exe.stdout.pipe(process.stdout);
  return await exe;
}

function sleep(ms) {
  console.log(`sleeping ${ms} @ ${Data.now()}`);
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function waitForServer(url, _tries = 0) {
  console.log(`checking reachable ${url} attempt ${_tries + 1} @ ${Date.now()}`);
  if (await isReachable(url)) {
    return true;
  }
  if (_tries > 1000) {
    throw new Error(`Unable to reach server at ${url} for performance analysis`);
  }
  await sleep(60);
  await waitForServer(url, _tries + 1);
}

async function getShaForRef(ref) {
  let { stdout } = await execWithLog(`git rev-parse --short=8 ${ref}`);

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
    await add('build-control', true);
    await add('build-experiment', true);
    await add('control-dist', 'dist-control');
    await add('experiment-dist', 'dist-experiment');
    await add('control-build-command', `ember build -e production --output-path ${config['control-dist']}`);
    await add('experiment-build-command', `ember build -e production --output-path ${config['experiment-dist']}`);
    await add('control-serve-command', `ember s --path=${config['control-dist']}`);
    await add('experiment-serve-command', `ember s --path=${config['experiment-dist']} --port=4201`);
    await add('control-url', 'http://localhost:4200');
    await add('experiment-url', 'http://localhost:4201');
    await add('fidelity', 'low');
    await add('markers', 'domComplete');
    await add('runtime-stats', false);
    await add('report', true);
    await add('headless', false);
    await add('regression-threshold', 50);

    return config;
}

function buildCompareCommand(config) {
  let cmd = `tracerbench compare` +
    ` --experimentURL=${config['experiment-url']}` +
    ` --controlURL=${config['control-url']}` +
    ` --regressionThreshold=${config['regression-threshold']}` +
    ` --fidelity=${config.fidelity}`;

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

async function startServerByCmd(cmd, url) {
    let server = execa.command(cmd);
    await waitForServer(url);
    return server;
}

async function main(srcConfig) {
    const config = await normalizeConfig(srcConfig);
    await execWithLog(config['use-yarn'] ? 'yarn global add tracerbench@3' : 'npm install -g tracerbench@3');

    await getDistForVariant(config, 'control');
    await getDistForVariant(config, 'experiment');

    let controlServer = await startServerByCmd(config[`control-serve-command`], config['control-url']);
    let experimentServer = await startServerByCmd(config[`experiment-serve-command`], config['experiment-url']);

    await execWithLog(buildCompareCommand());

    await controlServer.kill();
    await experimentServer.kill();
}

module.exports = main;