// Libraries
var chai = require('chai');
var assert = chai.assert;
// Utils
var isInverseBenchmarkRecord = require('./../../util/is-inverse-benchmark-record');

describe('isInverseBenchmarkRecord', function() {
  it('should default to false', function() {
    assert.isFalse(isInverseBenchmarkRecord({}));
  });
  it('should return false when decile 10 is equal to 100', function() {
    var isInverse = isInverseBenchmarkRecord({decile10: '100'});

    assert.isFalse(isInverse);

    var isInverse2 = isInverseBenchmarkRecord({
      decile3: '53.73 - 75.75',
      decile4: '75.76 - 88.45',
      decile5: '88.46 - 98.07',
      decile6: '98.08 - 99.99',
      decile7: '--',
      decile8: '--',
      decile9: '--',
      decile10: '100'
    });

    assert.isFalse(isInverse2);
  });
  it('should return true when decile 10 is equal to 0', function() {
    var isInverse = isInverseBenchmarkRecord({decile10: '0'});

    assert.isTrue(isInverse);

    var isInverse2 = isInverseBenchmarkRecord({
      decile3: '54.67 - 35.91',
      decile4: '35.90 - 25.63',
      decile5: '25.62 - 19.34',
      decile6: '19.33 - 14.15',
      decile7: '14.14 -  9.10',
      decile8: '9.09 -  3.34',
      decile9: '3.33 -  0.01',
      decile10: '0'
    });

    assert.isTrue(isInverse2);

    var isInverse3 = isInverseBenchmarkRecord({
      measureName: 'Children Who Have Dental Decay or Cavities',
      qualityId: '378',
      submissionMethod: 'EHR',
      measureType: 'Outcome',
      benchmark: 'Y',
      decile3: '0.36 -  0.01',
      decile4: '--',
      decile5: '--',
      decile6: '--',
      decile7: '--',
      decile8: '--',
      decile9: '--',
      decile10: '0',
      isToppedOut: 'Yes'
    });

    assert.isTrue(isInverse3);
  });
  it('should return true when decile 10 is <= x', function() {
    var isInverse = isInverseBenchmarkRecord({decile10: '<= 4.00'});

    assert.isTrue(isInverse, 'case1');

    var isInverse2 = isInverseBenchmarkRecord({
      measureName: 'Diabetes: Hemoglobin A1c Poor Control',
      qualityId: '1',
      submissionMethod: 'Claims',
      measureType: 'Outcome',
      benchmark: 'Y',
      decile3: '35.00 - 25.72',
      decile4: '25.71 - 20.32',
      decile5: '20.31 - 16.23',
      decile6: '16.22 - 13.05',
      decile7: '13.04 - 10.01',
      decile8: '10.00 -  7.42',
      decile9: '7.41 -  4.01',
      decile10: '<=  4.00',
      isToppedOut: 'No'
    });

    assert.isTrue(isInverse2);
  });
  it('should return false when decile 10 is >= x', function() {
    var isInverse = isInverseBenchmarkRecord({decile10: '>= 5.00'});

    assert.isFalse(isInverse);


    var isInverse2 = isInverseBenchmarkRecord({
      decile3: '76.59 - 87.88',
      decile4: '87.89 - 92.73',
      decile5: '92.74 - 95.35',
      decile6: '95.36 - 97.08',
      decile7: '97.09 - 98.27',
      decile8: '98.28 - 99.12',
      decile9: '99.13 - 99.75',
      decile10: '>= 99.76'
    });

    assert.isFalse(isInverse2);
  });
  it('should return true when a decreasing range is given for any of the deciles', function() {
    assert.isTrue(isInverseBenchmarkRecord({decile1: '54.67 - 35.91'}), 'decile1');
    assert.isTrue(isInverseBenchmarkRecord({decile2: '54.67 - 35.91'}), 'decile2');
    assert.isTrue(isInverseBenchmarkRecord({decile3: '54.67 - 35.91'}), 'decile3');
    assert.isTrue(isInverseBenchmarkRecord({decile4: '54.67 - 35.91'}), 'decile4');
    assert.isTrue(isInverseBenchmarkRecord({decile5: '54.67 - 35.91'}), 'decile5');
    assert.isTrue(isInverseBenchmarkRecord({decile6: '54.67 - 35.91'}), 'decile6');
    assert.isTrue(isInverseBenchmarkRecord({decile7: '54.67 - 35.91'}), 'decile7');
    assert.isTrue(isInverseBenchmarkRecord({decile8: '54.67 - 35.91'}), 'decile8');
    assert.isTrue(isInverseBenchmarkRecord({decile9: '54.67 - 35.91'}), 'decile9');
    assert.isTrue(isInverseBenchmarkRecord({decile10: '54.67 - 35.91'}), 'decile10');
  });
  it('should return false when an increasing range is given for any of the deciles', function() {
    assert.isFalse(isInverseBenchmarkRecord({decile1: '53.73 - 75.75'}), 'decile1');
    assert.isFalse(isInverseBenchmarkRecord({decile2: '53.73 - 75.75'}), 'decile2');
    assert.isFalse(isInverseBenchmarkRecord({decile3: '53.73 - 75.75'}), 'decile3');
    assert.isFalse(isInverseBenchmarkRecord({decile4: '53.73 - 75.75'}), 'decile4');
    assert.isFalse(isInverseBenchmarkRecord({decile5: '53.73 - 75.75'}), 'decile5');
    assert.isFalse(isInverseBenchmarkRecord({decile6: '53.73 - 75.75'}), 'decile6');
    assert.isFalse(isInverseBenchmarkRecord({decile7: '53.73 - 75.75'}), 'decile7');
    assert.isFalse(isInverseBenchmarkRecord({decile8: '53.73 - 75.75'}), 'decile8');
    assert.isFalse(isInverseBenchmarkRecord({decile9: '53.73 - 75.75'}), 'decile9');
    assert.isFalse(isInverseBenchmarkRecord({decile10: '53.73 - 75.75'}), 'decile10');
  });
  it('should return true when any decile below 10 is >= x', function() {
    assert.isTrue(isInverseBenchmarkRecord({decile1: '>= 4.00'}), 'decile1');
    assert.isTrue(isInverseBenchmarkRecord({decile2: '>= 4.00'}), 'decile2');
    assert.isTrue(isInverseBenchmarkRecord({decile3: '>= 4.00'}), 'decile3');
    assert.isTrue(isInverseBenchmarkRecord({decile4: '>= 4.00'}), 'decile4');
    assert.isTrue(isInverseBenchmarkRecord({decile5: '>= 4.00'}), 'decile5');
    assert.isTrue(isInverseBenchmarkRecord({decile6: '>= 4.00'}), 'decile6');
    assert.isTrue(isInverseBenchmarkRecord({decile7: '>= 4.00'}), 'decile7');
    assert.isTrue(isInverseBenchmarkRecord({decile8: '>= 4.00'}), 'decile8');
    assert.isTrue(isInverseBenchmarkRecord({decile9: '>= 4.00'}), 'decile9');
  });
  it('should return false when any decile below 10 is <= x', function() {
    assert.isFalse(isInverseBenchmarkRecord({decile1: '<= 4.00'}), 'decile1');
    assert.isFalse(isInverseBenchmarkRecord({decile2: '<= 4.00'}), 'decile2');
    assert.isFalse(isInverseBenchmarkRecord({decile3: '<= 4.00'}), 'decile3');
    assert.isFalse(isInverseBenchmarkRecord({decile4: '<= 4.00'}), 'decile4');
    assert.isFalse(isInverseBenchmarkRecord({decile5: '<= 4.00'}), 'decile5');
    assert.isFalse(isInverseBenchmarkRecord({decile6: '<= 4.00'}), 'decile6');
    assert.isFalse(isInverseBenchmarkRecord({decile7: '<= 4.00'}), 'decile7');
    assert.isFalse(isInverseBenchmarkRecord({decile8: '<= 4.00'}), 'decile8');
    assert.isFalse(isInverseBenchmarkRecord({decile9: '<= 4.00'}), 'decile9');
  });
});
