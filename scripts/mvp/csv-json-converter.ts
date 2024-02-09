/**
* @CsvToJsonConverter
*  This is a utility script which converts MVP CSVs
* to json.
*/
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import { parse } from 'csv-parse/sync';

function convertCsvToJson(csvPath: string, performanceYear: number, jsonFileName: string) {
    const csv = fetchCSV(csvPath);
    const jsonPath = `mvp/${performanceYear}/${jsonFileName}.json`;

    let parsedCsv: Object[] = parse(csv, {
        columns: true,
        relax_column_count: true,
        bom: true,
        trim: true,
        skip_empty_lines: true,
    });
    
    const mappedCsv = parsedCsv.map((row) => {
        const mvp = {
            'MVP Title': '',
            'MVP ID': '',
            'MVP Description': '',
            'Most Applicable Medical Specialties': '',
            'Clinical Topic': '',
            'MVP Reporting Category': '',
            'Measure Id': '',
        }
        //maps the csv column values to the matching json fields.
        _.each(mvp, (data, columnName) => {
            if (row[columnName]) {
                mvp[columnName] = row[columnName].trim();
            }
        });
        
        return mvp;
    });

    writeToFile(mappedCsv, jsonPath);
}

export function writeToFile(file: any, filePath: string) {
    fs.writeFileSync(path.join(appRoot + '', filePath), JSON.stringify(file, null, 2));
}

function fetchCSV(filePath: string) {
    return fs.readFileSync(path.join(appRoot + '', `${filePath}`), 'utf8');
}

convertCsvToJson(process.argv[2], parseInt(process.argv[3]), process.argv[4]);
