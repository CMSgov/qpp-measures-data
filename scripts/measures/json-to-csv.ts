/**
 * @JsonToCsv
 *  Converts a list of JSON measures (of the same category/year) to a CSV.
 */

import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import papa from 'papaparse';

import { error } from '../logger';

const performanceYear = process.argv[2];
const category = process.argv[3];

__dirname = __dirname.replace('/dist', '');
__dirname = __dirname.replace('\\dist', '');

const measuresPath = `../../measures/${performanceYear}/measures-data.json`;

const measuresJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, measuresPath), 'utf8')
);

const validCategories = ['ia', 'pi', 'cost', 'quality', 'qcdr'];

const categoryFields = {
    ia: [],
    pi: [],
    cost: [],
    quality: [],
    qcdr: [],
};

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
    setCategoriesArray(category, measuresOfCategory);

    writeToJsonFile(measuresOfCategory, `tmp/${performanceYear}/${category}-measures.json`);

    //strata field is not suited for CSVs, change to bool value (TRUE if exists).
    if (['qcdr', 'quality'].includes(category)) {
        const simplifiedForCSV = measuresOfCategory.map(measure => {
            return { ...measure, strata: !!measure.strata }
        });
        writeToCSVFile(simplifiedForCSV, `tmp/${performanceYear}/${category}-measures.csv`);
    } else {
        writeToCSVFile(measuresOfCategory, `tmp/${performanceYear}/${category}-measures.csv`);
    }
}

function getAllQcdrOrQualityMeasures() {
    const measuresOfCategory: any[] = [];
    for (let i = 0; i < measuresJson.length; i++) {
        if (
            category === 'qcdr' &&
            measuresJson[i].category === 'quality' &&
            measuresJson[i].isRegistryMeasure &&
            !['cahps', 'costScore'].includes(measuresJson[i].metricType)
        ) {
            measuresOfCategory.push(measuresJson[i]);
        }
        else if (
            category === 'quality' &&
            measuresJson[i].category === 'quality' &&
            !measuresJson[i].isRegistryMeasure &&
            !measuresJson[i].measureId.includes('CAHPS_')
        ) {
            measuresOfCategory.push(measuresJson[i]);
        }
    }
    return measuresOfCategory;
}

function writeToJsonFile(file: any, filePath: string) {
    fs.writeFile(
        path.join(appRoot + '', filePath),
        JSON.stringify(file, null, 2),
        function writeJSON(err) {
            if (err) return console.log(err);
        }
    );
}

function writeToCSVFile(file: any, filePath: string) {
    fs.writeFile(
        path.join(appRoot + '', filePath),
        papa.unparse(file, { columns: categoryFields[category] }),
        function writeCSV(err) {
            if (err) return console.log(err);
        }
    );
}

function setCategoriesArray(category: string, measures: any[]) {
    categoryFields[category] = [];
    measures.forEach(measure => {
        categoryFields[category].push(...Object.keys(measure));
    });
    // remove dupes
    categoryFields[category] = [...new Set(categoryFields[category])]
}

createJson();
