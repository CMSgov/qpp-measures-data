const chai = require('chai');
const assert = chai.assert;
const rp = require('request-promise');
const Promise = require('bluebird');

const measuresData = require('../../index.js');

function checkUrl(s) {
  return rp({method: 'HEAD', uri: s.url})
    .then(body => {
      return ({
        measureId: s.measureId,
        submissionMethod: s.url,
        success: true,
        httpStatus: body.statusCode
      });
    })
    .catch(body => {
      return ({
        measureId: s.measureId,
        submissionMethod: s.url,
        success: false,
        httpStatus: body.statusCode
      });
    });
};

// this will run once a day on travis
if (process.env.TRAVIS_EVENT_TYPE === 'cron') {
  it('has valid specification links', function() {
    this.timeout(12000);
    this.retries(3); // retry for transient network failures

    const specs = [];
    const measures = measuresData.getMeasuresData();
    measures
      .map(m => ({measureId: m.measureId, measureSpecification: m.measureSpecification}))
      .filter(s => !!s.measureSpecification)
      .forEach(s => {
        Object.values(s.measureSpecification).forEach(url => {
          specs.push({measureId: s.measureId, url: url});
        });
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
