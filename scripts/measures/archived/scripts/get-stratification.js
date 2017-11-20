#!/usr/bin/env node

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
  const retVal = {};
  measure.component.forEach((component, index) => {
    if (!component.populationCriteriaSection) {
      return;
    }

    const components = component.populationCriteriaSection[0].component;
    const numeratorUuid = components.find(item => item.numeratorCriteria).numeratorCriteria[0].id[0].$.root;
    const stratList = [];
    components.filter(item => item.stratifierCriteria).forEach((component, index) => {
      const supplementalDataComponent = component.stratifierCriteria[0].component;
      if (supplementalDataComponent === undefined ||
        supplementalDataComponent[0].measureAttribute[0].code[0].$.code !== 'SDE') {
        stratList.push(component.stratifierCriteria[0].id[0].$.root);
      }
    });
    if (stratList.length !== 0) {
      retVal[numeratorUuid] = stratList;
    }
  });

  return retVal;
}

// gather list of xml files
rimraf.sync(tmpDir);
new AdmZip(zipPath).extractAllTo(tmpDir, true);
// each measure has its own zip, collect name of SimpleXML files
const xmlFiles = fs.readdirSync(tmpDir).map(measureZip => {
  const zip = new AdmZip(path.join(tmpDir, measureZip));

  const filename = zip.getEntries()
    .find(entry => entry.entryName.match(/[0-9]\.xml$/))
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
      const emeasureid = measure.subjectOf[0].measureAttribute[0].value[0].$.value;
      const strata = extractStrata(measure);
      if (_.isEmpty(strata)) {
        return;
      }
      const version = measure.versionNumber[0].$.value.split('.')[0];
      const eMeasureId = `CMS${emeasureid}v${version}`;
      return {
        eMeasureId,
        strata
      };
    }));
  })
// map of measure id to stratification list
  .then(ecqms => {
    const stratifications = {};
    ecqms.forEach(ecqm => { stratifications[ecqm.eMeasureId] = ecqm.strata; });

    fs.writeFileSync(path.join(__dirname, '../../../../util/measures/additional-stratifications.json'), JSON.stringify(stratifications, null, 2));
  });
