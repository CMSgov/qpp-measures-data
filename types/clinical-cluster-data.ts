export interface ClinicalClusterDataItem {
    measureId: string;
    submissionMethod: string;
    firstPerformanceYear: number;
    lastPerformanceYear: number | null;
    specialtySets: {
        name: string;
        measureIds: string[];
    }[];
    clinicalClusters: {
        name: string;
        measureIds: string[];
    }[];
}

export type ClinicalClusterData = ClinicalClusterDataItem[];
