/**
 * @ParseMvpData
 *  Converts raw JSON measures file to correct format.
 */

import appRoot from 'app-root-path';
import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';

import { writeToFile } from '../measures/lib/measures-lib';
import { Measure } from '../../util/interfaces';
import { CORE_MEASURES_START_YEAR, isCoreMeasureYear } from '../constants';
import { warning } from '../logger';
import { MVP, MVPCategory } from './mvps.types';

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

  const mvpData: MVP[] = [];
  const isCoreYear = isCoreMeasureYear(performanceYear);

  rawMvpData.forEach((row) => {
    const existingMvp = mvpData.find((mvp) => mvp.mvpId === row["MVP ID"]);
    const measureId = row["Measure Id"];

    const measure = measuresData.find((m: Measure) => m.measureId === measureId);
    if (!measure) {
      console.log(
        `Measure not found for measureId ${measureId} for mvpId ${row["MVP ID"]}`
      );
    }
    const mvpCategory = row["MVP Reporting Category"];

    if (mvpCategory === MVPCategory.CoreQuality) {
      if (!isCoreYear) {
        warning(`'${row["MVP ID"]}': '${MVPCategory.CoreQuality}' is not a valid MVP Reporting Category before PY${CORE_MEASURES_START_YEAR} (measure '${measureId}').`);
      } else if (measure && measure.category !== "quality") {
        warning(`'${row["MVP ID"]}': measure '${measureId}' is marked '${MVPCategory.CoreQuality}' but is not a quality measure.`);
      }
    }

    if (!existingMvp) {
      const newMvp = {
        mvpId: row["MVP ID"],
        clinicalTopic: row["Clinical Topic"],
        title: row["MVP Title"],
        description: row["MVP Description"],
        specialtiesMostApplicableTo: row["Most Applicable Medical Specialties"]
          .split(";")
          .map((s: string) => s.trim()),
        clinicalTopics: row["Clinical Topic"],
        qualityMeasureIds: [] as string[],
        ...(isCoreYear ? { coreQualityMeasureIds: [] as string[] } : {}),
        iaMeasureIds: [] as string[],
        costMeasureIds: [] as string[],
        foundationPiMeasureIds: [] as string[],
        foundationQualityMeasureIds: [] as string[],
        administrativeClaimsMeasureIds: [] as string[],
        hasCahps: false,
        hasOutcomeAdminClaims: false,
      } as MVP;

      hydrateMeasureIds(newMvp, mvpCategory, measure, isCoreYear);

      newMvp.hasOutcomeAdminClaims = !_.isEmpty(newMvp.administrativeClaimsMeasureIds);

      mvpData.push(newMvp);

    } else {
      hydrateMeasureIds(existingMvp, mvpCategory, measure, isCoreYear);

      existingMvp.hasOutcomeAdminClaims = !_.isEmpty(existingMvp.administrativeClaimsMeasureIds);
    }
  });

  if (isCoreYear) {
    mvpData.forEach((mvp) => {
      if (_.isEmpty(mvp.coreQualityMeasureIds)) {
        warning(`'${mvp.mvpId}' has no '${MVPCategory.CoreQuality}' measures.`);
      }
    });
  }

  writeToFile(mvpData, mvpFileWritePath);
}

function pushUnique(ids: string[], measureId: string) {
  if (!ids.includes(measureId)) {
    ids.push(measureId);
  }
}

function hydrateMeasureIds(mvp: MVP, mvpCategory: string, measure: Measure, isCoreYear: boolean) {
  switch (measure?.category) {
    case "quality": {
      // 'Core Quality' (PY2027+) is a Quality measure that is also a Core Measure for this MVP.
      const isCoreQuality = isCoreYear && mvpCategory === MVPCategory.CoreQuality;

      if (mvpCategory === MVPCategory.Foundational) {
        mvp.foundationQualityMeasureIds.push(measure.measureId);
      } else if (mvpCategory === MVPCategory.Quality || isCoreQuality) {
        // Core years de-duplicate, since a measure may be listed as both 'Quality' and 'Core Quality'.
        const addId = (ids: string[]) => isCoreYear ? pushUnique(ids, measure.measureId) : ids.push(measure.measureId);

        // if it is an adminclaims measure, add it to that array.
        if (measure?.submissionMethods.includes("administrativeClaims")) {
          addId(mvp.administrativeClaimsMeasureIds);
        } else {
          if (measure?.measureId === "321") {
            mvp.hasCahps = true;
          }
          addId(mvp.qualityMeasureIds);
        }

        if (isCoreQuality) {
          pushUnique(mvp.coreQualityMeasureIds as string[], measure.measureId);
        }
      }
      break;
    }
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
