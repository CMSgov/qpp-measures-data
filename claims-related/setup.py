from setuptools import setup

setup(
    name='single_source_file_generator',
    version='1.0',
    description='Package for converting single source .csv files to json format',
    package_dir={"single_source_scripts": "scripts"},
    install_requires=[
        "pandas>=1.1.5",
        "numpy>=1.19.5"
    ]
)