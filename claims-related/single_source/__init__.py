"""
Filter out Deprecation Warnings

pandas throws a deprecation warning stating that pyarrow will become a
dependency in pandas 3
"""
import warnings

warnings.simplefilter(action="ignore", category=DeprecationWarning)
