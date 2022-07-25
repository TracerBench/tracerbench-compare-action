import core from '@actions/core';
import artifact from '@actions/artifact';
import glob from '@actions/glob';

import analyze from './analyze.mjs';

const configProperties = [
  'use-yarn',
  'use-pnpm',
  'pkg-manager',
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
  'sample-timeout',
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
  if (prop === 'scenarios' && input) {
    input = JSON.parse(input);
  }
  config[prop] = input;
});

async function uploadArtifacts() {
  const files = [];
  if (config['upload-results']) {
    files.push(
      './tracerbench-results/analysis-output.json',
      './tracerbench-results/artifact-*.pdf',
      './tracerbench-results/artifact-*.html',
    );
  }
  if (config['upload-traces']) {
    files.push(
      './tracerbench-results/traces/*',
      './tracerbench-results/report.json',
      './tracerbench-results/compare.json',
      './tracerbench-results/compare-flags-settings.json',
      './tracerbench-results/server-experiment-settings.json',
      './tracerbench-results/control-experiment-settings.json'
    );
  }
  if (files.length > 0) {
    const globber = await glob.create(files.join('\n'))
    const allFiles = await globber.glob()
    const artifactClient = artifact.create()
    const artifactName = 'Performance Reports';
    const rootDirectory = process.cwd();
    await artifactClient.uploadArtifact(artifactName, allFiles, rootDirectory)
  }
}

async function main() {
  try {
    await analyze(config);
    await uploadArtifacts();
    process.exit(0);
  } catch (e) {
    core.setFailed(e.message);
    await uploadArtifacts();
    process.exit(1);
  }
}

main();
