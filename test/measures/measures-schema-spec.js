const chai = require('chai');
const assert = chai.assert;
const exec = require('child_process').exec;

const Constants = require('../../constants.js');

describe('measures schema validates json', function() {
  const performanceYears = Constants.validPerformanceYears;
  for (const year of performanceYears) {
    describe(year + ' measures-data.json', function() {
      let capturedStdout = null;

      before(function(done) {
        const command = 'cat measures/' + year +
          '/measures-data.json | node scripts/validate-data.js measures ' + year;
        exec(command, function(error, stdout, stderr) {
          if (error) console.log(error.stack);
          capturedStdout = stdout;
          done();
        });
      });

      it('is valid', function() {
        assert.equal(capturedStdout, 'Valid!\n');
      });
    });
  }
});
