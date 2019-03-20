const helpers = require('./helpers/merge-benchmark-data-helpers.js');

const performanceYear = process.argv[2];

if (performanceYear) {
  const jsonDir = `../../staging/${performanceYear}/benchmarks/json/`;
  const benchmarkLayerFiles = helpers.getOrderedFileNames(__dirname, jsonDir);
  const formattedBenchmarks = helpers.mergeBenchmarkLayers(benchmarkLayerFiles, jsonDir);

  process.stdout.write(JSON.stringify(formattedBenchmarks, null, 2));
} else {
  console.log('Please provide a performance year like so: `node merge-benchmark-data.js 2017`');
}
