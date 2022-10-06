export function info(message: string) {
    console.info(
        '\x1b[32m%s\x1b[0m', 
        message,
    );
}

export function warning(message: string) {
    console.warn(
        '\x1b[33m%s\x1b[0m', 
        `[WARNING]: ${message}`,
    );
}

export function error(message: string) {
    console.error(
        '\x1b[31m%s\x1b[0m', 
        `[ERROR]: ${message}`,
    );
}
