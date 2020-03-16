const { getOrderedFileNames, mergeBenchmarkFiles, validateUniqueConstraints } = require('./helpers/merge-benchmark-data-helpers.js');
const path = require('path');

const performanceYear = process.argv[2];

if (performanceYear) {
  const relativeJsonDir = `../../staging/${performanceYear}/benchmarks/json/`;
  const jsonDir = path.join(__dirname, relativeJsonDir);
  /**
   * Sort 'performance-benchmarks.json' to the bottom of the list if present so that it will only add benchmarks from final scoring if they
   * do not already exist.
   */
  const benchmarkLayerFiles = getOrderedFileNames(__dirname, relativeJsonDir)
    .sort((left, right) => {
      if (left.indexOf('performance-benchmarks.json') > -1) {
        return 1;
      } else if (right.indexOf('performance-benchmarks.json') > -1) {
        return -1;
      } else {
        return 0;
      }
    });
  const formattedBenchmarks = mergeBenchmarkFiles(benchmarkLayerFiles, jsonDir);

  validateUniqueConstraints(formattedBenchmarks);

  process.stdout.write(JSON.stringify(formattedBenchmarks, null, 2));
} else {
  console.log('Please provide a performance year like so: `node merge-benchmark-data.js 2017`');
}
