import { execSync } from 'node:child_process';
import * as fs from 'fs-extra';
import * as path from 'node:path';

import packageJson from '../../package.json';

const OUTPUT_FILE = path.join(__dirname, '../../dist/qpp-measures-data.d.ts');
const ENTRY_FILE = path.join(__dirname, '../../util/interfaces/index.ts');

function bundleTypes(): void {
    console.log('Bundling type definitions...');

    // Run dts-bundle-generator
    execSync(
        `npx dts-bundle-generator --no-check --out-file ${OUTPUT_FILE} ${ENTRY_FILE}`,
        { stdio: 'inherit' }
    );

    // Prepend version header
    const header = `/**
    * QPP Measures Data Type Definitions
    * @version ${packageJson.version}
    * @generated ${new Date().toISOString().split('T')[0]}
    *
    * Usage: Copy this file into your project and reference types directly.
    * Example: const measure: Measure = apiResponse.data;
    */\n\n`;

    const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    fs.writeFileSync(OUTPUT_FILE, header + content);

    console.log(`Type bundle generated: ${OUTPUT_FILE}`);
}

bundleTypes();
