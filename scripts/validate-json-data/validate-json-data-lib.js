const Ajv = require('ajv');

const ajv = new Ajv({ verbose: true });
require('ajv-keywords')(ajv, 'uniqueItemProperties');
require('ajv-merge-patch')(ajv);

const ValidateLib = {};

ValidateLib.validate = function(schema, data) {
  const valid = ajv.validate(schema, data);

  return {
    valid,
    // Summary of errors, this is a string. If valid this is "No errors"
    errors: ajv.errorsText(ajv.errors),
    // Full error details, this is an array of objects
    details: ajv.errors
  };
};

module.exports = ValidateLib;
