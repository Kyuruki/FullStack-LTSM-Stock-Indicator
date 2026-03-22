"""FastAPI backend for the StockSignal LSTM dashboard."""

import threading
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pipeline import is_trained, run_predict, run_training

app = FastAPI(title="StockSignal LSTM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# In-memory training state per ticker
training_state: dict[str, dict[str, Any]] = {}

_DEFAULT_STATE = {
    "status": "idle",
    "progress": 0,
    "train_rmse": None,
    "test_rmse": None,
    "error_message": None,
}


def _get_state(ticker: str) -> dict:
    return training_state.get(ticker, dict(_DEFAULT_STATE))


def _set_state(ticker: str, **kwargs) -> None:
    current = training_state.get(ticker, dict(_DEFAULT_STATE))
    training_state[ticker] = {**current, **kwargs}


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/predict")
def predict(ticker: str):
    """Return cached predictions or {status: untrained}."""
    ticker = ticker.upper()
    if not is_trained(ticker):
        return {"status": "untrained"}

    try:
        payload = run_predict(ticker)
    except ValueError:
        # Invalid ticker — yfinance returned no data
        raise HTTPException(
            status_code=400,
            detail=f"No data found for ticker {ticker}"
        )

    if payload is None:
        # Weights were corrupt or missing at inference time
        return {"status": "untrained"}

    return payload


@app.post("/train")
def train(ticker: str):
    """Start background training. No-op if already training for this ticker."""
    ticker = ticker.upper()
    state = _get_state(ticker)
    if state["status"] == "training":
        return {"status": "already_training"}

    _set_state(ticker, status="training", progress=0,
               train_rmse=None, test_rmse=None, error_message=None)

    def _run():
        try:
            def progress_cb(pct: int):
                _set_state(ticker, progress=pct)

            metrics = run_training(ticker, progress_callback=progress_cb)
            _set_state(
                ticker,
                status="complete",
                progress=100,
                train_rmse=metrics["train_rmse"],
                test_rmse=metrics["test_rmse"],
            )
        except Exception as exc:
            _set_state(ticker, status="error", error_message=str(exc))

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    return {"status": "started"}


@app.get("/status")
def status(ticker: str):
    """Return current training state for a ticker."""
    return _get_state(ticker.upper())
