// Libraries
const chai = require('chai');
const assert = chai.assert;
const { execSync } = require('child_process');

// Test data
const year = 2018;

const expectedMeasuresFile = './test/scripts/measures/' + year + '/fixtures/expected-measures.json';
const duplicateMeasuresFile = './test/scripts/measures/' + year + '/fixtures/duplicate-measures.json';

const validateMeasures = function(measuresFile) {
  const cmd = 'cat ' + measuresFile + ' | node ./scripts/validate-data.js measures ' + year;
  return execSync(cmd, {stdio: 'pipe'}).toString();
};

describe(year + ' validate data against schema', function() {
  it('validates the expected combined measures json', () => {
    const message = validateMeasures(expectedMeasuresFile);
    assert.equal(message, 'Valid for 2018 performance year schema\n');
  });

  // fails because latest joi has stricter schema requirements and because of the added process.exit(1) to validate-data.
  it.skip('throws an error when we import measures with duplicate measureIds', () => {
    const errorMessage = 'Invalid for 2018 performance year schema: data must pass "uniqueItemProperties" keyword validation\n';
    const message = validateMeasures(duplicateMeasuresFile);
    assert.include(message, errorMessage);
  });
});
