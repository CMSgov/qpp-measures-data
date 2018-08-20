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
DEFAULT_SINGLE_SOURCE_CSV_PATH = (
    '/home/jovyan/work/data/2018_Claims_SingleSource_Bayes_Feedback_05032018.csv'
)
DEFAULT_OUTPUT_JSON_PATH = '/home/jovyan/work/data/qpp-single-source-2018.json'


def _convert_measure_ids_to_match_nava_format(single_source_dict):
    """Format measure number as 'measureId' string and add to measure dictionary."""
    single_source_final = {}
    for measure, measure_dict in single_source_dict.items():
        measure_id = '{:03.0f}'.format(float(measure))
        measure_dict.update({'measureId': measure_id})  # Include measureId in the JSON blob
        single_source_final[measure_id] = measure_dict

    return single_source_final


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

    # Update measureIds to match the format for later consolidation.
    output = _convert_measure_ids_to_match_nava_format(single_source_dict)

    # Write to JSON.
    if kwargs.get('output_filepath', None):
        with open(kwargs['output_filepath'], 'w') as f:
            json.dump(output, f, sort_keys=True, indent=4)

        print('The combined JSON file was written to {}.'.format(kwargs['output_filepath']))

    return output


def _get_arguments():
    """Build argument parser."""
    parser = argparse.ArgumentParser(
        description='''
            This script converts the Single Source Excel file to JSON.
            Arguments default to 2018 measures data and related files.
        '''
    )

    parser.add_argument(
        '-i', '--single_source_filepath',
        help='Single Source CSV file input filename',
        required=False,
        default=DEFAULT_SINGLE_SOURCE_CSV_PATH,
        type=str
    )

    parser.add_argument(
        '-o', '--output_filepath',
        help='Single source JSON output filepath',
        required=False,
        default=DEFAULT_OUTPUT_JSON_PATH,
        type=str
    )

    args = parser.parse_args()

    return args.__dict__

if __name__ == '__main__':
    _main(**_get_arguments())
