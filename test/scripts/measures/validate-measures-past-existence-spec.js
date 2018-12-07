// Libraries
const chai = require('chai');
const assert = chai.assert;
const { execSync } = require('child_process');
const Constants = require('../../../constants.js');

const year = Constants.currentPerformanceYear;

const validPerfYearMeasuresFile = './test/scripts/measures/' + year + '/fixtures/valid-perf-year-measures.json';
const invalidPerfYearMeasuresFile = './test/scripts/measures/' + year + '/fixtures/invalid-perf-year-measures.json';

const validateMeasures = function(measuresFile) {
  const cmd = 'cat ' + measuresFile + ' | node ./scripts/validate-measures-past-existence.js ' + year;
  return execSync(cmd, {stdio: 'pipe'}).toString();
};

describe('validateExistenceOfCurrentYearMeasuresInPreviousYearMeasures', function() {
  it('validates measures actually existed in their listed firstPerformanceYear and the years after, including measure id remapping', () => {
    const message = validateMeasures(validPerfYearMeasuresFile);
    assert.equal(message, '');
  });

  it('errors when measures did not exist in their listed firstPerformanceYear and the years after', () => {
    const message = validateMeasures(invalidPerfYearMeasuresFile);
    assert.equal(message, 'NEW_2018_MEASURE in 2018 measures data supposedly exists in 2017 measures data but does not\n');
  });
});
