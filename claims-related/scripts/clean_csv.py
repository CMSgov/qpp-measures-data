import csv
from pathlib import Path
import re
import argparse


######
# The result of exporting the .xlsx single source document to
# .csv format is not pretty.  This script will format the initial
# .csv file to match the 2021_Claims_SingleSource_v1.3.csv file.

# The to-be-cleaned .csv file should be placed in /claims-related/data
######


class FormatInitialCSV:

    CORRECT_HEADERS = [
        "Measure ID",
        "DATA ELEMENT NAME",
        "CODING SYSTEM",
        "CODE",
        "MODIFIER",
        "PLACE OF SERVICE",
        "AGE",
        "GENDER",
    ]

    HEADER_CHARS = r"\w+"

    NUM_COLS = len(CORRECT_HEADERS)

    @staticmethod
    def _get_filepath(filename):
        return Path().absolute().parent / "data" / filename

    def _get_orig_csv_contents(self, source_filename):
        with open(self._get_filepath(source_filename), "r") as f:
            contents = [l for l in csv.reader(f)]
            return contents[1:-1]

    @staticmethod
    def _verify_header(cleaned_header):
        if cleaned_header != FormatInitialCSV.CORRECT_HEADERS:
            raise AttributeError(
                "Please make sure that current and previous years have the same columns"
            )

    @staticmethod
    def _verify_col_count(cleaned_records):
        if any([len(r) != FormatInitialCSV.NUM_COLS for r in cleaned_records]):
            raise ValueError(
                f"The following rows have an incorrect number of columns: {[i for i,r in enumerate(cleaned_records) if len(r) != FormatInitialCSV.NUM_COLS]}"
            )

    def _create_clean_header(self, header):
        cleaned_header = [
            col.replace("\n", "") for col in header if re.match(self.HEADER_CHARS, col)
        ]
        self._verify_header(cleaned_header)
        return [cleaned_header]

    def _clean_records(self, records):
        cleaned_records = [
            [r for i, r in enumerate(record) if i < FormatInitialCSV.NUM_COLS]
            for record in records
        ]
        self._verify_col_count(cleaned_records)
        return cleaned_records

    def _write_cleaned_csv(self, cleaned_header, cleaned_records, output_filename):
        with open(self._get_filepath(output_filename), "w") as f:
            writer = csv.writer(f)
            writer.writerows(cleaned_header + cleaned_records)

    def run(self, source_filename, output_filename):
        contents = self._get_orig_csv_contents(source_filename)
        cleaned_header = self._create_clean_header(contents[0])
        cleaned_records = self._clean_records(contents[1:])
        self._write_cleaned_csv(cleaned_header, cleaned_records, output_filename)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Clean up initial single source .csv file"
    )
    parser.add_argument(
        "--input",
        required=True,
        help="name of .csv file converted from the single source .xlxs file",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="name of resulting single source .csv file.  Ex: 2021_Claims_SingleSource_v6.0.csv",
    )
    args = parser.parse_args()
    source_filename = args.input
    output_filename = args.output
    fmt = FormatInitialCSV()
    fmt.run(source_filename, output_filename)
