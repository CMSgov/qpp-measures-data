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
  const result = execSync(cmd, {stdio: 'pipe'}).toString();
  console.log(result);
  return result;
};

describe(year + ' validate data', function() {
  it('validates the expected combined measures json', () => {
    const message = validateMeasures(expectedMeasuresFile);
    assert.equal(message, 'Valid for 2018 performance year schema\n');
  });

  it('throws an error when we import measures with duplicate measureIds', () => {
    const errorMessage = 'Invalid for 2018 performance year schema: data should pass "uniqueItemProperties" keyword validation\n';
    const message = validateMeasures(duplicateMeasuresFile);
    assert.include(message, errorMessage);
  });
});
