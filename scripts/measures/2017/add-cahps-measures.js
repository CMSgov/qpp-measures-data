#!/usr/bin/env node

/**
 *
 * One-time use script to add cahps measures to additional-measures.json from csv
 * To run: `cat [DATA_CSV_FILE] | node add-cahps-measures.js`
 * e.g. `cat cahps_measures_origin.csv | node add-cahps-measures.js`
 */

// Libraries
const fs = require('fs');
const parse = require('csv-parse');
const path = require('path');

const additionalMeasuresFilepath = '../../util/measures/additional-measures.json';
let additionalMeasures = require(additionalMeasuresFilepath);

// Some measures have an NqfId (NQF: National Quality Forum) of '0005'
const defaultNqfId = '0005';
const nqfIdMap = {
  'CAHPS for MIPS SSM: Getting Timely Care, Appointments and Information': defaultNqfId,
  'CAHPS for MIPS SSM: How Well Providers Communicate': defaultNqfId,
  'CAHPS for MIPS SSM: Patient\'s Rating of Provider': defaultNqfId,
  'CAHPS for MIPS SSM: Courteous and Helpful Office Staff': defaultNqfId
};

const cahpsTitleToMeasureIdIndexMap = {
  'CAHPS for MIPS SSM: Getting Timely Care, Appointments and Information': 1,
  'CAHPS for MIPS SSM: How Well Providers Communicate': 2,
  'CAHPS for MIPS SSM: Patient\'s Rating of Provider': 3,
  'CAHPS for MIPS SSM: Access to Specialists': 4,
  'CAHPS for MIPS SSM: Health Promotion and Education': 5,
  'CAHPS for MIPS SSM: Shared Decision-Making': 6,
  'CAHPS for MIPS SSM: Health Status and Functional Status': 7,
  'CAHPS for MIPS SSM: Care Coordination': 8,
  'CAHPS for MIPS SSM: Courteous and Helpful Office Staff': 9,
  'CAHPS for MIPS SSM: Helping You Take Medications as Directed': 10,
  'CAHPS for MIPS SSM: Stewardship of Patient Resources': 11,
  'CAHPS for MIPS SSM: Between Visit Communication': 12
};

// Constants
const CAHPS_CSV_COLUMNS = [
  'Measure Name',
  // The following columns are unused but prefer leaving it to be clear about
  // the structure of the original import document.
  'Measure Points',
  'Measure Contribution'
];

// Initialize a string to store the CSV data.
let cahpsMeasuresData = '';

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    cahpsMeasuresData += chunk;
  }
});

function generateCahpsMeasure(record, idx) {
  const measureTitle = record['Measure Name'];
  const measureIdx = cahpsTitleToMeasureIdIndexMap[measureTitle];

  if (measureIdx === undefined) {
    throw new Error('No existing measure index matches title: "' + measureTitle + '"');
  }

  return {
    category: 'quality',
    firstPerformanceYear: 2017,
    lastPerformanceYear: null,
    metricType: 'cahps',
    title: measureTitle,
    description: '', // TBD: Will be provided by RAND,
    nationalQualityStrategyDomain: null,
    measureType: 'patientEngagementExperience',
    measureId: 'CAHPS_' + cahpsTitleToMeasureIdIndexMap[measureTitle],
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
        const re = /CAHPS_\d+/i;
        return measure.measureId.match(re) === null;
      });

      records.forEach(function(record, idx) {
        const measure = generateCahpsMeasure(record, idx);
        if (measure) additionalMeasures.push(measure);
      });

      fs.writeFileSync(path.join(__dirname, additionalMeasuresFilepath), JSON.stringify(additionalMeasures, null, 2), 'utf8');
    }
  });
});
