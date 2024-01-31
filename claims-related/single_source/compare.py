from copy import deepcopy

from single_source.parser import read_single_source_json


def read_and_sort_json(filepath):
    single_source = read_single_source_json(filepath)
    sorted_single_source = sort_single_source(single_source)
    return sorted_single_source


def sort_single_source(single_source):
    sorted_source = deepcopy(single_source)
    for x in sorted_source.values():
        x.update(dict(performanceOptions=sorted(x["performanceOptions"], key=sort_performance_options)))
    return sorted_source


def sort_performance_options(key):
    """
    Need to sort the performanceOptions list (json array) because the order is
    irrelevant for the performanceOptions.  Sort the array so if they have the same
    elements they pass as equal
    """
    x = [key.get("optionGroup"), key.get("optionType")]
    z = [x.get("code") for x in key.get("qualityCodes")]
    return x + z
