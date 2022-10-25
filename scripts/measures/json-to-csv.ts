/**
 * @JsonToCsv
 *  Converts a list of JSON measures (of the same category/year) to a CSV.
 */

import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';

import { error } from '../logger';

const performanceYear = process.argv[2];
const category = process.argv[3];

const measuresPath = `../../measures/${performanceYear}/measures-data.json`;

const measuresJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, measuresPath), 'utf8')
);

const validCategories = ['ia', 'pi', 'cost', 'quality', 'qcdr'];

function createJson() {

    if (!validCategories.includes(category)) {
        error(`category ${category} is not valid. Must be one of the following: ${validCategories.toString()}`)
        return;
    }

    let measuresOfCategory: any[];

    if (['ia', 'pi', 'cost'].includes(category)) {
        measuresOfCategory = _.filter(measuresJson, { category });
    }
    else {
        measuresOfCategory = getAllQcdrOrQualityMeasures();
    }

    writeToFile(measuresOfCategory, `tmp/${performanceYear}/${category}-measures.json`);
}

function getAllQcdrOrQualityMeasures() {
    let measuresOfCategory: any[] = [];
    for (let i = 0; i < measuresJson.length; i++) {
        if (
            category === 'quality' &&
            !measuresJson[i].isRegistryMeasure &&
            !['cahps', 'costScore'].includes(measuresJson[i].metricType)
        ) {
            measuresOfCategory.push(measuresJson[i]);
        }
        else if (
            category === 'qcdr' &&
            measuresJson[i].category === 'quality' &&
            !measuresJson[i].isRegistryMeasure
        ) {
            measuresOfCategory.push(measuresJson[i]);
        }
    }
    return measuresOfCategory;
}

function writeToFile(file: any, filePath: string) {
    fs.writeFile(path.join(appRoot + '', filePath), JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
    });
}

creatJson();
