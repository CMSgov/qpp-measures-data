#!/usr/bin/env node

/*
Extracts ecqm eMeasureIds and strata names, descriptions, and uuids from a zip file.
Running this will generate a file at util/measures/generated-ecqm-data.json

Usage: ./get-strata-and-uuids-from-ecqm-zip.js <path to zip of ecqm>

most likely:
./get-strata-and-uuids-from-ecqm-zip.js ecqm_eligibleclinician_jan2017.zip

each generated ecqm entry will look like this:

  {
    "eMeasureId": "CMS117v5",
    "eMeasureUuid": "40280381-52fc-3a32-0153-1a4ba57f0b8a",
    "strata": [
      {
        "name": "strata1",
        "description": "Children who have evidence showing they received recommended vaccines, had documented history of the illness, had a seropositive test result, or had an allergic reaction to the vaccine by their second birthday",
        "eMeasureUuids": {
          "initialPopulationUuid": "DA379EC2-EE2E-4548-AEF0-DD4F14F80279",
          "denominatorUuid": "CC8AFFF0-A436-42CD-8322-5EBCEF9CBF06",
          "numeratorUuid": "AE7A33AF-0DA7-4772-A23C-2D2CA732D53A",
          "denominatorExclusionUuid": "19d26b5e-9be2-4313-80f4-67be1e0dde37",
          "denominatorExceptionUuid": "01a1c883-e2e6-4aec-81de-17f3cd9b63b3"
        }
      }
    ],
    "metricType": "singlePerformanceRate"
  },
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

/*
return strata name, description, and uuids like so
[
  {
    name: 'strata1',
    description: 'Patients who initiated treatment within 14 days of the diagnosis',
    eMeasureUuids: {
      initialPopulationUuid: '25286925-4221-4396-9DE0-60EA606924DF',
      denominatorUuid: 'CFB8E3E2-FF4F-4D25-B613-7EC142BAE8A9',
      numeratorUuid: 'A399FA9C-48CF-41E5-812A-3445188B8301',
      denominatorExclusionUuid: 'EEAD441F-B3B2-4DC9-A890-B35E14B38EA7',
      denominatorExceptionUuid: 'E76F6606-1DC9-40DE-8A34-5B4B4E859152'
    }
  }
  ...
*/
function extractStrata(measure) {
  // our version of 'strata' are described as 'numerators'
  // parse out strata descriptions from numerator text
  // descriptions are like "Numerator 1: Patients who initiated treatment within 14 days of the diagnosis\nNumerator 2: Patients who initiated treatment and who had two or more additional services with an AOD diagnosis within 30 days of the initiation visit"
  const description = measure.subjectOf
    .find(item => item.measureAttribute[0].code[0].$.code === 'NUMER')
    .measureAttribute[0].value[0].$.value;

  let strataDescriptions = _.compact(description.split(/\n|\r|&#xA;/))
    // if multiple strata, they're enumerated as 'Numerator x: '
    .filter(string => string.match(/^(Numerator \d: )/))
    // all the text after 'Numerator 1:'
    .map(string => string.substr('Numerator x: '.length).trim());
  if (strataDescriptions.length === 0) {
    // description stores single stratum otherwise
    strataDescriptions = [description.trim()];
  }

  const strata = strataDescriptions.map(description => ({ description }));

  // pull out uuids for each stratum
  const components = measure.component.slice(1);
  components.forEach((component, index) => {
    const ids = component.populationCriteriaSection[0].component;
    const eMeasureUuids = {
      initialPopulationUuid: ids.find(item => item.initialPopulationCriteria).initialPopulationCriteria[0].id[0].$.root,
      denominatorUuid: ids.find(item => item.denominatorCriteria).denominatorCriteria[0].id[0].$.root,
      numeratorUuid: ids.find(item => item.numeratorCriteria).numeratorCriteria[0].id[0].$.root
    };

    const denominatorException = ids.find(item => item.denominatorExceptionCriteria);
    if (denominatorException) {
      eMeasureUuids.denominatorExceptionUuid = denominatorException.denominatorExceptionCriteria[0].id[0].$.root;
    }

    const denominatorExclusion = ids.find(item => item.denominatorExclusionCriteria);
    if (denominatorExclusion) {
      eMeasureUuids.denominatorExclusionUuid = denominatorExclusion.denominatorExclusionCriteria[0].id[0].$.root;
    }

    strata[index].eMeasureUuids = eMeasureUuids;
  });

  return strata;
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
        eMeasureId,
        eMeasureUuid: measure.id[0].$.root,
        strata: strata,
        metricType: strata.length > 1 ? 'multiPerformanceRate' : 'singlePerformanceRate'
      };
    }));
  })
// sort and write extracted data to disk
  .then(ecqms => {
    const sortedEcqms = _.sortBy(ecqms, ['eMeasureId']);
    fs.writeFileSync(path.join(__dirname, '../../util/measures/generated-ecqm-data.json'), JSON.stringify(sortedEcqms, null, 2));
    console.warn('remember to add the strata names manually!');
  });
