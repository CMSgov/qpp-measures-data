// usage ./scripts/get-strata-and-uuids-from-ecqm-zip.js <path to zip of ecqm>
// running this will generate a file at util/ecqm-strata.json
// with an object like this for each ecqm:
/*
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
  const details = measure.measure.measureDetails[0];
  // our version of 'strata' are described as 'numerators'
  // parse out strata descriptions from numerator text
  const description = details.numeratorDescription[0];
  // descriptions are like "Numerator 1: Patients who initiated treatment within 14 days of the diagnosis\nNumerator 2: Patients who initiated treatment and who had two or more additional services with an AOD diagnosis within 30 days of the initiation visit"
  let strataDescriptions = _.compact(description.split('\n'))
    // if multiple strata, they're enumerated as 'Numerator x: '
    .filter(string => string.match(/^(Numerator \d: )/))
    // all the text after 'Numerator 1:'
    .map(string => string.substr('Numerator x: '.length).trim());
  if (strataDescriptions.length === 0) {
    // description stores single stratum otherwise
    strataDescriptions = [description.trim()];
  }

  const strata = strataDescriptions.map((description, index) => ({
    // we'll replace these manually to be contextually relevant
    name: `strata${index + 1}`,
    description
  }));

  // pull out uuids for each stratum
  // ASSUMPTION: numerators are ordered the same as measure groupings
  // if not we need to key on something
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
Promise.all(
  xmlFiles.map(xmlFile => {
    return promisifiedParseString(fs.readFileSync(path.join(tmpDir, '/xmls', xmlFile)))
      .then(xml => xml);
  })
)
// extract data from converted JavaScript objects
.then(measures => {
  return _.compact(measures.map(measure => {
    const details = measure.measure.measureDetails[0];
    const emeasureid = details.emeasureid[0];
    if (emeasureid === '145') {
      console.log('WARNING: CMS145v5 has one numerator but two initial populations and needs to be added manually - see /tmp/ecqm/EC_CMS145v5_NQFXXXX_CAD_BB.zip');
      return;
    }
    if (emeasureid === '160') {
      console.log('WARNING: CMS160v5 has one numerator but two initial populations and needs to be added manually - see /tmp/EC_CMS160v5_NQF0712_Dep_PHQ9.zip');
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
})
// sort and write extracted data to disk
.then(ecqms => {
  const sortedEcqms = _.sortBy(ecqms, ['eMeasureId']);
  fs.writeFileSync(path.join(__dirname, '../util/ecqm-strata.json'), JSON.stringify(sortedEcqms, null, 2));
});

