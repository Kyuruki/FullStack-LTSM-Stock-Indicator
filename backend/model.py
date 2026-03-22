import torch
import torch.nn as nn


class PredictionModel(nn.Module):
    """LSTM model for single-feature time series prediction.

    Identical architecture to Main.ipynb:
      input_dim=1, hidden_dim=64, num_layers=3, output_dim=1
    """

    def __init__(self, input_dim: int, hidden_dim: int, num_layers: int, output_dim: int):
        super().__init__()
        self.num_layers = num_layers
        self.hidden_dim = hidden_dim
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Create hidden/cell states on the same device as input
        dev = x.device
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim, device=dev)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim, device=dev)
        out, _ = self.lstm(x, (h0, c0))
        return self.fc(out[:, -1, :])
