#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const mergeEcqmData = require('../lib/archive/merge-ecqm-data');
const mergeStratifications = require('../lib/archive/merge-stratifications');
const currentPerformanceYear=2023

const measures_data='../../../measures/'+currentPerformanceYear+'/measures-data.json';
const generated_ecqm_data='../../../util/measures/'+currentPerformanceYear+'/generated-ecqm-data.json'
const manually_created_ecqm_data='../../../util/measures/'+currentPerformanceYear+'/manually-created-missing-measures.json'
const additional_stratifications='../../../util/measures/'+currentPerformanceYear+'/additional-stratifications.json'
const output_path='./measures-data.json'

const measuresData = fs.readFileSync(path.join(__dirname, measures_data), 'utf8');

const generatedEcqmData = fs.readFileSync(path.join(__dirname, generated_ecqm_data), 'utf8');
const manuallyCreatedEcqmData = fs.readFileSync(path.join(__dirname, manually_created_ecqm_data), 'utf8');
const additionalStratificationsData = fs.readFileSync(path.join(__dirname, additional_stratifications), 'utf8');

const measures = JSON.parse(measuresData);

const generatedEcqms = JSON.parse(generatedEcqmData);
const manuallyCreatedEcqms = JSON.parse(manuallyCreatedEcqmData);
const additionalStratifications = JSON.parse(additionalStratificationsData);

mergeEcqmData(measures, generatedEcqms);
mergeEcqmData(measures, manuallyCreatedEcqms);
mergeStratifications(measures, additionalStratifications);

fs.writeFileSync(path.join(__dirname, output_path), JSON.stringify(measures, null, 2));
