#!/usr/bin/env node

/*

Extracts ecqm eMeasureIds and retrieves any measure stratifications
Running this will generate two files
  - util/measures/additional-stratifications.json
  - util/measures/generated-ecqm-data.json

Usage: ./get-stratification.js <current year>

*/

const _ = require('lodash');
const fs = require('fs');
const os = require('os');
const path = require('path');
const bbPromise = require('bluebird');
const parseString = require('xml2js').parseString;
const {
  extractZip,
  getXMLFiles,
  extractStrata,
  extractAdditionalStrata
} = require('../extract-util');

const tmpDir = os.tmpdir() + '/ecqm';
const tmpPath = tmpDir + '/xmls';
const currentYear = process.argv[2];

const zipPath = path.resolve(
  __dirname,
  '../../../staging',
  currentYear,
  '2026-EligibleClinician-eCQM_v2.zip'
);

if (!currentYear) {
  console.log('Missing required argument <current year>');
  process.exit(1);
}

// gather list of xml files
fs.rmSync(tmpDir, { recursive: true, force: true });
extractZip(zipPath, tmpDir);

// each measure has its own zip, collect name of SimpleXML files
const xmlFiles = getXMLFiles(tmpDir, tmpPath);

// generate additional-stratifications.json
// parse files into JavaScript objects
const promisifiedParseString = bbPromise.promisify(parseString);

bbPromise.all(
  xmlFiles.map(xmlFile => {
    return promisifiedParseString(
      fs.readFileSync(path.join(tmpPath, xmlFile))
    );
  })
).then(docs => {
  // extract data from converted JavaScript objects
  return _.compact(docs.map(doc => {
    const measure = doc.QualityMeasureDocument;
    const measureId =
      measure.subjectOf[0].measureAttribute[0].value[0].$.value;

    const strataMap = extractAdditionalStrata(measure);

    if (_.isEmpty(strataMap)) {
      return;
    }

    const version =
      measure.versionNumber[0].$.value.split('.')[0];

    const eMeasureId = `CMS${measureId}v${version}`;

    return {
      eMeasureId,
      strataMaps: strataMap
    };
  }));
}).then(ecqms => {
  // map of measure id to stratification list
  fs.writeFileSync(
    path.join(
      __dirname,
      '../../../util/measures/' +
      currentYear +
      '/additional-stratifications.json'
    ),
    JSON.stringify(ecqms, null, 2)
  );
});

// generate generated-ecqm-data.json
// parse files into JavaScript objects
const promisifiedStrataParseString =
  bbPromise.promisify(parseString);

bbPromise.all(
  xmlFiles.map(xmlFile => {
    return promisifiedStrataParseString(
      fs.readFileSync(path.join(tmpPath, xmlFile))
    );
  })
).then(docs => {
  // extract data from converted JavaScript objects
  return _.compact(docs.map(doc => {
    const measure = doc.QualityMeasureDocument;

    const emeasureid =
      measure.subjectOf[0].measureAttribute[0].value[0].$.value;

    const strataDescriptions =
      extractStrataDescription(measure, emeasureid);

    const strata =
      extractStrata(measure, strataDescriptions);

    const version =
      measure.versionNumber[0].$.value.split('.')[0];

    const eMeasureId =
      `CMS${emeasureid}v${version}`;

    // special measures with multi strata single performance rate
    // will be exception
    const multiStrataSinglePerformanceRateMeasures = [
      '145',
      '157',
      '347'
    ];

    const isSpecialMeasure =
      multiStrataSinglePerformanceRateMeasures.includes(
        emeasureid
      );

    const mType =
      (
        (
          strata.length > 1 ||
          emeasureid === '159'
        ) &&
        !isSpecialMeasure
      )
        ? 'multiPerformanceRate'
        : 'singlePerformanceRate';

    return {
      eMeasureId,
      eMeasureUuid: measure.id[0].$.root,
      strata: strata,
      metricType: mType
    };
  }));
}).then(ecqms => {
  // sort and write extracted data to disk
  const sortedEcqms =
    _.sortBy(ecqms, ['eMeasureId']);

  fs.writeFileSync(
    path.join(
      __dirname,
      '../../../util/measures/' +
      currentYear +
      '/generated-ecqm-data.json'
    ),
    JSON.stringify(sortedEcqms, null, 2)
  );

  console.warn(
    'remember to update measures repo with the generated data!'
  );
});

/*
return strata description array
*/
function extractStrataDescription(measure, emeasureid) {
  /*
   * Used only while finding labels such as:
   *
   * Numerator 1:
   * Numerator 2:
   *
   * It does not change the fallback description written to JSON.
   */
  function normalizeDescription(value) {
    return String(value || '')
      .replace(/&#xA;|&#10;|&#13;/gi, '\n')
      .replace(/\r\n?/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /*
   * Extract labeled descriptions even when multiple labels are
   * stored on the same line.
   *
   * Examples:
   *
   * Numerator 1: first description Numerator 2: second description
   *
   * Population 1: first description Population 2: second description
   */
  function extractLabeledDescriptions(
    value,
    label,
    removeTrailingInstructions
  ) {
    const normalizedValue =
      normalizeDescription(value);

    const expression = new RegExp(
      '(?:^|\\s)' +
      '(?:-\\s*)?' +
      label +
      '\\s+(\\d+)\\s*:\\s*' +
      '([\\s\\S]*?)' +
      '(?=' +
      '\\s+(?:-\\s*)?' +
      label +
      '\\s+\\d+\\s*:|' +
      '$)',
      'gi'
    );

    return Array.from(
      normalizedValue.matchAll(expression)
    )
      .sort((first, second) => {
        return Number(first[1]) - Number(second[1]);
      })
      .map(match => {
        let parsedDescription =
          match[2].trim();

        /*
         * MSRAGG may contain instructions after the final
         * population description.
         */
        if (removeTrailingInstructions) {
          parsedDescription =
            parsedDescription.replace(
              /\s+For the purposes of this measure,[\s\S]*$/i,
              ''
            );
        }

        return parsedDescription.trim();
      })
      .filter(Boolean);
  }

  /*
   * CMS156 descriptions use:
   *
   * 1. First rate
   * 2. Second rate
   * 3. Total rate
   */
  function extractNumberedDescriptions(value) {
    const normalizedValue =
      normalizeDescription(value);

    const expression =
      /(?:^|\s)(\d+)\.\s+([\s\S]*?)(?=\s+\d+\.\s+|$)/g;

    return Array.from(
      normalizedValue.matchAll(expression)
    )
      .sort((first, second) => {
        return Number(first[1]) - Number(second[1]);
      })
      .map(match => match[2].trim())
      .filter(Boolean);
  }

  let description;
  let strataDescriptions;
  let descriptionIdentifier = 'Numerator';

  /*
   * These measures store their population descriptions in
   * MSRAGG rather than NUMER.
   */
  const customMeasures = {
    '145': {
      subjectCode: 'MSRAGG',
      descriptionIdentifier: 'Population'
    },
    '157': {
      subjectCode: 'MSRAGG',
      descriptionIdentifier: 'Population'
    },
    '347': {
      subjectCode: 'MSRAGG',
      descriptionIdentifier: 'Population'
    }
  };

  // get description
  if (customMeasures[emeasureid]) {
    description = measure.subjectOf
      .find(item => {
        return (
          item.measureAttribute[0].code[0].$.code ===
          customMeasures[emeasureid].subjectCode
        );
      })
      .measureAttribute[0]
      .value[0]
      .$.
      value;

    descriptionIdentifier =
      customMeasures[emeasureid].descriptionIdentifier;
  } else {
    description = measure.subjectOf
      .find(item => {
        return (
          item.measureAttribute[0].code[0].$.code ===
          'NUMER'
        );
      })
      .measureAttribute[0]
      .value[0]
      .$.
      value;
  }

  // get descriptions for multi strata measures
  switch (emeasureid) {
    case '138':
      /*
       * CMS138 uses Population 1, Population 2 and Population 3
       * inside its NUMER description.
       */
      strataDescriptions =
        extractLabeledDescriptions(
          description,
          'Population',
          false
        );

      break;

    case '156':
      /*
       * CMS156 uses numbered descriptions in measure.text.
       */
      description =
        measure.text[0].$.value;

      strataDescriptions =
        extractNumberedDescriptions(description);

      break;

    default:
      /*
       * This handles:
       *
       * CMS128, CMS136, CMS137 and CMS155 using Numerator labels.
       *
       * CMS145, CMS157 and CMS347 using Population labels from
       * MSRAGG.
       */
      strataDescriptions =
        extractLabeledDescriptions(
          description,
          descriptionIdentifier,
          Boolean(customMeasures[emeasureid])
        );
  }

  /*
   * Preserve the original 2024/2025 behavior for normal
   * single-population measures.
   *
   * trim() removes only whitespace at the beginning and end.
   * It does not flatten internal line breaks.
   */
  if (strataDescriptions.length === 0) {
    strataDescriptions = [
      description.trim()
    ];
  }

  return strataDescriptions;
}
