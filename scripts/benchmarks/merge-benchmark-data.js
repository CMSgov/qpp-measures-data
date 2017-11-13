var helpers = require('./helpers/merge-benchmark-data-helpers.js');

const BENCHMARK_LAYERS = [
  '../../staging/benchmarks/benchmarks_base_2017.json',
  '../../staging/benchmarks/benchmarks_updates_20171109.json',
  '../../staging/benchmarks/benchmarks_readmission_20171109.json'
];

const formattedBenchmarks = helpers.mergeBenchmarkLayers(BENCHMARK_LAYERS);

process.stdout.write(JSON.stringify(formattedBenchmarks, null, 2));
