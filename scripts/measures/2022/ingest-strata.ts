/**
 * @IngestStrata
 *  Instead of utilizing an update process (as we do for measures),
 * we handle strata by updating the CSVs in /util and
 * re-inject the data into the measures-data.json.
 */

import appRoot from 'app-root-path';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';

import { DataValidationError } from '../../errors';
import { writeToFile } from './update-measures-util';
import { csvStratum, jsonStratum } from '../lib/measures.types';

export function ingestStrata(performanceYear: number, strataPath: string) {
  const measuresPath = `measures/${performanceYear}/measures-data.json`;

  const measuresJson = JSON.parse(
    fs.readFileSync(path.join(appRoot + "", measuresPath), "utf8")
  );
  const strata: csvStratum[] = parse(
    fs.readFileSync(path.join(appRoot + "", strataPath), "utf8"), {
    columns: true,
    relax_column_count: true,
    bom: true,
    skip_records_with_empty_values: true,
  });

  const uniqueMeasureIds = [
    ...new Set(strata.map((stratum) => {
      if (!stratum.measureId) {
        throw new DataValidationError(
          strataPath,
          "MeasureId is required."
        );
      }
      return stratum.measureId;
    })),
  ];
  for (let i = 0; i < uniqueMeasureIds.length; i++) {
    const currentStrata: jsonStratum[] = measuresJson.find(
      (measure: any) => measure.measureId === uniqueMeasureIds[i]
    ).strata;

    const measureStrata = _.filter(strata, { measureId: uniqueMeasureIds[i] });
    let mappedStrata = measureStrata.map((stratum) => {
      if (!stratum.stratumName || !stratum.description) {
        throw new DataValidationError(
          strataPath,
          "Name and description are required."
        );
      }
      return {
        ...currentStrata.find((currentStratum) => currentStratum.name === stratum.stratumName),
        name: stratum.stratumName,
        description: stratum.description,
      };
    });
    measuresJson.find(
      (measure: any) => measure.measureId === uniqueMeasureIds[i]
    ).strata = mappedStrata;
  }
  writeToFile(measuresJson, measuresPath);
}

/* c8 ignore next */
if (process.argv[2] && process.argv[2] !== '--coverage')
  /* c8 ignore next */
  ingestStrata(parseInt(process.argv[2]), process.argv[3]);
