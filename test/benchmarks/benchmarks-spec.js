// Libraries
const chai = require('chai');
const fs = require('fs');
const assert = chai.assert;
// functions being tested
const main = require('./../../index');
const getBenchmarksData = main.getBenchmarksData;
const getBenchmarksSchema = main.getBenchmarksSchema;

describe('benchmarks getter functions', function() {
  describe('getBenchmarksData', function() {
    it('should return an object', function() {
      assert.isObject(getBenchmarksData());
    });

    it('should return an object keyed by performance year with array values', function() {
      assert.isArray(getBenchmarksData()[2017]);
    });

    it('should return undefined if benchmarks do not exist for that performance year', function() {
      assert.isUndefined(getBenchmarksData()[2016]);
    });
  });

  describe('getBenchmarksSchema', function() {
    it('should return a string', function() {
      assert.isObject(getBenchmarksSchema());
    });
  });
});

describe('data validation', () => {
  describe('benchmarks should not have duplicate measures in any file', () => {
    const UNIQUE_COLUMN_CONSTRAINT = [
      'measureId',
      'benchmarkYear',
      'performanceYear',
      'submissionMethod'
    ];
    // const benchmark = require('../../benchmarks/2019.json');
    const benchmarkFiles = fs.readdirSync(`${__dirname}/../../benchmarks/`);
    for (const file of benchmarkFiles) {
      if (file.indexOf('.json') !== -1) {
        describe(`File: ./benchmarks/${file}`, () => {
          const benchmarks = require(`../../benchmarks/${file}`);
          for (const benchmark of benchmarks) {
            it(`should not duplicate ${benchmark.measureId} - ${benchmark.submissionMethod}`, () => {
              assert.isTrue(benchmarks
                .filter(b => UNIQUE_COLUMN_CONSTRAINT
                  .every(key => benchmark[key] === b[key]))
                .length === 1);
            });
          }
        });
      }
    }
  });
});
