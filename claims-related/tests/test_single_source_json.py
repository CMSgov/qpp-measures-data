import pytest
import json
import re
import os
import pandas as pd
from pprint import pprint

CURRENT_YEAR = "2021"
CSV_VERSION = "v1.3"

# Source data files. QPP_MEASURES_DATA_ROOT needs configuring.
QPP_MEASURES_DATA_ROOT = "../"
SINGLE_SOURCE_OUTPUT_JSON = os.path.join(
    QPP_MEASURES_DATA_ROOT, "measures", CURRENT_YEAR, "measures-data.json"
)
SINGLE_SOURCE_CSV = os.path.join(
    QPP_MEASURES_DATA_ROOT,
    "claims-related",
    "data",
    f"{CURRENT_YEAR}_Claims_SingleSource_{CSV_VERSION}.csv",
)
MEASURES_SOURCE_JSON = os.path.join(
    QPP_MEASURES_DATA_ROOT, "util", "measures", CURRENT_YEAR, "enriched-measures-data-quality.json"
)


@pytest.fixture(scope="session")
def single_source_df():
    """Load single source file into a DataFrame."""
    column_data_types = {
        "age": "str",
        "code": "str",
        "coding_system": "str",
        "data_element_name": "str",
        "gender": "str",
        "measure": "str",
        "modifier": "str",
        "place_of_service": "str",
        "reporting_method": "str",
    }
    with open(SINGLE_SOURCE_CSV, "rb") as f:
        native_ss = pd.read_csv(f, dtype=column_data_types)

    # Update column names.
    native_ss.rename(columns=format_column_title, inplace=True)

    # Strip text in the dataframe.
    for col in native_ss.columns:
        native_ss[col] = native_ss[col].dropna().astype("str").str.strip()

    native_ss.drop_duplicates(inplace=True)

    native_ss["codeset_number"] = native_ss["data_element_name"].str.extract(
        r"_([0-9]+)", expand=False
    )
    native_ss["option_group"] = native_ss["measure"].str.extract(
        r"\.([0-9]+)", expand=False
    ).str.zfill(2)
    native_ss["codeset_number"].fillna(-1, inplace=True)
    native_ss["option_group"].fillna("00", inplace=True)
    native_ss["codeset_number"] = native_ss["codeset_number"].astype(int)
    dx_two = re.compile("^DX_CODE_2")
    for row in native_ss.itertuples():
        measure_id = "{:06.2f}".format(float(row.measure))
        if re.match(dx_two, row.data_element_name):
            measure_id = measure_id[:-1] + "1"
        native_ss.at[row.Index, "measure"] = measure_id

    return native_ss


@pytest.fixture(scope="session")
def measures_source_json():
    """Pulls only the relevant measure ids out of the measures source json."""

    with open(MEASURES_SOURCE_JSON, "r") as f:
        output_json = []

        for measure in json.load(f):
            if "claims" in measure["submissionMethods"]:
                output_json.append(measure)
        return output_json


@pytest.fixture(scope="session")
def single_source_output_json():
    """Pulls only the relevant measure ids out of the single source output json."""

    with open(SINGLE_SOURCE_OUTPUT_JSON, "r") as f:
        output_json = []

        for measure in json.load(f):
            if "submissionMethods" in measure:
                if "claims" in measure["submissionMethods"]:
                    output_json.append(measure)

        return output_json


def format_column_title(c_name):
    """Clean up a column title by removing/replacing special characters."""
    str_patterns = {"([-,*'#])\n": "", " -./: ;": "_"}

    for from_ch_g, to_ch in str_patterns.items():
        for ch in from_ch_g:
            c_name = c_name.replace(ch, to_ch).strip(" _")

    if c_name.lower() == "measure_id":
        return "measure"

    return c_name.lower()


def format_json_measure_id(json_diag_codes, measure):
    """Append relevant measureId to the given list."""
    measure_id = measure["measureId"]

    if "eligibilityOptions" in measure.keys():
        for i, opt in enumerate(measure["eligibilityOptions"]):
            if measure_id + ".0" + str(i) not in json_diag_codes:
                json_diag_codes.append(measure_id + ".0" + str(i))
    elif measure_id + ".00" not in json_diag_codes:
        json_diag_codes.append(measure_id + ".00")

    return json_diag_codes


def dx_code(json_diag_codes, measure_id, code):
    """One option in the diagnosisCode switch which signals what to do for this specific code."""
    if "diagnosisCode" not in json_diag_codes[measure_id][0]:
        json_diag_codes[measure_id][0]["diagnosisCode"] = []
    json_diag_codes[measure_id][0]["diagnosisCode"].append(code)


def dx_code_2(json_diag_codes, measure_id, code):
    """One option in the diagnosisCode switch which signals what to do for this specific code."""
    if "diagnosisCode" not in json_diag_codes[measure_id][1]:
        json_diag_codes[measure_id][1]["diagnosisCode"] = []
    json_diag_codes[measure_id][1]["diagnosisCode"].append(code)


def dx_code_b(json_diag_codes, measure_id, code):
    """One option in the diagnosisCode switch which signals what to do for this specific code."""
    if "additionalDiagnosisCodes" not in json_diag_codes[measure_id][0]:
        json_diag_codes[measure_id][0]["additionalDiagnosisCodes"] = []
    json_diag_codes[measure_id][0]["additionalDiagnosisCodes"].append(code)


def dx_code_2_b(json_diag_codes, measure_id, code):
    """One option in the diagnosisCode switch which signals what to do for this specific code."""
    if "additionalDiagnosisCodes" not in json_diag_codes[measure_id][1]:
        json_diag_codes[measure_id][1]["additionalDiagnosisCodes"] = []
    json_diag_codes[measure_id][1]["additionalDiagnosisCodes"].append(code)


def dx_code_x(json_diag_codes, measure_id, code):
    """One option in the diagnosisCode switch which signals what to do for this specific code."""
    if "diagnosisExclusionCodes" not in json_diag_codes[measure_id][0]:
        json_diag_codes[measure_id][0]["diagnosisExclusionCodes"] = []
    json_diag_codes[measure_id][0]["diagnosisExclusionCodes"].append(code)


@pytest.fixture()
def source_diagnosis_codes(single_source_df):
    """Generate the source dict for diagnosisCode."""
    source_diag_codes = {}

    # Switch/case for diagnosis codes in the csv source file.
    dx_switcher = {
        "DX_CODE": dx_code,
        "DX_CODE_A": dx_code,
        "DX_CODE_1": dx_code,
        "DX_CODE_1_A": dx_code,
        "DX_CODE_2": dx_code_2,
        "DX_CODE_2_A": dx_code_2,
        "DX_CODE_B": dx_code_b,
        "DX_CODE_1_B": dx_code_b,
        "DX_CODE_2_B": dx_code_2_b,
        "DX_CODE_Exl": dx_code_x,
        "DX_CODE_X": dx_code_x,
    }

    # Scrape and format csv diagnosis codes
    for row in single_source_df.itertuples():
        # Format the measure id from the CSV.
        measure_id = "{:03.0f}".format(float(row.measure))
        if measure_id not in source_diag_codes:
            source_diag_codes[measure_id] = [{}, {}, {}]

        # Determine and run the appropriate function for the type of diagnosis code.
        func = dx_switcher.get(row.data_element_name)
        if func:
            func(source_diag_codes, measure_id, row.code)

    return source_diag_codes


def dx_format_json_measure(json_diag_codes, measure):
    """Pull out all diagnosisCodes in the output json and format them for comparison to source."""
    measure_id = measure["measureId"]
    if "eligibilityOptions" in measure:
        if measure_id not in json_diag_codes:
            json_diag_codes[measure_id] = [{}, {}, {}]
        for i, option in enumerate(measure["eligibilityOptions"]):
            if "diagnosisCodes" in option:
                for code in option["diagnosisCodes"]:
                    if "diagnosisCode" not in json_diag_codes[measure_id][i]:
                        json_diag_codes[measure_id][i]["diagnosisCode"] = []
                    if code not in json_diag_codes[measure_id][i]["diagnosisCode"]:
                        json_diag_codes[measure_id][i]["diagnosisCode"].append(code)
            if "additionalDiagnosisCodes" in option:
                for code in option["additionalDiagnosisCodes"]:
                    if "additionalDiagnosisCodes" not in json_diag_codes[measure_id][i]:
                        json_diag_codes[measure_id][i]["additionalDiagnosisCodes"] = []
                    if (
                        code
                        not in json_diag_codes[measure_id][i][
                            "additionalDiagnosisCodes"
                        ]
                    ):
                        json_diag_codes[measure_id][i][
                            "additionalDiagnosisCodes"
                        ].append(code)
            if "diagnosisExclusionCodes" in option:
                for code in option["diagnosisExclusionCodes"]:
                    if "diagnosisExclusionCodes" not in json_diag_codes[measure_id][i]:
                        json_diag_codes[measure_id][i]["diagnosisExclusionCodes"] = []
                    if (
                        code
                        not in json_diag_codes[measure_id][i]["diagnosisExclusionCodes"]
                    ):
                        json_diag_codes[measure_id][i][
                            "diagnosisExclusionCodes"
                        ].append(code)
    else:
        pprint("WARN: No eligibilityOptions object in measureId: " + measure_id)
    return json_diag_codes


def convert_inclusion_exclusion_string_to_lists(input_string):
    """Formats included, excluded strings for modifiers and placesOfService & their exlusion attributes."""
    list_split_regex = re.compile(r",\s*|\s*or\s*|≠\s*|=\s*")
    not_equals_split_regex = re.compile(r"≠\s*")

    included_excluded_string = re.split(not_equals_split_regex, input_string)

    if len(included_excluded_string) > 1:
        included_string = included_excluded_string[0] or ""
        excluded_string = included_excluded_string[1]
    else:
        included_string = included_excluded_string[0]
        excluded_string = ""

    included = [x for x in re.split(list_split_regex, included_string) if x]
    excluded = [x for x in re.split(list_split_regex, excluded_string) if x]

    return [included, excluded]


def format_source_procedure_codes(single_source_df):
    """Formats the procedure codes from the source csv for comparison to the output json."""
    source_proc_codes = {}
    # Scrape and format csv diagnosis codes
    for row in single_source_df.itertuples():
        if any(len(re.findall(x, row.data_element_name)) > 0 for x in ["PROC_CODE_?\d?$", "ENCOUNTER_CODE_?\d?$"]):
            # Format the measure id from the CSV.
            measure_id = "{:03.0f}".format(float(row.measure))
            measure_decimal = int(row.measure[-1:])
            proc_obj = {}

            if row.data_element_name.split("_")[-1].isnumeric():
                i = int(row.data_element_name[-1:]) - 1
            else:
                i = 0

            if measure_decimal > i:
                i = measure_decimal

            if measure_id not in source_proc_codes:
                source_proc_codes[measure_id] = [{}, {}, {}]

            proc_obj["code"] = row.code

            if pd.notnull(row.place_of_service):
                if "≠" in str(row.place_of_service):
                    proc_obj[
                        "placesOfServiceExclusions"
                    ] = convert_inclusion_exclusion_string_to_lists(
                        str(row.place_of_service)
                    )[
                        1
                    ]
                else:
                    proc_obj[
                        "placesOfService"
                    ] = convert_inclusion_exclusion_string_to_lists(
                        str(row.place_of_service)
                    )[
                        0
                    ]

            if pd.notnull(row.modifier):
                inclusions, exclusions = convert_inclusion_exclusion_string_to_lists(
                    str(row.modifier)
                )
                if inclusions:
                    proc_obj["modifiers"] = inclusions
                if exclusions:
                    proc_obj["modifierExclusions"] = exclusions

            if proc_obj:
                source_proc_codes[measure_id][i][row.code] = proc_obj

    return source_proc_codes


def format_json_genders(genders_dict, measure):
    """Format ouput json genders and add to passed dict."""
    measure_id = measure["measureId"]
    if "eligibilityOptions" in measure:
        for i, option in enumerate(measure["eligibilityOptions"]):
            if "sexCode" in option:
                genders_dict[measure_id + ".0" + str(i)] = option["sexCode"]
    return genders_dict


def format_json_age(age_dict, measure):
    """Format ouput json ages and add to passed dict."""
    if "eligibilityOptions" in measure:
        for i, option in enumerate(measure["eligibilityOptions"]):
            measure_id = measure["measureId"] + ".0" + str(i)
            if measure_id not in age_dict:
                age_dict[measure_id] = {}
            if "minAge" in option:
                age_dict[measure_id]["minAge"] = "{0:g}".format(option["minAge"])
            if "maxAge" in option:
                age_dict[measure_id]["maxAge"] = "{0:g}".format(option["maxAge"])
    return age_dict


def check_field_equality(field_1, field_2):
    """If both fields are equal, return field 2, if field 2 isn't populated, return field 1."""
    if field_2:
        if field_1 == field_2:
            return field_2
        else:
            pprint(
                "WARN: Field Equality failure: "
                + field_1
                + " is not equal to "
                + field_2
            )
    else:
        return field_1


def format_json_proc_codes(proc_dict, measure):
    """Format ouput json procedure codes and add to passed dict."""
    if "eligibilityOptions" in measure:
        for i, option in enumerate(measure["eligibilityOptions"]):
            m_id = measure["measureId"]

            if m_id not in proc_dict:
                proc_dict[m_id] = [{}, {}, {}]

            if "procedureCodes" in option:
                for proc in option["procedureCodes"]:
                    if not any(x == proc["code"] for x in proc_dict[m_id][i]):
                        proc_dict[m_id][i][proc["code"]] = proc
                    else:
                        if "modifiers" in proc:
                            proc_dict[m_id][i][proc["code"]][
                                "modifiers"
                            ] = check_field_equality(
                                proc["modifers"],
                                proc_dict[m_id][i][proc["code"]]["modifiers"],
                            )
                        if "modifierExclusions" in proc:
                            proc_dict[m_id][i][proc["code"]][
                                "modifierExclusions"
                            ] = check_field_equality(
                                proc["modifierExclusions"],
                                proc_dict[m_id][i][proc["code"]]["modifierExclusions"],
                            )
                        if "placesofService" in proc:
                            proc_dict[m_id][i][proc["code"]][
                                "placesofService"
                            ] = check_field_equality(
                                proc["placesofService"],
                                proc_dict[m_id][i][proc["code"]]["placesofService"],
                            )
                        if "placesofServiceExclusions" in proc:
                            proc_dict[m_id][i][proc["code"]][
                                "placesofServiceExclusions"
                            ] = check_field_equality(
                                proc["placesofServiceExclusions"],
                                proc_dict[m_id][i][proc["code"]][
                                    "placesofServiceExclusions]"
                                ],
                            )

    return proc_dict


def match_perf_opts(single_source_df_perf_opts, perf_opt, measure_id):
    """Return the index of a match between optionType & codeset if one exists, otherwise return None."""
    for i, opt in enumerate(single_source_df_perf_opts[measure_id]):
        if (
            perf_opt["optionType"] == opt["optionType"]
            and perf_opt["codeset"] == opt["codeset"]
            and perf_opt["optionGroup"] == opt["optionGroup"]
        ):
            return i


def format_top_level_json_attribute(target_json, attribute):
    """Return a dict of target attribute values keyed by measureID. This is used to test all top-level attributes."""
    attr_dict = {}
    for measure in target_json:
        attr_dict[measure["measureId"]] = measure[attribute]
    return attr_dict


def compare_dicts(source_dict, output_dict):
    """Compare output and source docs, ensuring their values are equal. Used for validation of most tests."""
    error_dict = {}
    for measure_id, measure in source_dict.items():
        if measure_id in output_dict:
            output_measure = output_dict[measure_id]
            if isinstance(measure, list):
                measure_comp = sorted(json.dumps(x, sort_keys=True) for x in measure)
                output_measure_comp = sorted(json.dumps(x, sort_keys=True) for x in output_measure)
            else:
                measure_comp = measure
                output_measure_comp = output_measure
            if measure_comp != output_measure_comp:
                error_dict[measure_id] = {
                    "error": "Measure ID " + measure_id + " values are not equal.",
                    "values": {"source": measure, "output": output_dict[measure_id]},
                }
        else:
            error_dict[measure_id] = {
                "error": "Measure ID " + measure_id + " not in single source json."
            }

    return error_dict


def test_measure_id(single_source_df, measures_source_json, single_source_output_json):
    """Test to ensure all measure ids from the csv made it into the single source json."""
    source_measures = []

    for row in single_source_df.itertuples():
        measure_id = row.measure

        if measure_id not in source_measures:
            source_measures.append(measure_id)

    for measure in measures_source_json:
        source_measures = format_json_measure_id(source_measures, measure)

    output_measures = []
    for measure in single_source_output_json:
        output_measures = format_json_measure_id(output_measures, measure)

    assert sorted(output_measures) == sorted(source_measures)


def test_dx_code(source_diagnosis_codes, single_source_output_json):
    """Test that all source diagnosis codes are in the single source json."""
    json_diag_codes = {}

    for measure in single_source_output_json:
        json_diag_codes = dx_format_json_measure(json_diag_codes, measure)

    assert compare_dicts(source_diagnosis_codes, json_diag_codes) == {}


def test_gender(single_source_df, single_source_output_json):
    """Test that all source gender values are in the single source json."""
    source_dict = {}
    output_dict = {}

    for row in single_source_df.itertuples():
        measure_id = row.measure

        if measure_id not in source_dict:
            source_dict[measure_id] = []

        source_dict[measure_id].append(row.gender)

    remove_keys = []
    for measure_id, measure in source_dict.items():
        unique_measure = list(set(measure))
        if unique_measure == ["M, F"]:
            remove_keys.append(measure_id)
        elif unique_measure == ["M"] or unique_measure == ["F"]:
            source_dict[measure_id] = unique_measure[0]
        else:
            raise ValueError(
                "WARN: Multiple gender values found in source for measureId: "
                + measure_id
                + " "
                + unique_measure
            )

    for k in remove_keys:
        del source_dict[k]

    pprint(source_dict)

    for measure in single_source_output_json:
        output_dict = format_json_genders(output_dict, measure)

    assert compare_dicts(source_dict, output_dict) == {}


def test_age(single_source_df, single_source_output_json):
    """Test that all source diagnosis codes are in the single source json."""
    source_dict = {}
    output_dict = {}
    month_regex = re.compile(r"^≥(\d+)mo$")

    for row in single_source_df.itertuples():
        measure_id = row.measure

        if measure_id not in source_dict:
            source_dict[measure_id] = {}

        min_age = source_dict[measure_id].get("minAge", 1000)
        max_age = source_dict[measure_id].get("maxAge", 0)

        if re.match(month_regex, row.age):
            source_dict[measure_id]["minAge"] = min(str(
                float(re.match(month_regex, row.age).groups()[0]) / 12
            ), min_age, key=float)
        elif "≥" in row.age or ">" in row.age:
            source_dict[measure_id]["minAge"] = min(re.findall(r"\d+", row.age)[0], min_age, key=float)
        else:
            row_min, row_max = re.findall(r"\d+", row.age)
            source_dict[measure_id]["minAge"] = min(row_min, min_age, key=float)
            source_dict[measure_id]["maxAge"] = max(row_max, max_age, key=float)

    for measure in single_source_output_json:
        format_json_age(output_dict, measure)

    assert compare_dicts(source_dict, output_dict) == {}


def test_procedure_codes(single_source_output_json, single_source_df):
    """Test that all source procedure codes are in the single source json."""
    output_dict = {}
    source_dict = format_source_procedure_codes(single_source_df)

    for measure in single_source_output_json:
        output_dict = format_json_proc_codes(output_dict, measure)

    assert compare_dicts(source_dict, output_dict) == {}


def test_performance_options(single_source_df, single_source_output_json):
    """Test that all source performance options are in the single source json."""
    source_dict = {}
    output_dict = {}

    perf_opts_map = {
        "PN_X": "performanceNotMet",
        "PN": "performanceMet",
        "PD_Exe": "eligiblePopulationException",
        "PD_Exl": "eligiblePopulationExclusion",
    }

    pd_list = {}
    perf_names = [
        "PROC_CODE$",
        "DX_CODE$",
        "ENCOUNTER_CODE.*",
        "G_CODE_DENOM_CODE.*",
        "CPT_II_DENOM_CODE.*",
    ]

    for row in single_source_df.itertuples():
        if any(len(re.findall(x, row.data_element_name)) > 0 for x in perf_names):
            continue

        measure_id = "{:03.0f}".format(float(row.measure))

        if len(re.findall("PD_?\d?$", row.data_element_name)) != 0:
            pd_list[measure_id] = row.data_element_name
            continue

        if measure_id not in source_dict:
            source_dict[measure_id] = []

        perf_opt = {"qualityCodes": [], "codeset": row.codeset_number, "optionType": None,
                    "optionGroup": row.option_group}

        for key in perf_opts_map.keys():
            if len(re.findall("{}_?\d?$".format(key), row.data_element_name)) != 0:
                perf_opt["optionType"] = perf_opts_map[key]
                perf_opt["optionGroup"] = row.option_group
            else:
                continue
        quality_code_obj = {"code": row.code}

        if pd.notnull(row.modifier):
            inclusions, exclusions = convert_inclusion_exclusion_string_to_lists(
                str(row.modifier)
            )
            if inclusions:
                quality_code_obj["modifiers"] = inclusions
            if exclusions:
                quality_code_obj["modifierExclusions"] = exclusions

        if pd.notnull(row.place_of_service):
            if "≠" in str(row.place_of_service):
                quality_code_obj[
                    "placesOfServiceExclusions"
                ] = convert_inclusion_exclusion_string_to_lists(
                    str(row.place_of_service)
                )[
                    1
                ]
            else:
                quality_code_obj[
                    "placesOfService"
                ] = convert_inclusion_exclusion_string_to_lists(
                    str(row.place_of_service)
                )[
                    0
                ]

        if source_dict[measure_id] and perf_opt["codeset"] > -1:
            index = match_perf_opts(source_dict, perf_opt, measure_id)
            if index is not None:
                source_dict[measure_id][index]["qualityCodes"].append(quality_code_obj)
                continue

        if perf_opt["optionType"] is None:
            continue

        perf_opt["qualityCodes"].append(quality_code_obj)
        source_dict[measure_id].append(perf_opt)

    for measure in source_dict.values():
        for perf_opt in measure:
            del perf_opt["codeset"]

    for measure in single_source_output_json:
        if "performanceOptions" in measure:
            m_id = measure["measureId"].split(".")[0]
            output_dict[m_id] = output_dict.get(m_id, []) + measure["performanceOptions"]

    # Sort step needed for unordered lists of dictionaries
    source_dict = {k: sorted(v, key=lambda x: x["optionType"]) for k, v in source_dict.items()}
    output_dict = {k: sorted(v, key=lambda x: x["optionType"]) for k, v in output_dict.items()}

    assert compare_dicts(source_dict, output_dict) == {}


# The rest of the tests check the various top level attributes from the measures source json.
def test_title(measures_source_json, single_source_output_json):
    """Test that all source title values are in the single source json."""
    source_dict = format_top_level_json_attribute(measures_source_json, "title")
    output_dict = format_top_level_json_attribute(single_source_output_json, "title")

    assert compare_dicts(source_dict, output_dict) == {}


def test_e_measure_id(measures_source_json, single_source_output_json):
    """Test that all source eMeasureId values are in the single source json."""
    source_dict = format_top_level_json_attribute(measures_source_json, "eMeasureId")
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "eMeasureId"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_nqf_e_measure_id(measures_source_json, single_source_output_json):
    """Test that all source nfqEMeasureId values are in the single source json."""
    source_dict = format_top_level_json_attribute(measures_source_json, "nqfEMeasureId")
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "nqfEMeasureId"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_nqf_id(measures_source_json, single_source_output_json):
    """Test that all source nfqId values are in the single source json."""
    source_dict = format_top_level_json_attribute(measures_source_json, "nqfId")
    output_dict = format_top_level_json_attribute(single_source_output_json, "nqfId")

    assert compare_dicts(source_dict, output_dict) == {}


def test_description(measures_source_json, single_source_output_json):
    """Test that all source description values are in the single source json."""
    source_dict = format_top_level_json_attribute(measures_source_json, "description")
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "description"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_national_quality_strategy_domain(
    measures_source_json, single_source_output_json
):
    """Test that all source nationalQualityStrategyDomain values are in the single source json."""
    source_dict = format_top_level_json_attribute(
        measures_source_json, "nationalQualityStrategyDomain"
    )
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "nationalQualityStrategyDomain"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_measure_type(measures_source_json, single_source_output_json):
    """Test that all source measureType values are in the single source json."""
    source_dict = format_top_level_json_attribute(measures_source_json, "measureType")
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "measureType"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_primary_steward(measures_source_json, single_source_output_json):
    """Test that all source title values are in the single source json."""
    source_dict = format_top_level_json_attribute(
        measures_source_json, "primarySteward"
    )
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "primarySteward"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_metric_type(measures_source_json, single_source_output_json):
    """Test that all source metricType values are in the single source json."""
    source_dict = format_top_level_json_attribute(measures_source_json, "metricType")
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "metricType"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_first_performance_year(measures_source_json, single_source_output_json):
    """Test that all source firstPerformanceYear values are in the single source json."""
    source_dict = format_top_level_json_attribute(
        measures_source_json, "firstPerformanceYear"
    )
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "firstPerformanceYear"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_last_performance_year(measures_source_json, single_source_output_json):
    """Test that all source lastPerformanceYear values are in the single source json."""
    source_dict = format_top_level_json_attribute(
        measures_source_json, "lastPerformanceYear"
    )
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "lastPerformanceYear"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_is_high_priority(measures_source_json, single_source_output_json):
    """Test that all source isHighPriority values are in the single source json."""
    source_dict = format_top_level_json_attribute(
        measures_source_json, "isHighPriority"
    )
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "isHighPriority"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_is_inverse(measures_source_json, single_source_output_json):
    """Test that all source isInverse values are in the single source json."""
    source_dict = format_top_level_json_attribute(measures_source_json, "isInverse")
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "isInverse"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_is_icd_impacted(measures_source_json, single_source_output_json):
    """Test that all source isIcdImpacted values are in the single source json."""
    source_dict = format_top_level_json_attribute(measures_source_json, "isIcdImpacted")
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "isIcdImpacted"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_is_clinical_guideline_changed(measures_source_json, single_source_output_json):
    """Test that all source isClinicalGuidelineChanged values are in the single source json."""
    source_dict = format_top_level_json_attribute(
        measures_source_json, "isClinicalGuidelineChanged"
    )
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "isClinicalGuidelineChanged"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_category(measures_source_json, single_source_output_json):
    """Test that all source category values are in the single source json."""
    source_dict = format_top_level_json_attribute(measures_source_json, "category")
    output_dict = format_top_level_json_attribute(single_source_output_json, "category")

    assert compare_dicts(source_dict, output_dict) == {}


def test_is_registry_measure(measures_source_json, single_source_output_json):
    """Test that all source isRegistryMeasure values are in the single source json."""
    source_dict = format_top_level_json_attribute(
        measures_source_json, "isRegistryMeasure"
    )
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "isRegistryMeasure"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_is_risk_adjusted(measures_source_json, single_source_output_json):
    """Test that all source isRiskAdjusted values are in the single source json."""
    source_dict = format_top_level_json_attribute(
        measures_source_json, "isRiskAdjusted"
    )
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "isRiskAdjusted"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_submission_methods(measures_source_json, single_source_output_json):
    """Test that all source submissionMethods values are in the single source json."""
    source_dict = format_top_level_json_attribute(
        measures_source_json, "submissionMethods"
    )
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "submissionMethods"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_measure_sets(measures_source_json, single_source_output_json):
    """Test that all source measureSets values are in the single source json."""
    source_dict = format_top_level_json_attribute(measures_source_json, "measureSets")
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "measureSets"
    )

    assert compare_dicts(source_dict, output_dict) == {}


def test_measure_specification(measures_source_json, single_source_output_json):
    """Test that all source measureSpecification values are in the single source json."""
    source_dict = format_top_level_json_attribute(
        measures_source_json, "measureSpecification"
    )
    output_dict = format_top_level_json_attribute(
        single_source_output_json, "measureSpecification"
    )

    assert compare_dicts(source_dict, output_dict) == {}
