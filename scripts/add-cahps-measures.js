// Libraries
var fs    = require('fs');
var parse = require('csv-parse');
var path  = require('path');

var additionalMeasuresFilepath = '../util/additional-measures.json'
var additionalMeasures = require(additionalMeasuresFilepath);

// We want to overwrite CAHPS measures every time we run this script.
additionalMeasures = additionalMeasures.filter(function(measure) {
  var re = /CAHPS_\d+/i;
  return measure.measureId.match(re) === null;
});

// Constants
var CAHPS_CSV_COLUMNS = [
  'Measure Name',
  'Measure Points',
  'Measure Contribution'
];

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
  return {
    category: 'quality',
    firstPerformanceYear: 2017,
    lastPerformanceYear: null,
    metricType: 'float',
    title: record['Measure Name'],
    description: null, // TBD: Will be provided by RAND,
    nationalQualityCode: null,
    measureType: 'patientEngagementExperience',
    measureId: 'CAHPS_' + (idx + 1),
    eMeasureId: null,
    nqfEMeasureId: null,
    nqfId: null, // TODO(aimee): update to conditional based on spec
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
      records.forEach(function(record, idx) {
        var measure = generateCahpsMeasure(record, idx);

        if (measure) additionalMeasures.push(measure);
      });

      fs.writeFileSync(path.join(__dirname, additionalMeasuresFilepath), JSON.stringify(additionalMeasures, null, 2), 'utf8');
    }
  });
});
