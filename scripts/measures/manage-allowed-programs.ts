import fs from 'fs-extra';
import path from 'path';
import appRoot from 'app-root-path';
import { Measure } from '../../util/interfaces';
import { Programs } from '../../util/interfaces/measure';
import { info, error } from '../../scripts/logger';

function isMVPProgram(program: Programs): boolean {
    return program.startsWith('G005') || program.startsWith('M0') || program.startsWith('M1');
}

function removeMeasureFromMVP(
    performanceYear: string,
    program: Programs,
    category: string,
    affectedMeasureIds: string[]
): void {
    if (!isMVPProgram(program) || affectedMeasureIds.length === 0) {
        return;
    }

    const mvpCsvFilePath = path.join(appRoot.toString(), `mvp/${performanceYear}/mvp.csv`);
    
    try {
        const csvContent = fs.readFileSync(mvpCsvFilePath, 'utf8');
        const lines = csvContent.split('\n');
        
        if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
            info('MVP CSV file is empty');
            return;
        }
        
        const header = lines[0];
        let removedCount = 0;
        
        let expectedCategory: string;
        switch (category) {
            case 'ia':
                expectedCategory = 'Improvement';
                break;
            case 'quality':
                expectedCategory = 'Quality';
                break;
            case 'cost':
                expectedCategory = 'Cost';
                break;
            case 'pi':
                expectedCategory = 'Foundational';
                break;
            default:
                info(`Unknown category "${category}" for MVP modification`);
                return;
        }

        const filteredLines = [header];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const columns = line.split(',');
            if (columns.length < 7) continue;
            
            const mvpId = columns[1];
            const reportingCategory = columns[5];
            const measureId = columns[6];
            
            const shouldRemove = mvpId === program && 
                               reportingCategory === expectedCategory && 
                               affectedMeasureIds.includes(measureId);
            
            if (shouldRemove) {
                info(`  - Removed measure "${measureId}" from MVP "${program}" (${expectedCategory}) in CSV`);
                removedCount++;
            } else {
                filteredLines.push(line);
            }
        }

        if (removedCount > 0) {
            const newCsvContent = filteredLines.join('\n');
            fs.writeFileSync(mvpCsvFilePath, newCsvContent);
            info(`Removed ${removedCount} measure associations from MVP "${program}" in mvp.csv`);
        } else {
            info(`No measure associations found to remove from MVP "${program}" in mvp.csv`);
        }
        
    } catch (err) {
        error(`Failed to update MVP CSV data: ${(err as Error).message}`);
    }
}

// Function to update allowedPrograms for a specific category
export function updateAllowedPrograms(
    performanceYear: string,
    category: string,
    program: Programs,
    action: 'add' | 'remove',
) {
    const measuresPath = `measures/${performanceYear}/measures-data.json`;
    
    const programNamesPath = `util/program-names/program-names.json`;

    try {
        // Load the measures data
        const measuresJson: Measure[] = JSON.parse(
            fs.readFileSync(path.join(appRoot.toString(), measuresPath), 'utf8')
        );

        // Load the program names json for sorting
        const programNamesJson: Record<string, string> = JSON.parse(
            fs.readFileSync(path.join(appRoot.toString(), programNamesPath), 'utf8')
        );

        let updatedMeasures = 0;
        const affectedMeasureIds: string[] = [];

        // Update measures in the specified category
        measuresJson.forEach((measure) => {
            if (measure.category === category) {
                const allowedPrograms: Programs[] = measure.allowedPrograms || [];

                if (action === 'add') {
                    // Add program if it doesn't already exist
                    if (!allowedPrograms.includes(program)) {
                        allowedPrograms.push(program);
                        Object.values(programNamesJson)

                        const sortedPrograms: Programs[] = sortPrograms(allowedPrograms, programNamesJson);
        
                        measure.allowedPrograms = sortedPrograms;
                        updatedMeasures++;
                        info(`Added program "${program}" to measure "${measure.measureId}".`);
                    }
                } else if (action === 'remove') {
                    // Remove program if it exists
                    const index = allowedPrograms.indexOf(program);
                    if (index !== -1) {
                        allowedPrograms.splice(index, 1);
                        measure.allowedPrograms = allowedPrograms;
                        updatedMeasures++;
                        affectedMeasureIds.push(measure.measureId);
                        info(`Removed program "${program}" from measure "${measure.measureId}".`);
                    }
                }
            }
        });

        // If removing an MVP program, also update the MVP data
        if (action === 'remove' && isMVPProgram(program)) {
            removeMeasureFromMVP(performanceYear, program, category, affectedMeasureIds);
        }

        // Save the updated measures data back to the file
        if (updatedMeasures > 0) {
            fs.writeFileSync(
                path.join(appRoot.toString(), measuresPath),
                JSON.stringify(measuresJson, null, 2)
            );
            info(`${updatedMeasures} measures updated successfully.`);
        } else {
            info(`No measures required updates.`);
        }
    } catch (err) {
        error(`Failed to update measures: ${(err as Error).message}`);
    }
}

// Function to sort programs based on their names from the programNamesJson
function sortPrograms(
    programs: Programs[],
    programNamesJson: Record<string, string>
): Programs[] {
    const programNamesArray: string[] = Object.values(programNamesJson);
    return programs.sort((v1, v2) => {
        return programNamesArray.indexOf(v1) - programNamesArray.indexOf(v2);
    });
}

/* c8 ignore start */
if (require.main === module && process.argv[2] && process.argv[2] !== '--coverage') {

    if (process.argv.length !== 6) {
        error('Usage: node updateAllowedPrograms.js <performanceYear> <category> <program> <add|remove>');
        process.exit(1);
    }

    const [performanceYear, category, program, action] = [
        process.argv[2],
        process.argv[3],
        process.argv[4],
        process.argv[5]
    ];

    if (!['add', 'remove'].includes(action)) {
        error('Invalid action. Use "add" or "remove".');
        process.exit(1);
    }

    updateAllowedPrograms(performanceYear, category, program as Programs, action as 'add' | 'remove');
}
/* c8 ignore stop */
