/**
 * @InitializeMeasuresData
 *  Currently this file just removes the spec urls and increments eMeasureIds from the previous year.
 * e.g. CMS122v10 -> CMS122v11
 *  Any future initialization logic added here should have its own function which
 * is then called in initMeasuresData().
 */

import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { error } from '../logger';

const performanceYear = process.argv[2];

const measuresPath = `../../measures/${performanceYear}/measures-data.json`;

const measuresJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, measuresPath), 'utf8')
);

function initMeasuresData() {
    incrementEMeasureId();
    removeSpecUrls();

    writeToFile(measuresJson, measuresPath);
}

function incrementEMeasureId() {
    for (let i = 0; i < measuresJson.length; i++) {
        if (_.isString(measuresJson[i].eMeasureId)) {
            const splitId: string[] = _.split(measuresJson[i].eMeasureId, 'v');
            if (splitId.length === 2 && _.isNumber(+splitId[1])) {
                measuresJson[i].eMeasureId = splitId[0] + 'v' + (+splitId[1]+1);
            } else {
                error(`Failed to increment eMeasureId ${measuresJson[i].eMeasureId}`);
            }
        }
    }
}

function removeSpecUrls() {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].measureSpecification) {
            measuresJson[i].measureSpecification = {};
        }
    }
}

function writeToFile(file: any, filePath: string) {
    fs.writeFile(path.join(__dirname, filePath), JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
    });
}

initMeasuresData();
