export interface MeasureSchema {
    $id: string;
    $schema: string;
    type: string;
    items: {
        $ref: string;
    };
    uniqueItemProperties: string[];
    definitions: {
        measure: {
            title: string;
            type: string;
            anyOf: Array<{ $ref: string }>;
        };
        baseMeasure: {
            title: string;
            type: string;
            additionalProperties: boolean;
            properties: {
                measureId: {
                    type: string;
                    description: string;
                };
                title: {
                    type: string;
                    description: string;
                };
                description: {
                    type: string;
                    description: string;
                };
                category: {
                    description: string;
                    enum: string[];
                };
                metricType: {
                    description: string;
                    enum: string[];
                };
                firstPerformanceYear: {
                    description: string;
                    type: string;
                    default: number;
                };
                lastPerformanceYear: {
                    description: string;
                    type: [string, string];
                    default: string;
                };
                measureSpecification: {
                    description: string;
                    anyOf: Array<{ $ref: string } | { type: string }>;
                };
                measureSets: {
                    description: string;
                    type: string;
                    items: {
                        $ref: string;
                    };
                };
                allowedPrograms: {
                    description: string;
                    type: string;
                    items: {
                        $ref: string;
                    };
                };
            };
            required: string[];
        };
        iaMeasure: {
            $merge: {
                source: { $ref: string };
                with: {
                    title: string;
                    type: string;
                    additionalProperties: boolean;
                    properties: {
                        category: {
                            enum: string[];
                        };
                        weight: {
                            description: string;
                            enum: string[];
                            default: string;
                        };
                        subcategoryId: {
                            description: string;
                            oneOf: Array<{ $ref: string }>;
                        };
                    };
                    required: string[];
                };
            };
        };
        piMeasure: {
            $merge: {
                source: { $ref: string };
                with: {
                    title: string;
                    type: string;
                    additionalProperties: boolean;
                    properties: {
                        category: {
                            enum: string[];
                        };
                        reportingCategory: {
                            description: string;
                            enum: string[];
                        };
                        objective: {
                            description: string;
                            oneOf: Array<{ $ref: string }>;
                        };
                        isRequired: {
                            description: string;
                            type: boolean;
                            default: boolean;
                        };
                        isBonus: {
                            description: string;
                            type: boolean;
                            default: boolean;
                        };
                        substitutes: {
                            description: string;
                            oneOf: Array<{ $ref: string }>;
                        };
                        exclusion: {
                            description: string;
                        };
                        preprod: {
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
        };
        aggregateCostMeasure: {
            $merge: {
                source: { $ref: string };
                with: {
                    title: string;
                    type: string;
                    additionalProperties: boolean;
                    properties: {
                        category: {
                            enum: string[];
                        };
                        isInverse: {
                            description: string;
                            type: boolean;
                            default: boolean;
                        };
                        overallAlgorithm: {
                            description: string;
                            type: [string, string];
                        };
                        submissionMethods: {
                            description: string;
                            type: string;
                        };
                    };
                };
            };
        };
        qualityMeasure: {
            $merge: {
                source: { $ref: string };
                with: {
                    title: string;
                    type: string;
                    additionalProperties: boolean;
                    properties: {
                        category: {
                            enum: string[];
                        };
                        measureType: {
                            description: string;
                            oneOf: Array<{ $ref: string }>;
                        };
                        eMeasureId: {
                            description: string;
                            type: [string, string];
                        };
                        eMeasureUuid: {
                            description: string;
                            type: string;
                        };
                        nqfEMeasureId: {
                            description: string;
                            type: [string, string];
                        };
                        nqfId: {
                            description: string;
                            type: [string, string];
                        };
                        isClinicalGuidelineChanged: {
                            description: string;
                            type: boolean;
                        };
                        clinicalGuidelineChanged: {
                            type: string;
                            description: string;
                            items: { $ref: string };
                        };
                        isHighPriority: {
                            description: string;
                            type: boolean;
                            default: boolean;
                        };
                        isInverse: {
                            description: string;
                            type: boolean;
                            default: boolean;
                        };
                        overallAlgorithm: {
                            description: string;
                            enum: string[];
                        };
                        strata: {
                            description: string;
                            type: string;
                            items: { $ref: string };
                        };
                        primarySteward: {
                            description: string;
                            type: string;
                        };
                        submissionMethods: {
                            description: string;
                            type: string;
                            items: { $ref: string };
                        };
                        eligibilityOptions: {
                            description: string;
                            type: string;
                            items: { $ref: string };
                        };
                        performanceOptions: {
                            description: string;
                            type: string;
                            items: { $ref: string };
                        };
                        requiredForPrograms: {
                            description: string;
                            type: string;
                            items: { $ref: string };
                        };
                        allowedVendors: {
                            description: string;
                            type: string;
                            items: { type: string, pattern: string };
                        };
                        isRegistryMeasure: {
                            description: string;
                            type: boolean;
                            default: boolean;
                        };
                        isRiskAdjusted: {
                            type: boolean;
                            description: string;
                            default: boolean;
                        };
                        isIcdImpacted: {
                            type: boolean;
                            description: string;
                            default: boolean;
                        };
                        icdImpacted: {
                            type: string;
                            description: string;
                            items: { $ref: string };
                        };
                        historic_benchmarks: {
                            type: object;
                            description: string;
                            propertyNames: { $ref: string };
                            patternProperties: {
                                "": { enum: string[] };
                            };
                        };
                        companionMeasureId: {
                            default: [];
                            description: string;
                            oneOf: Array<{ $ref: string }>;
                        };
                    };
                    oneOf: Array<{
                        properties: {
                            metricType: { enum: string[] };
                            strata: {
                                type: string;
                                minItems: number;
                                items: { $ref: string };
                            };
                        };
                        required: string[];
                    } | {
                        properties: {
                            metricType: { enum: string[] };
                        };
                    }>;
                    required: string[];
                };
            };
        };
        performanceStrata: {
            type: string;
            additionalProperties: boolean;
            properties: {
                description: {
                    type: string;
                    description: string;
                };
                name: {
                    type: string;
                    description: string;
                    maxLength: number;
                };
                eMeasureUuids: {
                    type: string;
                    properties: {
                        initialPopulationUuid: { type: string; maxLength: number };
                        denominatorUuid: { type: string; maxLength: number };
                        numeratorUuid: { type: string; maxLength: number };
                        denominatorExclusionUuid: { type: string; maxLength: number };
                        denominatorExceptionUuid: { type: string; maxLength: number };
                        strata: {
                            type: string;
                            items: { type: string; maxLength: number };
                        };
                    };
                };
            };
            required: string[];
        };
        subcategoryIds: {
            enum: string[];
        };
        objectives: {
            enum: string[];
        };
        measureTypes: {
            enum: string[];
        };
        methods: {
            enum: string[];
        };
        measureSpecification: {
            type: string;
            additionalProperties: boolean;
            properties: {
                default: { type: string };
                registry: { type: string };
                claims: { type: string };
                cmsWebInterface: { type: string };
                measureInformation: { type: string };
                electronicHealthRecord: { type: string };
            };
        };
        measureSets: {
            enum: string[];
        };
        eligibilityOption: {
            type: string;
            additionalProperties: boolean;
            properties: {
                sexCode: {
                    description: string;
                    enum: string[];
                };
                minAge: {
                    description: string;
                    type: number;
                };
                maxAge: {
                    description: string;
                    type: number;
                };
                diagnosisCodes: {
                    type: string;
                    description: string;
                    items: { type: string };
                };
                additionalDiagnosisCodes: {
                    type: string;
                    description: string;
                    items: { type: string };
                };
                procedureCodes: {
                    description: string;
                    type: string;
                    items: { $ref: string };
                };
                additionalProcedureCodes: {
                    description: string;
                    type: string;
                    items: { $ref: string };
                };
                optionGroup: {
                    description: string;
                    type: string;
                };
            };
            anyOf: Array<{ required: string[] }>;
        };
        performanceOption: {
            type: string;
            additionalProperties: boolean;
            properties: {
                optionType: {
                    description: string;
                    enum: string[];
                };
                qualityCodes: {
                    description: string;
                    type: string;
                    items: { $ref: string };
                };
                optionGroup: {
                    description: string;
                    type: string;
                };
            };
            required: string[];
        };
        programs: {
            enum: string[];
        };
        codeObject: {
            type: string;
            additionalProperties: boolean;
            properties: {
                code: {
                    description: string;
                    type: string;
                };
                modifiers: {
                    type: string;
                    description: string;
                    items: { type: string };
                };
                modifierExclusions: {
                    type: string;
                    description: string;
                    items: { type: string };
                };
                placesOfService: {
                    type: string;
                    description: string;
                    items: { type: string };
                };
                placesOfServiceExclusions: {
                    type: string;
                    description: string;
                    items: { type: string };
                };
            };
            required: string[];
        };
        qualityCodesSubmissionMethods: {
            type: string;
            items: {
                enum: string[];
            };
        };
        arrayOfStringIdentifiers: {
            type: string;
            items: { type: string };
        };
    };
}
