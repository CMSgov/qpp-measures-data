/*
    The input for this file will be a powerpoint with only the clinical cluster and specialty slides.
    Place the file in this same folder.
    To run this - `npx ts-node create-clinical-cluster-csv.ts ${currentYear}`
*/

import fs from "fs";
import path from "path";
import appRoot from 'app-root-path';
import { json2csv } from 'json-2-csv';
import { parseOfficeAsync } from "officeparser";

const currentYear = process.argv[2];
const pptPath = "./2025-EMA-and-Denominator-Reduction-User-Guide.pptx";
const csvPath = `../../util/clinical-clusters/${currentYear}/`;
const measuresPath = `measures/${currentYear}/measures-data.json`;
const MEASURE_START_REGEX = (/^([\d]{3}): (.*)$/);  // start with a match like this `123: XX`
const MEASURE_REGEX = (/(\d{3}): /g);   // to match `123: `
const config = { ignoreNotes: true };

const clinicalTopicReplace = {
  "Pathology 1": "Pathology",
  "AnesthesiologyCare": "Anesthesiology Care",
  "Pathology –Skin Cancer": "Pathology Skin Cancer",
  "Cardiac StressImaging": "Cardiac Stress Imaging"
}

if (!currentYear) {
  console.log('Missing required argument <current year>');
  process.exit(1);
}

parseOfficeAsync(pptPath, config).then((data) => {
  const specialtySplitSentence = "Appendix B: Specialty Measure Sets with Fewer than 6 Measures";

  // First element will have all the clinical data and the specialty set will be split into different elements.
  const clinicalData: string[] = data.split(specialtySplitSentence).shift()?.split("\n").filter(data => data.trim() != "") || [];
  const specialtyData: string[] = data.split(specialtySplitSentence).slice(1).join().split("\n").filter(data => data.trim() != "");
  
  const clinicalMeasures = extractMeasures(clinicalData);
  const specialtyMeasures = extractMeasures(specialtyData);


  // get measures json data for processing
  const measuresJson: object[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', measuresPath), 'utf8')
  );

  // create a list of clinical measures
  let clinicalMeasuresList: string[] = [];
  Object.keys(clinicalMeasures).forEach(key => {
    clinicalMeasuresList = [...clinicalMeasuresList, ...Object.keys(clinicalMeasures[key])]
  })

// create a list of specialty measures
  let specialtyMeasuresList: string[] = [];
  Object.keys(specialtyMeasures).forEach(key => {
    specialtyMeasuresList = [...specialtyMeasuresList, ...Object.keys(specialtyMeasures[key])]
  })

  // reduce the measures json to filter the only ones that are needed
  const filteredMeasures: object[] = measuresJson.filter(measure => [...clinicalMeasuresList, ...specialtyMeasuresList].includes(measure["measureId"]));

  // format data into to the structure json2csv accepts
  const clinicalClaimsData: object[] = [];
  const clinicalRegistryData: object[] = [];
  Object.keys(clinicalMeasures).map(clinicalTopic => {
    Object.keys(clinicalMeasures[clinicalTopic]).forEach(measureId => {
      const measure = filteredMeasures.find(measure => measure["measureId"] == measureId) || {};
      if (measure["submissionMethods"].includes("claims")) clinicalClaimsData.push({ "Title": clinicalTopic, "Quality ID": measureId });
      if (measure["submissionMethods"].includes("registry")) clinicalRegistryData.push({ "Title": clinicalTopic, "Quality ID": measureId });
    })
  });

  // create csv files
  fs.writeFileSync(path.join(csvPath + 'ClaimsClinical_Cluster.csv'), json2csv(clinicalClaimsData));
  fs.writeFileSync(path.join(csvPath + 'RegistryClinicalCluster.csv'), json2csv(clinicalRegistryData));

  console.log('Clinical Cluster CSV files created! Dont forget to build clinical clusters json');

}).catch((err) => console.error(err));

// extract measures data from each line
function extractMeasures(inlineData: string[]) {
  let clinicalTopic = "";
  const measuresOnly: object[] = [];
  inlineData.forEach((data, index) => {
    // if its measure entry - `123: desc` or `not applicable`
    if (checkMeasure(data)) {
      // if previous is clinical topic
      if (!checkMeasure(inlineData[index-1])) {
        clinicalTopic = getClinicalTopic(inlineData, index);
        // Remove (C) or (N) at the end of the clinicalTopic, if present
        clinicalTopic = clinicalTopic.replace(/\s*\((C|N)\)$/, '');
        measuresOnly[clinicalTopic] = {};
      }
      // if its valid measure entry - `123: desc`
      if (MEASURE_START_REGEX.test(data)) {
        const matches = data.match(MEASURE_REGEX);
        // add measure data by clinical topic
        if (Array.isArray(matches) && matches.length > 1) {
          const subMeasures = extractInlineMeasures(data, matches);
          // subMeasures.forEach(measure => measuresOnly[clinicalTopic].push(convertMeasure(measure)));
          subMeasures.forEach(measure => measuresOnly[clinicalTopic][measure.split(':')[0]] = measure.split(':')[1].trim());
        } else if (Array.isArray(matches) && matches.length == 1) measuresOnly[clinicalTopic][data.split(':')[0]] = data.split(':')[1].trim();
      }
    }
  })
  return measuresOnly;
}

// if its measure entry - `123: desc` or `not applicable`
function checkMeasure(value: string) {
  return MEASURE_START_REGEX.test(value) || value.trim().toLowerCase() == "not applicable"
}

// get clinical topic merged together with previous lines if seperated by linebreaks
function getClinicalTopic(data: string[], index: number) {
  let currentIndex = index - 1;
  const clinicalTopic: string[] = [];
  while (data[currentIndex].trim().toLowerCase() != "medicare part b claims" && !checkMeasure(data[currentIndex])) {
    clinicalTopic.push(data[currentIndex].trim());
    currentIndex--;
  }
  const fullClinicalTopic = clinicalTopic.reverse().join('');
  return clinicalTopicReplace[fullClinicalTopic] ? clinicalTopicReplace[fullClinicalTopic] : fullClinicalTopic;
}

// extract measures that is not seperated by line breaks. ex: `123: desc456: desc`
function extractInlineMeasures(lineData: string, matches: string[]) {
  const subMeasures: string[] = [];
  matches.reverse().forEach((match, index) => {
    const measurePos = lineData.indexOf(match);
    subMeasures.push(lineData.substring(measurePos));
    if (index != matches.length) lineData = lineData.substring(0,measurePos);
  })
  return subMeasures.reverse();
}