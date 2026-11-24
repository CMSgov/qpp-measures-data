import { describe, expect, it } from '@jest/globals';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import appRoot from 'app-root-path';
import { Measure } from '../../util/interfaces';

describe('update measures specification ingestion', () => {
    it('ingests claims links through a normal PY2027 update', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qpp-measures-update-'));

        try {
            for (const entry of ['scripts', 'util', 'package.json', 'tsconfig.json', 'constants.ts', 'index.ts']) {
                fs.cpSync(path.join(appRoot.path, entry), path.join(root, entry), { recursive: true });
            }
            for (const entry of ['measures/2027', 'mvp/2027']) {
                fs.cpSync(path.join(appRoot.path, entry), path.join(root, entry), { recursive: true });
            }
            fs.mkdirSync(path.join(root, 'updates/measures/2027'), { recursive: true });
            fs.writeFileSync(path.join(root, 'updates/measures/2027/changes.meta.json'), '[]');
            fs.symlinkSync(path.join(appRoot.path, 'node_modules'), path.join(root, 'node_modules'), 'dir');

            const adminLink = 'https://example.com/administrative-claims.pdf';
            const claimsLink = 'https://example.com/claims.pdf';
            fs.writeFileSync(
                path.join(root, 'util/measures/2027/claims-links.csv'),
                `link,measureId\n${adminLink},479\n${claimsLink},001\n`
            );

            const result = spawnSync('npm', ['run', 'update:measures', '2027'], {
                cwd: root,
                env: { ...process.env, APP_ROOT_PATH: root, TERM: 'xterm' },
                encoding: 'utf8',
                timeout: 120000,
            });
            if (result.error) throw result.error;
            if (result.status !== 0 || result.stdout.includes('Update failed.')) {
                throw new Error(`Update failed:\n${result.stdout}\n${result.stderr}`);
            }
            expect(result.stdout).toMatch(
                /Re-validating measures-data\.json after MVP enrichment\.\.\.[\s\S]*Valid for 2027 performance year schema[\s\S]*Update complete\./
            );

            const measures: Measure[] = JSON.parse(
                fs.readFileSync(path.join(root, 'measures/2027/measures-data.json'), 'utf8')
            );
            expect(measures.find(measure => measure.measureId === '479')?.measureSpecification)
                .toStrictEqual({ default: adminLink });
            expect(measures.find(measure => measure.measureId === '001')?.measureSpecification?.claims)
                .toBe(claimsLink);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 150000);
});
