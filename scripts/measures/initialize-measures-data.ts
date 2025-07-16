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

// This is a Test

// Fix for __dirname when running compiled scripts from dist
__dirname = __dirname.replace('/dist', '').replace('\\dist', '');

const measuresPath = `../../measures/${performanceYear}/measures-data.json`;

const measuresJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, measuresPath), 'utf8')
);

function initMeasuresData() {
    incrementEMeasureId();
    removeSpecUrls();
    removeIcdImpacted();
    removeClinicalGuidelineChanged();
    removeBenchmarksRemoved();
    removeEMeasureUuids();
    initializeSevenPointCapRemoved();

    writeToFile(measuresJson, measuresPath);
}

// Remove eMeasureUuid from the measure
function removeEMeasureUuids() {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].eMeasureId !== null) {
            delete measuresJson[i].eMeasureUuid;

            if (Array.isArray(measuresJson[i].strata)) {
                measuresJson[i].strata.forEach((stratum) => {
                    if (stratum.eMeasureUuids) {
                        delete stratum.eMeasureUuids;
                    }
                });
            }
        }
    }
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

function removeIcdImpacted() {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].isIcdImpacted) {
            measuresJson[i].isIcdImpacted = false;
        }
        if (measuresJson[i].icdImpacted) {
            measuresJson[i].icdImpacted = [];
        }
    }
}

function removeClinicalGuidelineChanged() {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].isClinicalGuidelineChanged) {
            measuresJson[i].isClinicalGuidelineChanged = false;
        }
        if (measuresJson[i].clinicalGuidelineChanged) {
            measuresJson[i].clinicalGuidelineChanged = [];
        }
    }
}

function removeBenchmarksRemoved() {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].historic_benchmarks) {
            delete measuresJson[i].historic_benchmarks;
        }
    }
}

function initializeSevenPointCapRemoved() {
    const year = parseInt(performanceYear, 10);

    if (isNaN(year)) {
        throw new Error('Invalid performance year. Please provide a valid number.');
    }

    for (let i = 0; i < measuresJson.length; i++) {
        if (year >= 2025 && measuresJson[i].category === 'quality') {
            measuresJson[i].isSevenPointCapRemoved = false;
            measuresJson[i].sevenPointCapRemoved = [];
        }
    }
}

function writeToFile(file: any, filePath: string) {
    fs.writeFile(path.join(__dirname, filePath), JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
    });
}

initMeasuresData();
