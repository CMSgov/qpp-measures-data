function transformColumn(transformDtype, columnObject, record) {
  switch (transformDtype) {
    case 'array':
      return record[columnObject.index].split(columnObject.transform.delimiter);
    default:
      throw new Error('Invalid dtype: ' + transformDtype);
  }
}

/**
 * [convertCsvToMeasures description]
 * @param  {array of arrays}  records each array in the outer array represents a new measure, each inner array its attributes
 * @param  {object}           config  object defining how to build a new measure from this csv file, including mapping of measure fields to column indices
 * @return {array}            Returns an array of measures objects
 */
const convertCsvToMeasures = function(records, config) {
  const sourcedFields = config.sourced_fields;
  const constantFields = config.constant_fields;

  const newMeasures = records.map(function(record) {
    var newMeasure = {};
    Object.entries(sourcedFields).forEach(function([measureKey, columnObject]) {
      if (typeof columnObject === 'number') {
        if (!record[columnObject]) {
          throw TypeError('Column ' + columnObject + ' does not exist in source data');
        } else {
          // measure data maps directly to data in csv
          newMeasure[measureKey] = record[columnObject];
        }
      } else if (columnObject.mappings !== undefined) {
        // measure data requires mapping CSV data to new value, e.g. Y, N -> true, false
        const mappedValue = columnObject.mappings[record[columnObject.index]];
        newMeasure[measureKey] = mappedValue || columnObject.mappings['default'];
      } else if (columnObject.transform !== undefined) {
        const transformDtype = columnObject.transform.dtype;
        newMeasure[measureKey] = transformColumn(transformDtype, columnObject, record);
      } else {
        throw Error('Invalid column definition for ' + measureKey);
      }
    });
    Object.entries(constantFields).forEach(function([measureKey, measureValue]) {
      newMeasure[measureKey] = measureValue;
    });
    return newMeasure;
  });

  return newMeasures;
};

module.exports = convertCsvToMeasures;
