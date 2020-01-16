const execa = require('execa');
const isReachable = require('is-reachable');

async function execWithLog(cmd) {
  let exe = execa.command(cmd);
  exe.stdout.pipe(process.stdout);
  return await exe;
}

async function waitForServer(url, _tries = 0) {
  if (await isReachable(url)) {
    return true;
  }
  if (_tries > 100) {
    throw new Error(`Unable to reach server at ${url} for performance analysis`);
  }
  return waitForServer(url, _tries + 1);
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
    await add('control-sha', () => execa.command(`git rev-parse --short=8 master`));
    await add('experiment-sha', () => execa.command(`git rev-parse --short=8 HEAD`));
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
    await add('fidelity', 'high');
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
    let server = execWithLog(cmd);
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