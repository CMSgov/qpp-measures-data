import json
from pathlib import Path
import os
import argparse

import measure_classes as mc
from mixins import StringFormatterMixin


class SingleSourceJsonComparisonRunner(StringFormatterMixin):
    def __init__(self, file1, file2):
        self.file1 = file1
        self.file2 = file2
        self.output_dir = ""
        self.source_dir = ""
        self.diff_list = []

    def setup_report_dir(self):
        current_dir = Path().absolute()
        output_dir = current_dir / "json_report"
        source_dir = current_dir.parent.parent / "data"
        os.makedirs(output_dir, exist_ok=True)
        self.output_dir = output_dir
        self.source_dir = source_dir

    def is_eligibility_options(self, key, data):
        return key == "eligibilityOptions" and isinstance(data, list)

    def is_measure_id(self, key, data):
        return key == "measureId" and isinstance(data, str)

    def is_performance_options(self, key, data):
        return key == "performanceOptions" and isinstance(data, list)

    def process_measure(self, id, code, filename):
        m = mc.Measure(id, filename)
        m.eligibility_options = self.dispatch(
            "eligibilityOptions", code["eligibilityOptions"]
        )
        m.measure_id = self.dispatch("measureId", code["measureId"])
        m.performance_options = self.dispatch(
            "performanceOptions", code["performanceOptions"]
        )
        return m

    def create_procedure_code(self, x):
        pc = mc.ProcedureCode()
        pc.code = x["code"] if x.get("code") else None
        pc.modifier_exclusions = (
            sorted(x["modifierExclusions"]) if x.get("modifierExclusions") else []
        )
        pc.places_of_service_exclusions = (
            sorted(x["placesOfServiceExclusions"])
            if x.get("placesOfServiceExclusions")
            else []
        )
        return pc

    def process_procedure_code(self, opt):
        return [self.create_procedure_code(x) for x in opt["procedureCodes"]]

    def process_additional_procedure_codes(self, opt):
        return [self.create_procedure_code(x) for x in opt["additionalProcedureCodes"]]

    def create_eligibility_option(self, opt):
        eo = mc.EligibilityOption()
        eo.diagnosis_codes = (
            sorted(opt["diagnosisCodes"]) if opt.get("diagnosisCodes") else []
        )
        eo.procedure_codes = sorted(self.process_procedure_code(opt))
        eo.min_age = opt["minAge"]
        eo.max_age = opt["maxAge"] if opt.get("maxAge") else None
        eo.option_group = opt["optionGroup"] if opt.get("optionGroup") else None
        eo.sex_code = opt["sexCode"] if opt.get("sexCode") else None
        eo.additional_procedure_codes = (
            sorted(self.process_additional_procedure_codes(opt))
            if opt.get("additionalProcedureCodes")
            else []
        )
        return eo

    def process_eligibility_options(self, data):
        return [self.create_eligibility_option(opt) for opt in data]

    def process_measure_id(self, data):
        mid = mc.MeasureId(data)
        return mid

    def create_quality_codes(self, code):
        qc = mc.QualityCode()
        qc.code = code["code"]
        qc.modifiers = sorted(code["modifiers"]) if code.get("modifiers") else []
        qc.modifier_exclusions = (
            sorted(code["modifierExclusions"]) if code.get("modifierExclusions") else []
        )
        qc.places_of_service_exclusions = (
            sorted(code["placesOfServiceExclusions"])
            if code.get("placesOfServiceExclusions")
            else []
        )
        return qc

    def process_quality_codes(self, codes):
        return sorted([self.create_quality_codes(code) for code in codes])

    def create_performance_options(self, opt):
        po = mc.PerformanceOption()
        po.option_group = opt["optionGroup"] if opt.get("optionGroup") else None
        po.option_type = opt["optionType"]
        po.quality_codes = self.process_quality_codes(opt["qualityCodes"])
        return po

    def process_performance_options(self, data):
        sorted_opts = sorted([self.create_performance_options(opt) for opt in data])
        return sorted_opts

    def dispatch(self, key, code):
        if self.is_eligibility_options(key, code):
            return self.process_eligibility_options(code)
        if self.is_measure_id(key, code):
            return self.process_measure_id(code)
        if self.is_performance_options(key, code):
            return self.process_performance_options(code)

    def get_missing_measures(self, measures1, measures2, file1, file2):
        in_1_not_2 = [m.id for m in measures1 if m.id not in [m.id for m in measures2]]
        self.diff_list = self.append_string(
            f"**Measures in {file1} but not in {file2}:**\n {self.convert_list_to_bullets(in_1_not_2)}"
        )
        in_2_not_1 = [m.id for m in measures2 if m.id not in [m.id for m in measures1]]
        self.diff_list = self.append_string(
            f"**Measures in {file2} but not in {file1}:**\n {self.convert_list_to_bullets(in_2_not_1)}"
        )

    def get_common_measures(self, measures1, measures2):
        common_measue1 = [m for m in measures1 if m.id in [m.id for m in measures2]]
        common_measure2 = [m for m in measures2 if m.id in [m.id for m in measures1]]
        common = list(zip(common_measue1, common_measure2))
        self.diff_list = self.append_string(
            f"**Measures in both that differ:**\n  {self.convert_list_to_bullets([m[0].id for m in common])}"
        )
        return common

    def compare_common_pairs(self, common_measures, report_dir):
        for m1, m2 in common_measures:
            if m1 != m2:
                m1.compare(m2)
                with open(f"{report_dir}/measure{m1.id}.md", "w") as f:
                    f.write("\n".join(m1.diff_list))

    def load_file_data(self):
        with open(f"{self.source_dir}/{self.file1}") as f1, open(
            f"{self.source_dir}/{self.file2}"
        ) as f2:
            data1 = json.load(f1)
            data2 = json.load(f2)
            return (data1, data2)

    def write_summary_data(self):
        with open(f"{self.output_dir}/_Summary.md", "w") as f:
            f.write("\n".join(self.diff_list))

    def run(self):
        self.setup_report_dir()
        data1, data2 = self.load_file_data()
        measures1 = [self.process_measure(d, data1[d], self.file1) for d in data1]
        measures2 = [self.process_measure(d, data2[d], self.file2) for d in data2]
        self.diff_list = self.append_string(
            f"# SUMMARY DIFF REPORT COMPARING {self.file1} and {self.file2}"
        )
        self.get_missing_measures(measures1, measures2, self.file1, self.file2)
        common_measures = self.get_common_measures(measures1, measures2)
        self.write_summary_data()
        self.compare_common_pairs(common_measures, self.output_dir)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Parse arguments')
    parser.add_argument('--base', type=str, help='Base file expected under data ',default="qpp-single-source-2021.json")
    parser.add_argument('--new', type=str, help='New file expected under data ',default="qpp-single-source-2022.json")
    args = parser.parse_args()
    file1 = args.base
    file2 = args.new
    runner = SingleSourceJsonComparisonRunner(file1, file2)
    runner.run()
