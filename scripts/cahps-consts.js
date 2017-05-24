// Some measures have an NqfId (NQF: National Quality Forum) of '0005'
const defaultNqfId = '0005';
const nqfIdMap = {
  'CAHPS for MIPS SSM: Getting Timely Care, Appointments and Information': defaultNqfId,
  'CAHPS for MIPS SSM: How Well Providers Communicate': defaultNqfId,
  'CAHPS for MIPS SSM: Patient\'s Rating of Provider': defaultNqfId,
  'CAHPS for MIPS SSM: Courteous and Helpful Office Staff': defaultNqfId
};

const cahpsTitleToMeasureIdIndexMap = {
  'CAHPS for MIPS SSM: Getting Timely Care, Appointments and Information': 1,
  'CAHPS for MIPS SSM: How Well Providers Communicate': 2,
  'CAHPS for MIPS SSM: Patient\'s Rating of Provider': 3,
  'CAHPS for MIPS SSM: Access to Specialists': 4,
  'CAHPS for MIPS SSM: Health Promotion and Education': 5,
  'CAHPS for MIPS SSM: Shared Decision-Making': 6,
  'CAHPS for MIPS SSM: Health Status and Functional Status': 7,
  'CAHPS for MIPS SSM: Care Coordination': 8,
  'CAHPS for MIPS SSM: Courteous and Helpful Office Staff': 9,
  'CAHPS for MIPS SSM: Helping You Take Medications as Directed': 10,
  'CAHPS for MIPS SSM: Stewardship of Patient Resources': 11,
  'CAHPS for MIPS SSM: Between Visit Communication': 12
};

module.exports = {
  nqfIdMap: nqfIdMap,
  cahpsTitleToMeasureIdIndexMap: cahpsTitleToMeasureIdIndexMap
};
