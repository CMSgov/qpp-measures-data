/**
 * @IngestStrata
 *  Instead of utilizing an update process (as we do for measures),
 * we handle strata by updating the CSVs in /util and 
 * re-inject the data into the measures-data.json.
 */

import _ from 'lodash';
import fs from 'fs';
import parse from 'csv-parse/lib/sync';
import path from 'path';
import appRoot from 'app-root-path';

import { info, error, warning} from '../../logger';
import { initValidation, MeasuresChange, measureType } from '../lib/validate-change-requests';
import * as Constants from '../../constants';

const performanceYear = process.argv[2];
const strataPath = process.argv[3];

const measuresPath = `measures/${performanceYear}/measures-data.json`;

const measuresJson = JSON.parse(
    fs.readFileSync(path.join(appRoot+'', measuresPath), 'utf8')
);
const strata = parse(
    fs.readFileSync(path.join(appRoot+'', strataPath), 'utf8'),
    { columns: true, skip_empty_lines: true },
);

export function ingestStrata() {
    const uniqueMeasureIds = [...new Set(strata.map(stratum => stratum.measureId))];
    for (let i = 0; i < uniqueMeasureIds.length; i++) {
        const measureStrata = _.filter(strata, {'measureId': uniqueMeasureIds[i]});
        const mappedStrata = measureStrata.map(stratum => {
            return {
                name: stratum.stratumName,
                description: stratum.description,
        }});
        measuresJson.find(measure => measure.measureId === uniqueMeasureIds[i]).strata = mappedStrata;
    }
    writeToFile(measuresJson, measuresPath);
}

function writeToFile(file: any, filePath: string) {
    fs.writeFile(path.join(appRoot+'', filePath), JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
    });
}

ingestStrata();