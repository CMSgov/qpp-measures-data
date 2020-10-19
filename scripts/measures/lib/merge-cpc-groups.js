module.exports = (measures, groups) => {
  Object.keys(groups).forEach((groupId) => {
    groups[groupId].forEach(eMeasureId => {
      const measure = measures.find(measure => measure.eMeasureId === eMeasureId);
      if (measure !== undefined) {
        measure.cpcPlusGroup = groupId;
      }
    });
  });
};
