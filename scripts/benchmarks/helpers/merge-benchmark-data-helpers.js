const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const UNIQUE_COLUMN_CONSTRAINT = [
  'measureId',
  'benchmarkYear',
  'performanceYear',
  'submissionMethod'
];

/**
 * Function to get an alphabetically-ordered list of files in a given path
 *
 * @param {String} currentDir The path of the current directory
 * @param {String} relativePath The relative path to the target directory
 * @returns {[String]} a collection of files in the target directory
 */
const getOrderedFileNames = (currentDir, relativePath) => fs.readdirSync(path.join(currentDir, relativePath));

/**
 * Generates a key in an object to store benchmarks in. Benchmarks with the same key will overwrite one another, based on which was added
 * first. See mergeBenchmarkLayers() for more details.
 * @param {{
  *   measureId: String,
  *   performanceYear: Number,
  *   benchmarkYear: Number,
  *   submissionMethod: String,
  *   deciles: [Number],
  *   isToppedOut: Boolean,
  *   isToppedOutByProgram: Boolean
  * }} benchmark The benchmark to get the key for
  * @returns {String} The benchmark key based on unique column constraints
 */
const getBenchmarkKey = (benchmark) => {
  let benchmarkKey = '';
  UNIQUE_COLUMN_CONSTRAINT.forEach((keyName) => {
    // For performance benchmarks, the benchmark year and the performance year are the same
    if (keyName in benchmark) {
      benchmarkKey = `${benchmarkKey}${benchmark[keyName]}|`;
    } else {
      throw new Error('Key is missing: ' + keyName);
    }
  });

  return benchmarkKey;
};

/**
 * Function to populate the missing fields on a performance benchmark
 * @param {{
 *   measureId: String,
 *   performanceYear: Number,
 *   submissionMethod: String,
 *   deciles: [Number]
 * }} benchmark the performance benchmark to process
 * @returns {{
  *   measureId: String,
  *   performanceYear: Number,
  *   benchmarkYear: Number,
  *   submissionMethod: String,
  *   deciles: [Number],
  *   isToppedOut: Boolean,
  *   isToppedOutByProgram: Boolean
  * }}
 */
const processPerformanceBenchmark = (benchmark) => {
  return {
    measureId: benchmark.measureId,
    performanceYear: benchmark.performanceYear,
    benchmarkYear: benchmark.performanceYear,
    submissionMethod: benchmark.submissionMethod,
    deciles: benchmark.deciles.map(d => _.round(d, (benchmark.performanceYear >= 2019 ? 4 : 2))),
    isToppedOut: false,
    isToppedOutByProgram: false
  };
};

/**
 * Function to read a JSON file
 * @param {String} dir The target directory
 * @param {String} file The target file
 * @returns {[{
 *   measureId: String,
 *   benchmarkYear?: Number,
 *   performanceYear: Number,
 *   submissionMethod: String,
 *   deciles: [Number],
 *   isToppedOut?: Boolean,
 *   isToppedOutByProgram?: Boolean
 * }]}
 */
const loadBenchmark = (dir, file) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));

/**
 * Loads in each JSON from the staging directory passed in, compares them by unique column constraints, and returns a collection of
 * formatted benchmarks.
 *
 * **Notes:**
 * * Benchmarks with the same key will raise a collective error
 * * Performance benchmarks from Final Scoring require special processing
 * @param {[String]} benchmarkFileNames An array of relative file paths to load JSONs from
 * @param {String} benchmarkJsonDir The directory to load JSON files from
 * @returns {[{
 *   measureId: String,
 *   benchmarkYear: Number,
 *   performanceYear: Number,
 *   submissionMethod: String,
 *   deciles: [Number],
 *   isToppedOut: Boolean,
 *   isToppedOutByProgram: Boolean
 * }]} a composite collection of benchmarks
 */
const mergeBenchmarkFiles = (benchmarkFileNames, benchmarkJsonDir) => {
  const mergedBenchmarks = new Map();
  const mergeConflicts = [];

  benchmarkFileNames.forEach((filename) => {
    const benchmarkFile = loadBenchmark(benchmarkJsonDir, filename);
    const isPerformanceBenchmark = filename.indexOf('performance-benchmarks.json') > -1;
    benchmarkFile.forEach((benchmark) => {
      if (isPerformanceBenchmark) {
        benchmark = processPerformanceBenchmark(benchmark);
      }
      const benchmarkKey = getBenchmarkKey(!isPerformanceBenchmark ? benchmark : {...benchmark, benchmarkYear: benchmark.performanceYear - 2});
      if (mergedBenchmarks.has(benchmarkKey) && !_.isEqual(mergedBenchmarks.get(benchmarkKey), benchmark)) {
        if (!isPerformanceBenchmark) {
          mergeConflicts.push({
            existing: mergedBenchmarks.get(benchmarkKey),
            conflicting: benchmark,
            conflictingFile: filename
          });
        }
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
  mergeBenchmarkFiles,
  validateUniqueConstraints
};
