const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const UNIQUE_COLUMN_CONSTRAINT = [
  'measureId',
  'benchmarkYear',
  'performanceYear',
  'submissionMethod'
];

// Returns an alphabetically-ordered list of files in the given pat
const getOrderedFileNames = (currentDir, relativePath) => {
  return fs.readdirSync(path.join(currentDir, relativePath));
};

// Generate a key in an object to store benchmarks in.
// Benchmarks with the same key will overwrite one another base
// which was loaded last. See mergeBenchmarkLayers for more details.
const getBenchmarkKey = (benchmark, isPerformanceBenchmark = false) => {
  let benchmarkKey = '';
  UNIQUE_COLUMN_CONSTRAINT.forEach((keyName) => {
    // For performance benchmarks, the benchmark year and the performance year are the same
    if (keyName === 'benchmarkYear' && isPerformanceBenchmark && 'performanceYear' in benchmark) {
      benchmarkKey = `${benchmarkKey}${benchmark['performanceYear']}|`;
    } else if (keyName in benchmark) {
      benchmarkKey = `${benchmarkKey}${benchmark[keyName]}|`;
    } else {
      throw new Error('Key is missing: ' + keyName);
    }
  });

  return benchmarkKey;
};

// Accepts an array of relative file paths, loads json files,
// returns a composite collection of benchmarks.
// Subsequent JSON files can add but not overwrite benchmarks from previous JSON files.
// Uniqueness is checked by the composite key in UNIQUE_COLUMN_CONSTRAINT.
// Note: Benchmarks with the same key will raise a collective error.
// Note: Perforamnce benchmarks are processed with data from the same year, so require special handling
const mergeBenchmarkLayers = (benchmarkLayers, benchmarkJsonDir) => {
  const mergedBenchmarks = new Map();
  const mergeConflicts = [];

  benchmarkLayers.forEach((benchmarkLayer) => {
    const benchmarkFile = JSON.parse(fs.readFileSync(path.join(benchmarkJsonDir, benchmarkLayer), 'utf8'));
    const isPerformanceBenchmark = benchmarkLayer.indexOf('performance-benchmarks.json') > -1;
    benchmarkFile.forEach((benchmark) => {
      const benchmarkKey = getBenchmarkKey(benchmark, isPerformanceBenchmark);
      if (isPerformanceBenchmark) {
        benchmark.benchmarkYear = benchmark.performanceYear - 2;
      }
      if (mergedBenchmarks.has(benchmarkKey) && !_.isEqual(mergedBenchmarks.get(benchmarkKey), benchmark)) {
        mergeConflicts.push({
          existing: mergedBenchmarks.get(benchmarkKey),
          conflicting: benchmark,
          conflictingFile: benchmarkLayer
        });
      } else {
        mergedBenchmarks.set(benchmarkKey, benchmark);
      }
    });
  });

  if (mergeConflicts.length > 0) {
    throw new Error('Merge Conflicts: \n' + JSON.stringify(mergeConflicts, null, 2));
  } else {
    const orderedBenchmarks = _.sortBy([...mergedBenchmarks.values()], ['measureId', 'submissionMethod']);
    return orderedBenchmarks;
  }
};

module.exports = {
  getOrderedFileNames,
  getBenchmarkKey,
  mergeBenchmarkLayers
};
