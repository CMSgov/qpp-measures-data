import fs from 'fs-extra';
import path from 'path';
import appRoot from 'app-root-path';
import { Measure } from '../../util/interfaces';
import { Programs } from '../../util/interfaces/measure';
import { info, error } from '../../scripts/logger';

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
                        info(`Removed program "${program}" from measure "${measure.measureId}".`);
                    }
                }
            }
        });

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
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length !== 4) {
        error('Usage: node updateAllowedPrograms.js <performanceYear> <category> <program> <add|remove>');
        process.exit(1);
    }

    const [performanceYear, category, program, action] = args;

    if (!['add', 'remove'].includes(action)) {
        error('Invalid action. Use "add" or "remove".');
        process.exit(1);
    }

    updateAllowedPrograms(performanceYear, category, program as Programs, action as 'add' | 'remove');
}
/* c8 ignore stop */
