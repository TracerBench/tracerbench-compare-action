const core = require('@actions/core');
const analyze = require('./analyze');

const configProperties = [
  'use-yarn',
  'repo-token',
  'control-sha',
  'experiment-sha',
  'build-control',
  'build-experiment',
  'control-build-command',
  'experiment-build-command',
  'control-serve-command',
  'experiment-serve-command',
  'control-dist',
  'experiment-dist',
  'control-url',
  'experiment-url',
  'markers',
  'fidelity',
  'runtime-stats',
  'report',
  'headless',
  'regression-threshold',
  'clean-after-analyze'
];
const config = {};

configProperties.forEach(prop => {
  let input = core.getInput(prop);
  if (input === '') {
    input = undefined;
  } else if (input === 'true') {
    input = true;
  } else if (input === 'false') {
    input = false;
  }
  config[prop] = input;
});

async function main() {
  try {
    await analyze(config);
    process.exit(0);
  } catch (e) {
    core.setFailed(e.message);
    process.exit(1);
  }
}

main();
