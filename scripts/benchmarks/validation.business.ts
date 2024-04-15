import _ from 'lodash';
import { Benchmark, BenchmarkList, QualityMeasure } from './benchmarks.types';
import {
  BaseMeasure,
  MeasureList,
} from './benchmarks.types';
import path from 'path';
import appRoot from 'app-root-path';
import fs from 'fs-extra';

function readStagingJSONFile(fileName: string, performanceYear: number) {
  const benchmarksStagingJSONDirectory = appRoot + `/staging/${performanceYear}/benchmarks/json`

  return JSON.parse(
    fs.readFileSync(path.join(benchmarksStagingJSONDirectory + '', fileName), 'utf8')
  ) as BenchmarkList;
}

export function benchmarkBusinessValidation(jsonName: string, performanceYear: number) {
  let errors: Error[] = [];
  let indexedBenchmarks: BenchmarkList;

  indexedBenchmarks = readStagingJSONFile(jsonName, performanceYear);
  indexedBenchmarks = _.mapKeys(indexedBenchmarks, ((benchmark: Benchmark) => {
    if (!benchmark.measureId) {
      errors.push(new Error(`no MeasureId provided for benchmark: ${JSON.stringify(benchmark)}`));
      return;
    }

    return benchmark.measureId;
  }));

  if (errors.length > 0) {
    throw errors;
  }


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

/* istanbul ignore next */
if (process.argv[2] && process.argv[2] !== '--coverage')
  benchmarkBusinessValidation(process.argv[2], parseInt(process.argv[3]));
