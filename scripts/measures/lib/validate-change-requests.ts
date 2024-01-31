import * as Constants from '../../constants';
import Ajv, { JSONSchemaType } from 'ajv';
import _ from 'lodash';
const ajv = new Ajv();

/**
 *  This file handles validation schema setup and validation runs
 * for the change requests. Validation of the measures-data file
 * is handled by `validate-data` and the measures-schema.yaml files.
 */

export enum measureType {
    ia = 'ia',
    pi = 'pi',
    cost = 'cost',
    quality = 'quality',
    qcdr = 'qcdr',
}

interface baseMeasuresChange {
    measureId: string,
    category: string,
    title?: string,
    description?: string,
    yearRemoved?: number,
    firstPerformanceYear?: number,
}

interface Cost_MeasuresChange extends baseMeasuresChange {
    isInverse?: boolean,
    metricType?: string,
    overallAlgorithm?: string,
    submissionMethods?: string[],
};

interface IA_MeasuresChange extends baseMeasuresChange {
    weight?: string,
    subcategoryId?: string,
};

interface PI_MeasuresChange extends baseMeasuresChange {
    isRequired?: boolean,
    metricType?: string,
    objective?: string,
    isBonus?: boolean,
    reportingCategory?: string,
    substitutes?: string[],
    exclusion?: string[],
};

interface Base_Quality_MeasuresChange extends baseMeasuresChange {
    nqfId?: string,
    isHighPriority?: boolean,
    isInverse?: boolean,
    isRiskAdjusted?: boolean,
    primarySteward?: string,
    measureType?: string,
    eMeasureId?: string,
    nqfEMeasureId?: string,
    isRegistryMeasure?: boolean,
    metricType?: string,
    submissionMethods?: string[],
    overallAlgorithm?: string,
    clinicalGuidelineChanged?: string[],
    historic_benchmarks?: object,
    icdImpacted?: string[],
    measureSets?: string[],
    strata?: object[],
};

interface QCDR_MeasuresChange extends Base_Quality_MeasuresChange {
    allowedVendors?: string[],
};

export type MeasuresChange =
    IA_MeasuresChange &
    PI_MeasuresChange &
    Cost_MeasuresChange &
    Base_Quality_MeasuresChange &
    QCDR_MeasuresChange;

const baseValidationSchemaProperties = {
    measureId: { type: 'string' },
    category: { type: 'string' },
    title: { type: 'string', nullable: true },
    description: { type: 'string', nullable: true },
    yearRemoved: { type: 'number', nullable: true },
    firstPerformanceYear: { type: 'number', nullable: true },
}

const baseQualitySchemaProperties = {
    ...baseValidationSchemaProperties,
    nqfId: { type: 'string', nullable: true },
    isHighPriority: { type: 'boolean', nullable: true },
    isInverse: { type: 'boolean', nullable: true },
    isRiskAdjusted: { type: 'boolean', nullable: true },
    primarySteward: { type: 'string', nullable: true },
    measureType: { type: 'string', nullable: true },
    eMeasureId: { type: 'string', nullable: true },
    nqfEMeasureId: { type: 'string', nullable: true },
    isRegistryMeasure: { type: 'boolean', nullable: true },
    metricType: { type: 'string', enum: Constants.METRIC_TYPES, nullable: true },
    submissionMethods: { type: 'array', items: { type: 'string' }, nullable: true },
    overallAlgorithm: { type: 'string', enum: Constants.OVERALL_ALGORITHM, nullable: true },
    clinicalGuidelineChanged: { type: 'array', items: { type: 'string', enum: [...new Set(Object.values(Constants.COLLECTION_TYPES))] }, nullable: true },
    historic_benchmarks: { type: 'object', nullable: true },
    icdImpacted: { type: 'array', items: { type: 'string', enum: [...new Set(Object.values(Constants.COLLECTION_TYPES))] }, nullable: true },
    measureSets: { type: 'array', items: { type: 'string' }, nullable: true },
    strata: { type: 'array', items: { type: 'object' }, nullable: true },
};

const baseQualityRequiredFields = [
    'measureId',
    'category',
    'title',
    'description',
    'primarySteward',
    'measureType',
    'isHighPriority',
    'submissionMethods',
    'isInverse',
    'metricType',
    'firstPerformanceYear',
];

const cost_validationSchema: JSONSchemaType<Cost_MeasuresChange> = {
    type: 'object',
    properties: {
        ...baseValidationSchemaProperties,
        isInverse: { type: 'boolean', nullable: true },
        metricType: { type: 'string', nullable: true },
        overallAlgorithm: { type: 'string', enum: Constants.OVERALL_ALGORITHM, nullable: true },
        submissionMethods: { type: 'array', items: { type: 'string' }, nullable: true },
    },
    required: ['measureId', 'category'],
    additionalProperties: false,
} as JSONSchemaType<Cost_MeasuresChange>;

const ia_validationSchema: JSONSchemaType<IA_MeasuresChange> = {
    type: 'object',
    properties: {
        ...baseValidationSchemaProperties,
        weight: { type: 'string', nullable: true },
        subcategoryId: { type: 'string', nullable: true },
    },
    required: ['measureId', 'category'],
    additionalProperties: false,
} as JSONSchemaType<IA_MeasuresChange>;

const pi_validationSchema: JSONSchemaType<PI_MeasuresChange> = {
    type: 'object',
    properties: {
        ...baseValidationSchemaProperties,
        isRequired: { type: 'boolean', nullable: true },
        metricType: { type: 'string', nullable: true },
        objective: { type: 'string', nullable: true },
        isBonus: { type: 'boolean', nullable: true },
        reportingCategory: { type: 'string', nullable: true },
        substitutes: { type: 'array', items: { type: 'string' }, nullable: true },
        exclusion: { type: 'array', items: { type: 'string' }, nullable: true },
    },
    required: ['measureId', 'category'],
    additionalProperties: false,
} as JSONSchemaType<PI_MeasuresChange>;

const quality_validationSchema: JSONSchemaType<Base_Quality_MeasuresChange> = {
    type: 'object',
    properties: baseQualitySchemaProperties,
    required: ['measureId', 'category'],
    additionalProperties: false,
} as JSONSchemaType<Base_Quality_MeasuresChange>;

const qcdr_validationSchema: JSONSchemaType<QCDR_MeasuresChange> = {
    type: 'object',
    properties: {
        ...baseQualitySchemaProperties,
        allowedVendors: { type: 'array', items: { type: 'string' }, nullable: true },
    },
    required: ['measureId', 'category'],
    additionalProperties: false,
} as JSONSchemaType<QCDR_MeasuresChange>;

export function initValidation(type: measureType, isNewMeasure) {
    return ajv.compile(getSchema(type, isNewMeasure))
}

function createSchema(schema: any, isNewMeasure: boolean, type: measureType) {
    // If it's a new measure, some fields are required beyond the category and measureId.
    if (isNewMeasure) {
        switch (type) {
            case measureType.quality:
                return {
                    ...schema,
                    required: [...baseQualityRequiredFields, 'measureSets'],
                };
            case measureType.qcdr:
                return {
                    ...schema,
                    required: [...baseQualityRequiredFields, 'allowedVendors', 'isRiskAdjusted'],
                };
            default:
                return {
                    ...schema,
                    required: _.remove(Object.keys(schema.properties), (property) => {return property !== 'yearRemoved';}),
                };
        }
    } else {
        return schema;
    }
}

function getSchema(type: measureType, isNewMeasure: boolean) {
    switch (type) {
        case measureType.ia:
            return createSchema(ia_validationSchema, isNewMeasure, type);
        case measureType.pi:
            return createSchema(pi_validationSchema, isNewMeasure, type);
        case measureType.cost:
            return createSchema(cost_validationSchema, isNewMeasure, type)
        case measureType.quality:
            return createSchema(quality_validationSchema, isNewMeasure, type);
        case measureType.qcdr:
            return createSchema(qcdr_validationSchema, isNewMeasure, type);
    }
}