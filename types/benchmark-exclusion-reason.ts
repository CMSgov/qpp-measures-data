export type BenchmarkExclusionReason = {
    measureId: string;
    submissionMethod: string;
    performanceYear: number;
    benchmarkYear: number;
    reasonCodes: string[];
    reasonDescriptions: string[];
};
