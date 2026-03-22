"""Training, inference, and forecasting pipeline for the LSTM stock model."""

import os
import pickle
from datetime import timedelta

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
import yfinance as yf
from sklearn.preprocessing import StandardScaler

try:
    from sklearn.metrics import root_mean_squared_error
except ImportError:
    from sklearn.metrics import mean_squared_error as _mse
    def root_mean_squared_error(y_true, y_pred):
        return _mse(y_true, y_pred, squared=False)

from model import PredictionModel

# ── Constants ────────────────────────────────────────────────────────────────
SEQ_LENGTH = 120
EPOCHS = 1000
LR = 0.001
HIDDEN_DIM = 64
NUM_LAYERS = 3
DATA_START = "2020-01-01"
WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "weights")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ── File helpers ─────────────────────────────────────────────────────────────

def weights_path(ticker: str) -> str:
    return os.path.join(WEIGHTS_DIR, f"{ticker}.pt")


def scaler_path(ticker: str) -> str:
    return os.path.join(WEIGHTS_DIR, f"{ticker}_scaler.pkl")


def is_trained(ticker: str) -> bool:
    """Return True iff both model weights and scaler files exist."""
    return (
        os.path.exists(weights_path(ticker))
        and os.path.exists(scaler_path(ticker))
    )


# ── Data ─────────────────────────────────────────────────────────────────────

def download_prices(ticker: str) -> tuple[np.ndarray, list[str]]:
    """Download close prices from yfinance. Returns (prices_array, date_strings).

    Raises ValueError if ticker returns no data.
    """
    df = yf.download(ticker, DATA_START, auto_adjust=True, progress=False)
    if df.empty:
        raise ValueError(f"No data found for ticker {ticker}")
    close = df["Close"].squeeze()  # handles multi-level columns in yfinance >= 0.2
    close = close.dropna()
    dates = close.index.strftime("%Y-%m-%d").tolist()
    prices = close.values.reshape(-1, 1).astype(float)
    return prices, dates


def build_sequences(prices: np.ndarray, scaler: StandardScaler) -> np.ndarray:
    """Build overlapping SEQ_LENGTH windows from scaled prices.

    Returns array of shape (N - SEQ_LENGTH, SEQ_LENGTH, 1).
    """
    scaled = scaler.transform(prices)
    seqs = np.lib.stride_tricks.sliding_window_view(
        scaled.squeeze(), SEQ_LENGTH
    )  # shape (N - SEQ_LENGTH + 1, SEQ_LENGTH)
    # Exclude the last window (no label) then reshape to (N, SEQ_LENGTH, 1)
    seqs = seqs[:-1, :, np.newaxis]  # (N - SEQ_LENGTH, SEQ_LENGTH, 1)
    return seqs.astype(np.float32)


# ── Forecast ─────────────────────────────────────────────────────────────────

def forecast_from_window(
    model: PredictionModel,
    scaler: StandardScaler,
    window: list[float],
    days: int = 7,
    device: str | torch.device = "cpu",
) -> list[float]:
    """Autoregressive rollout. window must be SEQ_LENGTH scaled values.

    Returns list of `days` inverse-transformed price predictions.
    """
    model.eval()
    rolling = list(window[-SEQ_LENGTH:])
    preds_scaled = []

    with torch.no_grad():
        for _ in range(days):
            x = torch.tensor(rolling[-(SEQ_LENGTH - 1):], dtype=torch.float32)
            x = x.view(1, SEQ_LENGTH - 1, 1).to(device)
            pred = model(x).item()
            rolling.append(pred)
            preds_scaled.append(pred)

    forecast = scaler.inverse_transform(
        np.array(preds_scaled).reshape(-1, 1)
    ).flatten().tolist()
    return forecast


# ── Training ─────────────────────────────────────────────────────────────────

def run_training(ticker: str, progress_callback=None) -> dict:
    """Full training pipeline. Returns metrics dict.

    progress_callback(pct: int) is called after each epoch with 0-100.
    Raises ValueError if ticker data cannot be downloaded.
    """
    os.makedirs(WEIGHTS_DIR, exist_ok=True)

    prices, _ = download_prices(ticker)
    scaler = StandardScaler()
    scaler.fit(prices)

    seqs = build_sequences(prices, scaler)  # (N, SEQ_LENGTH, 1)
    train_size = int(0.8 * len(seqs))

    X_train = torch.from_numpy(seqs[:train_size, :-1, :]).to(device)
    Y_train = torch.from_numpy(seqs[:train_size, -1, :]).to(device)
    X_test = torch.from_numpy(seqs[train_size:, :-1, :]).to(device)
    Y_test = seqs[train_size:, -1, :]

    model = PredictionModel(1, HIDDEN_DIM, NUM_LAYERS, 1).to(device)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=LR)

    for epoch in range(EPOCHS):
        model.train()
        optimizer.zero_grad()
        pred = model(X_train)
        loss = criterion(pred, Y_train)
        loss.backward()
        optimizer.step()
        if progress_callback:
            progress_callback(int((epoch + 1) / EPOCHS * 100))

    # Compute RMSE
    model.eval()
    with torch.no_grad():
        y_train_pred = model(X_train).cpu().numpy()
        y_test_pred = model(X_test).cpu().numpy()

    y_train_actual = scaler.inverse_transform(seqs[:train_size, -1, :])
    y_train_pred_actual = scaler.inverse_transform(y_train_pred)
    y_test_actual = scaler.inverse_transform(Y_test)
    y_test_pred_actual = scaler.inverse_transform(y_test_pred)

    train_rmse = float(root_mean_squared_error(y_train_actual, y_train_pred_actual))
    test_rmse = float(root_mean_squared_error(y_test_actual, y_test_pred_actual))

    # Save
    torch.save(model.state_dict(), weights_path(ticker))
    with open(scaler_path(ticker), "wb") as f:
        pickle.dump(scaler, f)

    return {"train_rmse": train_rmse, "test_rmse": test_rmse}


# ── Inference ─────────────────────────────────────────────────────────────────

def run_predict(ticker: str) -> dict | None:
    """Load cached weights and run inference + 7-day forecast.

    Returns None if weights are missing/corrupt (treat as untrained).
    Raises ValueError if ticker data cannot be downloaded (invalid ticker).
    """
    if not is_trained(ticker):
        return None

    try:
        prices, dates = download_prices(ticker)

        with open(scaler_path(ticker), "rb") as f:
            scaler = pickle.load(f)

        model = PredictionModel(1, HIDDEN_DIM, NUM_LAYERS, 1).to(device)
        model.load_state_dict(
            torch.load(weights_path(ticker), map_location=device)
        )
        model.eval()

        seqs = build_sequences(prices, scaler)
        train_size = int(0.8 * len(seqs))

        # Test set inference
        X_test = torch.from_numpy(seqs[train_size:, :-1, :]).to(device)
        Y_test = seqs[train_size:, -1, :]

        with torch.no_grad():
            y_pred = model(X_test).cpu().numpy()

        y_test_actual = scaler.inverse_transform(Y_test).flatten().tolist()
        y_pred_actual = scaler.inverse_transform(y_pred).flatten().tolist()
        error = [abs(a - p) for a, p in zip(y_test_actual, y_pred_actual)]

        # Train RMSE
        X_train = torch.from_numpy(seqs[:train_size, :-1, :]).to(device)
        Y_train = seqs[:train_size, -1, :]
        with torch.no_grad():
            y_train_pred = model(X_train).cpu().numpy()
        train_rmse = float(root_mean_squared_error(
            scaler.inverse_transform(Y_train),
            scaler.inverse_transform(y_train_pred)
        ))
        test_rmse = float(root_mean_squared_error(
            np.array(y_test_actual).reshape(-1, 1),
            np.array(y_pred_actual).reshape(-1, 1)
        ))

        # Test set dates (offset by train_size + SEQ_LENGTH into full date list)
        test_start_idx = train_size + SEQ_LENGTH - 1
        test_dates = dates[test_start_idx: test_start_idx + len(y_test_actual)]

        # 7-day forecast
        window = scaler.transform(prices[-SEQ_LENGTH:]).flatten().tolist()
        forecast = forecast_from_window(model, scaler, window, days=7, device=device)

        last_date = pd.to_datetime(test_dates[-1])
        forecast_dates = [
            (last_date + timedelta(days=i + 1)).strftime("%Y-%m-%d")
            for i in range(7)
        ]

        return {
            "ticker": ticker,
            "status": "complete",
            "dates": test_dates,
            "actual": y_test_actual,
            "predicted": y_pred_actual,
            "error": error,
            "train_rmse": train_rmse,
            "test_rmse": test_rmse,
            "forecast_dates": forecast_dates,
            "forecast": forecast,
        }

    except ValueError:
        # Invalid ticker — let caller handle as HTTP 400
        raise
    except Exception as exc:
        # Corrupt or missing weights at inference time → treat as untrained
        import warnings
        warnings.warn(f"run_predict({ticker}): treating as untrained due to error: {exc}")
        return None
