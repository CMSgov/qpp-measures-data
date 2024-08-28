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
            "1": number;
            "10": number;
            "20": number;
            "30": number;
            "40": number;
            "50": number;
            "60": number;
            "70": number;
            "80": number;
            "90": number;
            "99": number;
        };
        averagePerformanceRate?: number;
    }[];
}
