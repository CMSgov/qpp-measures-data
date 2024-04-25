#!/usr/bin/env node

/*
Extracts ecqm eMeasureIds and retrieves any measure stratifications
Running this will generate a file at util/measures/additional-stratifications.json

Usage: ./get-stratification.js <path to zip of ecqm>

most likely:
Ran while in the /scripts/measures/2021/ directory
./get-stratification.js ecqm_eligibleclinician_jan.zip

each generated ecqm stratification entry will look similar to this:

  {
    "eMeasureId": "CMS137v7",
    "strataMaps": [
      {
        "numeratorUuid": "0BBF8596-4CFE-47F4-A0D7-9BEAB94BA4CD",
        "strata": [
          "EFB5B088-CE10-43DE-ACCD-9913B7AC12A2",
          "94B9555F-8700-45EF-B69F-433EBEDE8051"
        ]
      },
      {
        "numeratorUuid": "7FFA49C4-D708-491E-85FE-6855F0A725DF",
        "strata": [
          "ABC5631A-81C0-45C9-9306-716EAE39CDDB",
          "2654804B-E6DA-4401-AA8B-1FEEACC0C259"
        ]
      }
    ]
  }
*/

const _ = require('lodash');
const fs = require('fs');
const os = require('os');
const rimraf = require('rimraf');
const path = require('path');
const bbPromise = require('bluebird');
const parseString = require('xml2js').parseString;
const { extractZip, getXMLFiles, extractAdditionalStrata } = require('../extract-util');
const tmpDir = os.tmpdir() + '/ecqm';
const tmpPath = tmpDir + '/xmls';
const currentYear = process.argv[2];
const zipPath = '../../../staging/' + currentYear + '/EC-eCQM-2023-11-v2.zip';

if (!currentYear) {
  console.log('Missing required argument <current year>');
  process.exit(1);
}

// gather list of xml files
rimraf.sync(tmpDir);
extractZip(zipPath, tmpDir);
// each measure has its own zip, collect name of SimpleXML files
const xmlFiles = getXMLFiles(tmpDir, tmpPath);

// parse files into JavaScript objects
const promisifiedParseString = bbPromise.promisify(parseString);
bbPromise.all(
  xmlFiles.map(xmlFile => {
    return promisifiedParseString(fs.readFileSync(path.join(tmpPath, xmlFile)));
  })
).then(docs => {
  // extract data from converted JavaScript objects
  return _.compact(docs.map(doc => {
    const measure = doc.QualityMeasureDocument;
    const measureId = measure.subjectOf[0].measureAttribute[0].value[0].$.value;
    const strataMap = extractAdditionalStrata(measure);
    if (_.isEmpty(strataMap)) {
      return;
    }
    const version = measure.versionNumber[0].$.value.split('.')[0];
    const eMeasureId = `CMS${measureId}v${version}`;
    return {
      eMeasureId,
      strataMaps: strataMap
    };
  }));
}).then(ecqms => {
  // map of measure id to stratification list
  fs.writeFileSync(path.join(__dirname,
    '../../../util/measures/' + currentYear + '/additional-stratifications.json'), JSON.stringify(ecqms, null, 2));
});
