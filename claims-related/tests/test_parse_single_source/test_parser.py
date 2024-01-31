import pytest
import numpy as np

from single_source.parser import *


def test_is_eligible_element(single_source):
    # An element is an eligibility option when it is not anything else
    data_element = pd.Series(["a_PD_Exl", "b_PD_Exe", "c_PD_Exe", "d_PN_X", "e"])
    is_eligible_element = is_eligible(data_element)
    expected = pd.Series([False, False, False, False, True])
    pd.testing.assert_series_equal(is_eligible_element, expected)


def test_is_eligible_exclusion(single_source):
    # case sensitive search for PD_Exl
    data_element = pd.Series(["Something_PD_Exl", "PD_Exl", "pd_Exl", "PN_Exl", "PN_Exc", "Exl"])
    is_eligible_exclusion_element = is_eligible_exclusion(data_element)
    expected = pd.Series([True, True, False, False, False, False])
    pd.testing.assert_series_equal(is_eligible_exclusion_element, expected)


def test_get_code_set(single_source):
    # search for _\d_ and extract the digit
    data_element = pd.Series(["a", "a_1_B", "a_1", "a_b_1", "a_1_A"])
    code_set = get_code_set(data_element)
    expected = pd.Series([np.nan, "1", np.nan, np.nan, "1"])
    pd.testing.assert_series_equal(code_set, expected)


def test_extract_equal():
    # A leading not equals sign means all elements are not equal.
    column = pd.Series(["≠2, 1, 2", "1", "2"])
    data = extract_equal(column)
    expected = pd.Series([[], ["1"], ["2"]])
    pd.testing.assert_series_equal(data, expected)


def test_extract_not_equal():
    # A leading not equals sign means all elements should not equal
    column = pd.Series(["≠2, 1, 2", "1", "≠1"])
    data = extract_not_equal(column)
    expected = pd.Series([["2", "1", "2"], [], ["1"]])
    pd.testing.assert_series_equal(data, expected)


def test_get_option_code_eligible():
    # Get option code returns a series with the code when the data element
    # is the option, np.nan otherwise
    single_source = pd.DataFrame([
        {Column.data_element.value: "a", Column.code.value: "myCode"},
        {Column.data_element.value: "a_PD_Exl", Column.code.value: "exclusion"},

    ])
    eligible_option_code = get_option_code("eligible",
                                           single_source[Column.data_element.value],
                                           single_source[Column.code.value])
    expected = pd.Series(["myCode", np.nan])
    pd.testing.assert_series_equal(eligible_option_code, expected)


def test_get_non_existent_option_code(single_source):
    with pytest.raises(KeyError):
        get_option_code("non_existent", single_source[Column.data_element.value], single_source[Column.code.value])


def test_get_submission_criteria():
    measure_id = pd.Series(["1", "2", "2.01", "2.02"])
    submission_criteria = get_submission_criteria(measure_id)
    expected = pd.Series(["00", "00", "01", "02"])
    pd.testing.assert_series_equal(submission_criteria, expected)


def test_get_min_age():
    age_range = pd.Series(["≥1", "≥6 mo", "18-65", ""])
    min_age = get_min_age(age_range)
    expected = pd.Series([1.0, 0.5, 18.0, np.nan])
    pd.testing.assert_series_equal(min_age, expected)


def test_get_max_age():
    age_range = pd.Series(["≥1", "≥6 mo", "18-65", "18 - 70", ""])
    min_age = get_max_age(age_range)
    expected = pd.Series([np.nan, np.nan, 65.0, 70.0, np.nan])
    pd.testing.assert_series_equal(min_age, expected)


def test_get_sex_code():
    gender_column = pd.Series(["M, F", "F", "M"])
    sex_code = get_sex_code(gender_column)
    expected = pd.Series(["", "F", "M"])
    pd.testing.assert_series_equal(sex_code, expected)


def test_parse_single_source_smoke_test(single_source):
    _ = parse_single_source(single_source)
