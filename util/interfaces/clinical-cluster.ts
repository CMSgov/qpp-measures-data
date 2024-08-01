export interface ClinicalCluster {
    measureId: string;
    submissionMethod: string;
    firstPerformanceYear: number;
    lastPerformanceYear: number | null;
    specialtySets: {
        name: string;
        measureIds: string[];
    };
}
