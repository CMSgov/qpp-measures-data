"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var SUBMISSION_METHODS = [
    'claims',
    'certifiedSurveyVendor',
    'electronicHealthRecord',
    'cmsWebInterface',
    'administrativeClaims',
    'registry'
];
function buildHeaderMap(suffix) {
    return SUBMISSION_METHODS.reduce(function (acc, method) {
        acc["".concat(method).concat(suffix)] = method;
        return acc;
    }, {});
}
function aggregateMethods(fieldMap, data) {
    return Object.entries(fieldMap).reduce(function (acc, _a) {
        var _b = __read(_a, 2), field = _b[0], method = _b[1];
        if (data[field] === 'Y') {
            acc.push(method);
        }
        return acc;
    }, []);
}
;
function aggregateBenchmarks(fieldMap, data, type, benchmarks) {
    if (benchmarks === void 0) { benchmarks = {}; }
    return Object.entries(fieldMap).reduce(function (acc, _a) {
        var _b = __read(_a, 2), field = _b[0], method = _b[1];
        if (data[field] === 'Y') {
            benchmarks[method] = type;
        }
        return acc;
    }, benchmarks);
}
var REMOVED_METHODS = buildHeaderMap('Removed');
var IMPACTED_METHODS = buildHeaderMap('Truncated');
var GUIDELINE_METHODS = buildHeaderMap('Suppressed');
module.exports = function (measures, benchmarkMetadata, benchmarkField) {
    var e_1, _a;
    if (benchmarkField === void 0) { benchmarkField = false; }
    var _loop_1 = function (benchmark) {
        var measure = measures.find(function (measure) { return measure.measureId === benchmark.measureId; });
        if (measure) {
            var icdImpacted = aggregateMethods(IMPACTED_METHODS, benchmark);
            var clinicalGuidelinesChanged = aggregateMethods(GUIDELINE_METHODS, benchmark);
            if (!measure.isRegistryMeasure) {
                measure.icdImpacted = icdImpacted;
                measure.isIcdImpacted = !!icdImpacted.length;
                measure.clinicalGuidelineChanged = clinicalGuidelinesChanged;
                measure.isClinicalGuidelineChanged = !!clinicalGuidelinesChanged.length;
            }
            if (benchmarkField) {
                measure.historic_benchmarks = aggregateBenchmarks(REMOVED_METHODS, benchmark, 'removed');
            }
        }
    };
    try {
        for (var benchmarkMetadata_1 = __values(benchmarkMetadata), benchmarkMetadata_1_1 = benchmarkMetadata_1.next(); !benchmarkMetadata_1_1.done; benchmarkMetadata_1_1 = benchmarkMetadata_1.next()) {
            var benchmark = benchmarkMetadata_1_1.value;
            _loop_1(benchmark);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (benchmarkMetadata_1_1 && !benchmarkMetadata_1_1.done && (_a = benchmarkMetadata_1.return)) _a.call(benchmarkMetadata_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
};
