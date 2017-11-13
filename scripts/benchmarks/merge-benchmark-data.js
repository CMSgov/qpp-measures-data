const fs = require('fs');
const path = require('path');

const helpers = require('./helpers/merge-benchmark-data-helpers.js');

const BENCHMARK_JSON_DIR = '../../staging/benchmarks/json/';
const BENCHMARK_LAYER_FILES = fs.readdirSync(path.join(__dirname, BENCHMARK_JSON_DIR));

const formattedBenchmarks = helpers.mergeBenchmarkLayers(BENCHMARK_LAYER_FILES);

process.stdout.write(JSON.stringify(formattedBenchmarks, null, 2));
