export interface ClinicalClusterSchema {
    $id: string;
    $schema: string;
    type: 'array';
    items: {
        $ref: '#/definitions/ClusterType';
    };
    definitions: {
        ClusterType: {
            type: 'object';
            properties: {
                measureId: {
                    type: 'string';
                    description: string;
                };
                firstPerformanceYear: {
                    description: string;
                    type: 'integer';
                    default: number;
                };
                lastPerformanceYear: {
                    description: string;
                    type: ['integer', 'null'];
                    default: 'null';
                };
                clinicalClusters: {
                    type: 'array';
                    items: {
                        $ref: '#/definitions/ClinicalClusterType';
                    };
                };
                specialtySets: {
                    type: 'array';
                    items: {
                        $ref: '#/definitions/ClinicalClusterType';
                    };
                };
            };
        };
        ClinicalClusterType: {
            type: 'object';
            properties: {
                name: {
                    type: 'string';
                    description: string;
                };
                measureIds: {
                    type: 'array';
                    items: {
                        type: 'string';
                        description: string;
                    };
                };
            };
        };
    };
}
