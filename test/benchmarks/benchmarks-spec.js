// Libraries
var chai   = require('chai');
var expect = chai.expect;
// functions being tested
var main = require('./../../index');
var getBenchmarksData   = main.getBenchmarksData;
var getBenchmarksSchema = main.getBenchmarksSchema;

describe('benchmarks getter functions', function() {
  describe('getBenchmarksData', function() {
    it('should return an array', function() {
      expect(Array.isArray(getBenchmarksData(2017))).to.be.true;
    });
  });

  describe('getBenchmarksSchema', function() {
    it('should return a string', function() {
      expect(typeof getBenchmarksSchema()).to.eql('object');
    });
  });
});
