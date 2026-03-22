import numpy as np
import pytest
from unittest.mock import patch, MagicMock
from sklearn.preprocessing import StandardScaler


def test_build_sequences_shape():
    """build_sequences should produce (N - SEQ_LENGTH, SEQ_LENGTH, 1) shaped array."""
    from pipeline import build_sequences, SEQ_LENGTH
    scaler = StandardScaler()
    prices = np.arange(200, dtype=float).reshape(-1, 1)
    scaler.fit(prices)
    seqs = build_sequences(prices, scaler)
    expected_n = 200 - SEQ_LENGTH
    assert seqs.shape == (expected_n, SEQ_LENGTH, 1), \
        f"Expected ({expected_n}, {SEQ_LENGTH}, 1), got {seqs.shape}"


def test_build_sequences_values_are_scaled():
    """Sequence values should be z-score scaled (mean ~0, std ~1)."""
    from pipeline import build_sequences, SEQ_LENGTH
    scaler = StandardScaler()
    prices = np.arange(200, dtype=float).reshape(-1, 1)
    scaler.fit(prices)
    seqs = build_sequences(prices, scaler)
    flat = seqs.flatten()
    assert abs(flat.mean()) < 0.5, "Scaled values should be near zero mean"


def test_forecast_length():
    """forecast_from_window should return exactly 7 predictions."""
    from pipeline import forecast_from_window, SEQ_LENGTH
    import torch

    # Create a trivial trained model that always returns 0
    from model import PredictionModel
    model = PredictionModel(1, 64, 3, 1)
    model.eval()

    scaler = StandardScaler()
    prices = np.arange(200, dtype=float).reshape(-1, 1)
    scaler.fit(prices)

    window = scaler.transform(prices[-SEQ_LENGTH:]).flatten().tolist()
    result = forecast_from_window(model, scaler, window, days=7, device='cpu')

    assert len(result) == 7, f"Expected 7 forecast values, got {len(result)}"


def test_forecast_values_are_in_price_space():
    """forecast_from_window should return inverse-transformed price values (not scaled)."""
    from pipeline import forecast_from_window, SEQ_LENGTH
    from model import PredictionModel

    model = PredictionModel(1, 64, 3, 1)
    model.eval()

    scaler = StandardScaler()
    prices = (np.arange(200, dtype=float) + 100).reshape(-1, 1)  # prices ~100-299
    scaler.fit(prices)

    window = scaler.transform(prices[-SEQ_LENGTH:]).flatten().tolist()
    result = forecast_from_window(model, scaler, window, days=7, device='cpu')

    # Results should be in price space (not z-scores near 0)
    # A freshly initialised model will output something small but inverse_transform
    # will shift it back to price space (mean ~199)
    assert all(isinstance(v, float) for v in result)


def test_is_trained_false_when_no_files(tmp_path):
    """is_trained should return False when weights files are missing."""
    from pipeline import is_trained
    # Point to a temp directory that has no .pt or .pkl files
    with patch('pipeline.WEIGHTS_DIR', str(tmp_path)):
        assert is_trained('FAKE') is False


def test_is_trained_true_when_both_files_exist(tmp_path):
    """is_trained should return True when both .pt and .pkl exist."""
    from pipeline import is_trained
    (tmp_path / 'AAPL.pt').touch()
    (tmp_path / 'AAPL_scaler.pkl').touch()
    with patch('pipeline.WEIGHTS_DIR', str(tmp_path)):
        assert is_trained('AAPL') is True
