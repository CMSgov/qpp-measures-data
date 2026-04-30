import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

const BUNDLE_PATH = path.join(__dirname, '../../dist/qpp-measures-data.d.ts');

describe('bundle-types output', () => {
    let content: string;

    beforeAll(() => {
        execSync('npm run build:types', { stdio: 'inherit' });
        content = fs.readFileSync(BUNDLE_PATH, 'utf-8');
    });

    it('bundle file exists at dist/qpp-measures-data.d.ts', () => {
        expect(fs.existsSync(BUNDLE_PATH)).toBe(true);
    });

    it('contains no import statements', () => {
        const importLines = content.split('\n').filter(line => /^\s*import\s/.test(line));
        expect(importLines).toHaveLength(0);
    });

    const expectedTypes = [
        'BenchmarksExclusionReasons',
        'BenchmarksData',
        'ClusterInfo',
        'CostNationalAverage',
        'Stratum',
        'MeasureSpecification',
        'BaseMeasure',
        'IAMeasure',
        'PIMeasure',
        'QualityMeasure',
        'AggregateCostMeasure',
        'Measure',
        'MVPData',
        'MVPDataSlim',
        'ProgramNames',
    ];

    it.each(expectedTypes)('exports type %s', (typeName) => {
        expect(content).toMatch(new RegExp(`\\bexport\\b[\\s\\S]*?\\b${typeName}\\b`));
    });
});
