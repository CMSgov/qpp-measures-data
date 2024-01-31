import pytest
import json
from pathlib import Path

from single_source.parser import read_single_source_csv


@pytest.fixture(scope="session")
def data_directory():
    path = Path(__file__)
    return path.parents[2] / "data"


@pytest.fixture(scope="session")
def measures_directory():
    path = Path(__file__)
    return path.parents[3] / "measures"


@pytest.fixture(scope="session")
def single_source(data_directory):
    """
    "2022_Claims_SingleSource_v6.0_08-12-2022.csv"
    """
    file_path = data_directory / "2022_Claims_SingleSource_v6.0_08-12-2022.csv"
    return read_single_source_csv(file_path)


@pytest.fixture(scope="session")
def single_source_json(data_directory):
    """
    "qpp-single-source-2022.json"
    """
    file_path = data_directory / "qpp-single-source-2022.json"
    with open(file_path, "r") as file_handle:
        lines = file_handle.readlines()
    single_source = json.loads("".join(lines))
    return single_source
