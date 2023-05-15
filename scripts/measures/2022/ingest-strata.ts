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

import { DataValidationError } from '../lib/errors';

const performanceYear = process.argv[2];
const strataPath = process.argv[3];

const measuresPath = `measures/${performanceYear}/measures-data.json`;

const measuresJson = JSON.parse(
  fs.readFileSync(path.join(appRoot + "", measuresPath), "utf8")
);
const strata = parse(
  fs.readFileSync(path.join(appRoot + "", strataPath), "utf8"),
  { columns: true, skip_empty_lines: true, bom: true }
);

export function ingestStrata() {
  const uniqueMeasureIds = [
    ...new Set(strata.map((stratum) => stratum.measureId)),
  ];
  for (let i = 0; i < uniqueMeasureIds.length; i++) {
    const currentStrata = measuresJson.find(
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
        ...currentStrata.find((currentStratum: any) => currentStratum.name === stratum.stratumName),
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

function writeToFile(file: any, filePath: string) {
  fs.writeFile(
    path.join(appRoot + "", filePath),
    JSON.stringify(file, null, 2),
    function writeJSON(err) {
      if (err) return console.log(err);
    }
  );
}

ingestStrata();
