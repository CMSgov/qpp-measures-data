const _ = require('lodash');
const fs = require('fs');

const cpcPlusGroups = require('../../util/measures/cpc+-measure-groups.json');

var qpp = '';

process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    qpp += chunk;
  }
});

process.stdin.on('end', () => {
  process.stdout.write(enrichMeasures(JSON.parse(qpp, 'utf8')));
});

function enrichMeasures(measures) {
  enrichCPCPlusMeasures(measures);
  return JSON.stringify(measures, null, 2);
};


/**
 * Will add extra metadata to CPC+ measures
 * @param {array} measures
 */
function enrichCPCPlusMeasures(measures) {
  measures
    .filter(measure => measure.category === 'quality')
    .forEach(measure => {
      Object.keys(cpcPlusGroups).forEach((groupId) => {
        var match = cpcPlusGroups[groupId].find((id) => id === measure.eMeasureId);
        if (match !== undefined) {
          measure.cpcPlusGroup = match;
        }
      });
    });
};
