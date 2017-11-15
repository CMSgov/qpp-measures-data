// Libraries
const chai = require('chai');
const assert = chai.assert;
const { execSync } = require('child_process');
// const fs = require('fs');
// const path = require('path');
// const _ = require('lodash');

const testCsv = '../../test/scripts/benchmarks/fixtures/test-benchmarks.csv';

// Function which executes script and reads in output file to a JS object.
const runTest = function(benchmarksCsv) {
  const cmd = 'cat ' + testCsv + ' | ' + 'node ./scripts/parse-benchmarks-data.js 2015 2017';
  const benchmark = execSync(cmd, {stdio: 'pipe'}).toString();

  return JSON.parse(benchmark);
};

describe.only('parse benchmark data', function() {
  it('should create new measures and ignore duplicate measureIds', () => {
    const measures = runTest(testCsv);
    assert.equal(measures.length, 3);
  });
});
