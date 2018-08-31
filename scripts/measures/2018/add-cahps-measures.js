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

const year = 2018;
const additionalMeasuresFilepath = '../../../staging/' + year + '/cahps-measures.json';
let additionalMeasures = require(additionalMeasuresFilepath);

// Some measures have an NqfId (NQF: National Quality Forum) of '0005'
const defaultNqfId = '0005';
const nqfIdMap = {
  'CAHPS for MIPS SSM: Getting Timely Care, Appointments and Information': defaultNqfId,
  'CAHPS for MIPS SSM: How Well Providers Communicate': defaultNqfId,
  'CAHPS for MIPS SSM: Patient\'s Rating of Provider': defaultNqfId,
  'CAHPS for MIPS SSM: Courteous and Helpful Office Staff': defaultNqfId
};

// Constants
const CAHPS_CSV_COLUMNS = [
  'Summary Survey Measure',
  'MIPS Measure Description in the Repository',
  'MIPS Measure ID for display in Measure Repository',
  'ACO Measure Description in the Repository',
  'ACO Measure ID for display in Measure Repository'
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
  const measureTitle = record['MIPS Measure Description in the Repository'].trim();
  const measureId = record['MIPS Measure ID for display in Measure Repository'].trim();

  if (measureTitle === '') return false;

  return {
    category: 'quality',
    firstPerformanceYear: year,
    lastPerformanceYear: null,
    metricType: 'cahps',
    title: measureTitle,
    description: '', // TBD: Will be provided by RAND,
    nationalQualityStrategyDomain: null,
    measureType: 'patientEngagementExperience',
    measureId: measureId,
    eMeasureId: null,
    nqfEMeasureId: null,
    nqfId: nqfIdMap[measureTitle] || null,
    isInverse: false,
    strata: [],
    isHighPriority: true,
    isIcdImpacted: false,
    isToppedOutByProgram: false,
    primarySteward: 'Agency for Healthcare Research & Quality',
    submissionMethods: [
      'certifiedSurveyVendor'
    ],
    measureSets: [
      'generalPracticeFamilyMedicine'
    ]
  };
};


function generateCahpsAcoMeasure(record, idx) {
  const measureTitle = record['ACO Measure Description in the Repository'].trim();
  const measureId = record['ACO Measure ID for display in Measure Repository'].trim();

  if (measureTitle === '') return false;
  if (measureTitle === 'Not part of ACO score in 2018 - will not include in 2018 repo') return false;

  return {
    category: 'quality',
    firstPerformanceYear: year,
    lastPerformanceYear: null,
    metricType: 'cahps',
    title: measureTitle,
    description: '', // TBD: Will be provided by RAND,
    nationalQualityStrategyDomain: null,
    measureType: 'patientEngagementExperience',
    measureId: measureId,
    eMeasureId: null,
    nqfEMeasureId: null,
    nqfId: nqfIdMap[measureTitle] || null,
    isInverse: false,
    strata: [],
    isHighPriority: true,
    isIcdImpacted: false,
    isToppedOutByProgram: false,
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
        const re = /CAHPS_/i;
        return measure.measureId.match(re) === null;
      });

      records.forEach(function(record, idx) {
        const cahpsMeasure = generateCahpsMeasure(record, idx);
        if (cahpsMeasure) additionalMeasures.push(cahpsMeasure);

        const cahpsAcoMeasure = generateCahpsAcoMeasure(record, idx);
        if (cahpsAcoMeasure) additionalMeasures.push(cahpsAcoMeasure);
      });

      fs.writeFileSync(path.join(__dirname, additionalMeasuresFilepath), JSON.stringify(additionalMeasures, null, 2), 'utf8');
    }
  });
});
