import _ from 'lodash';
import { Benchmark, BenchmarkList, QualityMeasure } from './benchmarks.types';
import { 
  BaseMeasure,
  MeasureList,
} from './benchmarks.types';

export function benchmarkBusinessValidation(performanceYear: number, input?: BenchmarkList) {
  if (!input) {
    input = require(`../measures/${performanceYear}/measures-data.json`);
  }

  const indexedBenchmarks = _.mapKeys(input, (benchmark:Benchmark) => {
    if (!benchmark.measureId) {
      throw new Error(`no MeasureId provided for benchmark: ${benchmark}`)
    }
    return benchmark.measureId;
  })

  const measures = require(`../measures/${performanceYear}/measures-data.json`);

  const indexedMeasures: MeasureList = _.mapKeys(measures, (measure: BaseMeasure) => {
    return measure.measureId;
  })

  let errors: Error[] = [];

  _.forEach(indexedBenchmarks, (benchmark, benchmarkMeasureId) => {
    const comparableMeasure = indexedMeasures[benchmarkMeasureId];

    if (!comparableMeasure) {
      errors.push(new Error(`Benchmark has invalid measureId ${benchmarkMeasureId}`));
    }

    if (_.has(benchmark, 'isHighPriority')) {
      if (benchmark.isHighPriority !== (comparableMeasure as QualityMeasure).isHighPriority) {
        //PropertyMismatch - isHighPriority
      }
    }

    if (_.has(benchmark, 'isInverse')) {
      if (benchmark.isInverse !== (comparableMeasure as QualityMeasure).isInverse) {
        //PropertyMismatch - isInverse
      }
    }
  });

  if (errors.length > 0) {
    throw new Error(JSON.stringify(errors));
  }
}