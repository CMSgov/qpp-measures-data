export enum Category {
    IA = 'ia',
    QUALITY = 'quality',
    PI = 'pi',
    COST = 'cost'
}

export enum MetricType {
    BOOLEAN = 'boolean',
    PROPORTION = 'proportion',
    SINGLE_PERFORMANCE_RATE = 'singlePerformanceRate',
    MULTI_PERFORMANCE_RATE = 'multiPerformanceRate',
    REGISTRY_SINGLE_PERFORMANCE_RATE = 'registrySinglePerformanceRate',
    REGISTRY_MULTI_PERFORMANCE_RATE = 'registryMultiPerformanceRate',
    NON_PROPORTION = 'nonProportion',
    CAHPS = 'cahps',
    COST_SCORE = 'costScore'
}

export enum Weight {
    MEDIUM = 'medium',
    HIGH = 'high'
}

export enum ReportingCategory {
    REQUIRED = 'required',
    BONUS = 'bonus',
    EXCLUSION = 'exclusion'
}

export enum Objective {
    ATTESTATION = 'attestation',
    PUBLIC_HEALTH_AND_CLINICAL_DATA_REGISTRY_REPORTING = 'publicHealthAndClinicalDataRegistryReporting',
    HEALTH_INFORMATION_EXCHANGE = 'healthInformationExchange',
    ELECTRONIC_PRESCRIBING = 'electronicPrescribing',
    COORDINATION_OF_CARE_THROUGH_PATIENT_ENGAGEMENT = 'coordinationOfCareThroughPatientEngagement',
    PATIENT_ELECTRONIC_ACCESS = 'patientElectronicAccess',
    PROTECT_PATIENT_HEALTH_INFORMATION = 'protectPatientHealthInformation',
    PUBLIC_HEALTH_REPORTING = 'publicHealthReporting',
    MEDICATION_RECONCILIATION = 'medicationReconciliation',
    PATIENT_SPECIFIC_EDUCATION = 'patientSpecificEducation',
    SECURE_MESSAGING = 'secureMessaging',
    PUBLIC_HEALTH_AND_CLINICAL_DATA_EXCHANGE = 'publicHealthAndClinicalDataExchange',
    PROVIDER_TO_PATIENT_EXCHANGE = 'providerToPatientExchange'
}

export enum MeasureType {
    EFFICIENCY = 'efficiency',
    INTERMEDIATE_OUTCOME = 'intermediateOutcome',
    OUTCOME = 'outcome',
    PATIENT_ENGAGEMENT_EXPERIENCE = 'patientEngagementExperience',
    PROCESS = 'process',
    STRUCTURE = 'structure',
    PATIENT_REPORTED_OUTCOME = 'patientReportedOutcome'
}

export enum SubmissionMethod {
    ADMINISTRATIVE_CLAIMS = 'administrativeClaims',
    CLAIMS = 'claims',
    CERTIFIED_SURVEY_VENDOR = 'certifiedSurveyVendor',
    CMS_WEB_INTERFACE = 'cmsWebInterface',
    ELECTRONIC_HEALTH_RECORD = 'electronicHealthRecord',
    REGISTRY = 'registry'
}

export enum SubcategoryId {
    ACHIEVING_HEALTH_EQUITY = 'achievingHealthEquity',
    BEHAVIORAL_AND_MENTAL_HEALTH = 'behavioralAndMentalHealth',
    BENEFICIARY_ENGAGEMENT = 'beneficiaryEngagement',
    CARE_COORDINATION = 'careCoordination',
    EMERGENCY_RESPONSE_AND_PREPAREDNESS = 'emergencyResponseAndPreparedness',
    EXPANDED_PRACTICE_ACCESS = 'expandedPracticeAccess',
    PATIENT_SAFETY_AND_PRACTICE_ASSESSMENT = 'patientSafetyAndPracticeAssessment',
    POPULATION_MANAGEMENT = 'populationManagement'
}

export enum OptionType {
    PERFORMANCE_MET = 'performanceMet',
    PERFORMANCE_NOT_MET = 'performanceNotMet',
    ELIGIBLE_POPULATION_EXCLUSION = 'eligiblePopulationExclusion',
    ELIGIBLE_POPULATION_EXCEPTION = 'eligiblePopulationException'
}

export enum OverallAlgorithm {
    SIMPLE_AVERAGE = 'simpleAverage',
    WEIGHTED_AVERAGE = 'weightedAverage',
    SUM_NUMERATORS = 'sumNumerators',
    OVERALL_STRATUM_ONLY = 'overallStratumOnly',
    SPLIT = 'split'
}

export interface BaseMeasure {
    measureId: string;
    title: string;
    description: string;
    category: Category;
    metricType: MetricType;
    firstPerformanceYear: number;
    lastPerformanceYear: number | null;
    allowedPrograms: string[];
    measureSpecification?: MeasureSpecification | null;
    measureSets?: string[];
}

export interface CostMeasure extends BaseMeasure {
    category: Category.COST;
    clinicalRecommendation?: string;
    clinicalCategory?: string;
    condition?: string;
    priority?: string;
}

export interface QualityMeasure extends BaseMeasure {
    category: Category.QUALITY;
    benchmark?: string;
    riskAdjustment?: string;
    isHighPriority: boolean;
    measureType: MeasureType;
    eMeasureId?: string | null;
    eMeasureUuid?: string;
    nqfEMeasureId?: string | null;
    nqfId?: string | null;
    isClinicalGuidelineChanged?: boolean;
    clinicalGuidelineChanged?: SubmissionMethod[];
    isInverse: boolean;
    overallAlgorithm?: OverallAlgorithm;
    strata?: PerformanceStratum[];
    primarySteward?: string;
    submissionMethods?: SubmissionMethod[];
    eligibilityOptions?: EligibilityOption[];
    performanceOptions?: PerformanceOption[];
    requiredForPrograms?: string[];
    allowedVendors?: string[];
    isRegistryMeasure?: boolean;
    isRiskAdjusted?: boolean;
    isIcdImpacted?: boolean;
    icdImpacted?: SubmissionMethod[];
    historic_benchmarks?: Record<string, 'removed' | 'flat'>;
    companionMeasureId?: string[];
}

export interface ImprovementActivityMeasure extends BaseMeasure {
    category: Category.IA;
    weight: Weight;
    subcategoryId: SubcategoryId;
}

export interface PromotingInteroperabilityMeasure extends BaseMeasure {
    category: Category.PI;
    objective: Objective;
    isRequired: boolean;
    isBonus: boolean;
    reportingCategory: ReportingCategory;
    substitutes: string[];
    exclusion: string | null;
    preprod: string[];
}

export type Measure = CostMeasure | QualityMeasure | ImprovementActivityMeasure | PromotingInteroperabilityMeasure;

export interface MeasureSpecification {
    default?: string;
    registry?: string;
    claims?: string;
    cmsWebInterface?: string;
    measureInformation?: string;
    electronicHealthRecord?: string;
}

export interface PerformanceStratum {
    description: string;
    name: string;
    eMeasureUuids: {
        initialPopulationUuid: string;
        denominatorUuid: string;
        numeratorUuid: string;
        denominatorExclusionUuid: string;
        denominatorExceptionUuid: string;
        strata: string[];
    };
}

export interface EligibilityOption {
    sexCode?: 'M' | 'F';
    minAge?: number;
    maxAge?: number;
    diagnosisCodes?: string[];
    additionalDiagnosisCodes?: string[];
    procedureCodes?: CodeObject[];
    additionalProcedureCodes?: CodeObject[];
    optionGroup?: string;
}

export interface PerformanceOption {
    optionType: OptionType;
    qualityCodes: CodeObject[];
    optionGroup?: string;
}

export interface CodeObject {
    code: string;
    modifiers?: string[];
    modifierExclusions?: string[];
    placesOfService?: string[];
    placesOfServiceExclusions?: string[];
}
