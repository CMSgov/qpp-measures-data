import pytest
from pathlib import Path
from single_source.compare import read_single_source_json


def get_json_file_paths():
    data_directory = get_data_directory()
    json_file_paths = sorted(data_directory.glob("qpp-single-source-*.json"))
    return json_file_paths


def get_data_directory():
    path = Path(__file__)
    return path.parent.parent / "data"


JSON_FILE_PATHS = get_json_file_paths()


@pytest.mark.parametrize("file_1,file_2",
                         list(zip(JSON_FILE_PATHS[1:], JSON_FILE_PATHS[:-1])),
                         ids=lambda x: x.name
)
def test_yoy_changes(file_1, file_2):
    json_1 = read_single_source_json(file_1)
    json_2 = read_single_source_json(file_2)
    assert json_1 == json_2
