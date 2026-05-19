import * as readline from 'readline';

const YEAR_REGEX = /^\d{4}$/;

/**
 * Performance year from CLI (`npm run script -- 2026`) or interactive prompt.
 */
export function getPerformanceYear(cliYear?: string): Promise<string> {
  const fromArgv = cliYear ?? process.argv[2];
  if (fromArgv && YEAR_REGEX.test(fromArgv.trim())) {
    return Promise.resolve(fromArgv.trim());
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter performance year (e.g. 2026): ', (answer) => {
      rl.close();
      const year = answer.trim();
      if (!YEAR_REGEX.test(year)) {
        reject(new Error(`Invalid performance year: "${answer}" (expected 4 digits, e.g. 2026)`));
        return;
      }
      resolve(year);
    });
  });
}
