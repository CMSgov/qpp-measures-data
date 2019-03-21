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
const getBenchmarkKey = (benchmark) => {
  let benchmarkKey = '';
  UNIQUE_COLUMN_CONSTRAINT.forEach((keyName) => {
    if (keyName in benchmark) {
      benchmarkKey += `${benchmark[keyName]}|`;
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
const mergeBenchmarkLayers = (benchmarkLayers, benchmarkJsonDir) => {
  const mergedBenchmarks = new Map();
  const mergeConflicts = [];

  benchmarkLayers.forEach((benchmarkLayer) => {
    const benchmarkFile = JSON.parse(fs.readFileSync(path.join(benchmarkJsonDir, benchmarkLayer), 'utf8'));
    benchmarkFile.forEach((benchmark) => {
      const benchmarkKey = getBenchmarkKey(benchmark);
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
