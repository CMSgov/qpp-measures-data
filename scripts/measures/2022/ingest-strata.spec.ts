
import appRoot from 'app-root-path';
import fs from 'fs';
import path from 'path';

import * as Util from './update-measures-util';
import { ingestStrata } from './ingest-strata';
import { DataValidationError } from '../../errors';

const performanceYear = 2022;
const testDataPath = `test/measures/${performanceYear}`;
const measuresPath = `${testDataPath}/test-measures.json`;

const measuresJson = JSON.parse(
    fs.readFileSync(path.join(appRoot + "", measuresPath), "utf8")
);

describe('ingest-strata', () => {
    it('successfully ingests strata changes', () => {
        const strataPath = `${testDataPath}/quality-strata.csv`;
        const measuresResultPath = `${testDataPath}/test-measures-result.json`;
        const measuresResultJson = JSON.parse(
            fs.readFileSync(path.join(appRoot + "", measuresResultPath), "utf8")
        );
        jest.spyOn(JSON, 'parse').mockReturnValueOnce(measuresJson);
        const writeSpy = jest.spyOn(Util, 'writeToFile');
        writeSpy.mockImplementation();
        
        ingestStrata(performanceYear, strataPath);
        
        expect(writeSpy).toBeCalledWith(measuresResultJson, `measures/${performanceYear}/measures-data.json`);
    });

    it('fails to ingest strata if the measureId is blank in the csv.', () => {
        const strataPath = `${testDataPath}/blank-measureid-quality-strata.csv`;
        jest.spyOn(JSON, 'parse').mockReturnValueOnce(measuresJson);
        const writeSpy = jest.spyOn(Util, 'writeToFile');
        writeSpy.mockImplementation();

        expect(() => {
            ingestStrata(performanceYear, strataPath);
        }).toThrowError(new DataValidationError(strataPath, 'MeasureId is required.'));
    });

    it('fails to ingest strata if the name or description is blank in the csv.', () => {
        const strataPath = `${testDataPath}/bad-quality-strata.csv`;
        jest.spyOn(JSON, 'parse').mockReturnValueOnce(measuresJson);
        const writeSpy = jest.spyOn(Util, 'writeToFile');
        writeSpy.mockImplementation();
        
        expect(() => {
            ingestStrata(performanceYear, strataPath);
        }).toThrowError(new DataValidationError(strataPath, 'Name and description are required.'));
    });
});