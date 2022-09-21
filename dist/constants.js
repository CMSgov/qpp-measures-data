"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEASURE_SETS = exports.MEASURE_TYPES = exports.ALLOWED_PROGRAMS = exports.COLLECTION_TYPES = exports.COLLECTION_TYPES_FIELDS = exports.OVERALL_ALGORITHM = exports.METRIC_TYPES = exports.BOOLEAN_CSV_FIELDS = exports.ARRAY_CSV_FIELDS = exports.QUALITY_CSV_COLUMN_NAMES = exports.PI_CSV_COLUMN_NAMES = exports.IA_CSV_COLUMN_NAMES = exports.BASE_CSV_COLUMN_NAMES = void 0;
exports.BASE_CSV_COLUMN_NAMES = {
    'title': 'title',
    'description': 'description',
    'measureId': 'measure_id',
    'yearRemoved': 'Year Removed',
    'firstPerformanceYear': 'Year Added',
    'category': 'Category',
};
exports.IA_CSV_COLUMN_NAMES = {
    ...exports.BASE_CSV_COLUMN_NAMES,
    'weight': 'weight',
    'subcategoryId': 'subcategory_name'
};
exports.PI_CSV_COLUMN_NAMES = {
    ...exports.BASE_CSV_COLUMN_NAMES,
    'required': 'required',
    'isRequired': 'required',
    'metricType': 'name',
    'isBonus': 'bonus',
    'reportingCategory': 'reporting_category',
    'substitutes': 'substitutes',
    'exclusion': 'exclusions',
};
exports.QUALITY_CSV_COLUMN_NAMES = {
    'title': 'Measure Title',
    'eMeasureId': 'CMS eCQM ID',
    'nqfEMeasureId': 'eCQM NQF',
    'nqfId': 'NQF',
    'measureId': 'Quality Number (#) / QCDR #',
    'primarySteward': 'Primary Measure Steward',
    'allowedVendors': 'Allowed QCDR Vendor ID',
    'description': 'Measure Description',
    'measureType': 'Measure Type  ',
    'isHighPriority': 'High Priority',
    'submissionMethods': 'Collection Type(s) for Submission',
    'measureSets': 'Specialty Measure Sets',
    'isInverse': 'Inverse',
    'metricType': 'Metric Type',
    'overallAlgorithm': 'Calculation Type',
    'clinicalGuidelineChanged': 'Collection Type(s) where Suppressed',
    'historic_benchmarks': 'Collection Type(s) where Historic Benchmark Removed',
    'icdImpacted': 'Collection Type(s) where Truncated',
    'allowedPrograms': 'Allowed Program(s)',
    'isRiskAdjusted': 'Is Risk Adjusted ',
    'yearRemoved': 'Year Removed',
    'firstPerformanceYear': 'Year Added',
};
exports.ARRAY_CSV_FIELDS = [
    'substitutes',
    'exclusions',
    'Collection Type(s) for Submission',
    'Allowed QCDR Vendor ID',
    'Allowed Program(s)',
    'Specialty Measure Sets',
    'Collection Type(s) where Suppressed',
    'Collection Type(s) where Historic Benchmark Removed',
    'Collection Type(s) where Truncated',
];
exports.BOOLEAN_CSV_FIELDS = [
    'Inverse',
    'Is Risk Adjusted ',
    'High Priority',
];
exports.METRIC_TYPES = [
    'registrySinglePerformanceRate',
    'singlePerformanceRate',
    'multiPerformanceRate',
    'nonProportion',
    'costScore',
];
exports.OVERALL_ALGORITHM = [
    'weightedAverage',
    'simpleAverage',
    'overallStratumOnly',
];
exports.COLLECTION_TYPES_FIELDS = [
    'Collection Type(s) where Suppressed',
    'Collection Type(s) where Historic Benchmark Removed',
    'Collection Type(s) where Truncated',
    'Collection Type(s) for Submission',
];
exports.COLLECTION_TYPES = {
    'Part B Claims': 'claims',
    'CSV': 'certifiedSurveyVendor',
    'eCQM': 'electronicHealthRecord',
    'CMS WI': 'cmsWebInterface',
    'Admin Claims': 'administrativeClaims',
    'MIPS CQM': 'registry',
    'QCDR': 'registry',
};
exports.ALLOWED_PROGRAMS = {
    'MIPS': 'mips',
    'APP': 'app1',
    'PCF': 'pcf',
};
exports.MEASURE_TYPES = {
    'process': 'process',
    'outcome': 'outcome',
    'patient engagement/experience': 'patientEngagementExperience',
    'efficiency': 'efficiency',
    'intermediateoutcome': 'intermediateOutcome',
    'structure': 'structure',
    'patientreportedoutcome': 'patientReportedOutcome'
};
exports.MEASURE_SETS = {
    'Allergy/Immunology': 'allergyImmunology',
    'Anesthesiology': 'anesthesiology',
    'Cardiology': 'cardiology',
    'Electro-physiologyCardiacSpecialist': 'electrophysiologyCardiacSpecialist',
    'Gastro-enterology': 'gastroenterology',
    'Dermatology': 'dermatology',
    'EmergencyMedicine': 'emergencyMedicine',
    'FamilyMedicine': 'familyMedicine',
    'InternalMedicine': 'internalMedicine',
    'Obstetrics/Gynecology': 'obstetricsGynecology',
    'Ophthalmology/Optometry': 'ophthalmology',
    'OrthopedicSurgery': 'orthopedicSurgery',
    'Otolaryngology': 'otolaryngology',
    'Pathology': 'pathology',
    'Pediatrics': 'pediatrics',
    'PhysicalMedicine': 'physicalMedicine',
    'PlasticSurgery': 'plasticSurgery',
    'PreventiveMedicine': 'preventiveMedicine',
    'Neurology': 'neurology',
    'Mental/Behavioral Health and Psychiatry': 'mentalBehavioralHealth',
    'DiagnosticRadiology': 'diagnosticRadiology',
    'InterventionalRadiology': 'interventionalRadiology',
    'VascularSurgery': 'vascularSurgery',
    'GeneralSurgery': 'generalSurgery',
    'ThoracicSurgery': 'thoracicSurgery',
    'Urology': 'urology',
    'Oncology/Hematology': 'oncology',
    'RadiationOncology': 'radiationOncology',
    'Hospitalists': 'hospitalists',
    'Rheumatology': 'rheumatology',
    'Nephrology': 'nephrology',
    'InfectiousDisease': 'infectiousDisease',
    'Neurosurgical': 'neurosurgical',
    'Podiatry': 'podiatry',
    'PhysicalTherapy/OccupationalTherapy': 'physicalTherapyOccupationalTherapy',
    'Geriatrics': 'geriatrics',
    'UrgentCare': 'urgentCare',
    'SkilledNursing Facility': 'skilledNursingFacility',
    'Dentistry': 'dentistry',
    'Cinical Social Work': 'clinicalSocialWork',
    'Audiology': 'audiology',
    'CertifiedNurseMidwife': 'certifiedNurseMidwife',
    'ChiropracticMedicine': 'chiropracticMedicine',
    'Endocrinology': 'endocrinology',
    'Nutrition/Dietician': 'nutritionDietician',
    'Pulmonology': 'pulmonology',
    'SpeechLanguagePathology': 'speechLanguagePathology',
};
