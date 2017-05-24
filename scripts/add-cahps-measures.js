// Libraries
const fs    = require('fs');
const parse = require('csv-parse');
const path  = require('path');

const additionalMeasuresFilepath = '../util/additional-measures.json';
var additionalMeasures = require(additionalMeasuresFilepath);

// Constants
const CAHPS_CSV_COLUMNS = [
  'Measure Name'
];

// Some measures have an NqfId (NQF: National Quality Forum) of '0005'
const defaultNqfId = '0005';
const nqfIdMap = {
  'CAHPS for MIPS SSM: Getting Timely Care, Appointments and Information': defaultNqfId,
  'CAHPS for MIPS SSM: How Well Providers Communicate': defaultNqfId,
  'CAHPS for MIPS SSM: Patient\'s Rating of Provider': defaultNqfId,
  'CAHPS for MIPS SSM: Courteous and Helpful Office Staff': defaultNqfId
};

// Data
var cahpsMeasuresData = '';

/**
 *
 * Script to add cahps measures to additional-measures.json from csv
 * To run: `cat [DATA_CSV_FILE] | node scripts/add-cahps-measures.js`
 * e.g. `cat cahps_measures_origin.csv | node scripts/add-cahps-measures.js`
 */

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    cahpsMeasuresData += chunk;
  }
});

function generateCahpsMeasure(record, idx) {
  var measureTitle = record['Measure Name'];
  return {
    category: 'quality',
    firstPerformanceYear: 2017,
    lastPerformanceYear: null,
    metricType: 'float',
    title: measureTitle,
    description: '', // TBD: Will be provided by RAND,
    nationalQualityCode: null,
    measureType: 'patientEngagementExperience',
    measureId: 'CAHPS_' + (idx + 1),
    eMeasureId: null,
    nqfEMeasureId: null,
    nqfId: nqfIdMap[measureTitle] || null,
    isInverse: false,
    strata: [],
    isHighPriority: true,
    primarySteward: 'Agency for Healthcare Research & Quality',
    submissionMethods: [
      'certifiedSurveyVendor'
    ],
    measureSets: [
      'generalPracticeFamilyMedicine'
    ]
  };
};

process.stdin.on('end', function() {
  parse(cahpsMeasuresData, {columns: CAHPS_CSV_COLUMNS, from: 2}, function(err, records) {
    if (err) {
      console.log(err);
    } else {
      // We want to overwrite CAHPS measures every time we run this script.
      additionalMeasures = additionalMeasures.filter(function(measure) {
        var re = /CAHPS_\d+/i;
        return measure.measureId.match(re) === null;
      });

      records.forEach(function(record, idx) {
        var measure = generateCahpsMeasure(record, idx);
        if (measure) additionalMeasures.push(measure);
      });

      fs.writeFileSync(path.join(__dirname, additionalMeasuresFilepath), JSON.stringify(additionalMeasures, null, 2), 'utf8');
    }
  });
});
