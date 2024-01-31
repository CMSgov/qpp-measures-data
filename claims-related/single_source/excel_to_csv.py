"""
Convert Mathematica's Excel single source file to CSV
"""
import sys
import argparse
from pathlib import Path
import pandas as pd


def main():
    parsed_args = parse_args(sys.argv[1:])
    if parsed_args.output_path is None:
        output_path = Path(parsed_args.input_path).with_suffix(".csv")
    else:
        output_path = Path(parsed_args.output_path)
    if output_path.exists() and not parsed_args.overwrite:
        raise ValueError("File exists, specify overwrite if desired")

    data = pd.read_excel(parsed_args.input_path,
                         sheet_name="Codes",
                         skiprows=1)
    rename = dict(zip(data.columns, data.columns.str.replace(r"\n", " ", regex=True)))
    data = data.rename(columns=rename)
    # Remove row if DATA ELEMENT NAME is null
    # Mathematica put some notes at the bottom of the table which
    # messes with csv_to_json
    data = data.loc[~data["DATA ELEMENT NAME"].isnull()]
    data.to_csv(output_path, index=False)


def parse_args(args):
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-path", type=str, required=True)
    parser.add_argument("--output-path", type=str, required=False)
    parser.add_argument("--overwrite", action="store_true")
    parsed_args = parser.parse_args(args)
    return parsed_args


if __name__ == "__main__":
    main()
