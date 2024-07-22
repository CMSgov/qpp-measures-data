enum MeasureType {
    Process = 'process',
    Outcome = 'outcome',
    IntermediateOutcome = 'intermediateOutcome',
    PatientEngagementExperience = 'patientEngagementExperience',
    PatientReportedOutcome = 'patientReportedOutcome',
    Structure = 'structure',
    Efficiency = 'efficiency'
}

enum SubmissionMethods {
    Claims = 'claims',
    ElectronicHealthRecord = 'electronicHealthRecord',
    CMSWebInterface = 'cmsWebInterface',
    Registry = 'registry'
}

enum Category {
    Quality = 'quality',
    Cost = 'cost',
    PI = 'pi',
    IA = 'ia'
}

enum MetricType {
    SinglePerformanceRate = 'singlePerformanceRate',
    MultiPerformanceRate = 'multiPerformanceRate'
}

interface MVPEnrichedData {
    mvpId: string;
    clinicalTopic: string;
    title: string;
    description: string;
    specialtiesMostApplicableTo: string[];
    clinicalTopics: string;
    hasCahps: boolean;
    hasOutcomeAdminClaims: boolean;
    qualityMeasures: {
        title: string;
        eMeasureId: string;
        nqfEMeasureId: string | null;
        nqfId: string | null;
        measureId: string;
        description: string;
        measureType: MeasureType;
        isHighPriority: boolean;
        primarySteward: string;
        firstPerformanceYear: number;
        lastPerformanceYear: number | null;
        isInverse: boolean;
        category: Category;
        isRegistryMeasure: boolean;
        isRiskAdjusted: boolean;
        icdImpacted: any[];
        isClinicalGuidelineChanged: boolean;
        clinicalGuidelineChanged: any[];
        metricType: MetricType;
        companionMeasureId: string[];
        allowedPrograms: string[];
        submissionMethods: SubmissionMethods[];
        measureSets: string[];
        measureSpecification: {
            [key: string]: string;
        };
        eMeasureUuid: string;
        strata: {
            description: string;
            eMeasureUuids: {
                initialPopulationUuid: string;
                denominatorUuid: string;
                numeratorUuid: string;
                denominatorExceptionUuid: string;
                denominatorExclusionUuid?: string;
            };
        }[];
    }[];
}
