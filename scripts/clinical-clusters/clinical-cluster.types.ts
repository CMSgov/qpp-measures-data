export type SpecialtySet = {
    name: string,
    measureIds: string[]
};

export type SpecialtySetRelation = {
    name: string,
    action: string,
    measureIds: string[]
};

export type ClusterRelations = {
    measureId: string,
    optionals: string[]
};

export type ClinicalCluster = {
    name: string,
    measureIds: string[],
};

export type ClusterInfo = {
    measureId: string,
    submissionMethod: string,
    firstPerformanceYear: number,
    lastPerformanceYear: number | null,
    specialtySets?: SpecialtySet[],
    clinicalClusters?: ClinicalCluster[]
}
