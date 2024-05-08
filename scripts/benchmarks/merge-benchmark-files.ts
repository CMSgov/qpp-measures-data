import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';

import { Benchmark } from './benchmarks.types';
import { writeToFile } from './util';
import _ from 'lodash';
import { BENCHMARKS_ORDER } from '../constants';

// command to use this file:
//  node ./dist/benchmarks/merge-benchmark-files.js ./util/2023/benchmarks/json/ > ./benchmarks/2023.json
export function mergeBenchmarkFiles(benchmarksPath: string, performanceYear: number) {
    const mergedBenchmarks = new Map();
    const mergeConflicts: any[] = [];

    const fileNames = fs.readdirSync(path.join(appRoot + '', benchmarksPath));
    const benchmarkLayerFiles = fileNames
        .sort((left, right) => {
            if (left.indexOf('performance-benchmarks.json') > -1) {
                return 1;
            } else if (right.indexOf('performance-benchmarks.json') > -1) {
                return -1;
            } else {
                return 0;
            }
        });
    //  Run through all the files in the directory, pull their data into JSON arrays, 
    // then add their benchmarks to the final array.
    benchmarkLayerFiles.forEach(fileName => {
        const jsonFile = JSON.parse(
            fs.readFileSync(path.join(appRoot + '', `${benchmarksPath}${fileName}`), 'utf8')
        );
        const isPerformanceBenchmark = fileName.indexOf('performance-benchmarks.json') > -1;

        jsonFile.forEach((benchmark: Benchmark) => {
            benchmark = Object.assign({}, BENCHMARKS_ORDER, benchmark);
            if (isPerformanceBenchmark) {
                benchmark = processPerformanceBenchmark(benchmark);
            }
            const benchmarkKey = getBenchmarkKey(!isPerformanceBenchmark ? benchmark : { ...benchmark, benchmarkYear: benchmark.performanceYear - 2 });

            if (mergedBenchmarks.has(benchmarkKey) && !_.isEqual(mergedBenchmarks.get(benchmarkKey), benchmark)) {
                if (!isPerformanceBenchmark) {
                    mergeConflicts.push({
                        existing: mergedBenchmarks.get(benchmarkKey),
                        conflicting: benchmark,
                        conflictingFile: fileName
                    });
                } else if (isPerformanceBenchmark && benchmark.performanceYear === benchmark.benchmarkYear) {
                    mergedBenchmarks.set(benchmarkKey, benchmark);
                }
            } else {
                mergedBenchmarks.set(benchmarkKey, benchmark);
            }
            //remove the deciles column (which is still sometimes included in 3rd party files)
            delete benchmark.deciles;
        });
    });

    if (mergeConflicts.length > 0) {
        throw new Error('Merge Conflicts: \n' + JSON.stringify(mergeConflicts, null, 2));
    } else {
        const orderedBenchmarks = _.sortBy([...mergedBenchmarks.values()], ['measureId', 'submissionMethod']);
        writeToFile(orderedBenchmarks, `benchmarks/${performanceYear}.json`);
    };
};

function processPerformanceBenchmark(benchmark) {
    // Determines how to round Performance Benchmarks should be rounded per circumstance and business rules. Should mostly be 2.
    const acMeasures2021 = ['479', '480'];
    let decimalPlaces: number;
    if (acMeasures2021.includes(benchmark.measureId) && benchmark.performanceYear >= 2021) {
        decimalPlaces = 4;
    } else {
        decimalPlaces = 2;
    }

    Object.entries(benchmark.percentiles).forEach(([key, value]) => {
        if (typeof value === 'number') {
            benchmark.percentiles[key] = +value.toFixed(decimalPlaces)
        }
    })

    return {
        ...benchmark,
        isToppedOut: false,
        isToppedOutByProgram: false
    };
};

function getBenchmarkKey(benchmark) {
    let benchmarkKey = '';
    [ 'measureId', 'benchmarkYear', 'performanceYear', 'submissionMethod' ].forEach((keyName) => {
        if (keyName in benchmark) {
            benchmarkKey += `${benchmarkKey}${benchmark[keyName]}|`;
        } else {
            throw new Error('Key is missing: ' + keyName);
        }
    });

    return benchmarkKey;
};

/* c8 ignore next */
if (process.argv[2] && process.argv[2] !== '--coverage')
    /* c8 ignore next */
    mergeBenchmarkFiles(process.argv[2], parseInt(process.argv[3]));
