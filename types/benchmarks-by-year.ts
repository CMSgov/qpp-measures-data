export interface Percentiles {
    [key: string]: number;
}

export interface Benchmark {
    measureId: string;
    benchmarkYear: number;
    performanceYear: number;
    submissionMethod: string;
    isToppedOut: boolean;
    isHighPriority: boolean;
    isInverse: boolean;
    metricType: string;
    isToppedOutByProgram: boolean;
    percentiles: Percentiles;
    averagePerformanceRate?: number;
}

export interface BenchmarksByYear {
    [year: number]: Benchmark[];
}
