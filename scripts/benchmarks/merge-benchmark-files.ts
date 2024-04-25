import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';

import { Benchmark } from './benchmarks.types';
import { writeToFile } from './util';

// command to use this file:
//  node ./dist/benchmarks/merge-benchmark-files.js ./util/2023/benchmarks/json/ > ./benchmarks/2023.json
export function mergeBenchmarkFiles(benchmarksPath: string, performanceYear: number) {
    let combinedBenchmarks: Benchmark[] = [];

    const fileNames = fs.readdirSync(path.join(appRoot + '', benchmarksPath));

    //  Run through all the files in the directory, pull their data into JSON arrays, 
    // then add their benchmarks to the final array.
    fileNames.forEach(fileName => {
        const jsonFile = JSON.parse(
            fs.readFileSync(path.join(appRoot + '', `${benchmarksPath}${fileName}`), 'utf8')
        );
        //remove the deciles column (which is still sometimes included in 3rd party files)
        jsonFile.forEach((benchmark: Benchmark) => {
            delete benchmark.deciles;
        });
        combinedBenchmarks.push(...jsonFile);
    });
    
    // sort by measureId, then by submissionMethod.
    combinedBenchmarks.sort((a, b) =>
        a.measureId.localeCompare(b.measureId) ||
        a.submissionMethod.localeCompare(b.submissionMethod)
    );
    
    writeToFile(combinedBenchmarks, `benchmarks/${performanceYear}.json`);
};

/* istanbul ignore next */
if (process.argv[2] && process.argv[2] !== '--coverage')
    mergeBenchmarkFiles(process.argv[2], parseInt(process.argv[3]));