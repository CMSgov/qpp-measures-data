import pytest
from single_source.compare import read_and_sort_json, sort_single_source, sort_performance_options
from single_source.format_json import *


@pytest.fixture
def parsed_single_source(single_source):
    parsed = parse_single_source(single_source)
    return parsed


def test_format_single_measure(single_source):
    measure_id = "155"
    single_measure = single_source.loc[single_source[Column.measure_id.value] == measure_id]
    parsed = parse_single_source(single_measure)
    formatted = format_json(parsed)
    assert(len(formatted) == 1)
    assert(measure_id in formatted.keys())


@pytest.mark.parametrize("measure_id", [
    "001", "024", "039", "047", "076", "110", "111", "112", "113", "117", "128", "130", "134", "141",
    "145", "147", "155", "181", "226", "236", "249", "250", "261", "317", "320", "395", "396", "397",
    "405", "406", "416", "418", "422", "436"])
def test_format_json_compare(parsed_single_source, single_source_json, measure_id):
    results = format_json(parsed_single_source)
    results_measure = results[measure_id]
    results_measure.update(dict(performanceOptions=sorted(results_measure["performanceOptions"],
                                                          key=sort_performance_options)))
    single_source_measure = single_source_json[measure_id]
    single_source_measure.update(dict(performanceOptions=sorted(single_source_measure["performanceOptions"],
                                                                key=sort_performance_options)))
    assert results_measure == single_source_measure


@pytest.mark.parametrize("csv_path,json_path", [
    ("2018_Claims_SingleSource_Bayes_Feedback_05032018.csv", "qpp-single-source-2018.json"),
    ("2019_Claims_SingleSource_v2.0.csv", "qpp-single-source-2019.json"),
    ("2020_Claims_SingleSource_v1.4.csv", "qpp-single-source-2020.json"),
    ("2021_Claims_SingleSource_v1.3.csv", "qpp-single-source-2021.json"),
    ("2022_Claims_SingleSource_v6.0_08-12-2022.csv", "qpp-single-source-2022.json")
])
def test_compare_versions(csv_path, json_path, data_directory):
    # Compare creating the json file from the csv to the single source jsons
    single_source_csv = read_single_source_csv(data_directory / csv_path)
    parsed_single_source = parse_single_source(single_source_csv)
    formatted_json = format_json(parsed_single_source)
    sorted_json = sort_single_source(formatted_json)
    expected = read_and_sort_json(data_directory / json_path)
    assert sorted_json == expected


def test_format_json_new_filename_smoke_test(data_directory):
    filename = "2023_Claims_SingleSource_v7.0_1.29.24.csv"
    filepath = data_directory / filename
    source_csv = read_single_source_csv(filepath)
    parsed_single_source = parse_single_source(source_csv)
    _ = format_json(parsed_single_source)


@pytest.mark.parametrize("measure_id", [
    "001", "024", "039", "047", "110", "111", "112", "113", "128", "134", "141",
    "145", "147", "155", "181", "226", "236", "249", "250", "261", "317", "320", "395", "396", "397",
    "405", "406", "418", "422", "436"])
def test_compare_two_jsons_measure_by_measure(data_directory, measure_id):
    expected = read_and_sort_json(data_directory / "qpp-single-source-2023.json")
    test_ = read_and_sort_json(data_directory / "qpp-single-source-2023_new.json")
    test_measure = test_[measure_id]
    expected_measure = expected[measure_id]
    assert test_measure == expected_measure
