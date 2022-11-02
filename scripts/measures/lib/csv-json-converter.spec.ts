import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';

import { convertCsvToJson } from './csv-json-converter';
import * as logger from '../../logger';
import { InvalidValueError } from './errors';

const iaChangesCSV = fs.readFileSync(path.join(appRoot + '', 'test/measures/2023/iaMeasures.csv'), 'utf8');
const piChangesCSV = fs.readFileSync(path.join(appRoot + '', 'test/measures/2023/piMeasures.csv'), 'utf8');
const badPiMeasures = fs.readFileSync(path.join(appRoot + '', 'test/measures/2023/badPiMeasures.csv'), 'utf8');
const qualityChangesCSV = fs.readFileSync(path.join(appRoot + '', 'test/measures/2023/qualityMeasures.csv'), 'utf8');
const qcdrChangesCSV = fs.readFileSync(path.join(appRoot + '', 'test/measures/2023/qcdrMeasures.csv'), 'utf8');
const badQcdrMeasures = fs.readFileSync(path.join(appRoot + '', 'test/measures/2023/badQcdrMeasures.csv'), 'utf8');

const iaJson = {
    title: 'iaTitle',
    description: 'iaDescription',
    measureId: 'IA_EPA_2',
    firstPerformanceYear: 2018,
    category: 'ia',
    weight: 'high',
    subcategoryId: 'populationManagement',
};

const iaNullFieldsJson = {
    ...iaJson,
    measureId: 'IA_EPA_3',
    weight: null,
    subcategoryId: null,
};

const piJson = {
    title: 'piTitle',
    description: 'piDescription',
    measureId: 'PI_PPHI_1',
    firstPerformanceYear: 2018,
    category: 'pi',
    isRequired: false,
    objective: 'publicHealthAndClinicalDataExchange',
    metricType: 'boolean',
    isBonus: true,
    reportingCategory: 'required',
    substitutes: [ 'PI_PPHI_2' ],
    exclusion: [ 'PI_EP_1', 'PI_EP_32' ],
};

const piNullFieldsJson = {
    ...piJson,
    measureId: 'PI_PPHI_2',
    objective: null,
    reportingCategory: null,
    substitutes: [],
    exclusion: null,
};

const qualityJson = {
    title: 'qualityTitle',
    description: 'qualityDescription',
    measureId: '001',
    firstPerformanceYear: 2018,
    category: 'quality',
    nqfEMeasureId: 'idX11',
    nqfId: '0060',
    primarySteward: 'stewardTitle',
    measureType: 'process',
    isHighPriority: false,
    submissionMethods: [ 'registry', 'claims' ],
    measureSets: [ 'nephrology', 'preventiveMedicine' ],
    isInverse: false,
    metricType: 'singlePerformanceRate',
    clinicalGuidelineChanged: [ 'registry' ],
    historic_benchmarks: { registry: 'removed' },
    icdImpacted: [ 'claims' ],
    isRiskAdjusted: false,
};

const qcdrMeasure = {
    title: 'qcdrTitle',
    description: 'qcdrDescription',
    measureId: 'TestQCDR',
    firstPerformanceYear: 2018,
    category: 'qcdr',
    nqfEMeasureId: 'idX11',
    nqfId: '0060',
    primarySteward: 'stewardTitle',
    measureType: 'process',
    isHighPriority: false,
    submissionMethods: [ 'registry', 'claims' ],
    allowedVendors: [ '123456', '654321' ],
    isInverse: false,
    metricType: 'registrySinglePerformanceRate',
    clinicalGuidelineChanged: [ 'registry' ],
    historic_benchmarks: { registry: 'removed' },
    icdImpacted: [ 'claims' ],
    isRiskAdjusted: true,
};

describe('#csv-json-converter', () => {
    it('converts an IA csv to json', () => {
        expect(convertCsvToJson(iaChangesCSV)).toEqual([iaJson, iaNullFieldsJson]);
    });

    it('converts a PI csv to json', () => {
        expect(convertCsvToJson(piChangesCSV)).toEqual([piJson, piNullFieldsJson]);
    });

    it('converts a Quality csv to json', () => {
        const loggerSpy = jest.spyOn(logger, 'warning').mockImplementation(jest.fn());
        expect(convertCsvToJson(qualityChangesCSV)).toEqual([qualityJson, qcdrMeasure]);
        expect(loggerSpy).toBeCalledWith('Quality measures cannot be Risk Adjusted. Setting isRiskAdjusted to false.');
    });

    it('converts a QCDR multiPerfRate measure to json', () => {
        expect(convertCsvToJson(qcdrChangesCSV)).toEqual([{
            ...qcdrMeasure,
            metricType: 'registryMultiPerformanceRate',
            overallAlgorithm: 'simpleAverage',
            yearRemoved: 2023,
        }]);
    });

    it('throws InvalidValueError for badly mapped array data', () => {
        expect(() => {
            convertCsvToJson(badQcdrMeasures);
        }).toThrowError(new InvalidValueError('Collection Type(s) where Truncated', 'Part Baddata Claims'));
    });

    it('throws InvalidValueError for badly mapped boolean data', () => {
        expect(() => {
            convertCsvToJson(badPiMeasures);
        }).toThrowError(new InvalidValueError('Bonus', 'Yes'));
    });
});