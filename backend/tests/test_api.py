"""Integration tests for the FastAPI endpoints using mocked pipeline functions."""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


MOCK_PAYLOAD = {
    "ticker": "AAPL",
    "status": "complete",
    "dates": ["2024-01-02", "2024-01-03"],
    "actual": [185.2, 186.1],
    "predicted": [184.1, 185.7],
    "error": [1.1, 0.4],
    "train_rmse": 12.4,
    "test_rmse": 8.7,
    "forecast_dates": ["2024-01-04", "2024-01-05", "2024-01-06",
                        "2024-01-07", "2024-01-08", "2024-01-09", "2024-01-10"],
    "forecast": [187.0, 188.1, 186.5, 189.2, 190.0, 188.7, 191.1],
}


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


def test_predict_untrained_ticker(client):
    """GET /predict for unknown ticker returns {status: untrained}."""
    with patch("main.is_trained", return_value=False):
        resp = client.get("/predict?ticker=FAKE")
    assert resp.status_code == 200
    assert resp.json()["status"] == "untrained"


def test_predict_trained_ticker(client):
    """GET /predict for trained ticker returns full payload."""
    with patch("main.is_trained", return_value=True), \
         patch("main.run_predict", return_value=MOCK_PAYLOAD):
        resp = client.get("/predict?ticker=AAPL")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "complete"
    assert data["ticker"] == "AAPL"
    assert len(data["forecast"]) == 7


def test_predict_invalid_ticker_returns_400(client):
    """GET /predict for invalid ticker (yfinance empty) returns HTTP 400."""
    with patch("main.is_trained", return_value=True), \
         patch("main.run_predict", side_effect=ValueError("No data found for ticker INVALIDXXX")):
        resp = client.get("/predict?ticker=INVALIDXXX")
    assert resp.status_code == 400


def test_predict_corrupt_weights_returns_untrained(client):
    """GET /predict when weights are corrupt returns {status: untrained}."""
    with patch("main.is_trained", return_value=True), \
         patch("main.run_predict", return_value=None):
        resp = client.get("/predict?ticker=CORRUPT")
    assert resp.status_code == 200
    assert resp.json()["status"] == "untrained"


def test_train_starts_background_job(client):
    """POST /train returns {status: started} and begins training."""
    with patch("main.is_trained", return_value=False), \
         patch("main.threading") as mock_thread:
        mock_thread.Thread.return_value = MagicMock()
        resp = client.post("/train?ticker=AAPL")
    assert resp.status_code == 200
    assert resp.json()["status"] == "started"


def test_train_noop_when_already_training(client):
    """POST /train returns already_training if ticker is in training state."""
    from main import training_state
    training_state["NOOP"] = {"status": "training", "progress": 50,
                               "train_rmse": None, "test_rmse": None,
                               "error_message": None}
    resp = client.post("/train?ticker=NOOP")
    assert resp.status_code == 200
    assert resp.json()["status"] == "already_training"
    del training_state["NOOP"]


def test_status_unknown_ticker_returns_idle(client):
    """GET /status for a ticker with no state returns idle defaults."""
    resp = client.get("/status?ticker=UNKNOWN_TICKER_XYZ")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "idle"
    assert data["progress"] == 0


def test_status_returns_training_state(client):
    """GET /status reflects the in-memory training state."""
    from main import training_state
    training_state["TSLA"] = {"status": "training", "progress": 42,
                               "train_rmse": None, "test_rmse": None,
                               "error_message": None}
    resp = client.get("/status?ticker=TSLA")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "training"
    assert data["progress"] == 42
    del training_state["TSLA"]
