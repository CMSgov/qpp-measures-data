var chai   = require('chai');
var assert = chai.assert;
var main = require('./../../index');

describe('benchmarks getter functions', () => {

    it('should load clinical cluster data', () => {
        var data = main.getClinicalClusterData();
        assert.isArray(data);
        assert.isTrue(data.length > 0);
    });

    it('should load clinical cluster schema', () => {
        var schema = main.getClinicalClusterSchema();
        assert.isObject(schema);
    });

});
