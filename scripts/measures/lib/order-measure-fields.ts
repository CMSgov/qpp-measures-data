import * as fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';

import { orderFields, writeToFile } from './measures-lib';
import { Measure } from '../../../util/interfaces/measure';

export function orderMeasuresFields(performanceYear: string) {

    // Load and parse the JSON
    const measuresPath = `measures/${performanceYear}/measures-data.json`;
    const measuresJson: Measure[] = JSON.parse(
        fs.readFileSync(path.join(appRoot + '', measuresPath), 'utf8')
    );

    // Organize measures fields
    const orderedMeasures = measuresJson.map(measure => orderFields(measure));

    // Write the organized result to the measures-data.json file
    writeToFile(orderedMeasures, measuresPath);
    console.log('Measures fields sorted.');
}

/* c8 ignore next */
if (process.argv[2] && process.argv[2] !== '--coverage')
    /* c8 ignore next */
    orderMeasuresFields(process.argv[2]);
