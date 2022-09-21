"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initValidation = exports.measureType = void 0;
const Constants = __importStar(require("../../constants"));
const ajv_1 = __importDefault(require("ajv"));
const ajv = new ajv_1.default();
var measureType;
(function (measureType) {
    measureType["ia"] = "ia";
    measureType["pi"] = "pi";
    measureType["cost"] = "cost";
    measureType["quality"] = "quality";
})(measureType = exports.measureType || (exports.measureType = {}));
;
;
;
;
const baseValidationSchemaProperties = {
    measureId: { type: 'string' },
    category: { type: 'string' },
    title: { type: 'string', nullable: true },
    description: { type: 'string', nullable: true },
    yearRemoved: { type: 'number', nullable: true },
    firstPerformanceYear: { type: 'number', nullable: true },
};
const ia_validationSchema = {
    type: 'object',
    properties: {
        ...baseValidationSchemaProperties,
        weight: { type: 'string', nullable: true },
        subcategoryId: { type: 'string', nullable: true },
    },
    additionalProperties: false,
};
const pi_validationSchema = {
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
};
const cost_validationSchema = {
    type: 'object',
    properties: {
        ...baseValidationSchemaProperties,
        isInverse: { type: 'boolean', nullable: true },
        overallAlgorithm: { type: 'string', nullable: true },
        metricType: { type: 'string', nullable: true },
        submissionMethods: { type: 'array', items: { type: 'string' }, nullable: true },
    },
    additionalProperties: false,
};
const quality_validationSchema = {
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
        allowedPrograms: { type: 'array', items: { type: 'string', enum: Object.values(Constants.ALLOWED_PROGRAMS) }, nullable: true },
        eMeasureId: { type: 'string', nullable: true },
        nqfEMeasureId: { type: 'string', nullable: true },
        measureSets: { type: 'array', items: { type: 'string' }, nullable: true },
        isRegistryMeasure: { type: 'boolean', nullable: true },
        metricType: { type: 'string', enum: Constants.METRIC_TYPES, nullable: true },
        submissionMethods: { type: 'array', items: { type: 'string' }, nullable: true },
        overallAlgorithm: { type: 'string', enum: Constants.OVERALL_ALGORITHM, nullable: true },
        clinicalGuidelineChanged: { type: 'array', items: { type: 'string', enum: [...new Set(Object.values(Constants.COLLECTION_TYPES))] }, nullable: true },
        historic_benchmarks: { type: 'object', nullable: true },
        icdImpacted: { type: 'array', items: { type: 'string', enum: [...new Set(Object.values(Constants.COLLECTION_TYPES))] }, nullable: true },
    },
    required: ['measureId', 'category'],
    additionalProperties: false,
};
function initValidation(type, requireAll) {
    return ajv.compile(getSchema(type, requireAll));
}
exports.initValidation = initValidation;
function createSchema(schema, requireAll) {
    if (requireAll) {
        return {
            ...schema,
            required: Object.keys(schema.properties),
        };
    }
    else {
        return {
            ...schema,
            required: ['measureId', 'category'],
        };
    }
}
function getSchema(type, requireAll) {
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
