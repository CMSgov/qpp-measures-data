/**
 * @ParseMvpData
 *  Converts raw JSON measures file to correct format.
 */

import appRoot from 'app-root-path';
import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';

import { writeToFile } from '../measures/lib/measures-lib';

export function parseMvpData(performanceYear: string) {
  const rawMvpFilePath = `mvp/${performanceYear}/mvp-raw.json`;
  const mvpFileWritePath = `mvp/${performanceYear}/mvp.json`;
  const measuresFilePath = `measures/${performanceYear}/measures-data.json`;

  const rawMvpData = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', rawMvpFilePath), "utf8")
  );

  const measuresData = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', measuresFilePath), "utf8")
  );

  const mvpData = [] as any;

  rawMvpData.forEach((row) => {
    const existingMvp = mvpData.find((mvp) => mvp.mvpId === row["MVP ID"]);
    const measureId = row["Measure Id"];

    const measure = measuresData.find((m) => m.measureId === measureId);
    if (!measure) {
      console.log(
        `Measure not found for measureId ${measureId} for mvpId ${row["MVP ID"]}`
      );
    }
    const mvpCategory = row["MVP Reporting Category"];

    if (!existingMvp) {
      const newMvp = {
        mvpId: row["MVP ID"],
        clinicalTopic: row["Clinical Topic"],
        title: row["MVP Title"],
        description: row["MVP Description"],
        specialtiesMostApplicableTo: row["Most Applicable Medical Specialties"]
          .split(";")
          .map((s) => s.trim()),
        clinicalTopics: row["Clinical Topic"],
        qualityMeasureIds: [] as any,
        iaMeasureIds: [] as any,
        costMeasureIds: [] as any,
        foundationPiMeasureIds: [] as any,
        foundationQualityMeasureIds: [] as any,
        administrativeClaimsMeasureIds: [] as any,
        hasCahps: false,
        hasOutcomeAdminClaims: false,
      };

      hydrateMeasureIds(newMvp, mvpCategory, measure);

      newMvp.hasOutcomeAdminClaims = !_.isEmpty(newMvp.administrativeClaimsMeasureIds);

      mvpData.push(newMvp);

    } else {
      hydrateMeasureIds(existingMvp, mvpCategory, measure);

      existingMvp.hasOutcomeAdminClaims = !_.isEmpty(existingMvp.administrativeClaimsMeasureIds);
    }
  });
  writeToFile(mvpData, mvpFileWritePath);
  // fs.writeFileSync(
  //   path.join(appRoot + '', mvpFileWritePath),
  //   JSON.stringify(mvpData, null, 2)
  // );
}

function hydrateMeasureIds(mvp, mvpCategory, measure) {
  switch (measure?.category) {
    case "quality":
      if (mvpCategory === "Foundational") {
        mvp.foundationQualityMeasureIds.push(measure.measureId);
      } else if (mvpCategory === "Quality") {
        // if it is an adminclaims measure, add it to that array.
        if (measure?.submissionMethods.includes("administrativeClaims")) {
          mvp.administrativeClaimsMeasureIds.push(measure.measureId);
          break;
        }
        if (measure?.measureId === "321") {
          mvp.hasCahps = true;
        }
        mvp.qualityMeasureIds.push(measure.measureId);
      }
      break;
    case "ia":
      mvp.iaMeasureIds.push(measure.measureId);
      break;
    case "cost":
      mvp.costMeasureIds.push(measure.measureId);
      break;
    case "pi":
      mvp.foundationPiMeasureIds.push(measure.measureId);
      break;
  }
}

/* c8 ignore next */
if (process.argv[2] && process.argv[2] !== '--coverage')
  /* c8 ignore next */
  parseMvpData(process.argv[2]);
