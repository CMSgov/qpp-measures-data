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
//  const description = measure.subjectOf
//    .find(item => item.measureAttribute[0].code[0].$.code === 'NUMER')
//    .measureAttribute[0].value[0].$.value;
//
//  let strataDescriptions = _.compact(description.split(/\n|\r|&#xA;/))
//    // if multiple strata, they're enumerated as 'Numerator x: '
//    .filter(string => string.match(/^(Numerator \d: )/))
//    // all the text after 'Numerator 1:'
//    .map(string => string.substr('Numerator x: '.length).trim());
//  if (strataDescriptions.length === 0) {
//    // description stores single stratum otherwise
//    strataDescriptions = [description.trim()];
//  }
//
//  const strata = strataDescriptions.map(description => ({ description }));
//
//  // pull out uuids for each stratum
//  const components = measure.component.slice(1);
//  components.forEach((component, index) => {
//    const ids = component.populationCriteriaSection[0].component;
//    const eMeasureUuids = {
//      initialPopulationUuid: ids.find(item => item.initialPopulationCriteria).initialPopulationCriteria[0].id[0].$.root,
//      denominatorUuid: ids.find(item => item.denominatorCriteria).denominatorCriteria[0].id[0].$.root,
//      numeratorUuid: ids.find(item => item.numeratorCriteria).numeratorCriteria[0].id[0].$.root
//    };
//
//    const denominatorException = ids.find(item => item.denominatorExceptionCriteria);
//    if (denominatorException) {
//      eMeasureUuids.denominatorExceptionUuid = denominatorException.denominatorExceptionCriteria[0].id[0].$.root;
//    }
//
//    const denominatorExclusion = ids.find(item => item.denominatorExclusionCriteria);
//    if (denominatorExclusion) {
//      eMeasureUuids.denominatorExclusionUuid = denominatorExclusion.denominatorExclusionCriteria[0].id[0].$.root;
//    }
//
//    strata[index].eMeasureUuids = eMeasureUuids;
//  });
//
//  return strata;
//  eMeasureId.component.populationCriteriaSection[*].component[*].stratifierCriteria.id.$.root
//  $.eMeasureId.component[*].populationCriteriaSection[*].component[*].stratifierCriteria[*].id[*].*.root
//  $.eMeasureId.component[*].populationCriteriaSection[*].component[*]
    var retVal = {}
    measure.component.forEach((component, index) => {
        if (!component.populationCriteriaSection) {
          return;
        }
//    const numerators = components.component.find(item => item.numeratorCriteria);
//    const ids = numerators.numeratorCriteria.find(item => item.id);
//    const numeratorUuids = ids.id.find(item => item.$.root);

    const components = component.populationCriteriaSection[0].component;
    const numeratorUuid = components.find(item => item.numeratorCriteria).numeratorCriteria[0].id[0].$.root;
    var stratList = [];
    stratificationUuids = components.filter(item => item.stratifierCriteria).forEach((component, index) => {
        stratList.push(component.stratifierCriteria[0].id[0].$.root);
    });

    retVal[numeratorUuid] = stratList;
    })

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
      if (emeasureid === '145') {
        console.warn('WARNING: CMS145v5 has one numerator but two initial populations and needs to be added manually - see /tmp/ecqm/EC_CMS145v5_NQFXXXX_CAD_BB.zip');
        return;
      }
      if (emeasureid === '160') {
        console.warn('WARNING: CMS160v5 has one numerator but two initial populations and needs to be added manually - see /tmp/ecqm/EC_CMS160v5_NQF0712_Dep_PHQ9.zip');
        return;
      }

      const strata = extractStrata(measure);
      const version = measure.versionNumber[0].$.value.split('.')[0];
      const eMeasureId = `CMS${emeasureid}v${version}`;
      return {
        eMeasureId: strata
      };
    }));
  })
// sort and write extracted data to disk
  .then(ecqms => {
    const sortedEcqms = _.sortBy(ecqms, ['eMeasureId']);
    fs.writeFileSync(path.join(__dirname, '../../../../util/measures/additional-stratifications.json'), JSON.stringify(sortedEcqms, null, 2));
    console.warn('remember to add the strata names manually!');
  });
