const chai = require('chai');
const assert = chai.assert;
const rp = require('request-promise');
const Promise = require('bluebird');

const Constants = require('../../constants');
const measuresData = require('../../index.js');

function checkUrl(s) {
  return rp({method: 'HEAD', uri: s.url})
    .then(body => {
      return ({
        measureId: s.measureId,
        submissionMethod: s.url,
        performanceYear: s.performanceYear,
        firstPerformanceYear: s.firstPerformanceYear,
        success: true,
        httpStatus: body.statusCode
      });
    })
    .catch(body => {
      return ({
        measureId: s.measureId,
        eMeasureId: s.eMeasureId,
        title: s.title,
        nqfId: s.nqfId,
        submissionMethod: s.submissionMethod,
        url: s.url,
        performanceYear: s.performanceYear,
        firstPerformanceYear: s.firstPerformanceYear,
        success: false,
        httpStatus: body.statusCode
      });
    });
}

// this will run once a day on travis
if (process.env.TRAVIS_EVENT_TYPE === 'cron') {
  const measures = [];
  const performanceYears = Constants.validPerformanceYears;

  performanceYears.forEach(yr =>
    measuresData.getMeasuresData(yr).forEach(measure => measures.push({'measure': measure, 'performanceYear': yr}))
  );

  it('has valid specification links', function() {
    this.timeout(300000);
    this.retries(3); // retry for transient network failures

    const specs = [];
    measures
      .map(m => ({
        measureId: m.measure.measureId, measureSpecification: m.measure.measureSpecification, firstPerformanceYear: m.measure.firstPerformanceYear, performanceYear: m.performanceYear, eMeasureId: m.measure.eMeasureId, title: m.measure.title, nqfId: m.measure.nqfId
      }))
      .filter(s => !!s.measureSpecification)
      .forEach(s => {
        if (typeof s.measureSpecification === 'object') {
          Object.keys(s.measureSpecification).forEach(key => {
            specs.push({
              measureId: s.measureId,
              submissionMethod: key,
              url: s.measureSpecification[key],
              firstPerformanceYear: s.firstPerformanceYear,
              performanceYear: s.performanceYear,
              eMeasureId: s.eMeasureId,
              title: s.title,
              nqfId: s.nqfId
            });
          });
        } else {
          specs.push({
            measureId: s.measureId,
            url: s.measureSpecification,
            firstPerformanceYear: s.firstPerformanceYear,
            performanceYear: s.performanceYear,
            eMeasureId: s.eMeasureId,
            title: s.title,
            nqfId: s.nqfId
          });
        }
      });

    return Promise.map(specs, s => checkUrl(s), { concurrency: 20 })
      .then(results => {
        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
          console.log(failures);
        }
        assert.equal(0, failures.length, 'One or more measure specifications link is invalid');
      });
  });
}
