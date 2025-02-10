"""
Construct the single source json from the parsed single source
"""
import sys
import argparse
from pathlib import Path
from itertools import chain
import numpy as np
import json

from single_source.parser import Column, Option, read_single_source_csv, parse_single_source


INCLUSION_EXCLUSION_RENAME = {
    "modifier_inclusion": "modifiers",
    "modifier_exclusion": "modifierExclusions",
    "place_of_service_inclusion": "placesOfService",
    "place_of_service_exclusion": "placesOfServiceExclusions"
}

PERFORMANCE_OPTIONS = [
    Option.eligible_exception,
    Option.eligible_exclusion,
    Option.performance_met,
    Option.performance_not_met,
]

PERFORMANCE_OPTION_RENAME = {
    Option.eligible_exception.value: "eligiblePopulationException",
    Option.eligible_exclusion.value: "eligiblePopulationExclusion",
    Option.performance_met.value: "performanceMet",
    Option.performance_not_met.value: "performanceNotMet",
}


def main():
    parsed_args = parse_args(sys.argv[1:])
    output_path = Path(parsed_args.output_path)
    if output_path.exists() and parsed_args.overwrite is False:
        raise FileExistsError("Pass --overwrite to overwrite existing file")
    single_source = read_single_source_csv(parsed_args.input_path)
    parsed_single_source = parse_single_source(single_source)
    formatted_json = format_json(parsed_single_source)
    write_json(formatted_json, parsed_args.output_path)


def parse_args(args):
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-path", type=str, required=True)
    parser.add_argument("--output-path", type=str, required=True)
    parser.add_argument("--overwrite", action="store_true")
    parsed_args = parser.parse_args(args)
    return parsed_args


def format_json(parsed_single_source):
    grouped = parsed_single_source.groupby("overall_measure_id")
    results = {}
    for m_id, grp in grouped:
        meas_fmtd = format_measure(grp, m_id)
        results.update({m_id: meas_fmtd})
    return results


def format_measure(data, measure_id):
    submission_groups = data.groupby("submission_criteria")

    performance_options = []
    eligibility_options = []
    for sg_ky, grp in submission_groups:
        perf_opts = get_all_performance_options(grp, sg_ky)
        performance_options.append(perf_opts)

        diagnosis = grp[Column.diagnosis.value].dropna().tolist()
        diagnosis_exclusion = grp[Column.diagnosis_exclusion.value].dropna().tolist()
        procedure = get_procedure(grp)
        additional_procedure = grp[Column.additional_procedure.value].\
            dropna().map(lambda x: dict(code=x)).\
            tolist()
        min_age = grp[Column.min_age.value].iloc[0]
        max_age = grp[Column.max_age.value].iloc[0]
        sex_code = grp[Column.sex_code.value].iloc[0]
        elig_opts = {
            "optionGroup": sg_ky,
            "procedureCodes": procedure,
        }
        if diagnosis:
            elig_opts.update({"diagnosisCodes": diagnosis})
        if diagnosis_exclusion:
            elig_opts.update({"diagnosisExclusionCodes": diagnosis_exclusion})
        if procedure:
            elig_opts.update({"procedureCodes": procedure})
        if additional_procedure:
            elig_opts.update({"additionalProcedureCodes": additional_procedure})
        if not np.isnan(min_age):
            elig_opts.update({"minAge": min_age})
        if not np.isnan(max_age):
            elig_opts.update({"maxAge": max_age})
        if not sex_code == "":
            elig_opts.update({"sexCode": sex_code})
        eligibility_options.append(elig_opts)

    result = {
        "eligibilityOptions": eligibility_options,
        "measureId": measure_id,
        "performanceOptions": list(chain.from_iterable(performance_options))
    }
    return result


def get_procedure(data):
    procedure_column = Column.procedure.value
    columns = [
        procedure_column,
        "modifier_inclusion",
        "modifier_exclusion",
        "place_of_service_inclusion",
        "place_of_service_exclusion"
    ]
    rename = {**INCLUSION_EXCLUSION_RENAME, procedure_column: "code"}
    option_data = data.loc[~data.loc[:, procedure_column].isna(), columns].rename(columns=rename)
    results = []
    for x in option_data.to_dict("records"):
        drop_empty_inc_exc = {k: v for k, v in x.items() if k == "code" or v}
        results.append(drop_empty_inc_exc)
    return results


def get_all_performance_options(data, submission_criteria):
    results = []
    for x in PERFORMANCE_OPTIONS:
        perf_opt = get_performance_option(data, x.value, submission_criteria)
        results.append(perf_opt)
    return list(chain.from_iterable(results))


def get_performance_option(data, option, submission_criteria):
    columns = [
        option,
        "modifier_inclusion",
        "modifier_exclusion",
        "place_of_service_inclusion",
        "place_of_service_exclusion",
        "code_set"
    ]
    rename = {**INCLUSION_EXCLUSION_RENAME, option: "code"}
    option_data = data.loc[~data.loc[:, option].isna(), columns].rename(columns=rename)
    not_a_set = "-1"
    option_data["code_set"] = option_data["code_set"].fillna(not_a_set)
    results = []
    for cd_st, x in option_data.groupby("code_set", dropna=False):
        if cd_st == not_a_set:
            for y in x.drop(columns=["code_set"]).to_dict("records"):
                drop_empty_inc_exc = {k: v for k, v in y.items() if k == "code" or v}
                results.append({"qualityCodes": [drop_empty_inc_exc],
                                "optionGroup": submission_criteria,
                                "optionType": PERFORMANCE_OPTION_RENAME.get(option)})
        else:
            quality_codes = []
            for y in x.drop(columns=["code_set"]).to_dict("records"):
                drop_empty_inc_exc = {k: v for k, v in y.items() if k == "code" or v}
                quality_codes.append(drop_empty_inc_exc)
            results.append({"qualityCodes": quality_codes,
                            "optionGroup": submission_criteria,
                            "optionType": PERFORMANCE_OPTION_RENAME.get(option)})
    return results


def write_json(json_data, file_path):
    with open(file_path, "w") as file_handle:
        json.dump(json_data, file_handle, sort_keys=True, indent=4)


if __name__ == "__main__":
    main()
