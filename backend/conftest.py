import sys
import os

# Allow running pytest from the repo root (e.g., `pytest backend/`)
# by ensuring the backend directory is on the Python path.
sys.path.insert(0, os.path.dirname(__file__))
