# @tracerbench/tracerbench-compare-action

GitHub Action for TracerBench https://www.tracerbench.com/

## What is it?

GitHub Action CI setup for TracerBench Compare command; finely tuned for benchmarking Ember applications and Addons. Please read the consumed TracerBench Compare command for associated configuration and API details: https://www.tracerbench.com/docs/api/compare

## Usage as a GitHub Action

You can use this action by adding it to an existing workflow
 or creating a new workflow in your project.

For example, the below adds a check for the `users` route to all
 pull requests to the master branch.

```yml
name: PerformanceCheck

on:
  pull_request:
    branches:
      - master

jobs:
  analyze-users-route:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
        with:
          fetch-depth: 0
      - uses: tracerbench/tracerbench-compare-action@master
        with:
          experiment-url: 'http://localhost:4201/users'
          control-url: 'http://localhost:4200/users'
          markers: 'end-users-model-load'
          regression-threshold: 25
          fidelity: high
```

## Local Usage and Usage with other CI Systems

The GitHub Action project provides a small wrapper that pipes
 the configuration into the project's `main`. This allows for easy use in any 
 setup (local or CI) by adding this action as a dependency.

 ```cli
 yarn add @tracerbench/tracerbench-compare-action
 ```

For example, you could mirror the above check in an Ember Application by doing the following.

```jsonc
// perf-test-config.json

{
  "experiment-url": "http://localhost:4201/users",
  "control-url": "http://localhost:4200/users",
  "markers": "end-users-model-load",
  "regression-threshold": 25,
  "fidelity": "high"
}
```

```js
// perf-test.js
// @ts-nocheck
import analyze from '@tracerbench/tracerbench-compare-action';
import fs from 'node:fs/promises';
import path from 'node:path';

const __dirname = new URL('.', import.meta.url).pathname;
const root = path.resolve(__dirname, '..');

const configFile = await fs.readFile(path.resolve(root, 'bin/perf-test-config.json'));
const config = JSON.parse(configFile);

analyze(config);
```

## Configuration Options

| Option | Default | Description |
| ------ | ------- | ----------- |
| build-control | true | Whether to build assets for the control case |
| build-experiment | true | Whether to build assets for the experiment case |
| control-dist | ./dist-control | The location of the control assets once a build has been performed (or if build-control is false the location they are already) |
| experiment-dist | ./dist-experiment | The location of the experiment assets once a build has been performed (or if build-control is false the location they are already) |
| control-sha | git rev-parse --short=8 origin/master | SHA to be built for the control commit |
| experiment-sha | git rev-parse --short=8 HEAD | SHA to be built for the experiment commit |
| experiment-ref | current branch or tag | The reference being built for the experiment |
| control-build-command | ember build -e production --output-path ${control-dist} | command to execute to build control assets if build-control is true
| experiment-build-command | ember build -e production --output-path ${experiment-dist} | command to execute to build experiment assets if build-experiment is true
| use-yarn | true | When building control/experiment whether to use yarn for install (npm is used otherwise) |
| control-serve-command | ember s --path=${control-dist} | command to execute to serve the control assets |
| experiment-serve-command | ember s --path=${experiment-dist} | command to execute to serve the experiment assets |
| clean-after-analyze | true if experiment-ref is preset, false otherwise | whether to try to restore initial repository state after the benchmark is completed. Useful for local runs. |
