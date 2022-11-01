//These are only needed if the csv column names do not match the measures-data field names.
export const BASE_CSV_COLUMN_NAMES = {
    'title': 'Measure Title',
    'description': 'Measure Description',
    'measureId': 'Measure ID',
    'yearRemoved': 'Year Removed',
    'firstPerformanceYear': 'First Performance Year',
    'category': 'Category',
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
    'measureType': '*** Measure Type  ',
    'isHighPriority': 'High Priority',
    'submissionMethods': '*** Collection Type(s) for Submission',
    'measureSets': 'Specialty Measure Sets',
    'isInverse': '*** Inverse',
    'metricType': '*** Metric Type',
    'overallAlgorithm': '*** Calculation Type',
    'clinicalGuidelineChanged': 'Collection Type(s) where Suppressed',
    'historic_benchmarks': 'Collection Type(s) where Historic Benchmark Removed',
    'icdImpacted': 'Collection Type(s) where Truncated',
    'isRiskAdjusted': 'Is Risk Adjusted ',
    'yearRemoved': 'Year Removed',
    'firstPerformanceYear': 'First Performance Year',
};

export const ARRAY_CSV_FIELDS = [
    'Substitutes',
    'Exclusions',
    '*** Collection Type(s) for Submission',
    'Allowed QCDR Vendor ID',
    'Specialty Measure Sets',
    'Collection Type(s) where Suppressed',
    'Collection Type(s) where Historic Benchmark Removed',
    'Collection Type(s) where Truncated',
];

export const BOOLEAN_CSV_FIELDS = [
    '*** Inverse',
    'Is Risk Adjusted ',
    'High Priority',
    'Bonus',
    'Required',
];

export const METRIC_TYPES = [
    'registrySinglePerformanceRate',
    'singlePerformanceRate',
    'multiPerformanceRate',
    'nonProportion',
    'costScore',
];

export const OVERALL_ALGORITHM = [
    'weightedAverage',
    'simpleAverage',
    'overallStratumOnly',
];

export const COLLECTION_TYPES_FIELDS = [
    'Collection Type(s) where Suppressed',
    'Collection Type(s) where Historic Benchmark Removed',
    'Collection Type(s) where Truncated',
    '*** Collection Type(s) for Submission',
];

export const COLLECTION_TYPES = {
    'PartBClaims': 'claims',
    'CSV': 'certifiedSurveyVendor',
    'eCQM': 'electronicHealthRecord',
    'CMSWI': 'cmsWebInterface',
    'AdminClaims': 'administrativeClaims',
    'MIPSCQM': 'registry',
    'QCDR': 'registry',
};

export const MEASURE_TYPES = {
    'Process': 'process',
    'Outcome': 'outcome',
    'PatientEngagement/Experience': 'patientEngagementExperience',
    'Efficiency': 'efficiency',
    'IntermediateOutcome': 'intermediateOutcome',
    'Structure': 'structure',
    'PatientReportedOutcome': 'patientReportedOutcome'
};

export const OBJECTIVES = {
    'ProtectPatientHealthInformation': 'protectPatientHealthInformation',
    'PublicHealthAndClinicalDataExchange': 'publicHealthAndClinicalDataExchange',
    'ProvidertoPatientExchange': 'providerToPatientExchange',
    'e-Prescribing': 'electronicPrescribing',
    'HealthInformationExchange': 'healthInformationExchange',
    'NULL': null,
};

export const REPORTING_CATEGORY = {
    'required': 'required',
    'bonus': 'bonus',
    'exclusion': 'exclusion',
    'NULL': null,

};

export const WEIGHT = {
    'high': 'high',
    'medium': 'medium',
    'NULL': null,
};

export const SUBCATEGORY_NAME = {
    'AchievingHealthEquity': 'achievingHealthEquity',
    'BehavioralAndMentalHealth': 'behavioralAndMentalHealth',
    'BeneficiaryEngagement': 'beneficiaryEngagement',
    'CareCoordination': 'careCoordination',
    'EmergencyResponseAndPreparedness': 'emergencyResponseAndPreparedness',
    'ExpandedPracticeAccess': 'expandedPracticeAccess',
    'PatientSafetyAndPracticeAssessment': 'patientSafetyAndPracticeAssessment',
    'PopulationManagement': 'populationManagement',
    'NULL': null,
};

export const MEASURE_SETS = {
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

export const IA_DEFAULT_VALUES = {
    metricType: 'boolean',
    lastPerformanceYear: null,
};

export const PI_DEFAULT_VALUES = {
    lastPerformanceYear: null,
    measureSets: [],
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
    nationalQualityStrategyDomain: null,
};
