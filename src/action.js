const core = require('@actions/core');
const artifact = require('@actions/artifact');
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
  'debug',
  'is-ci-env',
  'runtime-stats',
  'report',
  'upload-traces',
  'upload-results',
  'headless',
  'regression-threshold',
  'clean-after-analyze',
  'scenarios',
];
const config = {};

configProperties.forEach((prop) => {
  let input = core.getInput(prop);
  if (input === '') {
    input = undefined;
  } else if (input === 'true') {
    input = true;
  } else if (input === 'false') {
    input = false;
  }
  if (prop === 'scenarios') {
    console.log(input);
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
  } finally {
    const files = [];
    if (config['upload-results']) {
      files.push(
        './tracerbench-results/analysis-output.txt',
        './tracerbench-results/artifact-1.pdf',
        './tracerbench-results/artifact-1.html',
      );
    }
    if (config['upload-traces']) {
      files.push(
        './tracerbench-results/traces.zip',
        './tracerbench-results/report.json',
        './tracerbench-results/compare.json',
        './tracerbench-results/compare-flags-settings.json',
        './tracerbench-results/server-experiment-settings.json',
        './tracerbench-results/control-experiment-settings.json'
      );
    }
    if (files.length > 0) {
      const artifactClient = artifact.create()
      const artifactName = 'Reports';
      const rootDirectory = '.';
      await artifactClient.uploadArtifact(artifactName, files, rootDirectory)
    }
  }
}

main();
