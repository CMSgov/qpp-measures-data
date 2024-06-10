/**
* @util
*  This script hosts any functions used across benchmarks scripts
*/
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import { parse } from 'csv-parse/sync';

export function prepareCsv(csv: any) {
    //parse csv.
    let parsedCsv: any[] = parse(csv, {
        columns: true,
        relax_column_count: true,
        bom: true,
        skip_records_with_empty_values: true,
    });

    //trim keys in parsed csv.
    parsedCsv = _.map(parsedCsv, (row) => {
        return _.mapKeys(row, (value, key) => {
            return key.trim();
        });
    });

    return parsedCsv;
}

export function fetchCSV(filePath: string) {
    return fs.readFileSync(path.join(appRoot + '', `${filePath}`), 'utf8');
}

export function writeToFile(file: any, filePath: string) {
    fs.writeFileSync(path.join(appRoot + '', filePath), JSON.stringify(file, null, 2));
}
