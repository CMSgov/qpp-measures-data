"""Tests for single_source_conversion_helpers.py."""
import itertools
import pytest

from scripts import single_source_conversion_helpers

import pandas as pd


def test_determine_element_category():
    """Test that row types (i.e., element categories) are correctly determined from their names."""
    data_element_names = [
        'DX_CODE_A',
        'DX_CODE_B',
        'DX_CODE',
        'DX_CODE_X',
        'PD_Exe',
        'PD_Exl',
        'PN_X',
        'PN',
        'ENCOUNTER_CODE',
        'ENCOUNTER_CODE_1',
        'PROC_CODE',
        'DENOM_CODE',
    ]

    expected_element_categories = [
        'DX_CODE',
        'DX_CODE',
        'DX_CODE',
        'DX_CODE_X',
        'PD_Exe',
        'PD_Exl',
        'PN_X',
        'PN',
        'ENCOUNTER_CODE',
        'ENCOUNTER_CODE',
        'PROC_CODE',
        'ADDITIONAL_PROCEDURE_CODE',
    ]

    output = [
        single_source_conversion_helpers.determine_element_category(element_name)
        for element_name in data_element_names
    ]

    assert output == expected_element_categories


def test_determine_element_category_invalid_element():
    """Test that a NotImplementedError is raised for invalid element categories."""
    element_name = 'not_a_valid_element_category'
    with pytest.raises(NotImplementedError):
        single_source_conversion_helpers.determine_element_category(element_name)


def test_get_gender():
    """Test that get_gender functions as expected."""
    gender_strings = ['F', 'M', 'PQRST', '', None]
    expected_strings = ['F', 'M', None, None, None]
    expected = [pd.Series([code], index=['sex_code']) for code in expected_strings]
    output = [single_source_conversion_helpers.get_gender(string) for string in gender_strings]
    for expected_series, output_series in itertools.zip_longest(expected, output):
        assert (expected_series.fillna('None') == output_series.fillna('None')).all()


def test_is_additional_diagnosis_code():
    """Test that is_additional_diagnosis code returns True when a diagnosis code contains _B."""
    inputs = [None, 'DX_CODE_B', 'DX_CODE_A', 'DX_CODE', 'ENCOUNTER_CODE_B']
    expected = [False, True, False, False, False]
    output = [
        single_source_conversion_helpers.is_additional_diagnosis_code(string) for string in inputs
    ]
    assert output == expected


def test_convert_inclusion_exclusion_string_to_lists_inclusion_only():
    """Test convert_inclusion_exclusion_string_to_lists in the case of only inclusion."""
    input_string = "a, b, c"
    output = single_source_conversion_helpers.convert_inclusion_exclusion_string_to_lists(
        input_string)
    assert output.equals(pd.Series([['a', 'b', 'c'], []]))


def test_convert_inclusion_exclusion_string_to_lists_inclusion_with_equals():
    """Test convert_inclusion_exclusion_string_to_lists in the case of only inclusion with an =."""
    input_string = "=a, b, c"
    output = single_source_conversion_helpers.convert_inclusion_exclusion_string_to_lists(
        input_string)
    assert output.equals(pd.Series([['a', 'b', 'c'], []]))


def test_convert_inclusion_exclusion_string_to_lists_exclusion_only():
    """Test convert_inclusion_exclusion_string_to_lists in the case of only exclusion."""
    input_string = "≠a, b, c"
    output = single_source_conversion_helpers.convert_inclusion_exclusion_string_to_lists(
        input_string)
    assert output.equals(pd.Series([[], ['a', 'b', 'c']]))


def test_convert_inclusion_exclusion_string_to_lists_exclusion_with_space():
    u"""
    Test convert_inclusion_exclusion_string_to_lists in the case of exclusion with a space after ≠.

    This edge case occurs in the 2017 single source Excel file.
    """
    input_string = "≠ a, b, c"
    output = single_source_conversion_helpers.convert_inclusion_exclusion_string_to_lists(
        input_string)
    assert output.equals(pd.Series([[], ['a', 'b', 'c']]))


def test_convert_inclusion_exclusion_string_to_lists_exclusion_with_or():
    """Test convert_inclusion_exclusion_string_to_lists in the case of exclusion containing 'or'."""
    input_string = "≠ 52, 53, 73 or 74"
    output = single_source_conversion_helpers.convert_inclusion_exclusion_string_to_lists(
        input_string)
    assert output.equals(pd.Series([[], ['52', '53', '73', '74']]))


def test_convert_inclusion_exclusion_string_to_lists_inclusion_and_exclusion():
    """Test convert_inclusion_exclusion_string_to_lists in the case of exclusion and inclusion."""
    input_string = "1P, ≠ 2P, 3P, 8P"
    output = single_source_conversion_helpers.convert_inclusion_exclusion_string_to_lists(
        input_string)
    assert output.equals(pd.Series([['1P'], ['2P', '3P', '8P']]))


def test_find_min_max_age_months():
    """Test find_min_max_age correctly identifies strings measuring age in months."""
    input_string = '≥6mo'
    output = single_source_conversion_helpers.find_min_max_age(input_string)
    assert output.equals(pd.Series(data=[0.5, None], index=['min_age', 'max_age']))


def test_find_min_max_age_years():
    """Test find_min_max_age correctly identifies strings measuring age in years."""
    input_string = '18 thru 75'
    output = single_source_conversion_helpers.find_min_max_age(input_string)
    assert output.equals(pd.Series(data=[18.0, 75.0], index=['min_age', 'max_age']))


class TestRowToDictFunctions():
    """Test procedure_codes_to_dict and quality_codes_to_dict methods."""

    def setup(self):
        """Initialize pandas Series objects used in the tests."""
        self.diagnosis_row = pd.Series({
            'code': 'W56.22',
            'element_category': 'DX_CODE',
        })
        self.encounter_row = pd.Series({
            'code': '9000',
            'element_category': 'ENCOUNTER_CODE',
            'modifiers': ['8F'],
            'modifierExclusions': [],
            'placesOfService': [],
            'placesOfServiceExclusions': ['Hospice'],
            'codeset_number': -1,
        })
        self.quality_code_row = pd.Series({
            'code': 'G20.20',
            'element_category': 'PN',
            'modifiers': [],
            'modifierExclusions': ['4F'],
            'placesOfService': ['Emergency Room'],
            'placesOfServiceExclusions': [],
            'codeset_number': 0,
        })

    def test_procedure_codes_to_dict(self):
        """Test that DataFrame rows can be converted to procedure code dictionaries."""
        inputs = [self.diagnosis_row, self.encounter_row, self.quality_code_row]
        output = [single_source_conversion_helpers.procedure_codes_to_dict(row) for row in inputs]
        expected = [
            {},   # Diagnosis codes cannot be converted to procedure code dicts.
            {
                'code': '9000',
                'modifiers': ['8F'],
                'placesOfServiceExclusions': ['Hospice'],
            },       # Keys with empty values are ignored.
            {},   # Quality codes cannot be converted to procedure code dicts.
        ]

        assert output == expected

    def test_quality_codes_to_dict(self):
        """Test that DataFrame rows can be converted to quality code dictionaries."""
        inputs = [self.diagnosis_row, self.encounter_row, self.quality_code_row]
        output = [single_source_conversion_helpers.quality_codes_to_dict(row) for row in inputs]
        expected = [
            {},   # Diagnosis codes cannot be converted to quality code dicts.
            {},   # Encounter codes cannot be converted to quality code dicts.
            {
                'optionType': 'performanceMet',
                'codeset_number': 0,
                'qualityCodes': [{
                    'code': 'G20.20',
                    'modifierExclusions': ['4F'],
                    'placesOfService': ['Emergency Room']
                }]
            },       # Keys with empty values are ignored.
        ]
        assert output == expected
