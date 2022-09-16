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
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrayCSVfields = exports.QUALITY_CSV_COLUMN_NAMES = exports.PI_CSV_COLUMN_NAMES = exports.IA_CSV_COLUMN_NAMES = exports.BASE_CSV_COLUMN_NAMES = void 0;
//These are only needed if the csv column names do not match the measures-data field names.
exports.BASE_CSV_COLUMN_NAMES = {
    'title': 'title',
    'description': 'description',
    'measureId': 'measure_id',
    'yearRemoved': 'Year Removed',
};
exports.IA_CSV_COLUMN_NAMES = __assign(__assign({}, exports.BASE_CSV_COLUMN_NAMES), { 'weight': 'weight', 'subcategoryId': 'subcategory_name' });
exports.PI_CSV_COLUMN_NAMES = __assign(__assign({}, exports.BASE_CSV_COLUMN_NAMES), { 'required': 'required', 'isRequired': 'required', 'metricType': 'name', 'isBonus': 'bonus', 'reportingCategory': 'reporting_category', 'substitutes': 'substitutes', 'exclusion': 'exclusions' });
exports.QUALITY_CSV_COLUMN_NAMES = {
    'Year Removed': 'yearRemoved',
};
exports.arrayCSVfields = [
    'substitutes',
    'exclusions',
    'submissionMethods',
    'allowedVendors',
    'allowedPrograms',
    'measureSets',
    'submissionMethods',
];
