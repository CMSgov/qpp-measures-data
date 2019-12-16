// Libraries
const chai = require('chai');
const assert = chai.assert;
const { execSync } = require('child_process');

const testCsv = 'test/scripts/benchmarks/fixtures/test-benchmarks.csv';

// Function which executes script and reads in output file to a JS object.
const runTest = function(benchmarksCsv) {
  const cmd = 'cat ' + testCsv + ' | ' + 'node ./scripts/benchmarks/parse-benchmarks-data.js 2015 2017';
  const benchmark = execSync(cmd).toString();
  return JSON.parse(benchmark);
};

describe('parse benchmark data', function() {
  it('should create new measures and ignore duplicate measureIds', () => {
    const measures = runTest(testCsv);
    // 311 rows with Y in Benchmark column
    assert.equal(measures.length, 311);
  });
});
