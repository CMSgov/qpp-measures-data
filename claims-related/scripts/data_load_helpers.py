"""Generic helper methods."""
from functools import wraps

import pandas as pd


def format_column_title(c_name):
    """Clean up a column title by removing/replacing special characters."""
    for from_ch_g, to_ch in {"([-,*'#])\n": '', ' -./: ;': '_'}.items():
        for ch in from_ch_g:
            c_name = c_name.replace(ch, to_ch).strip(' _')

    if c_name.lower() == 'measure_id':
        return 'measure'

    return c_name.lower()


def create_list_from_code_row(code_row):
    """
    Given a row of dx or admin codes, return them in list format.

    First, it checks for non-null elements, then strips the whitespaces
    and returns a lower caseversion in a list format.
    """
    return [x.strip().lower() for x in code_row if pd.notnull(x)]


def create_code_modifier_key(row):
    """Create look-up key from CPT/HCPCS code and their corresopnding modifier."""
    return '-'.join(create_list_from_code_row(row))


def counter(func):
    """
    Count the number of times a function has been called.

    # of times a function has been called can be access by <funcname>.count
    """
    @wraps(func)
    def wrapped_func(*args, **kwargs):
        wrapped_func.count += 1
        return func(*args, **kwargs)
    wrapped_func.count = 0
    return wrapped_func
