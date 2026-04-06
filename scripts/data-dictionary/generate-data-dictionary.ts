import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import Papa from 'papaparse';
import YAML from 'yaml';

// Define the structure of schema properties and documents
type SchemaProperty = {
    type?: string | string[];
    description?: string;
    enum?: unknown[];
    oneOf?: unknown[];
    anyOf?: unknown[];
    allOf?: unknown[];
    $ref?: string;
    items?: {
        type?: string | string[];
        $ref?: string;
    };
};

type SchemaDefinition = {
    properties?: Record<string, SchemaProperty>;
    $merge?: {
        source?: {
            $ref?: string;
        };
        with?: {
            properties?: Record<string, SchemaProperty>;
        };
    };
};

type SchemaDocument = {
    definitions?: Record<string, SchemaDefinition>;
};

type DataDictionaryRow = {
    definition: string;
    property_name: string;
    type: string;
    description: string;
};

// Default year for the script
const DEFAULT_YEAR = '2026';

// Extract the definition name from a reference string
function getDefinitionNameFromRef(ref: string): string {
    return ref.replace('#/definitions/', '');
}

// Determine the type of a schema property
function getTypeValue(property: SchemaProperty): string {
    if (Array.isArray(property.type)) {
        return property.type.join('|');
    }
    if (typeof property.type === 'string') {
        return property.type;
    }
    if (property.$ref) {
        return getDefinitionNameFromRef(property.$ref);
    }
    if (property.items?.$ref) {
        return `array<${getDefinitionNameFromRef(property.items.$ref)}>`;
    }
    if (property.items?.type) {
        const itemType = Array.isArray(property.items.type)
            ? property.items.type.join('|')
            : property.items.type;
        return `array<${itemType}>`;
    }
    if (property.enum) return 'enum';
    if (property.oneOf) return 'oneOf';
    if (property.anyOf) return 'anyOf';
    if (property.allOf) return 'allOf';
    return '';
}

// Resolve properties of a schema definition, including inherited ones
function resolveDefinitionProperties(
    definitionName: string,
    definitions: Record<string, SchemaDefinition>,
    visited = new Set<string>(),
): Record<string, SchemaProperty> {
    if (visited.has(definitionName)) {
        throw new Error(
            `Circular definition merge detected while resolving "${definitionName}".`,
        );
    }

    const definition = definitions[definitionName];
    if (!definition) {
        throw new Error(`Definition "${definitionName}" was not found.`);
    }

    const nextVisited = new Set(visited);
    nextVisited.add(definitionName);

    let inheritedProperties: Record<string, SchemaProperty> = {};

    const sourceRef = definition.$merge?.source?.$ref;
    if (sourceRef?.startsWith('#/definitions/')) {
        const sourceDefinitionName = getDefinitionNameFromRef(sourceRef);
        inheritedProperties = resolveDefinitionProperties(
            sourceDefinitionName,
            definitions,
            nextVisited,
        );
    }

    return {
        ...inheritedProperties,
        ...(definition.properties ?? {}),
        ...(definition.$merge?.with?.properties ?? {}),
    };
}

// Extract rows of data from the schema document for the CSV
function extractRowsFromSchema(document: SchemaDocument): DataDictionaryRow[] {
    const definitions = document.definitions ?? {};
    const rows: DataDictionaryRow[] = [];

    for (const definitionName of Object.keys(definitions)) {
        const resolvedProperties = resolveDefinitionProperties(
            definitionName,
            definitions,
        );

        for (const [propertyName, propertyDetails] of Object.entries(
            resolvedProperties,
        )) {
            rows.push({
                definition: definitionName,
                property_name: propertyName,
                type: getTypeValue(propertyDetails),
                description: propertyDetails.description ?? '',
            });
        }
    }

    return rows.sort((left, right) => {
        const definitionCompare = left.definition.localeCompare(right.definition);
        if (definitionCompare !== 0) {
            return definitionCompare;
        }
        return left.property_name.localeCompare(right.property_name);
    });
}

// Read and parse a YAML schema file
async function readSchema(filePath: string): Promise<SchemaDocument> {
    const exists = await fs.pathExists(filePath);
    if (!exists) {
        throw new Error(`Schema file not found: ${filePath}`);
    }

    const yamlContent = await fs.readFile(filePath, 'utf8');
    try {
        return YAML.parse(yamlContent) as SchemaDocument;
    } catch (error) {
        throw new Error(
            `Unable to parse YAML from ${filePath}. ${(error as Error).message}`,
            { cause: error },
        );
    }
}

// Convert the schema to CSV and write it to a file
async function writeSchemaCsv(
    inputFilePath: string,
    outputFilePath: string,
): Promise<void> {
    const schema = await readSchema(inputFilePath);
    const rows = extractRowsFromSchema(schema);

    const csv = Papa.unparse(rows, {
        columns: ['definition', 'property_name', 'type', 'description'],
    });

    await fs.ensureDir(path.dirname(outputFilePath));
    await fs.writeFile(outputFilePath, csv, 'utf8');

    console.log(`Created: ${outputFilePath}`);
}

// Main function to process multiple schema files and generate CSVs
async function main(options: {
    year: string;
    outputDir?: string;
}): Promise<void> {
    const { year, outputDir } = options;

    const targetDir = outputDir || path.join('tmp', year);

    const files = [
        {
            input: path.join('measures', year, 'measures-schema.yaml'),
            output: path.join(targetDir, 'measures_db_schema.csv'),
        },
        {
            input: path.join('benchmarks', year, 'benchmarks-schema.yaml'),
            output: path.join(targetDir, 'benchmarks_db_schema.csv'),
        },
        {
            input: path.join('mvp', year, 'mvp-schema.yaml'),
            output: path.join(targetDir, 'mvp_db_schema.csv'),
        },
    ];

    for (const file of files) {
        await writeSchemaCsv(file.input, file.output);
    }

    console.log('All schema CSV files generated successfully.');
}

// CLI setup using Commander.js
const program = new Command();

program
    .name('generate-data-dictionary')
    .description(
        'Generate separate CSV data dictionary files from local measures, benchmarks, and MVP schema YAML files.',
    )
    .option('-y, --year <year>', 'Performance year', DEFAULT_YEAR)
    .option('-o, --output-dir <path>', 'Output directory for generated CSV files')
    .action(async (options) => {
        await main(options);
    });

program.parseAsync(process.argv).catch((error) => {
    console.error(error.message);
    process.exit(1);
});
