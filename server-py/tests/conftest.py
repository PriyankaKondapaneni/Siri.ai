"""Point every test at a throwaway SQLite file so the dev DB is never touched.

Must run before app modules import (pytest imports conftest first).
"""
import os
import tempfile

os.environ["SIRI_DB_PATH"] = os.path.join(tempfile.mkdtemp(), "test_siri.db")
