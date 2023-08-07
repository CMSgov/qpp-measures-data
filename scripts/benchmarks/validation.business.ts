import _ from 'lodash';
import { Benchmark, BenchmarkList, QualityMeasure } from './benchmarks.types';
import { 
  BaseMeasure,
  MeasureList,
} from './benchmarks.types';
import path from 'path';
import appRoot from 'app-root-path';
import fs from 'fs';

function readStagingJSONFile (fileName: string, performanceYear: number) {
  const benchmarksStagingJSONDirectory = appRoot + `/staging/${performanceYear}/benchmarks/json`

  return JSON.parse(
    fs.readFileSync(path.join(benchmarksStagingJSONDirectory + '', 'benchmarks_cahps.json'), 'utf8')
  ) as BenchmarkList ?? [];
}

export function benchmarkBusinessValidation(performanceYear: number, input?: BenchmarkList) {
  let rawInput;

  if (!input) {
    rawInput = readStagingJSONFile('benchmarks_cahps.json', performanceYear);

    rawInput = rawInput.concat(
      readStagingJSONFile('benchmarks.json', performanceYear)
    );

    input = _.mapKeys(rawInput, ((benchmark: Benchmark) => {
        if (!benchmark.measureId) {
          throw new Error(`no MeasureId provided for benchmark: ${benchmark}`)
        }

        return benchmark.measureId;
      })
    )
  }

  const indexedBenchmarks: BenchmarkList = input;

  const measures: BaseMeasure[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', `measures/${performanceYear}/measures-data.json`), 'utf8')
  );

  const indexedMeasures: MeasureList = _.mapKeys(measures, (measure: BaseMeasure) => {
    return measure.measureId;
  })

  let errors: Error[] = [];

  _.forEach(indexedBenchmarks, (benchmark, benchmarkMeasureId) => {
    if (typeof benchmarkMeasureId !== 'string') {
      errors.concat(
        new Error(`Invalid MeasureId data type for ${benchmarkMeasureId} expected 'string", received '${typeof benchmarkMeasureId}'. 
          ${JSON.stringify(benchmark, null, 2)}`
        )
      )
    }

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