import fs from 'fs';

import * as index from '../../../index';
import {
  info,
  warning
} from '../../logger';

export function updateMvps(performanceYear: string) {
  const filePath = `mvp/${performanceYear}/mvp-enriched.json`;

  // Delete the existing file
  try {
    fs.unlinkSync(filePath);
    info(`File ${filePath} deleted.`);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      warning(`File ${filePath} not found; proceeding to next step...`);
    } else {
      throw err;
    }
  }

  index.createMVPDataFile(Number(performanceYear));
  index.updateProgramNames(Number(performanceYear));
}

/* c8 ignore next */
if (process.argv[2] && process.argv[2] !== "--coverage")
  /* c8 ignore next */
  updateMvps(process.argv[2]);
