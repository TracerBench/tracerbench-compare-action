const core = require('@actions/core');
const github = require('@actions/github');
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
  'control-dist',
  'experiment-dist'
];
const config = {};

configProperties.forEach(prop => {
  config[prop] = core.getInput(prop);
});

async function main() {
  try {
    await analyze(config);
  } catch (e) {
    core.setFailed(e.message);
  }
}

main();