
export class InvalidValueError extends Error {
    constructor(field: string, value: string) {
        super();
        this.message = `Invalid Value in '${field}' field: ${value}`;
    };
}
export class DataValidationError extends Error {
    constructor(dataName: string, message: string) {
        super();
        this.message = `'${dataName}': ${message}`;
    };
}