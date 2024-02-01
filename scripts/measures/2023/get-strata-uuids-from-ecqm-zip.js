#!/usr/bin/env node

const _ = require('lodash');
const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');
const Promise = require('bluebird');
const AdmZip = require('adm-zip');
const parseString = require('xml2js').parseString;
const tmpDir = '/tmp/ecqm';
const tmpPath = '/tmp/ecqm/xmls';
const currentYear = '2023';
const zipPath = '../../../staging/' + currentYear + '/EC-eCQM-2022-05-v3.zip';
if (!zipPath) {
  console.log('Missing required argument <path to zip>');
  process.exit(1);
}

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
  if (Object.keys(customMeasures).includes(emeasureid) && customMeasures[emeasureid]['subjectCode']) {
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
      strataDescriptions = _.compact(description.replaceAll(/(\n{0,1}Population \d:\s{0,3}\n)/g, '').split(/\n|\r|&#xA;/));
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
        .filter(string => string.match(/^\*/))
        .map(string => string.substr('*'.length).trim());
      break;
    default:
      strataDescriptions = _.compact(description.split(/\n|\r|&#xA;/));
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
function extractStrata(measure, emeasureid) {
  const strataDescriptions = extractStrataDescription(measure, emeasureid);

  const strata = strataDescriptions.map(description => ({description}));
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

    const numeratorExclusion = ids.find(item => item.numeratorExclusionCriteria);
    if (numeratorExclusion) {
      eMeasureUuids.numeratorExclusionUuid = numeratorExclusion.numeratorExclusionCriteria[0].id[0].$.root;
    }

    strata[index].eMeasureUuids = eMeasureUuids;
  });

  return strata;
}

// gather list of xml files
rimraf.sync(tmpDir);
new AdmZip(zipPath).extractAllTo(tmpDir, true);
// each measure has its own zip, collect name of SimpleXML files
const xmlFiles = fs.readdirSync(tmpDir)
  .map(measureZip => {
    const folder = (measureZip.toString().split('.')[0].replace('-v2', ''));
    const zip = new AdmZip(path.join(tmpDir, measureZip));
    const { entryName: filename } = zip.getEntries()
      .find(({entryName}) => {
        const filename = entryName.toString();
        return filename.includes('.xml') && filename.includes(folder);
      });

    // extract 'CMS75v5.xml' to /xmls
    zip.extractEntryTo(filename, tmpPath, false, true);
    return filename;
  });

// parse files into JavaScript objects
const promisifiedParseString = Promise.promisify(parseString);
Promise.all(
  xmlFiles.map(xmlFile => {
    return promisifiedParseString(fs.readFileSync(path.join(tmpPath, xmlFile)));
  })
)
// extract data from converted JavaScript objects
  .then(docs => {
    return _.compact(docs.map(doc => {
      const measure = doc.QualityMeasureDocument;
      const emeasureid = measure.subjectOf[0].measureAttribute[0].value[0].$.value;
      const strata = extractStrata(measure, emeasureid);
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
  })
// sort and write extracted data to disk
  .then(ecqms => {
    const sortedEcqms = _.sortBy(ecqms, ['eMeasureId']);
    fs.writeFileSync(path.join(__dirname, '../../../util/measures/' + currentYear + '/generated-ecqm-data.json'), JSON.stringify(sortedEcqms, null, 2));
    console.warn('remember to update measures repo with the generated data!');
  });
