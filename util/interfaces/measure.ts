export enum Category {
    IA = 'ia',
    QUALITY = 'quality',
    QCDR = 'qcdr',
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

export enum Programs {
    MIPS = 'mips',
    PCF = 'pcf',
    APP1 = 'app1',
    APP_PLUS = 'appPlus',
    SSP = 'ssp',
    G0053 = 'G0053',
    G0054 = 'G0054',
    G0055 = 'G0055',
    G0056 = 'G0056',
    G0057 = 'G0057',
    G0058 = 'G0058',
    G0059 = 'G0059',
    M0001 = 'M0001',
    M0002 = 'M0002',
    M0004 = 'M0004',
    M0005 = 'M0005',
    M1366 = 'M1366',
    M1367 = 'M1367',
    M1368 = 'M1368',
    M1369 = 'M1369',
    M1370 = 'M1370',
    M1420 = "M1420",
    M1421 = "M1421",
    M1422 = "M1422",
    M1423 = "M1423",
    M1424 = "M1424",
    M1425 = "M1425"
}

export interface Stratum {
    description: string;
    name?: string;
    eMeasureUuids: {
        initialPopulationUuid: string;
        denominatorUuid: string;
        numeratorUuid: string;
        denominatorExclusionUuid?: string;
        denominatorExceptionUuid?: string;
        strata?: string[];
    };
}

export interface MeasureSpecification {
    default?: string
    registry?: string
    claims?: string
    cmsWebInterface?: string
    measureInformation?: string
    electronicHealthRecord?: string
}

export interface BaseMeasure {
    measureId: string;
    title: string;
    description: string;
    category: Category;
    metricType: MetricType;
    firstPerformanceYear: number;
    lastPerformanceYear: number | null;
    measureSpecification?: MeasureSpecification;
    measureSets?: string[];
    allowedPrograms: Programs[];
}

export interface IAMeasure extends BaseMeasure {
    category: Category.IA;
    weight?: Weight;
    subcategoryId: SubcategoryId;
}

export interface PIMeasure extends BaseMeasure {
    category: Category.PI;
    reportingCategory: 'required' | 'bonus' | 'exclusion' | null;
    objective: string;
    isRequired: boolean;
    isBonus: boolean;
    substitutes?: string[];
    exclusion?: string[];
    preprod?: string;
}

export interface QualityMeasure extends BaseMeasure {
    category: Category.QUALITY;
    measureType: string;
    eMeasureId: string | null;
    eMeasureUuid?: string;
    nqfEMeasureId: string | null;
    nqfId: string | null;
    isClinicalGuidelineChanged: boolean;
    clinicalGuidelineChanged: string[];
    isHighPriority: boolean;
    isInverse: boolean;
    overallAlgorithm?: string | null;
    strata?: Stratum[];
    primarySteward: string;
    submissionMethods: string[];
    eligibilityOptions?: {
        sexCode?: 'M' | 'F';
        minAge?: number;
        maxAge?: number;
        diagnosisCodes?: string[];
        additionalDiagnosisCodes?: string[];
        procedureCodes?: {
            code: string;
            modifiers?: string[];
            modifierExclusions?: string[];
            placesOfService?: string[];
            placesOfServiceExclusions?: string[];
        }[];
        additionalProcedureCodes?: {
            code: string;
            modifiers?: string[];
            modifierExclusions?: string[];
            placesOfService?: string[];
            placesOfServiceExclusions?: string[];
        }[];
        optionGroup?: string;
    }[];
    performanceOptions?: {
        optionType: 'performanceMet' | 'performanceNotMet' | 'eligiblePopulationExclusion' | 'eligiblePopulationException';
        qualityCodes: {
            code: string;
            modifiers?: string[];
            modifierExclusions?: string[];
            placesOfService?: string[];
            placesOfServiceExclusions?: string[];
        }[];
        optionGroup?: string;
    }[];
    requiredForPrograms?: Programs[];
    allowedVendors?: string[];
    isRegistryMeasure: boolean;
    isRiskAdjusted: boolean;
    isIcdImpacted: boolean;
    icdImpacted?: string[];
    historic_benchmarks?: {
        [key: string]: 'removed' | 'flat';
    };
    companionMeasureId?: string[];
}

export interface AggregateCostMeasure extends BaseMeasure {
    category: Category.COST;
    isInverse: boolean;
    submissionMethods: string[];
}

export type Measure = IAMeasure | PIMeasure | QualityMeasure | AggregateCostMeasure;
