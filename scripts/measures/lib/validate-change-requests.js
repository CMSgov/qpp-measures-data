"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initValidation = exports.measureType = void 0;
var ajv_1 = __importDefault(require("ajv"));
var ajv = new ajv_1.default();
/**
 *  This file handles validation schema setup and validation runs
 * for the change requests. Validation of the measures-data file
 * is handled by `validate-data` and the measures-schema.yaml files.
 */
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
var baseValidationSchemaProperties = {
    measureId: { type: 'string' },
    category: { type: 'string' },
    title: { type: 'string', nullable: true },
    description: { type: 'string', nullable: true },
};
var ia_validationSchema = {
    type: 'object',
    properties: __assign(__assign({}, baseValidationSchemaProperties), { weight: { type: 'string', nullable: true }, subcategoryId: { type: 'string', nullable: true } }),
    required: ['measureId', 'category'],
    additionalProperties: false,
};
var pi_validationSchema = {
    type: 'object',
    properties: __assign(__assign({}, baseValidationSchemaProperties), { required: { type: 'string', nullable: true }, name: { type: 'string', nullable: true }, bonus: { type: 'string', nullable: true }, reportingCategory: { type: 'string', nullable: true }, substitutes: { type: 'string', nullable: true }, exclusions: { type: 'string', nullable: true }, weight: { type: 'string', nullable: true }, subcategoryId: { type: 'string', nullable: true } }),
    required: ['measureId', 'category'],
    additionalProperties: false,
};
var cost_validationSchema = {
    type: 'object',
    properties: __assign(__assign({}, baseValidationSchemaProperties), { isInverse: { type: 'boolean', nullable: true }, overallAlgorithm: { type: 'string', nullable: true }, metricType: { type: 'string', nullable: true }, submissionMethods: { type: 'array', items: { type: 'string' }, nullable: true } }),
    required: ['measureId', 'category'],
    additionalProperties: false,
};
var quality_validationSchema = {
    type: 'object',
    properties: __assign(__assign({}, baseValidationSchemaProperties), { nqfId: { type: 'string', nullable: true }, nationalQualityStrategyDomain: { type: 'string', nullable: true }, isHighPriority: { type: 'boolean', nullable: true }, isInverse: { type: 'boolean', nullable: true }, isRiskAdjusted: { type: 'boolean', nullable: true }, primarySteward: { type: 'string', nullable: true }, allowedVendors: { type: 'array', items: { type: 'string' }, nullable: true }, allowedPrograms: { type: 'array', items: { type: 'string' }, nullable: true }, eMeasureId: { type: 'string', nullable: true }, nqfEMeasureId: { type: 'string', nullable: true }, measureSets: { type: 'array', items: { type: 'string' }, nullable: true }, isRegistryMeasure: { type: 'boolean', nullable: true }, isIcdImpacted: { type: 'boolean', nullable: true }, metricType: { type: 'string', nullable: true }, submissionMethods: { type: 'array', items: { type: 'string' }, nullable: true } }),
    required: ['measureId', 'category'],
    additionalProperties: false,
};
function initValidation(type) {
    return ajv.compile(getSchema(type));
}
exports.initValidation = initValidation;
function getSchema(type) {
    switch (type) {
        case measureType.ia:
            return ia_validationSchema;
        case measureType.pi:
            return pi_validationSchema;
        case measureType.cost:
            return cost_validationSchema;
        case measureType.quality:
            return quality_validationSchema;
    }
}
