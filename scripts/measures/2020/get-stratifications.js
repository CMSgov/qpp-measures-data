#!/usr/bin/env node

/*
Extracts ecqm eMeasureIds and retrieves any measure stratifications
Running this will generate a file at util/measures/additional-stratifications.json

Usage: ./get-stratification.js <path to zip of ecqm>

most likely:
Ran while in the /scripts/measures/2020/ directory
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
const rimraf = require('rimraf');
const path = require('path');
const Promise = require('bluebird');
const AdmZip = require('adm-zip');
const parseString = require('xml2js').parseString;
const tmpDir = '/tmp/ecqm';
const zipPath = process.argv[2];

if (!zipPath) {
  console.log('Missing required argument <path to zip>');
  process.exit(1);
}

function extractStrata(measure) {
  const strataMaps = [];
  const supplementDataType = 'SDE';
  measure.component.forEach((component, index) => {
    if (!component.populationCriteriaSection) {
      return;
    }

    const components = component.populationCriteriaSection[0].component;
    const numeratorUuid = components.find(item => item.numeratorCriteria).numeratorCriteria[0].id[0].$.root;
    const stratList = [];
    // Loops through a Stratifier Criteria's components. If it's not a supplemental data component,
    // add the stratum.
    components.filter(item => item.stratifierCriteria).forEach((component, index) => {
      const supplementalDataComponent = component.stratifierCriteria[0].component;
      if (_.isUndefined(supplementalDataComponent) ||
        supplementalDataComponent[0].measureAttribute[0].code[0].$.code !== supplementDataType) {
        stratList.push(component.stratifierCriteria[0].id[0].$.root);
      }
    });
    if (stratList.length !== 0) {
      const numeratorMap = {};
      numeratorMap['numeratorUuid'] = numeratorUuid;
      numeratorMap['strata'] = stratList;
      strataMaps.push(numeratorMap);
    }
  });

  return strataMaps;
}

// gather list of xml files
rimraf.sync(tmpDir);
new AdmZip(zipPath).extractAllTo(tmpDir, true);
// each measure has its own zip, collect name of SimpleXML files
const xmlFiles = fs.readdirSync(tmpDir).map(measureZip => {
  const zip = new AdmZip(path.join(tmpDir, measureZip));
  const MEASURE_XML_REGEX = (/([A-Z]{3})([0-9]{1,3})v([0-9])\.xml$/);

  const filename = zip.getEntries()
    .find(entry => MEASURE_XML_REGEX.test(entry.entryName))
    .entryName;

  // extract 'CMS75v5.xml' to /xmls
  zip.extractEntryTo(filename, tmpDir + '/xmls', false, true);

  return filename.split('/')[1];
});

// parse files into JavaScript objects
const promisifiedParseString = Promise.promisify(parseString);
Promise.all(
  xmlFiles.map(xmlFile => {
    return promisifiedParseString(fs.readFileSync(path.join(tmpDir, '/xmls', xmlFile)));
  })
)
// extract data from converted JavaScript objects
  .then(docs => {
    return _.compact(docs.map(doc => {
      const measure = doc.QualityMeasureDocument;
      const measureId = measure.subjectOf[0].measureAttribute[0].value[0].$.value;
      const strataMap = extractStrata(measure);
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
  })
// map of measure id to stratification list
  .then(ecqms => {
    fs.writeFileSync(path.join(__dirname,
      '../../../util/measures/2020/additional-stratifications.json'), JSON.stringify(ecqms, null, 2));
  });
