

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
        benchmark.benchmarkYear = benchmark.performanceYear;
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

/**
 * Function to ensure that the benchmarks are all unique according to the column constraints outlined above
 * @param {[{
  *   measureId: String,
  *   performanceYear: Number,
  *   benchmarkYear: Number,
  *   submissionMethod: String,
  *   deciles: [Number],
  *   isToppedOut: Boolean,
  *   isToppedOutByProgram: Boolean
  * }]} benchmarks - the collection of benchmarks to evaluate
 * @returns {void}
 */
const validateUniqueConstraints = (benchmarks) => {
  benchmarks = benchmarks || [];
  let failedCount = 0;
  for (const benchmark of benchmarks) {
    if (benchmarks
      .filter(b => UNIQUE_COLUMN_CONSTRAINT
        .every(key => benchmark[key] === b[key]))
      .length === 1) {
      continue;
    } else {
      console.log('Duplicate key constraint failed for benchmark:');
      UNIQUE_COLUMN_CONSTRAINT.forEach(key => {
        console.log(`  ${key}: ${benchmark[key]}`);
      });
      failedCount++;
    }
  }
  if (failedCount > 0) {
    console.log('Duplicate benchmarks found. This is usually the result of an error in modifying the benchmarks script. Exiting.');
    process.exit(failedCount);
  }
};

module.exports = {
  getOrderedFileNames,
  getBenchmarkKey,
  mergeBenchmarkLayers,
  validateUniqueConstraints
};
