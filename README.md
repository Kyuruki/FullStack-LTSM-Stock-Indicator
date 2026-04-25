# StockSignal — LSTM Stock Forecast Dashboard

A full-stack web application that trains a Long Short-Term Memory (LSTM) neural network on historical stock price data and displays predictions alongside a 7-day autoregressive forecast.

---

https://github.com/user-attachments/assets/0d1b2016-7b57-4a12-b81e-f54a4ca1135c

## Features

- Train a per-ticker LSTM model directly from the UI
- View predicted vs. actual close prices on an interactive chart
- 7-day autoregressive price forecast
- Live training progress bar with RMSE metrics
- Watchlist with local persistence
- Dark-themed/Light Themed dashboard built with React + TailwindCSS

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 18, Vite, TailwindCSS, Lightweight Charts, Three.js |
| Backend  | FastAPI, Uvicorn                        |
| ML       | PyTorch (LSTM), scikit-learn, yfinance  |

---

## Project Structure

```
FullStack-LTSM-Stock-Indicator/
├── backend/
│   ├── main.py          # FastAPI app & endpoints
│   ├── pipeline.py      # Data download, training, inference
│   ├── model.py         # LSTM model definition
│   ├── requirements.txt
│   ├── weights/         # Saved model weights & scalers (auto-created)
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── hooks/       # useLSTMApi, useWatchlist, useTheme, etc.
│   │   └── utils/
│   ├── index.html
│   └── package.json
└── Main.ipynb           # Exploratory notebook from my previous repository
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint              | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | `/predict?ticker=AAPL` | Returns cached predictions or `{status: "untrained"}` |
| POST   | `/train?ticker=AAPL`   | Starts background model training         |
| GET    | `/status?ticker=AAPL`  | Returns training progress and RMSE       |

---

## Model Details

- **Architecture**: 3-layer LSTM, hidden dim 64
- **Input**: 120-day sliding window of scaled close prices
- **Output**: Next-day close price prediction
- **Training**: 1000 epochs, Adam optimizer, MSE loss
- **Data split**: 80% train / 20% test
- **Forecast**: 7-day autoregressive rollout from the last known window
- **Data source**: Yahoo Finance via `yfinance` (from 2020-01-01)

Model weights and scalers are saved per-ticker under `backend/weights/` and reused on subsequent loads.

---

## Running Tests

```bash
cd backend
pytest
```
