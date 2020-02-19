const chai = require('chai');
const assert = chai.assert;
// Utils
const { formatBenchmarkRecord, formatMeasureId } = require('./../../../scripts/benchmarks/format-benchmark-record');

const options = {
  benchmarkYear: 2016,
  performanceYear: 2018
};

describe('formatMeasureId', function() {
  // when benchmarks are updated for 2018, the tests below should be duplicated
  // for appropriate measures in 2018
  const year = 2017;

  it('parses a recognized measureId correctly', function() {
    assert.equal(formatMeasureId('1', year), '001');
  });

  it('parses an unrecognized measureId with a space correctly', function() {
    assert.equal(formatMeasureId('USWR 13', year), 'USWR13');
  });

  it('parses a recognized measureId with a underscore correctly', function() {
    assert.equal(formatMeasureId('ASBS_1', year), 'ASBS1');
  });

  it('parses a recognized measureId with underscores correctly', function() {
    assert.equal(formatMeasureId('ACI_ONCDIR_1', year), 'ACI_ONCDIR_1');
    assert.equal(formatMeasureId('ACI_ONCDIR 1', year), 'ACI_ONCDIR_1');
    assert.equal(formatMeasureId('ACI ONCDIR 1', year), 'ACI_ONCDIR_1');
  });

  it('parses an unrecognized measure and removes spaces', function() {
    assert.equal(formatMeasureId('R_O G__E R 13', year), 'R_OG__ER13');
  });
});

describe('formatBenchmarkRecord', function() {
  describe('When qualityId of the record does NOT correspond to a measure', function() {
    it('should still be created', function() {
      const record = {
        measureName: 'Complications or Side Effects among patients undergoing Treatment with HBOT',
        qualityId: 'USWR 1800',
        submissionMethod: 'Registry/QCDR',
        measureType: 'Outcome',
        benchmark: 'Y',
        decile3: '98.99 - 99.07',
        decile4: '99.08 - 99.48',
        decile5: '99.49 - 99.78',
        decile6: '99.79 - 99.84',
        decile7: '99.85 - 99.99',
        decile8: ' -- ',
        decile9: ' -- ',
        decile10: '100',
        isToppedOut: 'Yes',
        isToppedOutByProgram: 'No',
        isHighPriority: 'No'
      };
      const benchmark = formatBenchmarkRecord(record, options);

      assert.equal(benchmark.measureId, 'USWR1800');
    });

    it('should still be created with padded 0s up to the hundredth place', function() {
      const record = {
        measureName: 'Complications or Side Effects among patients undergoing Treatment with HBOT',
        qualityId: '6',
        submissionMethod: 'Registry/QCDR',
        measureType: 'Outcome',
        benchmark: 'Y',
        decile3: '98.99 - 99.07',
        decile4: '99.08 - 99.48',
        decile5: '99.49 - 99.78',
        decile6: '99.79 - 99.84',
        decile7: '99.85 - 99.99',
        decile8: ' -- ',
        decile9: ' -- ',
        decile10: '100',
        isToppedOut: 'Yes',
        isToppedOutByProgram: 'No',
        isHighPriority: 'No'
      };
      const benchmark = formatBenchmarkRecord(record, options);

      assert.equal(benchmark.measureId, '006');
    });
  });

  describe('When benchmark property of record is \'N\'', function() {
    it('should return undefined', function() {
      const record = {
        measureName: 'Prostate Cancer: Avoidance of Overuse of Bone Scan for Staging Low Risk Prostate Cancer Patients',
        qualityId: '102',
        submissionMethod: 'eCQM',
        measureType: 'Process',
        benchmark: 'N',
        decile3: ' -- ',
        decile4: ' -- ',
        decile5: ' -- ',
        decile6: ' -- ',
        decile7: ' -- ',
        decile8: ' -- ',
        decile9: ' -- ',
        decile10: ' -- ',
        isToppedOut: ' -- ',
        isToppedOutByProgram: '--',
        isHighPriority: ' -- '
      };
      const benchmark = formatBenchmarkRecord(record, options);

      assert.isUndefined(benchmark);
    });
  });

  describe('When qualityId of the record does correspond to a measure', function() {
    it('should have the correct benchmarkYear based on the options argument', function() {
      const record = {
        measureName: 'Diabetes: Hemoglobin A1c Poor Control',
        qualityId: '1',
        submissionMethod: 'eCQM',
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
        isToppedOut: 'No',
        isToppedOutByProgram: 'No',
        isHighPriority: 'No'
      };
      const benchmark1 = formatBenchmarkRecord(record, {benchmarkYear: 2002, performanceYear: 2017});
      const benchmark2 = formatBenchmarkRecord(record, {benchmarkYear: 2004, performanceYear: 2018});

      assert.equal(benchmark1.benchmarkYear, 2002);
      assert.equal(benchmark2.benchmarkYear, 2004);
    });
    it('should have the correct performanceYear based on the options argument', function() {
      const record = {
        measureName: 'Diabetes: Hemoglobin A1c Poor Control',
        qualityId: '1',
        submissionMethod: 'eCQM',
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
        isToppedOut: 'No',
        isToppedOutByProgram: 'No',
        isHighPriority: 'No'
      };
      const benchmark1 = formatBenchmarkRecord(record, {benchmarkYear: 2002, performanceYear: 2017});
      const benchmark2 = formatBenchmarkRecord(record, {benchmarkYear: 2004, performanceYear: 2018});

      assert.equal(benchmark1.performanceYear, 2017);
      assert.equal(benchmark2.performanceYear, 2018);
    });

    describe('When a direct (non-inverse) measure', function() {
      describe('When there are no gaps between between Deciles 3 and 10', function() {
        const record = {
          measureName: 'Documentation of Current Medications in the Medical Record',
          qualityId: '130',
          submissionMethod: 'eCQM',
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
          isToppedOut: 'Yes',
          isToppedOutByProgram: 'No',
          isHighPriority: 'No'
        };
        const benchmark = formatBenchmarkRecord(record, options);

        it('should return the correct benchmark object', function() {
          assert.isDefined(benchmark);
          assert.equal(benchmark.measureId, '130', 'measureId');
          assert.equal(benchmark.submissionMethod, 'electronicHealthRecord', 'submissionMethod');
          assert.equal(benchmark.benchmarkYear, 2016, 'benchmarkYear');
          assert.equal(benchmark.performanceYear, 2018, 'performanceYear');
          assert.deepEqual(benchmark.deciles, [0, 76.59, 87.89, 92.74, 95.36, 97.09, 98.28, 99.13, 99.76], 'deciles');
          assert.equal(benchmark.isToppedOutByProgram, false);
        });
      });

      describe('When Deciles 3 through 9 are not defined', function() {
        const record = {
          measureName: 'Breast Cancer Resection Pathology Reporting: pT Category (Primary Tumor) and pN Category (Regional Lymph Nodes) with Histologic Grade',
          qualityId: '99',
          submissionMethod: 'Medicare Part B Claims',
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
          isToppedOut: 'Yes',
          isToppedOutByProgram: 'No',
          isHighPriority: 'No'
        };
        const benchmark = formatBenchmarkRecord(record, options);

        it('should return the correct benchmark object', function() {
          assert.isDefined(benchmark);
          assert.equal(benchmark.measureId, '099', 'measureId');
          assert.equal(benchmark.submissionMethod, 'claims', 'submissionMethod');
          assert.equal(benchmark.benchmarkYear, 2016, 'benchmarkYear');
          assert.equal(benchmark.performanceYear, 2018, 'performanceYear');
          assert.deepEqual(benchmark.deciles, [0, 100, 100, 100, 100, 100, 100, 100, 100], 'deciles');
        });
      });
    });

    describe('When an inverse measure', function() {
      describe('When Deciles 3 through 10 are all defined, i.e. not null or \'--\'', function() {
        describe('When Decile 10 is equal to 0', function() {
          it('should return the correct benchmark object', function() {
            const record = {
              measureName: 'Diabetes: Hemoglobin A1c Poor Control',
              qualityId: '1',
              submissionMethod: 'eCQM',
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
              isToppedOut: 'No',
              isToppedOutByProgram: 'Yes - words',
              isHighPriority: 'No'
            };
            const benchmark = formatBenchmarkRecord(record, options);

            assert.isDefined(benchmark);
            assert.equal(benchmark.measureId, '001', 'measureId');
            assert.equal(benchmark.submissionMethod, 'electronicHealthRecord', 'submissionMethod');
            assert.equal(benchmark.benchmarkYear, 2016, 'benchmarkYear');
            assert.equal(benchmark.performanceYear, 2018, 'performanceYear');
            assert.deepEqual(benchmark.deciles, [100, 54.67, 35.90, 25.62, 19.33, 14.14, 9.09, 3.33, 0], 'deciles');
            assert.equal(benchmark.isToppedOutByProgram, true);
          });
        });
        describe('When Decile 10 is less than or equal to x', function() {
          it('should return the correct benchmark object', function() {
            const record = {
              measureName: 'Diabetes: Hemoglobin A1c Poor Control',
              qualityId: '1',
              submissionMethod: 'Medicare Part B Claims',
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
              isToppedOut: 'No',
              isToppedOutByProgram: 'No',
              isHighPriority: 'No'
            };
            const benchmark = formatBenchmarkRecord(record, options);

            assert.isDefined(benchmark);
            assert.equal(benchmark.measureId, '001', 'measureId');
            assert.equal(benchmark.submissionMethod, 'claims', 'submissionMethod');
            assert.equal(benchmark.benchmarkYear, 2016, 'benchmarkYear');
            assert.equal(benchmark.performanceYear, 2018, 'performanceYear');
            assert.deepEqual(benchmark.deciles, [100, 35.00, 25.71, 20.31, 16.22, 13.04, 10.00, 7.41, 4.00], 'deciles');
          });
        });
      });

      describe('When Deciles 3 through 9 are not defined', function() {
        const record = {
          measureName: 'Anaphylaxis During Anesthesia Care',
          qualityId: '1', // ABG 11
          submissionMethod: 'MIPS CQM',
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
          isToppedOut: 'Yes',
          isToppedOutByProgram: 'No',
          isHighPriority: 'No'
        };

        it('should return the correct benchmark object', function() {
          const benchmark = formatBenchmarkRecord(record, options);
          assert.isDefined(benchmark);
          assert.equal(benchmark.measureId, '001', 'measureId');
          assert.equal(benchmark.submissionMethod, 'registry', 'submissionMethod');
          assert.equal(benchmark.benchmarkYear, 2016, 'benchmarkYear');
          assert.equal(benchmark.performanceYear, 2018, 'performanceYear');
          assert.deepEqual(benchmark.deciles, [100, 0, 0, 0, 0, 0, 0, 0, 0], 'deciles');
        });
      });

      describe('When there is one gap between Deciles 3 and 10', function() {
        const record = {
          measureName: 'Primary Open-Angle Glaucoma (POAG): Optic Nerve Evaluation',
          qualityId: '12',
          submissionMethod: 'Medicare Part B Claims',
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
          isToppedOut: 'Y',
          isToppedOutByProgram: 'No',
          isHighPriority: 'No'
        };
        const benchmark = formatBenchmarkRecord(record, options);

        it('should return the correct benchmark object', function() {
          assert.isDefined(benchmark);
          assert.equal(benchmark.measureId, '012', 'measureId');
          assert.equal(benchmark.submissionMethod, 'claims', 'submissionMethod');
          assert.equal(benchmark.benchmarkYear, 2016, 'benchmarkYear');
          assert.equal(benchmark.performanceYear, 2018, 'performanceYear');
          assert.deepEqual(benchmark.deciles, [0, 99.01, 100, 100, 100, 100, 100, 100, 100], 'deciles');
        });
      });
      describe('When there are two gaps between Deciles 3 and 10', function() {
        const record = {
          measureName: 'CT IV Contrast Extravasation Rate (Low Osmolar Contrast Media)',
          qualityId: '1', // ACRad 20
          submissionMethod: 'QCDR Measure',
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
          isToppedOut: 'Y',
          isToppedOutByProgram: 'No',
          isHighPriority: 'No'
        };
        const benchmark = formatBenchmarkRecord(record, options);

        it('should return the correct benchmark object', function() {
          assert.isDefined(benchmark);
          assert.equal(benchmark.measureId, '001', 'measureId');
          assert.equal(benchmark.submissionMethod, 'registry', 'submissionMethod');
          assert.equal(benchmark.benchmarkYear, 2016, 'benchmarkYear');
          assert.equal(benchmark.performanceYear, 2018, 'performanceYear');
          assert.deepEqual(benchmark.deciles, [100, 0.13, 0.12, 0.12, 0.12, 0, 0, 0, 0], 'deciles');
        });
      });
    });
  });
});
