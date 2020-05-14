#!/usr/bin/env node

/**
 * Script to add cahps measures to cahps-measures.json from CSV
 * To run: `node add-cahps-measures.js [DATA_CSV_FILE] [OUTPUT_FILE]`
 * e.g. `node add-cahps-measures.js cahps_measures_origin.csv cahps-measures.json`
 */

// Libraries
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const path = require('path');

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

const cahpsMeasureTemplate = {
  category: 'quality',
  firstPerformanceYear: 2017,
  lastPerformanceYear: null,
  metricType: 'cahps',
  title: null,
  description: '',
  nationalQualityStrategyDomain: null,
  measureType: 'patientEngagementExperience',
  measureId: null,
  eMeasureId: null,
  nqfEMeasureId: null,
  nqfId: null,
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

function generateCahpsMeasure(record, idx) {
  const measureTitle = record['MIPS Measure Description in the Repository'].trim();
  const measureId = record['MIPS Measure ID for display in Measure Repository'].trim();

  if (measureTitle === '') return false;

  return {
    ...cahpsMeasureTemplate,
    title: measureTitle,
    measureId: measureId,
    nqfId: nqfIdMap[measureTitle] || null
  };
}

function generateCahpsAcoMeasure(record, idx) {
  const measureTitle = record['ACO Measure Description in the Repository'].trim();
  const measureId = record['ACO Measure ID for display in Measure Repository'].trim();

  if (measureTitle === '') return false;
  if (measureTitle === 'Not part of ACO score in 2018 - will not include in 2018 repo') return false;

  return {
    ...cahpsMeasureTemplate,
    title: measureTitle,
    measureId: measureId,
    nqfId: nqfIdMap[measureTitle] || null,
    firstPerformanceYear: 2018
  };
}

function importCahpsMeasures(cahpsMeasuresCsv, cahpsMeasuresFilepath) {
  const cahpsMeasuresData = fs.readFileSync(path.join(__dirname, cahpsMeasuresCsv), {encoding: 'utf8'});
  const records = parse(cahpsMeasuresData, {columns: CAHPS_CSV_COLUMNS, from: 2});
  const cahpsMeasures = [];

  records.forEach(function(record, idx) {
    const cahpsMeasure = generateCahpsMeasure(record, idx);
    if (cahpsMeasure) cahpsMeasures.push(cahpsMeasure);

    const cahpsAcoMeasure = generateCahpsAcoMeasure(record, idx);
    if (cahpsAcoMeasure) cahpsMeasures.push(cahpsAcoMeasure);
  });

  fs.writeFileSync(path.join(__dirname, cahpsMeasuresFilepath), JSON.stringify(cahpsMeasures, null, 2), {encoding: 'utf8', flag: 'w'});
}

const cahpsMeasuresCsv = process.argv[2];
const outputFilepath = process.argv[3];

importCahpsMeasures(cahpsMeasuresCsv, outputFilepath);
