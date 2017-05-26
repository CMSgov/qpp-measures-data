// running this will generate a file in measures/quality-performace-rates.json
// with the descriptions for each performance rate
// claims pdfs can be downloaded from https://qpp.cms.gov/docs/QPP_quality_measure_specifications.zip
// usage ./scripts/get-strata-and-uuids-from-ecqm-zip.js <path to zip of ecqm>

const _ = require('lodash');
const fs = require('fs');
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

// gather list of xml files
new AdmZip(zipPath).extractAllTo(tmpDir, true);
// each measure has its own zip, collect name of SimpleXML files
const xmlFiles = fs.readdirSync(tmpDir).map(measureZip => {
  const zip = new AdmZip(path.join(tmpDir, measureZip));

  const filename = zip.getEntries()
    .find(entry => entry.entryName.match(/[^0-9]\.xml$/))
    .entryName;

  // extract 'CMS75v5.xml' to /xmls
  zip.extractEntryTo(filename, tmpDir + '/xmls', false, true);

  return filename.split('/')[1];
});

// parse files into JavaScript objects
const promisifiedParseString = Promise.promisify(parseString);
const promises = Promise.all(
  xmlFiles.map(xmlFile => {
    return promisifiedParseString(fs.readFileSync(path.join(tmpDir, '/xmls', xmlFile)))
      .then(xml => xml);
  })
);

function extractStrata(measure) {
  // parse out strata descriptions from numerator text
  const details = measure.measure.measureDetails[0];
  const description = details.numeratorDescription[0];
  // descriptions are like "Numerator 1: Patients who initiated treatment within 14 days of the diagnosis\nNumerator 2: Patients who initiated treatment and who had two or more additional services with an AOD diagnosis within 30 days of the initiation visit"
  let strataDescriptions = _.compact(description.split('\n'))
    .filter(string => string.match(/^(Numerator \d: )/))
    .map(string => string.substr('Numerator x: '.length).trim());
  if (strataDescriptions.length === 0) {
    // single stratum
    strataDescriptions = [description.trim()];
  }

  const strata = strataDescriptions.map((description, index) => ({
    name: `strata${index + 1}`,
    description
  }));

  measure.measure.measureGrouping[0].group.forEach((group, index) => {
    strata[index].eMeasureUuids = {
      initialPopulationUuid: group.clause[0].$.uuid,
      denominatorUuid: group.clause[1].$.uuid,
      numeratorUuid: group.clause[2].$.uuid,
      denominatorExclusionUuid: group.clause[3].$.uuid,
      denominatorExceptionUuid: group.clause[5].$.uuid
    }
  });

  return strata;
}

// extract fields
promises.then(measures => {
  return _.compact(measures.map(measure => {
    const details = measure.measure.measureDetails[0];
    const emeasureid = details.emeasureid[0];
    if (emeasureid === '145') {
      console.log('WARNING: CMS145v5 has one numerator but two initial populations and needs to be added manually - see /tmp/ecqm/xmls/CMS145v5.zip');
      return;
    }
    if (emeasureid === '160') {
      console.log('WARNING: CMS160v5 has one numerator but two initial populations and needs to be added manually - see /tmp/ecqm/xmls/CMS160v5.zip');
      return;
    }
    const strata = extractStrata(measure);
    const version = details.version[0].split('.')[0];
    const eMeasureId = `CMS${emeasureid}v${version}`;
    return  {
      eMeasureId,
      eMeasureUuid: details.uuid[0],
      // overallAlgorithm: '', // these need to be added manually
      strata: strata,
      metricType: strata.length > 1 ? 'multiPerformanceRate' : 'singlePerformanceRate'
    };
  }));
}).then(ecqms => {
  const sortedEcqms = _.sortBy(ecqms, ['eMeasureId']);
  fs.writeFileSync(path.join(__dirname, '../util/ecqm-strata.json'), JSON.stringify(sortedEcqms, null, 2));
});

