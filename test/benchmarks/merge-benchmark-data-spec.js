const chai = require('chai');
const assert = chai.assert;

const mergeBenchmarkData = require('../../scripts/benchmarks/helpers/merge-benchmark-data-helpers');

describe('mergeBenchmarkData', function() {
  describe('getOrderedFileNames', function() {
    it('orders files in a dir alphabetically', () => {
      const orderingJsonDir = '../../test/benchmarks/files/ordering-json/';
      const expectedOrder = ['000-benchmark.json', '001-benchmark.json', '999-benchmark.json'];
      assert.deepEqual(mergeBenchmarkData.getOrderedFileNames(__dirname, orderingJsonDir), expectedOrder);
    });
  });

  describe('getBenchmarkKey', function() {
    it('parses correctly the key', function() {
      const benchmark = {
        measureId: '458',
        benchmarkYear: 2015,
        performanceYear: 2017,
        submissionMethod: 'administrativeClaims',
        deciles: [ 100, 15.75, 15.41, 15.05, 14.89, 14.65, 14.45, 14.16, 13.82 ]
      };
      assert.equal(mergeBenchmarkData.getBenchmarkKey(benchmark), '458|2015|2017|administrativeClaims|');
    });

    it('throws an error when a key is missing', function() {
      const benchmark = {
        benchmarkYear: 2015,
        performanceYear: 2017,
        submissionMethod: 'administrativeClaims',
        deciles: [ 100, 15.75, 15.41, 15.05, 14.89, 14.65, 14.45, 14.16, 13.82 ]
      };
      assert.throws(() => {
        mergeBenchmarkData.getBenchmarkKey(benchmark);
      }, /Key is missing: measureId/);
    });
  });

  describe('getBenchmarkKey', function() {
    it('joins correctly two layers', function() {
      const baseLayer = '../../../test/benchmarks/files/base_layer.json';
      const secondLayer = '../../../test/benchmarks/files/overwrite_001_claims.json';

      const layers = [baseLayer, secondLayer];

      const resultingBenchmarks = [{
        measureId: '001',
        benchmarkYear: 2015,
        performanceYear: 2017,
        submissionMethod: 'claims',
        deciles: [
          100,
          50,
          25,
          20.31,
          16.22,
          11.02,
          10,
          7.41,
          4
        ]
      },
      {
        measureId: '001',
        benchmarkYear: 2015,
        performanceYear: 2017,
        submissionMethod: 'electronicHealthRecord',
        deciles: [
          100,
          54.67,
          35.9,
          25.62,
          19.33,
          14.14,
          9.09,
          3.33,
          0
        ]
      }];
      assert.deepEqual(mergeBenchmarkData.mergeBenchmarkLayers(layers), resultingBenchmarks);
    });

    it('joins a third independant layer', function() {
      const baseLayer = '../../../test/benchmarks/files/base_layer.json';
      const secondLayer = '../../../test/benchmarks/files/overwrite_001_claims.json';
      const thirdLayer = '../../../test/benchmarks/files/independent_layer.json';

      const layers = [baseLayer, secondLayer, thirdLayer];

      const resultingBenchmarks = [{
        measureId: '001',
        benchmarkYear: 2015,
        performanceYear: 2017,
        submissionMethod: 'claims',
        deciles: [
          100,
          50,
          25,
          20.31,
          16.22,
          11.02,
          10,
          7.41,
          4
        ]
      },
      {
        measureId: '001',
        benchmarkYear: 2015,
        performanceYear: 2017,
        submissionMethod: 'electronicHealthRecord',
        deciles: [
          100,
          54.67,
          35.9,
          25.62,
          19.33,
          14.14,
          9.09,
          3.33,
          0
        ]
      },
      {
        measureId: '999',
        benchmarkYear: 2015,
        performanceYear: 2017,
        submissionMethod: 'claims',
        deciles: [
          100,
          50,
          25,
          20,
          16.22,
          11.02,
          10,
          7.41,
          4
        ]
      }];
      assert.deepEqual(mergeBenchmarkData.mergeBenchmarkLayers(layers), resultingBenchmarks);
    });

    it('throws an error when a measure is missing a field ', function() {
      const baseLayer = '../../../test/benchmarks/files/base_layer.json';
      const secondLayer = '../../../test/benchmarks/files/missing_id_layer.json';

      const layers = [baseLayer, secondLayer];
      assert.throws(() => {
        mergeBenchmarkData.mergeBenchmarkLayers(layers);
      }, /Key is missing: measureId/);
    });
  });
});
