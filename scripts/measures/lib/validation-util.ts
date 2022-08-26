import Ajv, { JSONSchemaType } from 'ajv';
const ajv = new Ajv();

export enum measureType {
    ia = 'ia',
    pi = 'pi',
  }

interface baseMeasuresChange {
    measureId: string,
    category: string,
    title?: string,
    description?: string,
}

interface IA_MeasuresChange extends baseMeasuresChange {
    weight?: string,
    subcategory_name?: string,
};

interface PI_MeasuresChange extends baseMeasuresChange {
    required?: string,
    name?: string,
    bonus?: string,
    reporting_category?: string,
    substitutes?: string,
    exclusions?: string,
    weight?: string,
    subcategory_name?: string,
};

const baseValidationSchemaProperties = {
    measureId: { type: 'string' },
    category: { type: 'string' },
    title: { type: 'string', nullable: true },
    description: { type: 'string', nullable: true },
}

const ia_validationSchema: JSONSchemaType<IA_MeasuresChange> = {
    type: 'object',
    properties: {
        ...baseValidationSchemaProperties,
        weight: { type: 'string', nullable: true },
        subcategory_name: { type: 'string', nullable: true },
    },
    required: ['measureId', 'category'],
    additionalProperties: false,
} as JSONSchemaType<IA_MeasuresChange>;

const pi_validationSchema: JSONSchemaType<PI_MeasuresChange> = {
    type: 'object',
    properties: {
        ...baseValidationSchemaProperties,
        required: { type: 'string', nullable: true },
        name: { type: 'string', nullable: true },
        bonus: { type: 'string', nullable: true },
        reporting_category: { type: 'string', nullable: true },
        substitutes: { type: 'string', nullable: true },
        exclusions: { type: 'string', nullable: true },
        weight: { type: 'string', nullable: true },
        subcategory_name: { type: 'string', nullable: true },
    },
    required: ['measureId', 'category'],
    additionalProperties: false,
} as JSONSchemaType<PI_MeasuresChange>;


export function initValidation(type: measureType) {
    return ajv.compile(getSchema(type))
}

function getSchema(type: measureType) {
    switch (type) {
        case measureType.ia:
            return ia_validationSchema;
        case measureType.pi:
            return pi_validationSchema;
    }
}