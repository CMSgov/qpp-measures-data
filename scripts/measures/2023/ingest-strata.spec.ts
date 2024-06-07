
import appRoot from 'app-root-path';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';

import * as Lib from '../lib/measures-lib';
import { ingestStrata } from './ingest-strata';
import { DataValidationError } from '../../errors';

const performanceYear = 2023;
const testDataPath = `test/measures/${performanceYear}`;
const measuresPath = `${testDataPath}/test-measures.json`;

const measuresJson = JSON.parse(
    fs.readFileSync(path.join(appRoot + "", measuresPath), "utf8")
);

describe('ingest-strata', () => {
    it('successfully ingests strata changes', () => {
        const strataPath = `${testDataPath}/test-strata.csv`;
        const measuresResultPath = `${testDataPath}/test-measures-result.json`;
        const measuresResultJson = JSON.parse(
            fs.readFileSync(path.join(appRoot + "", measuresResultPath), "utf8")
        );
        jest.spyOn(JSON, 'parse').mockReturnValueOnce(measuresJson);
        const writeSpy = jest.spyOn(Lib, 'writeToFile');
        writeSpy.mockImplementation();
        
        ingestStrata(performanceYear, strataPath);
        
        expect(writeSpy).toBeCalledWith(measuresResultJson, `measures/${performanceYear}/measures-data.json`);
    });

    it('fails to ingest strata if the measureId is blank in the csv.', () => {
        const strataPath = `${testDataPath}/blank-measureid-test-strata.csv`;
        jest.spyOn(JSON, 'parse').mockReturnValueOnce(measuresJson);
        const writeSpy = jest.spyOn(Lib, 'writeToFile');
        writeSpy.mockImplementation();

        expect(() => {
            ingestStrata(performanceYear, strataPath);
        }).toThrowError(new DataValidationError(strataPath, 'MeasureId is required.'));
    });

    it('fails to ingest strata if the name or description is blank in the csv.', () => {
        const strataPath = `${testDataPath}/bad-test-strata.csv`;
        jest.spyOn(JSON, 'parse').mockReturnValueOnce(measuresJson);
        const writeSpy = jest.spyOn(Lib, 'writeToFile');
        writeSpy.mockImplementation();
        
        expect(() => {
            ingestStrata(performanceYear, strataPath);
        }).toThrowError(new DataValidationError(strataPath, 'Name and description are required.'));
    });
});