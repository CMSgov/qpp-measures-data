#!/usr/bin/env node

/*

Extracts ecqm eMeasureIds and retrieves any measure stratifications
Running this will generate two files
  - util/measures/additional-stratifications.json
  - util/measures/generated-ecqm-data.json

Usage: ./get-stratification.js <current year>

*/

const _ = require('lodash');
const fs = require('fs');
const os = require('os');
const path = require('path');
const bbPromise = require('bluebird');
const parseString = require('xml2js').parseString;
const { extractZip, getXMLFiles, extractStrata, extractAdditionalStrata } = require('../extract-util');
const tmpDir = os.tmpdir() + '/ecqm';
const tmpPath = tmpDir + '/xmls';
const currentYear = process.argv[2];
// Use path.resolve() to create absolute path for AdmZip (required for 2026)
// Relative paths cause "Invalid filename" errors in AdmZip constructor
const zipPath = path.resolve(__dirname, '../../../staging/' + currentYear + '/2026-EligibleClinician-eCQM_v2.zip');

if (!currentYear) {
  console.log('Missing required argument <current year>');
  process.exit(1);
}

// gather list of xml files
fs.rmSync(tmpDir, { recursive: true, force: true });
extractZip(zipPath, tmpDir);
// each measure has its own zip, collect name of SimpleXML files
const xmlFiles = getXMLFiles(tmpDir, tmpPath);

// generate additional-stratifications.json
// parse files into JavaScript objects
const promisifiedParseString = bbPromise.promisify(parseString);
bbPromise.all(
  xmlFiles.map(xmlFile => {
    return promisifiedParseString(fs.readFileSync(path.join(tmpPath, xmlFile)));
  })
).then(docs => {
  // extract data from converted JavaScript objects
  return _.compact(docs.map(doc => {
    const measure = doc.QualityMeasureDocument;
    const measureId = measure.subjectOf[0].measureAttribute[0].value[0].$.value;
    const strataMap = extractAdditionalStrata(measure);
    if (_.isEmpty(strataMap)) {
      return;
    }
    const version = measure.versionNumber[0].$.value.split('.')[0];
    const eMeasureId = `CMS${measureId}v${version}`;
    return {
      eMeasureId,
      strataMaps: strataMap
    };
  }));
}).then(ecqms => {
  // map of measure id to stratification list
  fs.writeFileSync(path.join(__dirname,
    '../../../util/measures/' + currentYear + '/additional-stratifications.json'), JSON.stringify(ecqms, null, 2));
});


// generate generated-ecqm-data.json
// parse files into JavaScript objects
const promisifiedStrataParseString = bbPromise.promisify(parseString);
bbPromise.all(
  xmlFiles.map(xmlFile => {
    return promisifiedStrataParseString(fs.readFileSync(path.join(tmpPath, xmlFile)));
  })
).then(docs => {
  // extract data from converted JavaScript objects
  return _.compact(docs.map(doc => {
    const measure = doc.QualityMeasureDocument;
    const emeasureid = measure.subjectOf[0].measureAttribute[0].value[0].$.value;
    const strataDescriptions = extractStrataDescription(measure, emeasureid);
    const strata = extractStrata(measure, strataDescriptions);
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
}).then(ecqms => {
  // sort and write extracted data to disk
  const sortedEcqms = _.sortBy(ecqms, ['eMeasureId']);
  fs.writeFileSync(path.join(__dirname, '../../../util/measures/' + currentYear + '/generated-ecqm-data.json'), JSON.stringify(sortedEcqms, null, 2));
  console.warn('remember to update measures repo with the generated data!');
});

/*
return strata description array
*/
/*
 * Extracts stratification descriptions from eCQM measure XML
 * 
 * Handles multiple formats:
 * - 2025 format: strata separated by newlines ("Numerator 1:\n<text>\nNumerator 2:\n<text>")
 * - 2026 format: strata on same line ("Numerator 1: <text>. Numerator 2: <text>.")
 * 
 * Special cases:
 * - CMS138: Uses 'Population' identifier in DENOM field (not NUMER)
 * - CMS145/157: Uses MSRAGG field with '- Population' identifier
 * - CMS156/347: Custom parsing from measure.text field
 * 
 * @param {Object} measure - Parsed XML measure object
 * @param {string} emeasureid - Measure ID (e.g., '128', '138')
 * @returns {Array<string>} Array of stratum descriptions
 */
function extractStrataDescription(measure, emeasureid) {
  let description, strataDescriptions;
  let descriptionIdentifier = 'Numerator';
  
  // Custom measures that use different XML fields or identifiers
  const customMeasures = {
    '138': { 'subjectCode': 'DENOM', 'descriptionIdentifier': 'Population' },  // CMS138 uses populations in DENOM field
    '145': { 'subjectCode': 'MSRAGG', 'descriptionIdentifier': '- Population' },
    '157': { 'subjectCode': 'MSRAGG', 'descriptionIdentifier': '- Population' }
  };

  // get description
  if (customMeasures[emeasureid]) {
    description = measure.subjectOf
      .find(item => item.measureAttribute[0].code[0].$.code === customMeasures[emeasureid]['subjectCode'])
      .measureAttribute[0].value[0].$.value;
    descriptionIdentifier = customMeasures[emeasureid]['descriptionIdentifier'];
  } else {
    description = measure.subjectOf
      .find(item => item.measureAttribute[0].code[0].$.code === 'NUMER')
      .measureAttribute[0].value[0].$.value;
  }

  // Parse descriptions for multi-strata measures with special formatting
  switch (emeasureid) {
    case '138':
      // CMS138: Preventive Care and Screening - Tobacco Use
      // 2025 format: "Population 1:\n<text>\nPopulation 2:\n<text>\nPopulation 3:\n<text>"
      // 2026 format: "Population 1: <text>. Population 2: <text>. Population 3: <text>."
      
      // First attempt: Try to split by newlines (works for 2025)
      strataDescriptions = _.compact(description.replaceAll(/(\n{0,1}Population \d:\s{0,3}\n)/g, '')
        .split(/\n|\r|&#xA;/))
        .map(string => string.trim());
      
      // If we only got 1 result but multiple populations exist, they're on the same line (2026 format)
      if (strataDescriptions.length < 2 && description.includes('Population 1:') && description.includes('Population 2:')) {
        // Extract populations from single-line format using regex
        // Matches: "Population 1: <text>. Population 2: <text>. Population 3: <text>."
        const popRegex = /Population (\d+): ([^]+?)(?=\. Population \d+: |\.$|$)/g;
        let match;
        strataDescriptions = [];
        while ((match = popRegex.exec(description)) !== null) {
          strataDescriptions.push(match[2].trim().replace(/\.$/, ''));
        }
      }
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
        // eslint-disable-next-line no-useless-escape
        .filter(string => string.match(/^\-/))
        .map(string => string.substr('-'.length).trim());
      break;
    default:
      // Default extraction logic for most measures (e.g., CMS128 and others)
      // Step 1: Try splitting by newlines (works for 2025 format)
      strataDescriptions = _.compact(description.split(/\n|\r|&#xA;/));
      
      // Step 2: Filter lines that start with "Numerator X:" (or other identifier)
      // eslint-disable-next-line no-case-declarations
      const idRegEx = new RegExp('^(' + descriptionIdentifier + ' \\d: )');
      strataDescriptions = strataDescriptions
        .filter(string => string.match(idRegEx))
        .map(string => string.substr(`${descriptionIdentifier} x: `.length).trim());
      
      // Step 3: Handle 2026 format where multiple numerators are on same line
      // Example: "Numerator 1: <84 days text>. Numerator 2: <180 days text>."
      // This occurs when indicators ("Numerator 1:", "Numerator 2:") exist but we only got 1 stratum
      if (description.includes(descriptionIdentifier + ' 1:') && 
          description.includes(descriptionIdentifier + ' 2:') && 
          strataDescriptions.length < 2) {
        // Use regex to extract each numerator from the single-line format
        // Pattern matches: "Numerator N: <text>" followed by either ". Numerator" or end of string
        const numeratorRegex = new RegExp(descriptionIdentifier + ' (\\d+): ([^]+?)(?=\\. ' + descriptionIdentifier + ' \\d+: |\\.$|$)', 'g');
        let match;
        strataDescriptions = [];
        while ((match = numeratorRegex.exec(description)) !== null) {
          // match[1] = numerator number, match[2] = description text
          strataDescriptions.push(match[2].trim().replace(/\.$/, ''));
        }
      }
  }

  // description stores single stratum otherwise
  if (strataDescriptions.length === 0) {
    strataDescriptions = [description.trim()];
  }

  return strataDescriptions;
}
