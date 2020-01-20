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
  'control-serve-command',
  'experiment-serve-command',
  'control-dist',
  'experiment-dist',
  'control-url',
  'experiment-url',
  'markers'
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
  } catch (e) {
    core.setFailed(e.message);
  }
}

main();
