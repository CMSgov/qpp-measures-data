const fs = require('fs');

const stagingMeasuresDataPath = './staging/measures-data.json';
const stagingMeasuresString = fs.readFileSync(stagingMeasuresDataPath, 'utf-8');
const stagingMeasures = JSON.parse(stagingMeasuresString);

const updatedMeasures = [];
stagingMeasures.forEach((measure) => {
  // if it's an ecqm measure and it allows 'electronicHealthRecord'
  // submissions but not 'registry' submissions already, add 'registry' to the list.
  if (measure.eMeasureUuid && measure.submissionMethods.includes('electronicHealthRecord')) {
    if (!measure.submissionMethods.includes('registry')) {
      measure.submissionMethods.push('registry');
    }
  }
  updatedMeasures.push(measure);
});

const updatedMeasuresJson = JSON.stringify(updatedMeasures, null, 2);
fs.writeFileSync(stagingMeasuresDataPath, updatedMeasuresJson);
