var chai = require('chai');
var assert = chai.assert;
var main = require('./../../index');

describe('clinical cluster functionality', () => {
  it('can load clinical cluster data', () => {
    var data = main.getClinicalClusterData();
    assert.isArray(data);
    assert.isTrue(data.length > 0);
  });

  it('can load clinical cluster schema', () => {
    var schema = main.getClinicalClusterSchema();
    assert.isObject(schema);
  });

  it('clusters do not have registry 130, but claims', () => {
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

  it('claims 117 should not have any clinical clusters', () => {
    var data = main.getClinicalClusterData();
    var clusters = data.filter(c => c.measureId === '117' && c.submissionMethod === 'claims');
    assert.equal(0, clusters.length);
  });

  it('claims 130 should not have any clinical clusters', () => {
    var data = main.getClinicalClusterData();
    var clusters = data.filter(c => c.measureId === '130' && c.submissionMethod === 'claims' && c.clinicalClusters);
    assert.equal(0, clusters.length);
  });

  it('claims Eye Care should have 117 in clinical clusters', () => {
    var data = main.getClinicalClusterData();
    var measureIds = ['012', '014', '019', '140', '141'];
    measureIds.forEach(measureId => {
      var clusters = data.filter(c => c.measureId === measureId && c.submissionMethod === 'claims');
      assert.equal(1, clusters.length);
      var theCluster = clusters[0];
      var eyeCare = theCluster.clinicalClusters.find(c => c.name === 'eyeCare');
      assert.include(eyeCare.measureIds, '117');
    });
  });

  it('claims Colonoscopy Care should have 130 in clinical clusters', () => {
    var data = main.getClinicalClusterData();
    var measureIds = ['425'];
    measureIds.forEach(measureId => {
      var clusters = data.filter(c => c.measureId === measureId && c.submissionMethod === 'claims');
      assert.equal(1, clusters.length);
      var theCluster = clusters[0];
      var eyeCare = theCluster.clinicalClusters.find(c => c.name === 'colonoscopyCare');
      assert.include(eyeCare.measureIds, '130');
    });
  });

  it('claims Endoscopy and Polyp Surveillance should have 320 in clinical clusters', () => {
    var data = main.getClinicalClusterData();
    var measureIds = ['185'];
    measureIds.forEach(measureId => {
      var clusters = data.filter(c => c.measureId === measureId && c.submissionMethod === 'claims');
      assert.equal(1, clusters.length);
      var theCluster = clusters[0];
      var eyeCare = theCluster.clinicalClusters.find(c => c.name === 'endoscopyAndPolypSurveillance');
      assert.include(eyeCare.measureIds, '320');
    });
  });

  it('registry Osteoporosis Care should not have 110 in clinical clusters', () => {
    var data = main.getClinicalClusterData();
    var clusters = data
      .filter(c => c.submissionMethod === 'registry')
      .filter(c => c.clinicalClusters && c.clinicalClusters.find(cc => cc.name === 'osteoporosisCare'));
    clusters.forEach(theCluster => {
      var osteoporosisCare = theCluster.clinicalClusters.find(c => c.name === 'osteoporosisCare');
      assert.notInclude(osteoporosisCare.measureIds, '110');
    });
  });

  it('registry Heart Failure Care should not have 226 in clinical clusters', () => {
    var data = main.getClinicalClusterData();
    var clusters = data
      .filter(c => c.submissionMethod === 'registry')
      .filter(c => c.clinicalClusters && c.clinicalClusters.find(cc => cc.name === 'heartFailureCare'));
    clusters.forEach(theCluster => {
      var osteoporosisCare = theCluster.clinicalClusters.find(c => c.name === 'heartFailureCare');
      assert.notInclude(osteoporosisCare.measureIds, '226');
    });
  });
});
