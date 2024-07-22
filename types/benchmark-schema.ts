export interface BenchmarkSchema {
    $id: string;
    $schema: string;
    type: string;
    items: {
        $ref: string;
    };
    definitions: {
        [key: string]: {
            type: string;
            properties: {
                [key: string]: {
                    description?: string;
                    type: string | string[];
                    items?: {
                        type: string | string[];
                    };
                    minItems?: number;
                    maxItems?: number;
                    enum?: string[];
                };
            };
            required: string[];
        };
    };
}
