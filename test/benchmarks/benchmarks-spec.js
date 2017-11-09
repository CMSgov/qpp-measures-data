// Libraries
const chai = require('chai');
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
