export interface BenchmarksData {
    [year: number]: {
        measureId: string;
        benchmarkYear: number;
        performanceYear: number;
        submissionMethod: string;
        isToppedOut: boolean;
        isHighPriority: boolean;
        isInverse: boolean;
        metricType: string;
        isToppedOutByProgram: boolean;
        percentiles: {
            [key: string]: number;
        };
        averagePerformanceRate?: number;
    }[];
}
