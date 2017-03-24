// Libraries
var chai = require('chai');
var expect = chai.expect;
// Utils
var isInverseBenchmarkRecord = require('./../../util/is-inverse-benchmark-record');

describe('isInverseBenchmarkRecord', function() {
  it('should default to false', function() {
    expect(isInverseBenchmarkRecord({})).to.be.false;
  });
  it('should return false when decile 10 is equal to 100', function() {
    var isInverse = isInverseBenchmarkRecord({decile10: '100'});

    expect(isInverse).to.be.false;

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

    expect(isInverse2).to.be.false;
  });
  it('should return true when decile 10 is equal to 0', function() {
    var isInverse = isInverseBenchmarkRecord({decile10: '0'});

    expect(isInverse).to.be.true;

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

    expect(isInverse2).to.be.true;

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

    expect(isInverse3).to.be.true;
  });
  it('should return true when decile 10 is <= x', function() {
    var isInverse = isInverseBenchmarkRecord({decile10: '<= 4.00'});

    expect(isInverse, 'case1').to.be.true;

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

    expect(isInverse2).to.be.true;
  });
  it('should return false when decile 10 is >= x', function() {
    var isInverse = isInverseBenchmarkRecord({decile10: '>= 5.00'});

    expect(isInverse).to.be.false;


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

    expect(isInverse2).to.be.false;
  });
  it('should return true when a decreasing range is given for any of the deciles', function() {
    expect(isInverseBenchmarkRecord({decile1: '54.67 - 35.91'}), 'decile1').to.be.true;
    expect(isInverseBenchmarkRecord({decile2: '54.67 - 35.91'}), 'decile2').to.be.true;
    expect(isInverseBenchmarkRecord({decile3: '54.67 - 35.91'}), 'decile3').to.be.true;
    expect(isInverseBenchmarkRecord({decile4: '54.67 - 35.91'}), 'decile4').to.be.true;
    expect(isInverseBenchmarkRecord({decile5: '54.67 - 35.91'}), 'decile5').to.be.true;
    expect(isInverseBenchmarkRecord({decile6: '54.67 - 35.91'}), 'decile6').to.be.true;
    expect(isInverseBenchmarkRecord({decile7: '54.67 - 35.91'}), 'decile7').to.be.true;
    expect(isInverseBenchmarkRecord({decile8: '54.67 - 35.91'}), 'decile8').to.be.true;
    expect(isInverseBenchmarkRecord({decile9: '54.67 - 35.91'}), 'decile9').to.be.true;
    expect(isInverseBenchmarkRecord({decile10: '54.67 - 35.91'}), 'decile10').to.be.true;
  });
  it('should return false when an increasing range is given for any of the deciles', function() {
    expect(isInverseBenchmarkRecord({decile1: '53.73 - 75.75'}), 'decile1').to.be.false;
    expect(isInverseBenchmarkRecord({decile2: '53.73 - 75.75'}), 'decile2').to.be.false;
    expect(isInverseBenchmarkRecord({decile3: '53.73 - 75.75'}), 'decile3').to.be.false;
    expect(isInverseBenchmarkRecord({decile4: '53.73 - 75.75'}), 'decile4').to.be.false;
    expect(isInverseBenchmarkRecord({decile5: '53.73 - 75.75'}), 'decile5').to.be.false;
    expect(isInverseBenchmarkRecord({decile6: '53.73 - 75.75'}), 'decile6').to.be.false;
    expect(isInverseBenchmarkRecord({decile7: '53.73 - 75.75'}), 'decile7').to.be.false;
    expect(isInverseBenchmarkRecord({decile8: '53.73 - 75.75'}), 'decile8').to.be.false;
    expect(isInverseBenchmarkRecord({decile9: '53.73 - 75.75'}), 'decile9').to.be.false;
    expect(isInverseBenchmarkRecord({decile10: '53.73 - 75.75'}), 'decile10').to.be.false;
  });
  it('should return true when any decile below 10 is >= x', function() {
    expect(isInverseBenchmarkRecord({decile1: '>= 4.00'}), 'decile1').to.be.true;
    expect(isInverseBenchmarkRecord({decile2: '>= 4.00'}), 'decile2').to.be.true;
    expect(isInverseBenchmarkRecord({decile3: '>= 4.00'}), 'decile3').to.be.true;
    expect(isInverseBenchmarkRecord({decile4: '>= 4.00'}), 'decile4').to.be.true;
    expect(isInverseBenchmarkRecord({decile5: '>= 4.00'}), 'decile5').to.be.true;
    expect(isInverseBenchmarkRecord({decile6: '>= 4.00'}), 'decile6').to.be.true;
    expect(isInverseBenchmarkRecord({decile7: '>= 4.00'}), 'decile7').to.be.true;
    expect(isInverseBenchmarkRecord({decile8: '>= 4.00'}), 'decile8').to.be.true;
    expect(isInverseBenchmarkRecord({decile9: '>= 4.00'}), 'decile9').to.be.true;
  });
  it('should return false when any decile below 10 is <= x', function() {
    expect(isInverseBenchmarkRecord({decile1: '<= 4.00'}), 'decile1').to.be.false;
    expect(isInverseBenchmarkRecord({decile2: '<= 4.00'}), 'decile2').to.be.false;
    expect(isInverseBenchmarkRecord({decile3: '<= 4.00'}), 'decile3').to.be.false;
    expect(isInverseBenchmarkRecord({decile4: '<= 4.00'}), 'decile4').to.be.false;
    expect(isInverseBenchmarkRecord({decile5: '<= 4.00'}), 'decile5').to.be.false;
    expect(isInverseBenchmarkRecord({decile6: '<= 4.00'}), 'decile6').to.be.false;
    expect(isInverseBenchmarkRecord({decile7: '<= 4.00'}), 'decile7').to.be.false;
    expect(isInverseBenchmarkRecord({decile8: '<= 4.00'}), 'decile8').to.be.false;
    expect(isInverseBenchmarkRecord({decile9: '<= 4.00'}), 'decile9').to.be.false;
  });
});
