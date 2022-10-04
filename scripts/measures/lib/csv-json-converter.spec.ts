import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';

import { convertCsvToJson } from './csv-json-converter';
import * as logger from '../../logger';

const iaChangesCSV = fs.readFileSync(path.join(appRoot + '', 'test/measures/2023/iaMeasures.csv'), 'utf8');
const piChangesCSV = fs.readFileSync(path.join(appRoot + '', 'test/measures/2023/piMeasures.csv'), 'utf8');
const qualityChangesCSV = fs.readFileSync(path.join(appRoot + '', 'test/measures/2023/qualityMeasures.csv'), 'utf8');

const iaJson = {
    title: 'iaTitle',
    description: 'iaDescription',
    measureId: 'IA_EPA_2',
    firstPerformanceYear: 2018,
    category: 'ia',
    weight: 'high',
    subcategoryId: 'populationManagement',
};

const piJson = {
    title: 'piTitle',
    description: 'piDescription',
    measureId: 'PI_PPHI_1',
    firstPerformanceYear: 2018,
    category: 'pi',
    isRequired: false,
    metricType: 'boolean',
    isBonus: true,
    reportingCategory: 'required',
    substitutes: [ 'PI_PPHI_2' ],
    exclusion: [ 'PI_EP_1', 'PI_EP_32' ],
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
    allowedPrograms: [ 'mips' ],
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
    allowedPrograms: [ 'mips' ],
    isRiskAdjusted: true,
};

describe('#csv-json-converter', () => {
    it('converts an IA csv to json', () => {
        expect(convertCsvToJson(iaChangesCSV)).toEqual([iaJson]);
    });

    it('converts a PI csv to json', () => {
        expect(convertCsvToJson(piChangesCSV)).toEqual([piJson]);
    });

    it('converts a Quality csv to json', () => {
        const loggerSpy = jest.spyOn(logger, 'warning').mockImplementation(jest.fn());
        expect(convertCsvToJson(qualityChangesCSV)).toEqual([qualityJson, qcdrMeasure]);
        expect(loggerSpy).toBeCalledWith('Quality measures cannot be Risk Adjusted. Setting isRiskAdjusted to false.');
    });
});