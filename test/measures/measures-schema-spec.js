const chai = require('chai');
const assert = chai.assert;
const exec = require('child_process').exec;
const fs = require('fs');

const testFilesFolder = 'test/measures/examples/quality/';
const qualityMeasureExampleFilenames = fs.readdirSync(testFilesFolder);

describe('measures schema validates json', function() {
  describe('measures-data.json', function() {
    let capturedStdout = null;

    before(function(done) {
      const command = 'cat measures/measures-data.json | node scripts/validate-data.js measures';
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

  // TODO(aimee): Remove: This will become obsolete once c2q measures are imported into measures-data.
  describe('example quality measures', function() {
    qualityMeasureExampleFilenames.forEach(function(qualityMeasureExampleFilename) {
      let capturedStdoutExamples = null;

      before(function(done) {
        const command = 'cat ' + testFilesFolder + qualityMeasureExampleFilename +
          ' | node scripts/validate-data.js measures';
        exec(command, function(error, stdout, stderr) {
          if (error) console.log(error.stack);
          capturedStdoutExamples = stdout;
          done();
        });
      });

      it(qualityMeasureExampleFilename + ' is valid', function() {
        assert.deepEqual(capturedStdoutExamples, 'Valid!\n');
      });
    });
  });
});
