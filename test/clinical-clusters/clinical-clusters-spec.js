const chai = require('chai');
const assert = chai.assert;
const main = require('./../../index');

describe('clinical cluster functionality', () => {
  it('can load clinical cluster data', () => {
    const data = main.getClinicalClusterData();
    assert.isArray(data);
    assert.isTrue(data.length > 0);
  });

  it('can load clinical cluster schema', () => {
    const schema = main.getClinicalClusterSchema();
    assert.isObject(schema);
  });

  it('measures in specialClusterRelations are ignored completely if no optional is available', () => {
    // clusters do not have registry 130, but claims
    const data = main.getClinicalClusterData();
    let clusters = data.filter(c => c.measureId === '130' && c.submissionMethod === 'registry');
    assert.isArray(clusters);
    assert.equal(0, clusters.length);
    clusters = data.filter(c => c.measureId === '130' && c.submissionMethod === 'claims');
    assert.isArray(clusters);
    assert.equal(1, clusters.length);
  });

  it('cluster for measure 317 in 2018 should exist only for claims and not registry', () => {
    const data = main.getClinicalClusterData(2018);
    let clusters = data.filter(c => c.measureId === '317' && c.submissionMethod === 'registry');
    assert.isArray(clusters);
    assert.equal(0, clusters.length);
    clusters = data.filter(c => c.measureId === '317' && c.submissionMethod === 'claims');
    assert.isArray(clusters);
    assert.equal(1, clusters.length);
  });

  it('measures in specialClusterRelations has measureIds without optionals', () => {
    // registry 051 and 052 should only have 130 in their clinicalCluster for registry
    const data = main.getClinicalClusterData();
    let clusters = data.filter(c => c.measureId === '051' && c.submissionMethod === 'registry');
    assert.equal(1, clusters.length);
    const cluster051 = clusters[0];
    assert.deepEqual(['130', '051'], cluster051.clinicalClusters[0].measureIds);

    clusters = data.filter(c => c.measureId === '052' && c.submissionMethod === 'registry');
    assert.equal(1, clusters.length);
    const cluster052 = clusters[0];
    assert.deepEqual(['130', '052'], cluster052.clinicalClusters[0].measureIds);
  });

  it('cluster for measure 134 and 47 in 2018 should not exist only for registry', () => {
    const data = main.getClinicalClusterData(2018);
    ['134', '47'].forEach((m) => {
      const clusters = data.filter(c => c.measureId === m && c.submissionMethod === 'registry');
      assert.isArray(clusters);
      assert.equal(0, clusters.length);
    });
  });

  it('cluster for measure 1 and 117 in 2018 should not exist only for claims', () => {
    const data = main.getClinicalClusterData(2018);
    ['1', '117'].forEach((m) => {
      const clusters = data.filter(c => c.measureId === m && c.submissionMethod === 'claims');
      assert.isArray(clusters);
      assert.equal(0, clusters.length);
    });
  });

  it('clinical cluster for measure 226 in 2018 should not exist only for claims', () => {
    const data = main.getClinicalClusterData(2018);
    const clusters = data.filter(c => c.measureId === '226' && c.submissionMethod === 'claims');
    assert.equal(undefined, clusters.clinicalClusters);
  });

  it('Cluster input files are processed properly', () => {
    // registry Acute Otitis Externa should have 91 and 93
    const data = main.getClinicalClusterData();
    const measuresIds = data.filter(c => c.submissionMethod === 'registry')
      .filter(c => c.clinicalClusters && c.clinicalClusters.find(c => c.name === 'acuteOtitisExterna'))
      .map(c => c.clinicalClusters[0].measureIds);
    assert.deepEqual(measuresIds, [ [ '091', '093' ], [ '091', '093' ] ]);
  });

  it('Should handel missing years gracefully', () => {
    const data = main.getClinicalClusterData(2000);
    assert.deepEqual(data, []);
  });
});
