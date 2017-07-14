var chai = require('chai');
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

  it('should not have registry 130, but claims', () => {
    var data = main.getClinicalClusterData();
    var clusters = data.filter(c => c.measureId === '130' && c.submissionMethod === 'registry');
    assert.isArray(clusters);
    assert.equal(0, clusters.length);
    clusters = data.filter(c => c.measureId === '130' && c.submissionMethod === 'claims');
    assert.isArray(clusters);
    assert.equal(1, clusters.length);
  });

  it('registry 051 and 052 should only have 130 in their clinicalCluster for registry', () => {
    var data = main.getClinicalClusterData();
    var clusters = data.filter(c => c.measureId === '051' && c.submissionMethod === 'registry');
    assert.equal(1, clusters.length);
    var cluster051 = clusters[0];
    assert.deepEqual(['130'], cluster051.clinicalClusters[0].measureIds);

    clusters = data.filter(c => c.measureId === '052' && c.submissionMethod === 'registry');
    assert.equal(1, clusters.length);
    var cluster052 = clusters[0];
    assert.deepEqual(['130'], cluster052.clinicalClusters[0].measureIds);
  });
});
