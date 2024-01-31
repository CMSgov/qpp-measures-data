import json
from pathlib import Path


def check_output_path_overwrite(parsed_args):
    output_path = Path(parsed_args.output_path)
    if output_path.exists() and not parsed_args.overwrite:
        raise ValueError("File exists, specify overwrite if desired")


def write_json(json_data, file_path):
    with open(file_path, "w") as file_handle:
        json.dump(json_data, file_handle, sort_keys=True, indent=4)
