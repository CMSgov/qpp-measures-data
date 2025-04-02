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
const rimraf = require('rimraf');
const path = require('path');
const bbPromise = require('bluebird');
const parseString = require('xml2js').parseString;
const { extractZip, getXMLFiles, extractStrata, extractAdditionalStrata } = require('../extract-util');
const tmpDir = os.tmpdir() + '/ecqm';
const tmpPath = tmpDir + '/xmls';
const currentYear = process.argv[2];
const zipPath = '../../../staging/' + currentYear + '/2025-EC-eCQM-v2.zip';

if (!currentYear) {
  console.log('Missing required argument <current year>');
  process.exit(1);
}

// gather list of xml files
rimraf.sync(tmpDir);
extractZip(zipPath, tmpDir);
// each measure has its own zip, collect name of SimpleXML files
const xmlFiles = getXMLFiles(tmpDir, tmpPath);

// generate additional-stratifications.json
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


// generate generated-ecqm-data.json
// parse files into JavaScript objects
const promisifiedStrataParseString = bbPromise.promisify(parseString);
bbPromise.all(
  xmlFiles.map(xmlFile => {
    return promisifiedStrataParseString(fs.readFileSync(path.join(tmpPath, xmlFile)));
  })
).then(docs => {
  // extract data from converted JavaScript objects
  return _.compact(docs.map(doc => {
    const measure = doc.QualityMeasureDocument;
    const emeasureid = measure.subjectOf[0].measureAttribute[0].value[0].$.value;
    const strataDescriptions = extractStrataDescription(measure, emeasureid);
    const strata = extractStrata(measure, strataDescriptions);
    const version = measure.versionNumber[0].$.value.split('.')[0];
    const eMeasureId = `CMS${emeasureid}v${version}`;
    // special measures with multi strata single performance rate will be exception
    const multiStrataSinglePerformanceRateMeasures = ['145', '157', '347'];
    const isSpecialMeasure = multiStrataSinglePerformanceRateMeasures.includes(emeasureid);
    const mType = ((strata.length > 1 || emeasureid === '159') && !isSpecialMeasure) ? 'multiPerformanceRate' : 'singlePerformanceRate';
    return {
      eMeasureId,
      eMeasureUuid: measure.id[0].$.root,
      strata: strata,
      metricType: mType
    };
  }));
}).then(ecqms => {
  // sort and write extracted data to disk
  const sortedEcqms = _.sortBy(ecqms, ['eMeasureId']);
  fs.writeFileSync(path.join(__dirname, '../../../util/measures/' + currentYear + '/generated-ecqm-data.json'), JSON.stringify(sortedEcqms, null, 2));
  console.warn('remember to update measures repo with the generated data!');
});

/*
return strata description array
*/
function extractStrataDescription(measure, emeasureid) {
  // parse out strata descriptions from numerator text or aggregated rate or text value
  // descriptions are like "Numerator 1: Patients who initiated treatment within 14 days of the diagnosis\nNumerator 2: Patients who initiated treatment and who had two or more additional services with an AOD diagnosis within 30 days of the initiation visit"
  let description, strataDescriptions;
  let descriptionIdentifier = 'Numerator';
  const customMeasures = {
    '145': { 'subjectCode': 'MSRAGG', 'descriptionIdentifier': '- Population' },
    '157': { 'subjectCode': 'MSRAGG', 'descriptionIdentifier': '- Population' }
  };

  // get description
  if (customMeasures[emeasureid]) {
    description = measure.subjectOf
      .find(item => item.measureAttribute[0].code[0].$.code === customMeasures[emeasureid]['subjectCode'])
      .measureAttribute[0].value[0].$.value;
    descriptionIdentifier = customMeasures[emeasureid]['descriptionIdentifier'];
  } else {
    description = measure.subjectOf
      .find(item => item.measureAttribute[0].code[0].$.code === 'NUMER')
      .measureAttribute[0].value[0].$.value;
  }

  // get descriptions for multi strata measures
  switch (emeasureid) {
    case '138':
      strataDescriptions = _.compact(description.replaceAll(/(\n{0,1}Population \d:\s{0,3}\n)/g, '')
        .split(/\n|\r|&#xA;/))
        .map(string => string.trim());
      break;
    case '156':
      description = measure.text[0].$.value;
      strataDescriptions = _.compact(description.split(/\n|\r|&#xA;/));
      strataDescriptions = strataDescriptions
        .filter(string => string.match(/^(\d. )/))
        .map(string => string.substr(`x. `.length).trim());
      break;
    case '347':
      description = measure.text[0].$.value;
      strataDescriptions = description.replaceAll('; OR', '').split(/\n/);
      strataDescriptions = strataDescriptions
        // eslint-disable-next-line no-useless-escape
        .filter(string => string.match(/^\-/))
        .map(string => string.substr('-'.length).trim());
      break;
    default:
      strataDescriptions = _.compact(description.split(/\n|\r|&#xA;/));
      // eslint-disable-next-line no-case-declarations
      const idRegEx = new RegExp('^(' + descriptionIdentifier + ' \\d: )');
      strataDescriptions = strataDescriptions
        .filter(string => string.match(idRegEx))
        .map(string => string.substr(`${descriptionIdentifier} x: `.length).trim());
  }

  // description stores single stratum otherwise
  if (strataDescriptions.length === 0) {
    strataDescriptions = [description.trim()];
  }

  return strataDescriptions;
}
