"""
Convert Single Source Excel Measure definitions into JSON.

Inputs:
    1. Single source Excel document containing quality measure definitions
    for claims.

    2. Top-level measures data for all QPP measures.
    Source: https://github.com/CMSgov/qpp-measures-data/blob/master/measures/measures-data.json

Outputs:
    Single source JSON file combining both inputs into one large JSON object conforming to
    this schema:
        https://github.com/CMSgov/qpp-measures-data/blob/master/measures/measures-schema.yaml
    It is built by supplementing the measures-data JSON object with the information for 74
    claims-based quality measures in the single source Excel document.

TODO: Clean up this code and add tests.
"""
import argparse
import json

from data_load import load_single_source

from single_source_conversion_helpers import (
    add_row_level_information_to_dataframe,
    extract_eligibility_options_from_measure_dataframe,
    merge_multiple_performance_options,
    extract_performance_options_from_measure_dataframe,
    merge_multiple_eligibility_options,
)

# Default filepaths for all required resources.
DEFAULT_SINGLE_SOURCE_EXCEL_PATH = (
    '/home/jovyan/work/data/2017_Claims_IndivMeasures_SingleSourceVersion2_11082017_andrea_edit'
    '.xlsx'
)
DEFAULT_NAVA_MEASURES_DATA_PATH = '/home/jovyan/measures/measures-data.json'
DEFAULT_OUTPUT_JSON_PATH = '/home/jovyan/work/data/qpp_single_source.json'


def _convert_measure_ids_to_match_nava_format(single_source_dict):
    """Format measure number as 'measureId' string and add to measure dictionary."""
    single_source_final = {}
    for measure, measure_dict in single_source_dict.items():
        measure_id = '{:03.0f}'.format(float(measure))
        measure_dict.update({'measureId': measure_id})  # Include measureId in the JSON blob
        single_source_final[measure_id] = measure_dict

    return single_source_final


def merge_single_source_with_nava_measures_data(single_source_dict, nava_measure_filepath):
    """
    Read in the Nava measures data JSON file and merge with measures contained in the single source.

    The measures data JSON can be found here:
        https://github.com/CMSgov/qpp-measures-data/blob/master/measures/measures-data.json
    """
    # Convert measure IDs to agree with Nava's naming conventions.
    single_source_dict = _convert_measure_ids_to_match_nava_format(single_source_dict)

    with open(nava_measure_filepath, 'r') as f:
        nava_measures_data = json.load(f)

    full_measures_data = []
    for measure in nava_measures_data:
        if measure['measureId'] in single_source_dict:
            updated_measure = measure.copy()
            updated_measure.update(single_source_dict[measure['measureId']])
            full_measures_data.append(updated_measure)
        else:
            full_measures_data.append(measure)

    return full_measures_data


def _main(**kwargs):
    single_source_df = load_single_source(kwargs['single_source_filepath'])
    single_source_df = add_row_level_information_to_dataframe(single_source_df)

    single_source_dict = {}
    # Assign eligibility and performance options for each measure.
    for measure, measure_df in single_source_df.groupby('measure'):
        single_source_dict[measure] = {
            'eligibilityOptions': extract_eligibility_options_from_measure_dataframe(measure_df),
            'performanceOptions': merge_multiple_performance_options(
                extract_performance_options_from_measure_dataframe(measure_df)
            )
        }

    # Merge eligibility options based on .00, .01, .02 measure IDs.
    # As the measures have different measure IDs, this cannot be easily accomplished during the
    # above iteration.
    single_source_dict = merge_multiple_eligibility_options(single_source_dict)

    full_measures_data = merge_single_source_with_nava_measures_data(
        single_source_dict,
        nava_measure_filepath=kwargs['measures_data_filepath']
    )
    # Write to JSON.
    if kwargs.get('output_filepath', None):
        with open(kwargs['output_filepath'], 'w') as f:
            json.dump(full_measures_data, f, sort_keys=True, indent=4)

        print('The combined JSON file was written to {}.'.format(kwargs['output_filepath']))

    return full_measures_data


def _get_arguments():
    """Build argument parser."""
    parser = argparse.ArgumentParser(
        description='This script converts the single source Excel file to JSON.'
    )

    parser.add_argument(
        '-i', '--single_source_filepath',
        help='Single Source Excel file input filename',
        required=False,
        default=DEFAULT_SINGLE_SOURCE_EXCEL_PATH,
        type=str)

    parser.add_argument(
        '-md', '--measures_data_filepath',
        help='Measure data JSON filepath (maintained by Nava)',
        required=False,
        default=DEFAULT_NAVA_MEASURES_DATA_PATH,
        type=str)

    parser.add_argument(
        '-o', '--output_filepath',
        help='Single source JSON output filepath',
        required=False,
        default=DEFAULT_OUTPUT_JSON_PATH,
        type=str)

    args = parser.parse_args()

    return args.__dict__

if __name__ == '__main__':
    _main(**_get_arguments())
