/**
 * Expects from standard input a JSON blob describing activity measures and
 * writes to standard output an equivalent XML string.
 *
 * This script can be used as follows:
 * cat measures-data.json | node convert-json-to-xml.js  > measures-data.xml
 **/

var xml2js = require('xml2js');

var schemaType = 'measures';

var json = '';
/**
  * XML does not allow for multiple elements without a root element. So by
  * default, the measures-data JSON object, whose root element is an array
  * is converted to elements with indices such as:
  *   <root>
  *     <0></0>
  *     <1></1>
  *   </root>
  * This is not valid XML syntax, so we use regex to replace these indices with
  * <measure></measure>. See this xml2js issue for details:
  * https://github.com/Leonidas-from-XIV/node-xml2js/issues/119
  */
function convertToXml(json) {
  var builder = new xml2js.Builder({rootName: schemaType});
  var xml = builder.buildObject(JSON.parse(json, 'utf8'));
  process.stdout.write(xml.replace(/(<\/)?[0-9]{1,}(>)/g,'$1measure$2'));
}

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
    var chunk = this.read();
    if (chunk !== null) {
      json += chunk;
    }
});

process.stdin.on('end', function() {
   convertToXml(json);
});
