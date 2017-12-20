const fs = require('fs');

stagingMeasuresDataPath = './staging/measures-data.json';
stagingMeasuresString = fs.readFileSync(stagingMeasuresDataPath, 'utf-8');
stagingMeasures = JSON.parse(stagingMeasuresString);

updatedMeasures = [];
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

updatedMeasuresJson = JSON.stringify(updatedMeasures, null, 2);
fs.writeFileSync(stagingMeasuresDataPath, updatedMeasuresJson);
