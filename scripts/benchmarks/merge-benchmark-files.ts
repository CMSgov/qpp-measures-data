import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';

import { Benchmark } from './csv-json-converter';

// command to use this file:
//  node ./dist/benchmarks/merge-benchmark-files.js ./util/2023/benchmarks/json/ > ./benchmarks/2023.json
function mergeBenchmarkFiles(benchmarksPath: string) {
    let combinedBenchmarks: Benchmark[] = [];

    const fileNames = fs.readdirSync(path.join(appRoot + '', benchmarksPath));

    //  Run through all the files in the directory, pull their data into JSON arrays, 
    // then add their benchmarks to the final array.
    fileNames.forEach(fileName => {
        const jsonFile = JSON.parse(
            fs.readFileSync(path.join(appRoot + '', `${benchmarksPath}${fileName}`), 'utf8')
        );
        combinedBenchmarks.push(...jsonFile);
    });
    
    // sort by measureId, then by submissionMethod.
    combinedBenchmarks.sort((a, b) =>
        a.measureId.localeCompare(b.measureId) ||
        a.submissionMethod.localeCompare(b.submissionMethod)
    );
    
    // output to [year].json
    process.stdout.write(JSON.stringify(combinedBenchmarks, null, 2));
};

mergeBenchmarkFiles(process.argv[2]);