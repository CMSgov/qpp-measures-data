const SUBMISSION_METHODS = [
  'claims',
  'certifiedSurveyVendor',
  'electronicHealthRecord',
  'cmsWebInterface',
  'administrativeClaims',
  'registry'
];

function buildHeaderMap(suffix) {
  return SUBMISSION_METHODS.reduce((acc, method) => {
    acc[`${method}${suffix}`] = method;
    return acc;
  }, {});
}
function aggregateMethods(fieldMap, data) {
  return Object.entries(fieldMap).reduce((acc, [field, method]) => {
    if (data[field] === 'Y') {
      acc.push(method);
    }
    return acc;
  }, []);
};

function aggregateBenchmarks(fieldMap, data, type, benchmarks = {}) {
  return Object.entries(fieldMap).reduce((acc, [field, method]) => {
    if (data[field] === 'Y') {
      benchmarks[method] = type;
    }
    return acc;
  }, benchmarks);
}

const FLAT_METHODS = buildHeaderMap('Flat');
const REMOVED_METHODS = buildHeaderMap('Removed');
const IMPACTED_METHODS = buildHeaderMap('Truncated');
const GUIDELINE_METHODS = buildHeaderMap('Suppressed');

module.exports = (measures, benchmarkMetadata, benchmarkField = false) => {
  for (const benchmark of benchmarkMetadata) {
    const measure = measures.find(measure => measure.measureId === benchmark.measureId);
    if (measure) {
      const icdImpacted = aggregateMethods(IMPACTED_METHODS, benchmark);
      const clinicalGuidelinesChanged = aggregateMethods(GUIDELINE_METHODS, benchmark);

      measure.icdImpacted = icdImpacted;
      measure.isIcdImpacted = !!icdImpacted.length;
      measure.clinicalGuidelinesChanged = clinicalGuidelinesChanged;
      measure.isClinicalGuidelinesChanged = !!clinicalGuidelinesChanged.length;

      if (benchmarkField) {
        let benchmarks = aggregateBenchmarks(FLAT_METHODS, benchmark, 'flat', {});
        benchmarks = aggregateBenchmarks(REMOVED_METHODS, benchmark, 'removed', benchmarks);
        measure.benchmarks = benchmarks;
      }
    }
  }
};
