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
import { Measure } from '../../util/interfaces';
import { Category } from '../../util/interfaces/measure';

__dirname = __dirname.replace('/dist', '');
__dirname = __dirname.replace('\\dist', '');

const validCategories = ['ia', 'pi', 'cost', 'quality', 'qcdr'];

const categoryFields = {
    ia: [] as string[],
    pi: [] as string[],
    cost: [] as string[],
    quality: [] as string[],
    qcdr: [] as string[],
};

export function createJson(performanceYear: string, category: Category) {
    const measuresPath = `../../measures/${performanceYear}/measures-data.json`;
    const measuresJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, measuresPath), 'utf8')
    );

    if (!validCategories.includes(category)) {
        error(`category ${category} is not valid. Must be one of the following: ${validCategories.toString()}`)
        return;
    }

    let measuresOfCategory: Measure[];

    if (['ia', 'pi', 'cost'].includes(category)) {
        measuresOfCategory = _.filter(measuresJson, { category });
    }
    else {
        measuresOfCategory = getAllQcdrOrQualityMeasures(measuresJson, category);
    }
    setCategoriesArray(category, measuresOfCategory);

    writeToJsonFile(measuresOfCategory, `tmp/${performanceYear}/${category}-measures.json`);

    //strata field is not suited for CSVs, change to bool value (TRUE if exists).
    if (['qcdr', 'quality'].includes(category)) {
        const simplifiedForCSV = measuresOfCategory.map(measure => {
            return { ...measure, strata: !!measure['strata'] }
        });
        writeToCSVFile(category, simplifiedForCSV, `tmp/${performanceYear}/${category}-measures.csv`);
    } else {
        writeToCSVFile(category, measuresOfCategory, `tmp/${performanceYear}/${category}-measures.csv`);
    }
}

export function getAllQcdrOrQualityMeasures(measuresJson: Measure[], category: string): Measure[] {
    const measuresOfCategory: Measure[] = [];
    for (let i = 0; i < measuresJson.length; i++) {
        const measure = measuresJson[i];
        if (
            category === Category.QCDR &&
            measure.category === Category.QUALITY &&
            measure.isRegistryMeasure &&
            !['cahps', 'costScore'].includes(measure.metricType)
        ) {
            measuresOfCategory.push(measure);
        }
        else if (
            category === Category.QUALITY &&
            measure.category === Category.QUALITY &&
            !measure.isRegistryMeasure &&
            !measure.measureId.includes('CAHPS_')
        ) {
            measuresOfCategory.push(measure);
        }
    }
    return measuresOfCategory;
}

export function writeToJsonFile(file: any, filePath: string) {
    fs.writeFile(
        path.join(appRoot + '', filePath),
        JSON.stringify(file, null, 2),
        function writeJSON(err) {
            if (err) return console.log(err);
        }
    );
}

export function writeToCSVFile(category: Category, file: any, filePath: string) {
    fs.writeFile(
        path.join(appRoot + '', filePath),
        papa.unparse(file, { columns: categoryFields[category] }),
        function writeCSV(err) {
            if (err) return console.log(err);
        }
    );
}

function setCategoriesArray(category: string, measures: Measure[]) {
    categoryFields[category] = [];
    measures.forEach(measure => {
        categoryFields[category].push(...Object.keys(measure));
    });
    // remove dupes
    categoryFields[category] = [...new Set(categoryFields[category])]
}

/* c8 ignore next */
if (process.argv[2] && process.argv[2] !== '--coverage')
    /* c8 ignore next */
    createJson(process.argv[2], process.argv[3] as Category);
