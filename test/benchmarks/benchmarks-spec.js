// Libraries
var chai   = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var isObject = require('lodash/isObject');
// functions being tested
var main = require('./../../index');
var getBenchmarksData   = main.getBenchmarksData;
var getBenchmarksSchema = main.getBenchmarksSchema;

describe('benchmarks getter functions', function() {
  describe('getBenchmarksData', function() {
    it('should return an object', function() {
      assert(isObject(getBenchmarksData()));
    });

    it('should return an object keyed by performance year with array values', function() {
      console.log('getBenchmarksData:', getBenchmarksData());
      assert(Array.isArray(getBenchmarksData()[2017]));
    });

    it('should return undefined if benchmarks do not exist for that performance year', function(){
      expect(getBenchmarksData()[2016]).to.equal(undefined);
    });
  });

  describe('getBenchmarksSchema', function() {
    it('should return a string', function() {
      expect(typeof getBenchmarksSchema()).to.eql('object');
    });
  });
});
