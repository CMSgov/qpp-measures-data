//These are only needed if the csv column names do not match the measures-data field names.
export const BASE_CSV_COLUMN_NAMES = {
    'title': 'Measure Title',
    'description': 'Measure Description',
    'measureId': 'Measure ID',
    'yearRemoved': 'Year Removed',
    'firstPerformanceYear': 'First Performance Year',
    'category': 'Category',
};

export const COST_CSV_COLUMN_NAMES = {
    ...BASE_CSV_COLUMN_NAMES,
    'isInverse': 'Inverse',
    'metricType': 'Metric Type',
    'submissionMethods': 'Collection Type(s) for Submission',
};

export const IA_CSV_COLUMN_NAMES = {
    ...BASE_CSV_COLUMN_NAMES,
    'weight': 'Weight',
    'subcategoryId': 'Subcategory Name'
};

export const PI_CSV_COLUMN_NAMES = {
    ...BASE_CSV_COLUMN_NAMES,
    'isRequired': 'Required',
    'metricType': 'Metric Type',
    'isBonus': 'Bonus',
    'objective': 'Objective',
    'reportingCategory': 'Reporting Category',
    'substitutes': 'Substitutes',
    'exclusion': 'Exclusions',
};

export const QUALITY_CSV_COLUMN_NAMES = {
    'category': 'Category',
    'title': 'Measure Title',
    'eMeasureId': 'CMS eCQM ID',
    'nqfEMeasureId': 'eCQM NQF',
    'nqfId': 'NQF',
    'measureId': '*** Quality Number (#) / QCDR #',
    'primarySteward': 'Primary Measure Steward',
    'allowedVendors': 'Allowed QCDR Vendor ID',
    'description': 'Measure Description',
    'measureType': '*** Measure Type',
    'isHighPriority': 'High Priority',
    'submissionMethods': '*** Collection Type(s) for Submission',
    'measureSets': 'Specialty Measure Sets',
    'isInverse': '*** Inverse',
    'metricType': '*** Metric Type',
    'overallAlgorithm': '*** Calculation Type',
    'clinicalGuidelineChanged': 'Collection Type(s) where Suppressed',
    'historic_benchmarks': 'Collection Type(s) where Historic Benchmark Removed',
    'icdImpacted': 'Collection Type(s) where Truncated',
    'isRiskAdjusted': 'Is Risk Adjusted',
    'yearRemoved': 'Year Removed',
    'firstPerformanceYear': 'First Performance Year',
    'sevenPointCapRemoved': '*** Collection Type(s) where 7-point Cap Removed',
};

export const BENCHMARKS_COLUMN_NAMES = {
    'measureId': 'measureId',
    'qualityId': 'measureId',
    'isToppedOut': 'isToppedOut',
    'isToppedOutByProgram': 'isToppedOutByProgram',
    'isHighPriority': 'isHighPriority',
    'submissionMethod': 'submissionMethod',
    'isInverse': 'isInverse',
    'metricType': 'metricType',
    'averagePerformanceRate': 'averagePerformanceRate',
};

export const COST_NATIONAL_AVERAGES_COLUMN_NAMES = {
    'measureId': 'measure_id',
    'benchmarkYear': 'benchmark_year',
    'performanceYear': 'performance_year',
    'groupNationalAverage': 'group_national_average',
    'individualNationalAverage': 'individual_national_average',
};

export const SUBMISSION_METHOD_MAP = {
    'ecqm': 'electronicHealthRecord',
    'medicarepartbclaims': 'claims',
    'mipscqm': 'registry',
    'qcdrmeasure': 'registry',
    'cmswebinterface': 'cmsWebInterface',
    'administrativeclaims': 'administrativeClaims',
    'cahpssurveyvendor': 'certifiedSurveyVendor',
    'certifiedsurveyvendor': 'certifiedSurveyVendor'
};

export const ARRAY_CSV_FIELDS = [
    'Substitutes',
    'Exclusions',
    '*** Collection Type(s) for Submission',
    'Collection Type(s) for Submission',
    'Allowed QCDR Vendor ID',
    'Specialty Measure Sets',
    'Collection Type(s) where Suppressed',
    'Collection Type(s) where Historic Benchmark Removed',
    'Collection Type(s) where Truncated',
    '*** Collection Type(s) where 7-point Cap Removed',
];

export const BOOLEAN_CSV_FIELDS = [
    '*** Inverse',
    'Inverse',
    'Is Risk Adjusted',
    'High Priority',
    'Bonus',
    'Required',
    'benchmark',
    'isHighPriority',
    'isInverse',
    'isToppedOut',
    'isToppedOutByProgram',
];

export const METRIC_TYPES = [
    'registrySinglePerformanceRate',
    'registryMultiPerformanceRate',
    'singlePerformanceRate',
    'multiPerformanceRate',
    'nonProportion',
    'costScore',
];

export const OVERALL_ALGORITHM = [
    'weightedAverage',
    'simpleAverage',
    'overallStratumOnly',
    'split',
];

export const COLLECTION_TYPES_FIELDS = [
    'Collection Type(s) where Suppressed',
    'Collection Type(s) where Historic Benchmark Removed',
    'Collection Type(s) where Truncated',
    '*** Collection Type(s) for Submission',
    '*** Collection Type(s) where 7-point Cap Removed',
];

export const COLLECTION_TYPES = {
    'partbclaims': 'claims',
    'csv': 'certifiedSurveyVendor',
    'ecqm': 'electronicHealthRecord',
    'cmswi': 'cmsWebInterface',
    'adminclaims': 'administrativeClaims',
    'mipscqm': 'registry',
    'qcdr': 'registry',
};

export const MEASURE_TYPES = {
    'process': 'process',
    'outcome': 'outcome',
    'patientengagement/experience': 'patientEngagementExperience',
    'efficiency': 'efficiency',
    'intermediateoutcome': 'intermediateOutcome',
    'structure': 'structure',
    'patientreportedoutcome': 'patientReportedOutcome',
    'patient-reportedoutcome-basedperformancemeasure': 'patientReportedOutcome'
};

export const OBJECTIVES = {
    'protectpatienthealthinformation': 'protectPatientHealthInformation',
    'publichealthandclinicaldataexchange': 'publicHealthAndClinicalDataExchange',
    'providertopatientexchange': 'providerToPatientExchange',
    'e-prescribing': 'electronicPrescribing',
    'healthinformationexchange': 'healthInformationExchange',
    'attestation': 'attestation',
    'null': null,
};

export const REPORTING_CATEGORY = {
    'required': 'required',
    'bonus': 'bonus',
    'exclusion': 'exclusion',
    'null': null,

};

export const WEIGHT = {
    'high': 'high',
    'medium': 'medium',
    'null': null,
};

export const SUBCATEGORY_NAME = {
    'achievinghealthequity': 'achievingHealthEquity',
    'behavioralandmentalhealth': 'behavioralAndMentalHealth',
    'beneficiaryengagement': 'beneficiaryEngagement',
    'carecoordination': 'careCoordination',
    'emergencyresponseandpreparedness': 'emergencyResponseAndPreparedness',
    'expandedpracticeaccess': 'expandedPracticeAccess',
    'patientsafetyandpracticeassessment': 'patientSafetyAndPracticeAssessment',
    'populationmanagement': 'populationManagement',
    'null': null,
};

export const MEASURE_SETS = {
    'allergy/immunology': 'allergyImmunology',
    'anesthesiology': 'anesthesiology',
    'cardiology': 'cardiology',
    'electro-physiologycardiacspecialist': 'electrophysiologyCardiacSpecialist',
    'gastro-enterology': 'gastroenterology',
    'dermatology': 'dermatology',
    'emergencymedicine': 'emergencyMedicine',
    'familymedicine': 'familyMedicine',
    'internalmedicine': 'internalMedicine',
    'obstetrics/gynecology': 'obstetricsGynecology',
    'ophthalmology': 'ophthalmology',
    'optometry': 'optometry',
    'orthopedicsurgery': 'orthopedicSurgery',
    'otolaryngology': 'otolaryngology',
    'pathology': 'pathology',
    'pediatrics': 'pediatrics',
    'physicalmedicine': 'physicalMedicine',
    'plasticsurgery': 'plasticSurgery',
    'preventivemedicine': 'preventiveMedicine',
    'neurology': 'neurology',
    'mental/behavioralhealthandpsychiatry': 'mentalBehavioralHealth',
    'diagnosticradiology': 'diagnosticRadiology',
    'interventionalradiology': 'interventionalRadiology',
    'vascularsurgery': 'vascularSurgery',
    'generalsurgery': 'generalSurgery',
    'thoracicsurgery': 'thoracicSurgery',
    'urology': 'urology',
    'oncology/hematology': 'oncology',
    'radiationoncology': 'radiationOncology',
    'hospitalists': 'hospitalists',
    'rheumatology': 'rheumatology',
    'nephrology': 'nephrology',
    'infectiousdisease': 'infectiousDisease',
    'neurosurgical': 'neurosurgical',
    'podiatry': 'podiatry',
    'physicaltherapy/occupationaltherapy': 'physicalTherapyOccupationalTherapy',
    'geriatrics': 'geriatrics',
    'urgentcare': 'urgentCare',
    'skillednursingfacility': 'skilledNursingFacility',
    'dentistry': 'dentistry',
    'clinicalsocialwork': 'clinicalSocialWork',
    'audiology': 'audiology',
    'certifiednursemidwife': 'certifiedNurseMidwife',
    'chiropracticmedicine': 'chiropracticMedicine',
    'endocrinology': 'endocrinology',
    'nutrition/dietician': 'nutritionDietician',
    'pulmonology': 'pulmonology',
    'speechlanguagepathology': 'speechLanguagePathology',
};

export const QUALITY_MEASURES_ORDER = {
    'category': undefined,
    'measureId': undefined,
    'title': undefined,
    'description': undefined,
    'metricType': undefined,
    'overallAlgorithm': undefined,
    'isRegistryMeasure': undefined,
    'firstPerformanceYear': undefined,
    'lastPerformanceYear': undefined,
    'eMeasureId': undefined,
    'eMeasureUuid': undefined,
    'nqfEMeasureId': undefined,
    'nqfId': undefined,
    'measureType': undefined,
    'isHighPriority': undefined,
    'primarySteward': undefined,
    'primarySteward1': undefined,
    'isInverse': undefined,
    'isRiskAdjusted': undefined,
    'isIcdImpacted': undefined,
    'icdImpacted': undefined,
    'isClinicalGuidelineChanged': undefined,
    'clinicalGuidelineChanged': undefined,
    'companionMeasureId': undefined,
    'allowedPrograms': undefined,
    'submissionMethods': undefined,
    'measureSets': undefined,
    'measureSpecification': undefined,
    'isSevenPointCapRemoved': undefined,
    'sevenPointCapRemoved': undefined,
    'allowedRegistrationTypes': undefined,
    'historic_benchmarks': undefined,
    'strata': undefined,
    'eligilibityOptions': undefined
};

export const QCDR_MEASURES_ORDER = {
    'category': undefined,
    'measureId': undefined,
    'title': undefined,
    'description': undefined,
    'metricType': undefined,
    'overallAlgorithm': undefined,
    'isRegistryMeasure': undefined,
    'firstPerformanceYear': undefined,
    'lastPerformanceYear': undefined,
    'eMeasureId': undefined,
    'nqfEMeasureId': undefined,
    'nqfId': undefined,
    'measureType': undefined,
    'isHighPriority': undefined,
    'primarySteward': undefined,
    'isInverse': undefined,
    'isRiskAdjusted': undefined,
    'isIcdImpacted': undefined,
    'icdImpacted': undefined,
    'isClinicalGuidelineChanged': undefined,
    'clinicalGuidelineChanged': undefined,
    'allowedPrograms': undefined,
    'submissionMethods': undefined,
    'measureSets': undefined,
    'isSevenPointCapRemoved': undefined,
    'sevenPointCapRemoved': undefined,
    'allowedRegistrationTypes': undefined,
    'allowedVendors': undefined,
    'strata': undefined
};

export const PI_MEASURES_ORDER = {
    'category': undefined,
    'measureId': undefined,
    'title': undefined,
    'description': undefined,
    'metricType': undefined,
    'firstPerformanceYear': undefined,
    'lastPerformanceYear': undefined,
    'isRequired': undefined,
    'objective': undefined,
    'isBonus': undefined,
    'reportingCategory': undefined,
    'measureSpecification': undefined,
    'measureSets': undefined,
    'exclusion': undefined,
    'substitutes': undefined,
    'allowedPrograms': undefined,
    'preprod': undefined,
    'allowedRegistrationTypes': undefined
};

export const IA_MEASURES_ORDER = {
    'category': undefined,
    'measureId': undefined,
    'title': undefined,
    'description': undefined,
    'metricType': undefined,
    'firstPerformanceYear': undefined,
    'lastPerformanceYear': undefined,
    'subcategoryId': undefined,
    'allowedPrograms': undefined,
    'allowedRegistrationTypes': undefined
};

export const COST_MEASURES_ORDER = {
    'category': undefined,
    'measureId': undefined,
    'title': undefined,
    'description': undefined,
    'metricType': undefined,
    'firstPerformanceYear': undefined,
    'lastPerformanceYear': undefined,
    'isInverse': undefined,
    'submissionMethods': undefined,
    'measureSpecification': undefined,
    'allowedPrograms': undefined,
    'allowedRegistrationTypes': undefined
};

export const BENCHMARKS_ORDER = {
    'measureId': undefined,
    'benchmarkYear': undefined,
    'performanceYear': undefined,
    'submissionMethod': undefined,
    'isToppedOut': undefined,
    'isHighPriority': undefined,
    'isInverse': undefined,
    'metricType': undefined,
    'isToppedOutByProgram': undefined,
    'deciles': undefined,
};

export const COST_DEFAULT_VALUES = {
    metricType: 'costScore',
    lastPerformanceYear: null,
    allowedRegistrationTypes: [
        'apm',
        'group',
        'subgroup',
        'individual'
    ]
};

export const IA_DEFAULT_VALUES = {
    metricType: 'boolean',
    lastPerformanceYear: null,
    allowedRegistrationTypes: [
        'apm',
        'group',
        'subgroup',
        'individual'
    ]
};

export const PI_DEFAULT_VALUES = {
    lastPerformanceYear: null,
    measureSets: [],
    allowedRegistrationTypes: [
        'apm',
        'group',
        'subgroup',
        'individual'
    ]
};

export const QUALITY_DEFAULT_VALUES = {
    eMeasureId: null,
    nqfEMeasureId: null,
    nqfId: null,
    lastPerformanceYear: null,
    isRiskAdjusted: false,
    icdImpacted: [],
    isClinicalGuidelineChanged: false,
    isIcdImpacted: false,
    clinicalGuidelineChanged: [],
    measureSets: [],
    isSevenPointCapRemoved: false,
    sevenPointCapRemoved: [],
    allowedRegistrationTypes: [
        'apm',
        'group',
        'subgroup',
        'individual'
    ]
};

export const QUALITY_DEFAULT_PROGRAMS = [
    'mips',
    'pcf',
];

export const COST_DEFAULT_PROGRAMS = [
    'mips',
    'app1',
];

export const IA_DEFAULT_PROGRAMS = [
    'mips',
    'app1',
    'appPlus',
    'pcf',
];

export const PI_DEFAULT_PROGRAMS = [
    'mips',
    'app1',
    'appPlus',
    'pcf',
];
