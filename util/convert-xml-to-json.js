/**
 * Expects from standard input an XML string and writes to standard output an
 * equivalent JSON string.
 *
 * This script can be used as follows:
 * cat measurement-set.xml | node convert-xml-to-json.js > measurement-set.json
 **/

var xml2js = require('xml2js');

var xml = '';
var params = {
  explicitRoot: false,
  explicitArray: false,
  ignoreAttrs : true,
  // By default, all XML values are converted to strings. These functions handle
  // the proper conversion of boolean and integer values.
  valueProcessors: [handleBoolean, handleNumber],
  // The individual measurement XML objects should be collated into a
  // measurements (plural) array.
  tagNameProcessors: [handleMeasurementArrayItems]
};

function convertToJson(xml) {
  var json = '';
  // The parseString callback is synchronous by default
  xml2js.parseString(xml, params, function (err, result) {
    // XML does not allow for a root array object, so in the case of
    // measures-data, the converted JSON will have a root measure object that
    // keys to the measures-data array that we will remove before returning.
    json = JSON.stringify(result && result.measure ? result.measure : result);
  });
  return json;
}

function handleBoolean(name) {
  if (name === "true") {
    return true;
  } else if (name === "false") {
    return false;
  } return name;
}

function handleNumber(name) {
  if (/^\d+$/.test(name)) {
    return parseInt(name);
  } return name;
}

function handleMeasurementArrayItems(name) {
  return (name === 'measurement') ? 'measurements' : name;
}

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
    var chunk = this.read();
    if (chunk !== null) {
      xml += chunk.trim();
    }
});

process.stdin.on('end', function() {
  process.stdout.write(convertToJson(xml));
});

module.exports = {
  convertToJson: convertToJson
}
