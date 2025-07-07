import { mergeBenchmarkFiles } from './merge-benchmark-files';
import * as benchmarksUtil from './util';
import fs from 'fs';

jest.mock('app-root-path', () => ({
    toString: () => '/mock-root'
}));

const performanceYear = 2023;

describe('Merge Benchmark Files', () => {
    let writeSpy: jest.SpyInstance;

    beforeEach(() => {
        writeSpy = jest.spyOn(benchmarksUtil, 'writeToFile').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('Successfully merges two benchmark JSON files and sorts the benchmarks', () => {
        // Setup: two files, one with a regular benchmark, one with a performance benchmark
        jest.spyOn(fs, 'readdirSync').mockReturnValue([
            'regular-benchmarks.json' as any,
            'performance-benchmarks.json' as any
        ]);
        jest.spyOn(fs, 'readFileSync')
            .mockImplementationOnce(() =>
                JSON.stringify([
                    {
                        measureId: '001',
                        benchmarkYear: 2021,
                        performanceYear: 2023,
                        submissionMethod: 'registry',
                        percentiles: { p10: 0.1, p50: 0.5 },
                        averagePerformanceRate: 0.5
                    }
                ])
            )
            .mockImplementationOnce(() =>
                JSON.stringify([
                    {
                        measureId: '002',
                        benchmarkYear: 2021,
                        performanceYear: 2023,
                        submissionMethod: 'registry',
                        percentiles: { p10: 0.123456, p50: 0.654321 },
                        averagePerformanceRate: 0.8
                    }
                ])
            );

        mergeBenchmarkFiles('test/benchmarks/merge-input-files/', performanceYear);

        // Should call writeToFile with sorted benchmarks
        expect(writeSpy).toBeCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ measureId: '001' }),
                expect.objectContaining({ measureId: '002' })
            ]),
            `benchmarks/${performanceYear}.json`
        );
    });

    it('removes deciles property from benchmarks', () => {
        jest.spyOn(fs, 'readdirSync').mockReturnValueOnce(['regular-benchmarks.json' as any]);
        jest.spyOn(fs, 'readFileSync').mockReturnValue(
            JSON.stringify([
                {
                    measureId: '003',
                    benchmarkYear: 2021,
                    performanceYear: 2023,
                    submissionMethod: 'registry',
                    percentiles: { p10: 0.1 },
                    deciles: [1, 2, 3],
                    averagePerformanceRate: 0.5
                }
            ])
        );
        mergeBenchmarkFiles('test/benchmarks/merge-input-files/', performanceYear);
        const written = writeSpy.mock.calls[0][0];
        expect(written[0].deciles).toBeUndefined();
    });

    it('throws error if merge conflicts are found', () => {
        jest.spyOn(fs, 'readdirSync').mockReturnValue(['regular-benchmarks.json' as any]);
        // Two conflicting benchmarks with the same key but different content
        jest.spyOn(fs, 'readFileSync').mockReturnValue(
            JSON.stringify([
                {
                    measureId: '004',
                    benchmarkYear: 2021,
                    performanceYear: 2023,
                    submissionMethod: 'registry',
                    percentiles: { p10: 0.1 },
                    averagePerformanceRate: 0.5
                },
                {
                    measureId: '004',
                    benchmarkYear: 2021,
                    performanceYear: 2023,
                    submissionMethod: 'registry',
                    percentiles: { p10: 0.2 },
                    averagePerformanceRate: 0.6
                }
            ])
        );
        expect(() =>
            mergeBenchmarkFiles('test/benchmarks/merge-input-files/', performanceYear)
        ).toThrow(/Merge Conflicts/);
    });

    it('throws error if a required key is missing', () => {
        jest.spyOn(fs, 'readdirSync').mockReturnValue(['regular-benchmarks.json' as any]);
        jest.spyOn(fs, 'readFileSync').mockReturnValue(
            JSON.stringify([
                {
                    // missing benchmarkYear
                    measureId: '005',
                    performanceYear: 2023,
                    submissionMethod: 'registry',
                    percentiles: { p10: 0.1 },
                    averagePerformanceRate: 0.5
                }
            ])
        );
        expect(() =>
            mergeBenchmarkFiles('test/benchmarks/merge-input-files/', performanceYear)
        ).toThrow(new Error('Key is missing: benchmarkYear'));
    });

    it('rounds percentiles to 4 decimals for acMeasures2021 in processPerformanceBenchmark', () => {
        jest.spyOn(fs, 'readdirSync').mockReturnValue(['performance-benchmarks.json' as any]);
        jest.spyOn(fs, 'readFileSync').mockReturnValue(
            JSON.stringify([
                {
                    measureId: '479',
                    benchmarkYear: 2021,
                    performanceYear: 2023,
                    submissionMethod: 'registry',
                    percentiles: { p10: 0.123456, p50: 0.654321 },
                    averagePerformanceRate: 0.8
                }
            ])
        );
        mergeBenchmarkFiles('test/benchmarks/merge-input-files/', performanceYear);
        const written = writeSpy.mock.calls[0][0];
        expect(written[0].percentiles.p10).toBeCloseTo(0.1235, 4);
        expect(written[0].percentiles.p50).toBeCloseTo(0.6543, 4);
    });

    it('sets isToppedOut and isToppedOutByProgram to false and averagePerformanceRate to null if missing', () => {
        jest.spyOn(fs, 'readdirSync').mockReturnValue(['performance-benchmarks.json' as any]);
        jest.spyOn(fs, 'readFileSync').mockReturnValue(
            JSON.stringify([
                {
                    measureId: '479',
                    benchmarkYear: 2021,
                    performanceYear: 2023,
                    submissionMethod: 'registry',
                    percentiles: { p10: 0.123456 }
                    // averagePerformanceRate missing
                }
            ])
        );
        mergeBenchmarkFiles('test/benchmarks/merge-input-files/', performanceYear);
        const written = writeSpy.mock.calls[0][0];
        expect(written[0].isToppedOut).toBe(false);
        expect(written[0].isToppedOutByProgram).toBe(false);
        expect(written[0].averagePerformanceRate).toBeNull();
    });

    it('sorts files so performance-benchmarks.json is processed last', () => {
        jest.spyOn(fs, 'readdirSync').mockReturnValue([
            'a.json' as any,
            'performance-benchmarks.json' as any,
            'b.json' as any
        ]);
        jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(
            JSON.stringify([
                {
                    measureId: '006',
                    benchmarkYear: 2021,
                    performanceYear: 2023,
                    submissionMethod: 'registry',
                    percentiles: { p10: 0.1 },
                    averagePerformanceRate: 0.5
                }
            ])
        );
        jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(
            JSON.stringify([
                {
                    measureId: '007',
                    benchmarkYear: 2021,
                    performanceYear: 2023,
                    submissionMethod: 'registry',
                    percentiles: { p10: 0.1 },
                    averagePerformanceRate: 0.5
                }
            ])
        );
        jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(
            JSON.stringify([
                {
                    measureId: '008',
                    benchmarkYear: 2021,
                    performanceYear: 2023,
                    submissionMethod: 'registry',
                    percentiles: { p10: 0.1 },
                    averagePerformanceRate: 0.5
                }
            ])
        );
        mergeBenchmarkFiles('test/benchmarks/merge-input-files/', performanceYear);
        // The sort order should put performance-benchmarks.json last
        const sortedFiles = jest.spyOn(fs, 'readFileSync').mock.calls[2][0];
        expect(sortedFiles).toContain('performance-benchmarks.json');
    });
});
