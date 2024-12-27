import fs from 'fs-extra';
import path from 'path';
import appRoot from 'app-root-path';

// Function to update allowedPrograms for a specific category
export function updateAllowedPrograms(
    performanceYear: string,
    category: string,
    program: string,
    action: 'add' | 'remove',
) {
    const measuresPath = `measures/${performanceYear}/measures-data.json`;

    try {
        // Load the measures data
        const measuresJson: any[] = JSON.parse(
            fs.readFileSync(path.join(appRoot.toString(), measuresPath), 'utf8')
        );

        let updatedMeasures = 0;

        // Update measures in the specified category
        measuresJson.forEach((measure) => {
            if (measure.category === category) {
                const allowedPrograms: string[] = measure.allowedPrograms || [];

                if (action === 'add') {
                    // Add program if it doesn't already exist
                    if (!allowedPrograms.includes(program)) {
                        allowedPrograms.push(program);
                        measure.allowedPrograms = allowedPrograms;
                        updatedMeasures++;
                        console.log(`Added program "${program}" to measure "${measure.measureId}".`);
                    }
                } else if (action === 'remove') {
                    // Remove program if it exists
                    const index = allowedPrograms.indexOf(program);
                    if (index !== -1) {
                        allowedPrograms.splice(index, 1);
                        measure.allowedPrograms = allowedPrograms;
                        updatedMeasures++;
                        console.log(`Removed program "${program}" from measure "${measure.measureId}".`);
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
            console.log(`${updatedMeasures} measures updated successfully.`);
        } else {
            console.log(`No measures required updates.`);
        }
    } catch (err) {
        console.error(`Failed to update measures: ${(err as Error).message}`);
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length !== 4) {
        console.error('Usage: node updateAllowedPrograms.js <performanceYear> <category> <program> <add|remove>');
        process.exit(1);
    }

    const [performanceYear, category, program, action] = args;

    if (!['add', 'remove'].includes(action)) {
        console.error('Invalid action. Use "add" or "remove".');
        process.exit(1);
    }

    updateAllowedPrograms(performanceYear, category, program, action as 'add' | 'remove');
}
