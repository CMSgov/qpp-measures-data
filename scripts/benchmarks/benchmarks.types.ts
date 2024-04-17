//  npx yaml-to-json-schema measures-schema.yaml | npx quicktype --src-lang schema --lang ts --just-types --acronym-style original -t MeasuresSample

export enum Category {
  ia = 'ia',
  quality = 'quality',
  pi = 'pi',
  cost = 'cost'
}

export enum Subcategory {
  null,
  achievingHealthEquity = 'achievingHealthEquity',
  behavioralAndMentalHealth = 'behavioralAndMentalHealth',
  beneficiaryEngagement = 'beneficiaryEngagement',
  careCoordination = 'careCoordination',
  emergencyResponseAndPreparedness = 'emergencyResponseAndPreparedness',
  expandedPracticeAccess = 'expandedPracticeAccess',
  patientSafetyAndPracticeAssessment = 'patientSafetyAndPracticeAssessment',
  populationManagement = 'populationManagement'
}

export type MeasureSpecification = {
  default: string
  registry: string
  claims: string
  cmsWebInterface: string
  measureInformation: string
  electronicHealthRecord: string
}

export enum MeasureSet {
  transition= "transition",
  allergyImmunology= "allergyImmunology",
  anesthesiology= "anesthesiology",
  cardiology= "cardiology",
  dentistry= "dentistry",
  dermatology= "dermatology",
  diagnosticRadiology= "diagnosticRadiology",
  electrophysiologyCardiacSpecialist= "electrophysiologyCardiacSpecialist",
  emergencyMedicine= "emergencyMedicine",
  gastroenterology= "gastroenterology",
  generalSurgery= "generalSurgery",
  hospitalists= "hospitalists",
  infectiousDisease= "infectiousDisease",
  internalMedicine= "internalMedicine",
  interventionalRadiology= "interventionalRadiology",
  mentalBehavioralHealth= "mentalBehavioralHealth",
  nephrology= "nephrology",
  neurology= "neurology",
  neurosurgical= "neurosurgical",
  obstetricsGynecology= "obstetricsGynecology",
  ophthalmology= "ophthalmology",
  orthopedicSurgery= "orthopedicSurgery",
  otolaryngology= "otolaryngology",
  pathology= "pathology",
  pediatrics= "pediatrics",
  physicalMedicine= "physicalMedicine",
  plasticSurgery= "plasticSurgery",
  podiatry= "podiatry",
  preventiveMedicine= "preventiveMedicine",
  radiationOncology= "radiationOncology",
  rheumatology= "rheumatology",
  thoracicSurgery= "thoracicSurgery",
  urology= "urology",
  vascularSurgery= "vascularSurgery",
  familyMedicine= "familyMedicine",
  oncology= "oncology",
  physicalTherapyOccupationalTherapy= "physicalTherapyOccupationalTherapy",
  geriatrics= "geriatrics",
  urgentCare= "urgentCare",
  skilledNursingFacility= "skilledNursingFacility",
  generalPracticeFamilyMedicine= "generalPracticeFamilyMedicine",
  endocrinology= "endocrinology",
  nutritionDietician= "nutritionDietician",
  pulmonology= "pulmonology",
  chiropracticMedicine= "chiropracticMedicine",
  clinicalSocialWork= "clinicalSocialWork",
  audiology= "audiology",
  speechLanguagePathology= "speechLanguagePathology",
  certifiedNurseMidwife= "certifiedNurseMidwife",
}

export enum Program {
  mips = "mips",
  pcf = "pcf",
  app1 = "app1",
  G0053 = "G0053",
  G0054 = "G0054",
  G0055 = "G0055",
  G0056 = "G0056",
  G0057 = "G0057",
  G0058 = "G0058",
  G0059 = "G0059",
  M0001 = "M0001",
  M0002 = "M0002",
  M0003 = "M0003",
  M0004 = "M0004",
  M0005 = "M0005",
}

export enum Objective {
  null,
  attestation = "attestation",
  publicHealthAndClinicalDataRegistryReporting = "publicHealthAndClinicalDataRegistryReporting",
  healthInformationExchange = "healthInformationExchange",
  electronicPrescribing = "electronicPrescribing",
  coordinationOfCareThroughPatientEngagement = "coordinationOfCareThroughPatientEngagement",
  patientElectronicAccess = "patientElectronicAccess",
  protectPatientHealthInformation = "protectPatientHealthInformation",
  publicHealthReporting = "publicHealthReporting",
  medicationReconciliation = "medicationReconciliation",
  patientSpecificEducation = "patientSpecificEducation",
  secureMessaging = "secureMessaging",
  publicHealthAndClinicalDataExchange = "publicHealthAndClinicalDataExchange",
  providerToPatientExchange = "providerToPatientExchange",
}

export enum SubmissionMethod {
  cmsWebInterface = 'cmsWebInterface',
  electronicHealthRecord = 'electronicHealthRecord',
  claims = 'claims',
  registry = 'registry',
  certifiedSurveyVendor = 'certifiedSurveyVendor',
  administrativeClaims = 'administrativeClaims',
  webAttestation = 'webAttestation',
}

export enum PerformanceAlgorithm {
  null,
  Overall = 'overallAlgorithm',
  WeightedAverage = 'weightedAverage',
  SimpleAverage = 'simpleAverage',
  Sum = 'sumNumerators',
  OverallStratum = 'overallStratumOnly',
  Split = 'split',
}

export enum MeasureType {
  efficiency = "efficiency",
  intermediateOutcome = "intermediateOutcome",
  outcome = "outcome",
  patientEngagementExperience = "patientEngagementExperience",
  process = "process",
  structure = "structure",
  patientReportedOutcome = "patientReportedOutcome",
}

export enum Method {
  administrativeClaims = "administrativeClaims",
  claims = "claims",
  certifiedSurveyVendor = "certifiedSurveyVendor",
  cmsWebInterface = "cmsWebInterface",
  electronicHealthRecord = "electronicHealthRecord",
  registry = "registry",
}

export type Benchmark = {
  measureId: string,
  benchmarkYear: number,
  performanceYear: number,
  submissionMethod: string,
  isToppedOut?: boolean,
  isHighPriority?: boolean,
  isInverse?: boolean,
  metricType?: string,
  isToppedOutByProgram?: boolean,
  percentiles?: object,
  averagePerformanceRate?: number | null
}

export type BenchmarkList =  {
  [key: string]: Benchmark
}

export type BaseMeasure = {
  measureId: string;
  title: string;
  description: string;
  category: string;
  metricType: string;
  firstPerformanceYear: number;
  lastPerformanceYear?: number;
  measureSpecification?: MeasureSpecification;
  measureSets?: MeasureSet[];
  allowedPrograms?: Program[];
}

export type MeasureList = {
  [key: string]: BaseMeasure
}

export type IAMeasure = BaseMeasure & {
  category: Category.ia;
  weight: 'medium' | 'high' | null;
  subcategoryId: Subcategory;
}

export type PIMeasure = BaseMeasure & {
  category: Category.pi;
  reportingCategory: 'required' | 'bonus' | 'exclusion' | null;
  objective: Objective;
  isRequired: boolean;
  isBonus: boolean;
  substitutes?: string[];
  exclusion?: string[];
}

export type CostMeasure = BaseMeasure & {
  category: Category.cost;
  isInverse?: boolean;
  overallAlgorithm: PerformanceAlgorithm;
  submissionMethods: SubmissionMethod;
}

//required: [measureType, eMeasureId, nqfEMeasureId, nqfId, isHighPriority, isInverse, primarySteward, submissionMethods, isRegistryMeasure, isIcdImpacted]
export type QualityMeasure = BaseMeasure & {
  category: Category.quality;
  measureType: MeasureType;
  eMeasureId?: string | null;
  eMeasureUuid?: string;
  nqfEMeasureId?: string | null;
  nqfId?: string | null;
  isClinicalGuidelineChanged?: boolean;
  clinicalGuidelineChanged?: Method;
  isHighPriority: boolean;
  isInverse: boolean;
  overallAlgorithm?: PerformanceAlgorithm;
  strata?: PerformanceStrata;
  primarySteward?: string;
  submissionMethods: Method;
  eligibilityOptions?: any[];
  performanceOptions?: any[];
  requiredForPrograms?: Program;
  isRegistryMeasure: boolean;
  isRiskAdjusted?: boolean;
  isIcdImpacted: boolean;
  icdImpacted?: Method;
  historic_benchmarks?: Object;
}

export type PerformanceStrata = {
  description: string;
  name: string;
}

export type CostNationalAverage = {
  measureId: string;
  benchmarkYear: number;
  performanceYear: number;
  groupNationalAverage: null | number;
  individualNationalAverage: null | number;
}
