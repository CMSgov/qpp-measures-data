//These are only needed if the csv column names do not match the measures-data field names.
export const BASE_CSV_COLUMN_NAMES = {
    'title': 'title',
    'description': 'description',
    'measureId': 'measure_id',
    'yearRemoved': 'Year Removed',
}

export const IA_CSV_COLUMN_NAMES = {
    ...BASE_CSV_COLUMN_NAMES,
    'weight': 'weight',
    'subcategoryId': 'subcategory_name'
};

export const PI_CSV_COLUMN_NAMES = {
    ...BASE_CSV_COLUMN_NAMES,
    'required': 'required',
    'isRequired': 'required',
    'metricType': 'name',
    'isBonus': 'bonus',
    'reportingCategory': 'reporting_category',
    'substitutes': 'substitutes',
    'exclusion': 'exclusions',
};

export const QUALITY_CSV_COLUMN_NAMES = {
    'Year Removed': 'yearRemoved',
};

export const arrayCSVfields = [
    'substitutes',
    'exclusions',
    'submissionMethods',
    'allowedVendors',
    'allowedPrograms',
    'measureSets',
    'submissionMethods',
]