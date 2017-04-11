// Libraries
var chai    = require('chai');
var expect  = chai.expect;
// Utils
var formatBenchmarkRecord = require('./../../util/format-benchmark-record');

var options = {
  benchmarkYear: 2016,
  performanceYear: 2018
};

describe('formatBenchmarkRecord', function() {
  describe('When qualityId of the record does NOT correspond to a measure', function() {
    it('should return undefined', function() {
      // USWR 1800 is not a real qualityID, but the other properties are from real benchmark USWR 18.
      var record = {
        measureName: 'Complications or Side Effects among patients undergoing Treatment with HBOT',
        qualityId: 'USWR 1800', // USWR 18
        submissionMethod: 'Registry/QCDR',
        measureType: 'Outcome',
        benchmark: 'Y',
        decile3: '98.99 - 99.07',
        decile4: '99.08 - 99.48',
        decile5: '99.49 - 99.78',
        decile6: '99.79 - 99.84',
        decile7: '99.85 - 99.99',
        decile8: ' -- ',
        decile9: ' --	',
        decile10: '100',
        isToppedOut: 'Yes'
      };
      var benchmark = formatBenchmarkRecord(record, options);

      expect(benchmark).to.be.undefined;
    });
  });

  describe('When benchmark property of record is \'N\'', function() {
    it('should return undefined', function() {
      var record = {
        measureName: 'Prostate Cancer: Avoidance of Overuse of Bone Scan for Staging Low Risk Prostate Cancer Patients',
        qualityId: '102',
        submissionMethod: 'EHR',
        measureType: 'Process',
        benchmark: 'N',
        decile3: ' -- ',
        decile4: ' -- ',
        decile5: ' -- ',
        decile6: ' -- ',
        decile7: ' -- ',
        decile8: ' -- ',
        decile9: ' --	',
        decile10: ' -- ',
        isToppedOut: ' -- '
      };
      var benchmark = formatBenchmarkRecord(record, options);

      expect(benchmark).to.be.undefined;
    });
  });

  describe('When qualityId of the record does correspond to a measure', function() {
    it('should have the correct benchmarkYear based on the options argument', function() {
      var record = {
        measureName: 'Diabetes: Hemoglobin A1c Poor Control',
        qualityId: '1',
        submissionMethod: 'EHR',
        measureType: 'Outcome',
        benchmark: 'Y',
        decile3: '54.67 - 35.91',
        decile4: '35.90 - 25.63',
        decile5: '25.62 - 19.34',
        decile6: '19.33 - 14.15',
        decile7: '14.14 -  9.10',
        decile8: '9.09 -  3.34',
        decile9: '3.33 -  0.01',
        decile10: '0',
        isToppedOut: 'No'
      };
      var benchmark1 = formatBenchmarkRecord(record, { benchmarkYear: 2002, performaceYear: 2004});
      var benchmark2 = formatBenchmarkRecord(record, { benchmarkYear: 2004, performanceYear: 2006});

      expect(benchmark1.benchmarkYear).to.equal(2002);
      expect(benchmark2.benchmarkYear).to.equal(2004);
    });
    it('should have the correct performanceYear based on the options argument', function() {
      var record = {
        measureName: 'Diabetes: Hemoglobin A1c Poor Control',
        qualityId: '1',
        submissionMethod: 'EHR',
        measureType: 'Outcome',
        benchmark: 'Y',
        decile3: '54.67 - 35.91',
        decile4: '35.90 - 25.63',
        decile5: '25.62 - 19.34',
        decile6: '19.33 - 14.15',
        decile7: '14.14 -  9.10',
        decile8: '9.09 -  3.34',
        decile9: '3.33 -  0.01',
        decile10: '0',
        isToppedOut: 'No'
      };
      var benchmark1 = formatBenchmarkRecord(record, {benchmarkYear: 2002, performanceYear: 2004});
      var benchmark2 = formatBenchmarkRecord(record, {benchmarkYear: 2004, performanceYear: 2006});

      expect(benchmark1.performanceYear).to.equal(2004);
      expect(benchmark2.performanceYear).to.equal(2006);
    });

    describe('When a direct (non-inverse) measure', function() {
      describe('When there are no gaps between between Deciles 3 and 10', function() {
        var record = {
          measureName: 'Documentation of Current Medications in the Medical Record',
          qualityId: '130',
          submissionMethod: 'EHR',
          measureType: 'Process',
          benchmark: 'Y',
          decile3: '76.59 - 87.88',
          decile4: '87.89 - 92.73',
          decile5: '92.74 - 95.35',
          decile6: '95.36 - 97.08',
          decile7: '97.09 - 98.27',
          decile8: '98.28 - 99.12',
          decile9: '99.13 - 99.75',
          decile10: '>= 99.76',
          isToppedOut: 'Yes'
        };
        var benchmark = formatBenchmarkRecord(record, options);

        it('should return the correct benchmark object', function() {
          expect(benchmark).to.exist;
          expect(benchmark.measureId, 'measureId').to.equal('CMS68v60419130');
          expect(benchmark.submissionMethod, 'submissionMethod').to.equal('ehr');
          expect(benchmark.benchmarkYear, 'benchmarkYear').to.equal(2016);
          expect(benchmark.performanceYear, 'performanceYear').to.equal(2018);
          expect(benchmark.deciles).to.eql([0, 76.59, 87.89, 92.74, 95.36, 97.09, 98.28, 99.13, 99.76]);
        });
      });

      describe('When Deciles 3 through 9 are not defined', function() {
        var record = {
          measureName: 'Breast Cancer Resection Pathology Reporting: pT Category (Primary Tumor) and pN Category (Regional Lymph Nodes) with Histologic Grade',
          qualityId: '99',
          submissionMethod: 'Claims',
          measureType: 'Process',
          benchmark: 'Y',
          decile3: '--',
          decile4: '--',
          decile5: '--',
          decile6: '--',
          decile7: '--',
          decile8: '--',
          decile9: '--',
          decile10: '100',
          isToppedOut: 'Yes'
        };
        var benchmark = formatBenchmarkRecord(record, options);

        it('should return the correct benchmark object', function() {
          expect(benchmark).to.exist;
          expect(benchmark.measureId, 'measureId').to.equal('0391099');
          expect(benchmark.submissionMethod, 'submissionMethod').to.equal('claims');
          expect(benchmark.benchmarkYear, 'benchmarkYear').to.equal(2016);
          expect(benchmark.performanceYear, 'performanceYear').to.equal(2018);
          expect(benchmark.deciles).to.eql([100, 100, 100, 100, 100, 100, 100, 100, 100]);
        });
      });
    });

    describe('When an inverse measure', function() {
      describe('When Deciles 3 through 10 are all defined, i.e. not null or \'--\'', function() {
        describe('When Decile 10 is equal to 0', function() {
          it('should return the correct benchmark object', function() {
            var record = {
              measureName: 'Diabetes: Hemoglobin A1c Poor Control',
              qualityId: '1',
              submissionMethod: 'EHR',
              measureType: 'Outcome',
              benchmark: 'Y',
              decile3: '54.67 - 35.91',
              decile4: '35.90 - 25.63',
              decile5: '25.62 - 19.34',
              decile6: '19.33 - 14.15',
              decile7: '14.14 -  9.10',
              decile8: '9.09 -  3.34',
              decile9: '3.33 -  0.01',
              decile10: '0',
              isToppedOut: 'No'
            };
            var benchmark = formatBenchmarkRecord(record, options);

            expect(benchmark).to.exist;
            expect(benchmark.measureId, 'measureId').to.equal('CMS122v50059001');
            expect(benchmark.submissionMethod, 'submissionMethod').to.equal('ehr');
            expect(benchmark.benchmarkYear, 'benchmarkYear').to.equal(2016);
            expect(benchmark.performanceYear, 'performanceYear').to.equal(2018);
            expect(benchmark.deciles).to.eql([100, 54.67, 35.90, 25.62, 19.33, 14.14, 9.09, 3.33, 0]);
          });
        });
        describe('When Decile 10 is less than or equal to x', function() {
          it('should return the correct benchmark object', function() {
            var record = {
              measureName: 'Diabetes: Hemoglobin A1c Poor Control',
              qualityId: '1',
              submissionMethod: 'Claims',
              measureType: 'Outcome',
              benchmark: 'Y',
              decile3: '35.00 - 25.72',
              decile4: '25.71 - 20.32',
              decile5: '20.31 - 16.23',
              decile6: '16.22 - 13.05',
              decile7: '13.04 - 10.01',
              decile8: '10.00 -  7.42',
              decile9: '7.41 -  4.01',
              decile10: '<=  4.00',
              isToppedOut: 'No'
            };
            var benchmark = formatBenchmarkRecord(record, options);

            expect(benchmark).to.exist;
            expect(benchmark.measureId, 'measureId').to.equal('CMS122v50059001');
            expect(benchmark.submissionMethod, 'submissionMethod').to.equal('claims');
            expect(benchmark.benchmarkYear, 'benchmarkYear').to.equal(2016);
            expect(benchmark.performanceYear, 'performanceYear').to.equal(2018);
            expect(benchmark.deciles, 'deciles').to.eql([100, 35.00, 25.71, 20.31, 16.22, 13.04, 10.00, 7.41, 4.00]);
          });
        });
      });

      describe('When Deciles 3 through 9 are not defined', function() {
        var record = {
          measureName: 'Anaphylaxis During Anesthesia Care',
          qualityId: '1', // ABG 11
          submissionMethod: 'Registry/QCDR',
          measureType: 'Outcome',
          benchmark: 'Y',
          decile3: '--',
          decile4: '--',
          decile5: '--',
          decile6: '--',
          decile7: '--',
          decile8: '--',
          decile9: '--',
          decile10: '0',
          isToppedOut: 'Yes'
        };
        var benchmark = formatBenchmarkRecord(record, options);

        it('should return the correct benchmark object', function() {
          expect(benchmark).to.exist;
          expect(benchmark.measureId, 'measureId').to.equal('CMS122v50059001');
          expect(benchmark.submissionMethod, 'submissionMethod').to.equal('registry');
          expect(benchmark.benchmarkYear, 'benchmarkYear').to.equal(2016);
          expect(benchmark.performanceYear, 'performanceYear').to.equal(2018);
          expect(benchmark.deciles).to.eql([0, 0, 0, 0, 0, 0, 0, 0, 0]);
        });
      });

      describe('When there is one gap between Deciles 3 and 10', function() {
        var record = {
          measureName: 'Primary Open-Angle Glaucoma (POAG): Optic Nerve Evaluation',
          qualityId: '12',
          submissionMethod: 'Claims',
          measureType: 'Process',
          benchmark: 'Y',
          decile3: '99.01 - 99.99',
          decile4: '--',
          decile5: '--',
          decile6: '--',
          decile7: '--',
          decile8: '--',
          decile9: '--',
          decile10: '100',
          isToppedOut: 'Y'
        };
        var benchmark = formatBenchmarkRecord(record, options);

        it('should return the correct benchmark object', function() {
          expect(benchmark).to.exist;
          expect(benchmark.measureId, 'measureId').to.equal('CMS143v50086012');
          expect(benchmark.submissionMethod, 'submissionMethod').to.equal('claims');
          expect(benchmark.benchmarkYear, 'benchmarkYear').to.equal(2016);
          expect(benchmark.performanceYear, 'performanceYear').to.equal(2018);
          expect(benchmark.deciles).to.eql([0, 99.01, 100, 100, 100, 100, 100, 100, 100]);
        });
      });
      describe('When there are two gaps between Deciles 3 and 10', function() {
        var record = {
          measureName: 'CT IV Contrast Extravasation Rate (Low Osmolar Contrast Media)',
          qualityId: '1', // ACRad 20
          submissionMethod: 'Registry/QCDR',
          measureType: 'Outcome',
          benchmark: 'Y',
          decile3: '0.13 -  0.13',
          decile4: '--',
          decile5: '--',
          decile6: '0.12 -  0.01',
          decile7: '--',
          decile8: '--',
          decile9: '--',
          decile10: '0',
          isToppedOut: 'Y'
        };
        var benchmark = formatBenchmarkRecord(record, options);

        it('should return the correct benchmark object', function() {
          expect(benchmark).to.exist;
          expect(benchmark.measureId, 'measureId').to.equal('CMS122v50059001');
          expect(benchmark.submissionMethod, 'submissionMethod').to.equal('registry');
          expect(benchmark.benchmarkYear, 'benchmarkYear').to.equal(2016);
          expect(benchmark.performanceYear, 'performanceYear').to.equal(2018);
          expect(benchmark.deciles).to.eql([100, 0.13, 0.12, 0.12, 0.12, 0, 0, 0, 0]);
        });
      });
    });
  });
});
