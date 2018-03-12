"""Methods to load different data files into dataframes."""
from data_load_helpers import format_column_title

import pandas as pd


def load_qpp_emeasure(excel_path):
    """Load QPP eMeasure excel file into a DataFrame, updating some column names and values."""
    # FIXME: Remove this functionality.
    # Load the Excel file.
    with open(excel_path, 'rb') as fname:
        qpp_measures = pd.read_excel(
            fname,
            encoding=None,
            skip_footer=21,
            converters={'Measure #': int}
        )
    # Update column names.
    qpp_measures.columns = qpp_measures.columns.map(format_column_title)
    # There is one non-int value in the '# of Perf Rates' column.
    # I will replace it by 1 because this value is 1 for Claims.
    qpp_measures['of_perf_rates'] = qpp_measures['of_perf_rates'].replace(
        'Claims/ Registry = 1\neCQM = 2', 1
    ).astype(int, raise_on_error=False)

    # There is one null line in the dataset. Drop it.
    qpp_measures.dropna(how='all', inplace=True)

    # I will split and dummify the reporting option column.
    col_name = '2017_reporting_option_claims_registry_ehr'
    for reporting_option in ['eHR', 'Registry', 'Claims']:
        qpp_measures['if_' + reporting_option.lower()] = qpp_measures[col_name] \
            .apply(lambda x: reporting_option in x)

    # Clean up text columns in the dataframe.
    columns = [
        'emeasure_id',
        'measure_title',
        'claims_registry_measure_tag',
        'emeasure_specific_measure_tag',
        'additional_analytic_logic_or_guidance',
        'inverse'
    ]
    for col in columns:
        qpp_measures[col] = qpp_measures[col].str.strip()

    # Format the measure numbers for consistency.
    qpp_measures['measure'] = qpp_measures['measure'].apply(lambda x: '%0.2f' % x)
    # Replace null values with 'NA'.
    qpp_measures.fillna('NA', inplace=True)

    return qpp_measures


def load_single_source(excel_path):
    """Load single source file into a DataFrame."""
    column_dtypes = {
        'age': 'str',
        'code': 'str',
        'coding_system': 'str',
        'data_element_name': 'str',
        'gender': 'str',
        'measure': 'str',
        'modifier': 'str',
        'place_of_service': 'str',
        'reporting_method': 'str'
    }

    with open(excel_path, 'rb') as fname:
        single_source = pd.read_excel(fname, sheetname='Codes', dtypes=column_dtypes)

    # Update column names.
    single_source.rename(columns=format_column_title, inplace=True)

    # Format the measure codes to be compatible.
    single_source['measure'] = single_source['measure'].apply(lambda x: "{:.2f}".format(x))

    # Strip text in the dataframe.
    for col in single_source.columns:
        single_source[col] = single_source[col].dropna().astype('str').str.strip()

    print('There are {} unique measures.'.format(single_source.measure.nunique()))
    # Drop duplicates.
    print('Shape before drop:', single_source.shape)
    single_source.drop_duplicates(inplace=True)
    print('Shape after drop:', single_source.shape)

    return single_source
