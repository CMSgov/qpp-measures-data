import argparse
import sys
from copy import deepcopy

from single_source.parser import read_single_source_json
from single_source.util import write_json


def main():
    parsed_args = parse_args(sys.argv[1:])
    single_source = read_single_source_json(parsed_args.single_source)
    measures_data = read_single_source_json(parsed_args.measures_data)
    single_source_measures = add_measures_data(single_source, measures_data)
    write_json(single_source_measures, parsed_args.output_path)


def parse_args(args):
    parser = argparse.ArgumentParser()
    parser.add_argument("--single-source", type=str, required=True)
    parser.add_argument("--measures-data", type=str, required=True)
    parser.add_argument("--output-path", type=str, required=True)
    parser.add_argument("--overwrite", action="store_true")
    parsed_args = parser.parse_args(args)
    return parsed_args


def add_measures_data(single_source, measures_data):
    measures_data_dict = get_measures_data_dict(measures_data)
    measure_ids = single_source.keys()
    single_source_measures = deepcopy(single_source)
    for meas_id in measure_ids:
        meas_data = measures_data_dict[meas_id]
        sngl_src = single_source_measures[meas_id]
        sngl_src.update(meas_data)
    return single_source_measures


def get_measures_data_dict(measures_data):
    """
    Change from list of dicts to dict of dicts
    """
    measures_data_dict = {x["measureId"]: x for x in measures_data}
    return measures_data_dict


if __name__ == "__main__":
    main()
