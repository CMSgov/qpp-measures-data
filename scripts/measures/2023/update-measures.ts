import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';

import { warning } from '../../logger';
import { updateMeasuresWithChangeFile, writeToFile } from './update-measures-util';

export function updateMeasures(performanceYear: string, testMode: string = 'false') {

    const changesPath = `updates/measures/${performanceYear}/`;
    const measuresPath = `measures/${performanceYear}/measures-data.json`;    

    const changelog = JSON.parse(
        fs.readFileSync(path.join(appRoot + '', `${changesPath}changes.meta.json`), 'utf8')
    );

    const measuresJson: any[] = JSON.parse(
        fs.readFileSync(path.join(appRoot + '', measuresPath), 'utf8')
    );

    //to determine if any new changes need to be written to measures-data.json.
    let numOfNewChangeFiles = 0;

    const fileNames = fs.readdirSync(path.join(appRoot + '', changesPath));

    fileNames.forEach(fileName => {
        if (fileName != 'changes.meta.json') {
            //find only the change files not yet present in the changelog.
            if (!changelog.includes(fileName)) {
                numOfNewChangeFiles++;
                updateMeasuresWithChangeFile(fileName, changesPath, performanceYear, measuresJson, testMode);
            }
        }
    });

    if (numOfNewChangeFiles > 0) {
        if (testMode === 'false'){
            writeToFile(measuresJson, measuresPath);
        }
    } else {
        warning('No new change files found.');
    }
}

 /* istanbul ignore next */ 
if (process.argv[2] && process.argv[2] !== '--coverage')
    updateMeasures(process.argv[2], process.argv[3]);