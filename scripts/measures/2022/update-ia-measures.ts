const performanceYear = 2022
const measuresFileName = `../../../measures/${performanceYear}/measures-data.json`;
const changesDir = `../../../updates/measures/${performanceYear}/`;

import changelog from '../../../updates/measures/2022/Changelog.json';
import measuresJson from '../../../measures/2022/measures-data.json';

import fs from 'fs';
import Ajv, { JSONSchemaType } from 'ajv';
const ajv = new Ajv();
let numOfNewChangeFiles = 0;

interface MeasuresChange {
    measureId: string,
    description?: string,
    weight?: string,
    subcategoryId?: string,
};

const validationSchema: JSONSchemaType<MeasuresChange> = {
    type: "object",
    properties: {
        measureId: { type: "string" },
        description: { type: "string", nullable: true },
        weight: { type: "string", nullable: true },
        subcategoryId: { type: "string", nullable: true },
    },
    required: ["measureId"],
    additionalProperties: false,
}

const validate = ajv.compile(validationSchema);

function makeChanges() {
    const files = fs.readdirSync(changesDir);

    files.forEach(fileName => {
        if(fileName != 'Changelog.json') {
            if(!changelog.includes(fileName)) {
                numOfNewChangeFiles++;
                updateMeasuresWithChangeFile(fileName)
            }
        }
    });

    if(numOfNewChangeFiles > 0) {
        writeToFile(measuresJson, measuresFileName);
    } else {
        console.info(
            '\x1b[33m%s\x1b[0m', 
            `No new change files found.`,
        );
    }
}

function updateMeasuresWithChangeFile(fileName: string) {
    const changeDataRaw = fs.readFileSync(`${changesDir}${fileName}`, 'utf8');
    const changeData = JSON.parse(changeDataRaw);
    let numOfFailures = 0;

    for (let i = 0; i < changeData.length; i++) {
        const change: MeasuresChange = changeData[i];
        if (validate(change)) {
            updateMeasure(change);
        } else {
            numOfFailures++;
            console.log(validate.errors)
        }
    }

    if(numOfFailures === 0) {
        updateChangeLog(fileName);
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

function updateChangeLog(fileName: string) {
    changelog.push(fileName);
    writeToFile(changelog, `${changesDir}Changelog.json`);
}

function writeToFile(file: any, fileName: string) {
    fs.writeFile(fileName, JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
      })
}

function updateMeasure(change: MeasuresChange) {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].measureId == change.measureId) {
            measuresJson[i] = {
                ...measuresJson[i],
                ...change as any,
            };
        }
    }
}

makeChanges()