import * as Constants from '../../constants';
import Ajv, { JSONSchemaType } from 'ajv';
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
  }

interface baseMeasuresChange {
    measureId: string,
    Category: string,
    title?: string,
    description?: string,
    yearRemoved?: number,
    firstPerformanceYear?: number,
}

interface IA_MeasuresChange extends baseMeasuresChange {
    weight?: string,
    subcategoryId?: string,
};

interface PI_MeasuresChange extends baseMeasuresChange {
    required?: string,
    name?: string,
    bonus?: string,
    reportingCategory?: string,
    substitutes?: string[],
    exclusions?: string[],
    weight?: string,
    subcategoryId?: string,
};

interface Cost_MeasuresChange extends baseMeasuresChange {
    isInverse?: boolean,
    overallAlgorithm?: string,
    metricType?: string,
    submissionMethods?: string[],
};

interface Quality_MeasuresChange extends baseMeasuresChange {
    nqfId?: string,
    isHighPriority?: boolean,
    isInverse?: boolean,
    isRiskAdjusted?: boolean,
    primarySteward?: string,
    allowedVendors?: string[],
    allowedPrograms?: string[],
    eMeasureId?: string,
    nqfEMeasureId?: string,
    measureSets?: string[],
    metricType?: string,
    submissionMethods?: string[],
    overallAlgorithm?: string,
    clinicalGuidelineChanged?: string[],
    historic_benchmarks?: string[],
    icdImpacted?: string[],
};

export type MeasuresChange = IA_MeasuresChange | PI_MeasuresChange | Cost_MeasuresChange | Quality_MeasuresChange;

const baseValidationSchemaProperties = {
    measureId: { type: 'string' },
    Category: { type: 'string' },
    title: { type: 'string', nullable: true },
    description: { type: 'string', nullable: true },
    yearRemoved: { type: 'number', nullable: true },
    firstPerformanceYear: { type: 'number', nullable: true },
}

const ia_validationSchema: JSONSchemaType<IA_MeasuresChange> = {
    type: 'object',
    properties: {
        ...baseValidationSchemaProperties,
        weight: { type: 'string', nullable: true },
        subcategoryId: { type: 'string', nullable: true },
    },
    additionalProperties: false,
} as JSONSchemaType<IA_MeasuresChange>;

const pi_validationSchema: JSONSchemaType<PI_MeasuresChange> = {
    type: 'object',
    properties: {
        ...baseValidationSchemaProperties,
        required: { type: 'string', nullable: true },
        name: { type: 'string', nullable: true },
        bonus: { type: 'string', nullable: true },
        reportingCategory: { type: 'string', nullable: true },
        substitutes: { type: 'array', items: { type: 'string' }, nullable: true },
        exclusions: { type: 'array', items: { type: 'string' }, nullable: true },
        weight: { type: 'string', nullable: true },
        subcategoryId: { type: 'string', nullable: true },
    },
    additionalProperties: false,
} as JSONSchemaType<PI_MeasuresChange>;

const cost_validationSchema: JSONSchemaType<Cost_MeasuresChange> = {
    type: 'object',
    properties: {
        ...baseValidationSchemaProperties,
        isInverse: { type: 'boolean', nullable: true },
        overallAlgorithm: { type: 'string', nullable: true },
        metricType: { type: 'string', nullable: true },
        submissionMethods: { type: 'array', items: { type: 'string' }, nullable: true },
    },
    additionalProperties: false,
} as JSONSchemaType<Cost_MeasuresChange>;

const quality_validationSchema: JSONSchemaType<Quality_MeasuresChange> = {
    type: 'object',
    properties: {
        ...baseValidationSchemaProperties,
        nqfId: { type: 'string', nullable: true },
        nationalQualityStrategyDomain: { type: 'string', nullable: true },
        isHighPriority: { type: 'boolean', nullable: true },
        isInverse: { type: 'boolean', nullable: true },
        isRiskAdjusted: { type: 'boolean', nullable: true },
        primarySteward: { type: 'string', nullable: true },
        allowedVendors: { type: 'array', items: { type: 'string' }, nullable: true },
        allowedPrograms: { type: 'array', items: { type: 'string', enum: Constants.ALLOWED_PROGRAMS }, nullable: true },
        eMeasureId: { type: 'string', nullable: true },
        nqfEMeasureId: { type: 'string', nullable: true },
        measureSets: { type: 'array', items: { type: 'string' }, nullable: true },
        isRegistryMeasure: { type: 'boolean', nullable: true },
        metricType: { type: 'string', enum: Constants.METRIC_TYPES, nullable: true },
        submissionMethods: { type: 'array', items: { type: 'string' }, nullable: true },
        overallAlgorithm: { type: 'string', enum: Constants.OVERALL_ALGORITHM, nullable: true },
        clinicalGuidelineChanged: { type: 'array', items: { type: 'string', enum: [...new Set(Object.values(Constants.COLLECTION_TYPES))] }, nullable: true },
        historic_benchmarks: { type: 'array', items: { type: 'string', enum: [...new Set(Object.values(Constants.COLLECTION_TYPES))] }, nullable: true },
        icdImpacted: { type: 'array', items: { type: 'string', enum: [...new Set(Object.values(Constants.COLLECTION_TYPES))] }, nullable: true },
    },
    required: ['measureId', 'Category'],
    additionalProperties: false,
} as JSONSchemaType<Quality_MeasuresChange>;

export function initValidation(type: measureType, requireAll: boolean) {
    return ajv.compile(getSchema(type, requireAll))
}

function createSchema(schema: any, requireAll: boolean) {
    if (requireAll) {
        return {
            ...schema,
            required: Object.keys(schema.properties),
        }
    } else {
        return {
            ...schema,
            required: ['measureId', 'Category'],
        }
    }
}

function getSchema(type: measureType, requireAll: boolean) {
    switch (type) {
        case measureType.ia:
            return createSchema(ia_validationSchema, requireAll);
        case measureType.pi:
            return createSchema(pi_validationSchema, requireAll);
        case measureType.cost:
            return createSchema(cost_validationSchema, requireAll);
        case measureType.quality:
            return createSchema(quality_validationSchema, requireAll);
    }
}