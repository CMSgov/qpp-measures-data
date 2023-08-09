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
    fs.readFileSync(path.join(benchmarksStagingJSONDirectory + '', fileName), 'utf8')
  ) as BenchmarkList;
}

export function benchmarkBusinessValidation(performanceYear: number, input?: BenchmarkList) {
  let rawInput, rawInputCahps;
  let errors: Error[] = [];

  if (!input) {
    rawInputCahps = readStagingJSONFile('benchmarks_cahps.json', performanceYear);
    rawInput = readStagingJSONFile('benchmarks.json', performanceYear);

    rawInput = rawInput.concat(rawInputCahps);

    input = _.mapKeys(rawInput, ((benchmark: Benchmark) => {
        if (!benchmark.measureId) {
          errors.push(new Error(`no MeasureId provided for benchmark: ${JSON.stringify(benchmark)}`));
          return;
        }

        return benchmark.measureId;
      })
    )
  }

  if (errors.length > 0) {
    throw errors;
  }

  const indexedBenchmarks: BenchmarkList = input;

  const measures: BaseMeasure[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', `measures/${performanceYear}/measures-data.json`), 'utf8')
  );

  const indexedMeasures: MeasureList = _.mapKeys(measures, (measure: BaseMeasure) => {
    return measure.measureId;
  })



  _.forEach(indexedBenchmarks, (benchmark, benchmarkMeasureId) => {
    const comparableMeasure = indexedMeasures[benchmarkMeasureId];

    if (!comparableMeasure) {
      errors.push(
        new Error(
          `No comparable measure found for Benchmark with measureId: ${benchmarkMeasureId}`
        )
      );

      return;
    }

    if (_.has(benchmark, 'isHighPriority')) {
      if (benchmark.isHighPriority !== (comparableMeasure as QualityMeasure).isHighPriority) {
        errors.push(
          new Error(
            `Property mismatch for isHighPrority between Benchmark of id ${benchmarkMeasureId} and its Measure's data. Measure expected ${(comparableMeasure as QualityMeasure).isHighPriority} received ${benchmark.isHighPriority}.`
          )
        );

        return;
      }
    }

    if (_.has(benchmark, 'isInverse')) {
      if (benchmark.isInverse !== (comparableMeasure as QualityMeasure).isInverse) {
        errors.push(
          new Error(`Property mismatch for isInverse between Benchmark of id ${benchmarkMeasureId} its Measure's data. Measure expected ${(comparableMeasure as QualityMeasure).isInverse} received ${benchmark.isInverse}.`)
        );

        return;
      }
    }
  });

  if (errors.length > 0) {
    throw errors;
  }
}