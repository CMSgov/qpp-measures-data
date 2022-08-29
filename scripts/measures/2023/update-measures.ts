import _ from 'lodash';
import fs from 'fs';
import parse from 'csv-parse/lib/sync';
import path from 'path'

import { initValidation } from '../lib/validation-util';

const performanceYear = process.argv[2];

const measuresPath = `../../../measures/${performanceYear}/measures-data.json`;
const changesPath = `../../../updates/measures/${performanceYear}/`;

const measuresJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, measuresPath), 'utf8')
);

const changelog = JSON.parse(
    fs.readFileSync(path.join(__dirname, `${changesPath}Changelog.json`), 'utf8')
);

let numOfNewChangeFiles = 0;

const BASE_CSV_COLUMN_NAMES = {
    'title': 'title',
    'description': 'description',
    'measureId': 'measure_id'
}

const IA_CSV_COLUMN_NAMES = {
    ...BASE_CSV_COLUMN_NAMES,
    'weight': 'weight',
    'subcategoryId': 'subcategory_name'
};

const PI_CSV_COLUMN_NAMES = {
    ...BASE_CSV_COLUMN_NAMES,
    'required': 'required',
    'isRequired': 'required',
    'metricType': 'name',
    'isBonus': 'bonus',
    'reportingCategory': 'reporting_category',
    'substitutes': 'substitutes',
    'exclusion': 'exclusions',
};

function makeChanges() {
    const files = fs.readdirSync(path.join(__dirname, changesPath));

    files.forEach(fileName => {
        if(fileName != 'Changelog.json') {
            if(!changelog.includes(fileName)) {
                numOfNewChangeFiles++;
                updateMeasuresWithChangeFile(fileName, changesPath)
            }
        }
    });

    if(numOfNewChangeFiles > 0) {
        writeToFile(measuresJson, measuresPath);
    } else {
        console.info(
            '\x1b[33m%s\x1b[0m', 
            `No new change files found.`,
        );
    }
}

function convertCsvToJson(fileName: string, changesPath: string) {
    const csv = fs.readFileSync(path.join(__dirname, `${changesPath}${fileName}`), 'utf8');
    const parsedCsv = parse(csv, {columns: true});

    return parsedCsv.map((row) => {
        const measure = {};
        measure['category'] = row['category'].toLowerCase();
        let csvColumnNames;
        switch (measure['category']) {
          case 'ia':
              csvColumnNames = IA_CSV_COLUMN_NAMES;
              break;
          case 'pi':
              csvColumnNames = PI_CSV_COLUMN_NAMES;
              break;
        }
        _.each(csvColumnNames, (columnName, measureKeyName) => {
          if(row[columnName]) {
              measure[measureKeyName] = row[columnName];
          }
        });
        
        return measure;
    });
}

function updateMeasuresWithChangeFile(fileName: string, changesPath: string) {
    const changeData = convertCsvToJson(fileName, changesPath);
    let numOfFailures = 0;

    for (let i = 0; i < changeData.length; i++) {
        const change = changeData[i];

        if(change.category) {
            const validate = initValidation(change.category);

            if (validate(change)) {
                updateMeasure(change);
            } else {
                numOfFailures++;
                console.log(validate.errors)
            }
        } else {
            numOfFailures++;
            console.error(
                '\x1b[31m%s\x1b[0m', 
                `[ERROR]: '${fileName}': category is required.`,
            );
        }
    }

    if(numOfFailures === 0) {
        updateChangeLog(fileName, changesPath);
        console.info(
            '\x1b[32m%s\x1b[0m', 
            `File '${fileName}' successfully ingested into measures-data ${performanceYear}`,
        );
    } else {
        console.error(
            '\x1b[31m%s\x1b[0m', 
            `[ERROR]: Some changes failed for file '${fileName}'. More info logged above.`,
        );
    }
}

function updateChangeLog(fileName: string, changesPath: string) {
    changelog.push(fileName);
    writeToFile(changelog, `${changesPath}Changelog.json`);
}

function writeToFile(file: any, filePath: string) {
    fs.writeFile(path.join(__dirname, filePath), JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
      })
}

function updateMeasure(change) {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].measureId == change.measureId) {
            measuresJson[i] = {
                ...measuresJson[i],
                ...change as any,
            };
        }
    }
}

makeChanges();