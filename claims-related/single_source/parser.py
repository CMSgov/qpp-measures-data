"""
Parse Mathematica's single source file

Create a new DataFrame which has columns containing the various
eligibility and performance options depending on the data element name,
modifiers, etc.
"""
import pandas as pd
import json
from functools import reduce
from enum import Enum
from functools import partial


class Option(Enum):
    eligible = "eligible"
    performance_met = "performance_met"
    performance_not_met = "performance_not_met"
    eligible_exclusion = "eligible_exclusion"
    eligible_exception = "eligible_exception"

    procedure = "procedure"
    diagnosis = "diagnosis"
    additional_procedure = "additional_procedure"


class Column(Enum):
    measure_id = "Measure ID"
    data_element = "DATA ELEMENT NAME"
    modifier = "MODIFIER"
    place_of_service = "PLACE OF SERVICE"
    code = "CODE"
    age = "AGE"
    gender = "GENDER"

    # Derived Columns
    submission_criteria = "submission_criteria"
    overall_measure_id = "overall_measure_id"
    diagnosis = "diagnosis"
    procedure = "procedure"
    min_age = "min_age"
    max_age = "max_age"
    sex_code = "sex_code"
    additional_procedure = "additional_procedure"


DIAGNOSIS_CODE = "DX_CODE",
PROCEDURE_CODE = ("ENCOUNTER_CODE", "PROC_CODE")


def read_single_source_table(path):
    if path.endswith(".csv"):
        data = pd.read_csv(path)
    elif path.endswith(".xlsx"):
        data = pd.read_excel(path, sheet_name="Codes", skiprows=1)
    return data


def read_single_source_csv(path):
    data = pd.read_csv(path)
    data[Column.measure_id.value] = data[Column.measure_id.value].astype(str).\
        str.replace(r"\.0$", "", regex=True)
    return data


def read_single_source_json(path):
    with open(path, "r") as file_handle:
        lines = file_handle.readlines()
    single_source = json.loads("".join(lines))
    return single_source


def parse_single_source(single_source):
    """
    Define the various eligibility, performance options from the single source excel or CSV file
    """
    parsed_source = pd.DataFrame(index=single_source.index)
    parsed_source["modifier_inclusion"] = extract_equal(single_source[Column.modifier.value])
    parsed_source["modifier_exclusion"] = extract_not_equal(single_source[Column.modifier.value])
    parsed_source["place_of_service_inclusion"] = extract_equal(single_source[Column.place_of_service.value])
    parsed_source["place_of_service_exclusion"] = extract_not_equal(single_source[Column.place_of_service.value])

    options = [x.value for x in Option]
    get_option_partial = partial(get_option_code,
                                 data_element=single_source[Column.data_element.value],
                                 code=single_source[Column.code.value])
    parsed_source[options] = pd.concat(map(get_option_partial, options), axis=1)

    parsed_source["code_set"] = get_code_set(single_source[Column.data_element.value])

    parsed_source["overall_measure_id"] = get_overall_measure_id(single_source[Column.measure_id.value])
    parsed_source["submission_criteria"] = get_submission_criteria(single_source[Column.measure_id.value])

    parsed_source["min_age"] = get_min_age(single_source[Column.age.value])
    parsed_source["max_age"] = get_max_age(single_source[Column.age.value])
    parsed_source["sex_code"] = get_sex_code(single_source[Column.gender.value])
    return parsed_source


def is_additional_procedure_code(data_element_name):
    is_additional = data_element_name.str.contains("DENOM")
    return is_additional


def get_overall_measure_id(measure_id):
    """
    overall_measure_id is the measure id without the submission criteria suffix if applicable
    Ex. measure id 226.01 => overall_measure_id=226
    """
    return measure_id.str.extract(r"^(\d+)", expand=False).str.zfill(3)


def get_submission_criteria(measure_id):
    """
    Ex. measure id 226.01 => submission_criteria=01
    """
    submission_criteria = measure_id.str.extract(r"\.(\d+)").\
        fillna("0").squeeze(axis=1).str.zfill(2)
    submission_criteria = submission_criteria.rename(None)
    return submission_criteria


def get_code_set(data_element):
    """
    A code_set groups performanceOptions together
    """
    return data_element.str.extract("_([0-9]){1}_", expand=False)


def extract_not_equal(column):
    no_spaces_or_unequal_sign = column.str.replace(" |≠", "", regex=True)
    starts_with_unequal_sign = column.str.startswith("≠", na=False)
    split = no_spaces_or_unequal_sign.str.split(",")
    split.loc[~starts_with_unequal_sign] = split[~starts_with_unequal_sign].apply(lambda x: [])
    return split


def extract_equal(column):
    no_spaces = column.str.replace(" ", "", regex=False)
    starts_with_unequal_sign = column.str.startswith("≠", na=False)
    equal = no_spaces.str.split(",", regex=False)
    fill_with_empty_list = starts_with_unequal_sign | equal.isna()
    equal.loc[fill_with_empty_list] = equal.loc[fill_with_empty_list].apply(lambda x: [])
    return equal


def get_min_age(column):
    age_range_age = column.str.extract(r"^(\d+)", expand=False)
    greater_than_equal_age = column.str.extract(r"≥(\d+)", expand=False)
    is_in_months = column.str.contains("mo", regex=True)
    min_age = age_range_age.combine_first(greater_than_equal_age).astype(float)
    n_months_in_year = 12
    min_age.loc[is_in_months] = min_age.loc[is_in_months] / n_months_in_year
    return min_age


def get_max_age(column):
    age_range_age = column.str.extract(r"-[ ]*(\d+)", expand=False).astype(float)
    return age_range_age


def get_option_code(option_, data_element, code):
    option_map = {
        "eligible": is_eligible,
        "eligible_exclusion": is_eligible_exclusion,
        "eligible_exception": is_eligible_exception,
        "performance_met": is_performance_met,
        "performance_not_met": is_performance_not_met,
        "procedure": is_procedure_code,
        "diagnosis": is_diagnosis_code,
        "additional_procedure": is_additional_procedure_code
    }
    option_fun = option_map[option_]
    # Need object dtype to include lists
    option_code = pd.Series(index=data_element.index, dtype="object")
    is_option = option_fun(data_element)
    option_code.loc[is_option] = code.loc[is_option]
    return option_code


def is_eligible(data_element):
    other_option_fun = [is_eligible_exclusion, is_eligible_exception, is_performance_not_met, is_performance_met]
    other_option = list(map(lambda x: x(data_element), other_option_fun))
    return ~reduce(lambda x, y: x | y, other_option[1:], other_option[0])


def is_diagnosis_code(data_element):
    contains_exception_exclusion = data_element.str.contains("PD_Exe|PD_Exl")
    starts_with_diagnosis_code = data_element.str.startswith(DIAGNOSIS_CODE, na=False)
    is_diagnosis_code_ = starts_with_diagnosis_code & (~contains_exception_exclusion)
    return is_diagnosis_code_


def is_procedure_code(data_element):
    contains_exception_exclusion = data_element.str.contains("PD_Exe|PD_Exl")
    starts_with_procedure_code = data_element.str.startswith(PROCEDURE_CODE, na=False)
    is_procedure_code_ = starts_with_procedure_code & (~contains_exception_exclusion)
    return is_procedure_code_


def is_eligible_exclusion(data_element):
    return data_element.str.contains("PD_Exl", regex=True)


def is_eligible_exception(data_element):
    return data_element.str.contains("PD_Exe", regex=True)


def is_performance_not_met(data_element):
    return data_element.str.contains("PN_X", regex=True)


def is_performance_met(data_element):
    # Don't include PD because these are in PN, PN_X, etc.
    return data_element.str.contains("PN", regex=True) & \
           ~(is_eligible_exclusion(data_element) |
             is_performance_not_met(data_element) |
             is_eligible_exception(data_element)
             )


def get_sex_code(gender):
    has_male = gender.str.contains("M")
    has_female = gender.str.contains("F")
    only_male = has_male & ~has_female
    only_female = ~has_male & has_female
    sex_code = pd.Series("", index=gender.index)
    sex_code.loc[only_male] = "M"
    sex_code.loc[only_female] = "F"
    return sex_code
