/**
 * Maps normalized (trimmed and squeezed) submission method values
 * from csv to standard values.
 * @enum {string}
 */
var submissionMethodMap = {
  'claims': 'claims',
  'registry': 'registry',
  'registry/qcdr': 'qcdrOrQualifiedRegistry',
  'cmswebinterface': 'cmsWebInterface',
  'administrativeclaims': 'administrativeClaims',
  'ehr': 'ehr',
  'cmsapprovedcahpsvendor': 'cmsApprovedCahpsVendor'
};

module.exports = submissionMethodMap;
