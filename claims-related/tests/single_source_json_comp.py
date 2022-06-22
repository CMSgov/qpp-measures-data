import json
import copy
import re
from pathlib import Path
import os

from measure_classes import *


def setup_report_dir():
    current_dir = Path().absolute()
    rep_dir = current_dir / "json_report"
    source_dir = current_dir.parent / "data"
    os.makedirs(rep_dir, exist_ok=True)
    return (rep_dir, source_dir)


def is_eligibility_options(key, data):
    return key == "eligibilityOptions" and isinstance(data, list)

def is_id(key, data):
    return re.search(r"\d{3}", key) and isinstance(data, dict)

def is_measure_id(key, data):
    return key == "measureId" and isinstance(data, str)

def is_performance_options(key, data):
    return key == "performanceOptions" and isinstance(data, list)
    

def process_measure(id, code, filename):
    m = Measure(id, filename)
    m.eligibility_options = dispatch("eligibilityOptions", code["eligibilityOptions"])
    m.measure_id = dispatch("measureId", code["measureId"])
    m.performance_options = dispatch("performanceOptions", code["performanceOptions"])
    return m

def create_procedure_code(x):
    pc = ProcedureCode()
    pc.code = x["code"] if x.get("code") else None
    pc.modifier_exclusions = sorted(x["modifierExclusions"]) if x.get("modifierExclusions") else []
    pc.places_of_service_exclusions = sorted(x["placesOfServiceExclusions"]) if x.get("placesOfServiceExclusions") else []
    return pc

def process_procedure_code(opt):
    return [create_procedure_code(x) for x in opt["procedureCodes"]]

def process_additional_procedure_codes(opt):
    return [create_procedure_code(x) for x in opt["additionalProcedureCodes"]]


def create_eligibility_option(opt):
        eo = EligibilityOption()
        eo.diagnosis_codes = sorted(opt["diagnosisCodes"]) if opt.get("diagnosisCodes") else []
        eo.procedure_codes = sorted(process_procedure_code(opt))
        eo.min_age = opt["minAge"]
        eo.max_age = opt["maxAge"] if opt.get("maxAge") else None
        eo.option_group = opt["optionGroup"] if opt.get("optionGroup") else None
        eo.sex_code = opt["sexCode"] if opt.get("sexCode") else None
        eo.additional_procedure_codes = sorted(process_additional_procedure_codes(opt)) if opt.get("additionalProcedureCodes") else []
        return eo

def process_eligibility_options(key, data):
    return [create_eligibility_option(opt) for opt in data]

def process_measure_id(key, data):
    mid = MeasureId(data)
    return mid


def create_quality_codes(code):
    qc = QualityCode()
    qc.code = code["code"]
    qc.modifiers = sorted(code["modifiers"]) if code.get("modifiers") else []
    qc.modifier_exclusions = sorted(code["modifierExclusions"]) if code.get("modifierExclusions") else []
    qc.places_of_service_exclusions = sorted(code["placesOfServiceExclusions"]) if code.get("placesOfServiceExclusions") else []
    return qc

def process_quality_codes(codes):
    return sorted([create_quality_codes(code) for code in codes])


def create_performance_options(opt):
    po = PerformanceOption()
    po.option_group = opt["optionGroup"] if opt.get("optionGroup") else None
    po.option_type = opt["optionType"]
    po.quality_codes = process_quality_codes(opt["qualityCodes"])
    return po

def process_performance_options(key, data):
    sorted_opts = sorted([create_performance_options(opt) for opt in data])
    return sorted_opts
        


def dispatch(key, code):
    if is_id(key, code):
        return process_measure(key, code)
    if is_eligibility_options(key, code):
        return process_eligibility_options(key, code)
    if is_measure_id(key, code):
        return process_measure_id(key, code)
    if is_performance_options(key, code):
        return process_performance_options(key, code)


def get_missing_measures(measures1, measures2, file1, file2):
    in_1_not_2 = [m.id for m in measures1 if m.id not in [m.id for m in measures2]]
    print(f"measures in {file1} but not in {file2}: ", in_1_not_2)
    in_2_not_1 = [m.id for m in measures2 if m.id not in [m.id for m in measures1]]
    print(f"measures in {file2} but not in {file1}: ", in_2_not_1)

def get_common_measures(measures1, measures2):
    common_measue1 = [m for m in measures1 if m.id in [m.id for m in measures2]]
    common_measure2 = [m for m in measures2 if m.id in [m.id for m in measures1]]
    common = list(zip(common_measue1, common_measure2))
    print(f"Measures in both that differ: {[m[0].id for m in common]}")
    return common

def compare_common_pairs(common_measures, report_dir):
    for m1,m2 in common_measures:
        if m1 != m2:
            m1.compare(m2)
            with open(f"{report_dir}/measure{m1.id}.md", "w") as f:
                f.write("\n".join(m1.diff_str))



if __name__ == "__main__":

    file1 = "qpp-single-source-2020.json"
    file2 = "qpp-single-source-2021.json"
    report_dir, source_dir = setup_report_dir()

    with open(f"{source_dir}/{file1}") as f:
        data1 = json.load(f)

    with open(f"{source_dir}/{file2}") as f:
        data2 = json.load(f)

    measures1 = [process_measure(d, data1[d], file1) for d in data1]
    measures2 = [process_measure(d, data2[d], file2) for d in data2]

    get_missing_measures(measures1, measures2, file1, file2)
    common_measures = get_common_measures(measures1, measures2)
    compare_common_pairs(common_measures, report_dir)

