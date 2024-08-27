export interface BenchmarksData {
  [year: number]: BenchmarksDetails[];
}

export interface BenchmarksDetails {
  measureId: string;
  benchmarkYear: number;
  performanceYear: number;
  submissionMethod: string;
  isToppedOut?: boolean;
  isHighPriority?: boolean;
  isInverse?: boolean;
  metricType?: string;
  isToppedOutByProgram?: boolean;
  percentiles?: {
    [key: string]: number;
  };
  deciles?: number[];
  averagePerformanceRate?: number;
}
