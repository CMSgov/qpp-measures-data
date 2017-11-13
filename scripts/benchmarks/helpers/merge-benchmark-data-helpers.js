const fs = require('fs');
const path = require('path');

const UNIQUE_COLUMN_CONSTRAINT = [
  'measureId',
  'benchmarkYear',
  'performanceYear',
  'submissionMethod'
];

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

const mergeBenchmarkLayers = (benchmarkLayers) => {
  const mergedBenchmarks = new Map();

  benchmarkLayers.forEach((benchmarkLayer) => {
    const benchmarkFile = JSON.parse(fs.readFileSync(path.join(__dirname, benchmarkLayer), 'utf8'));
    benchmarkFile.forEach((benchmark) => {
      mergedBenchmarks.set(getBenchmarkKey(benchmark), benchmark);
    });
  });

  const formattedBenchmarks = [];
  for (const value of mergedBenchmarks.values()) {
    formattedBenchmarks.push(value);
  }

  return formattedBenchmarks;
};

module.exports = {
  getBenchmarkKey,
  mergeBenchmarkLayers
};
