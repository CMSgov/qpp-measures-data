import * as fs from 'fs';
import naturalCompare from 'natural-compare-lite';
import path from 'path';
import appRoot from 'app-root-path';

import { writeToFile } from './measures-lib';
import { Measure } from '../../../util/interfaces/measure';

export function sortMeasures(performanceYear: string) {

    // Load and parse the JSON
    const measuresPath = `measures/${performanceYear}/measures-data.json`;
    const measuresJson: Measure[] = JSON.parse(
        fs.readFileSync(path.join(appRoot + '', measuresPath), 'utf8')
    );

    // Group measures by category
    const grouped: { [category: string]: Measure[] } = {};
    measuresJson.forEach(measure => {
        if (!grouped[measure.category]) {
            grouped[measure.category] = [];
        }
        grouped[measure.category].push(measure);
    });

    // Sort measures in each category by MeasureId (do not sort categories)
    Object.keys(grouped).forEach(category => {
        grouped[category].sort((a, b) => naturalCompare(a.measureId, b.measureId));
    });

    // Flatten all sorted measures into a single array
    const flattened: Measure[] = Object.values(grouped).flat();

    // Write the organized result to the measures-data.json file
    writeToFile(flattened, measuresPath);
    console.log('Measures organized by category and measureId.');
}

/* c8 ignore next */
if (process.argv[2] && process.argv[2] !== '--coverage')
    /* c8 ignore next */
    sortMeasures(process.argv[2]);
