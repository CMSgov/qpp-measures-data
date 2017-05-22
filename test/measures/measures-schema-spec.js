const chai = require('chai');
const assert = chai.assert;
const exec = require('child_process').exec;
const fs = require('fs');

const testFilesFolder = 'test/examples/quality/';
const qualityMeasureExampleFilenames = fs.readdirSync(testFilesFolder);
const numExamples = qualityMeasureExampleFilenames.length;

describe('measures schema validates json', function() {
  describe('measures-data.json', function() {
    var capturedStdout = null;

    before(function(done) {
      var command = 'cat measures/measures-data.json | node scripts/validate-data.js measures';
      exec(command, function(error, stdout, stderr) {
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
    var capturedStdoutExamples = [];

    before(function(done) {
      qualityMeasureExampleFilenames.forEach(function(qualityMeasureExampleFilename, idx) {
        var command = 'cat ' + testFilesFolder + qualityMeasureExampleFilename + 
          ' | node scripts/validate-data.js measures';
        exec(command, function(error, stdout, stderr) {
          capturedStdoutExamples.push(stdout);
          if (idx === numExamples - 1) {
            done();
          }
        });
      });
    });

    it('are valid', function() {
      assert.deepEqual(capturedStdoutExamples, Array(numExamples).fill('Valid!\n'));
    });
  });
});
