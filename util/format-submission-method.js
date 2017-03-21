// Function to normalize the submission method types
// Constants
var SUBMISSION_METHOD_MAP = require('./constants/submission-method-map');

/**
 *
 * @param {string} submissionMethod - non-normalized version from csv dataset
 * @returns {string} - normalized version
 */
var formatSubmissionMethod = function formatSubmissionMethod(submissionMethod) {
  return SUBMISSION_METHOD_MAP[submissionMethod.replace(/\s/g, '').toLowerCase()];
};

module.exports = formatSubmissionMethod;
