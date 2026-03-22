import torch
import pytest
from model import PredictionModel


def test_forward_output_shape():
    """Model should output (batch, 1) for input (batch, seq_len-1, 1)."""
    model = PredictionModel(input_dim=1, hidden_dim=64, num_layers=3, output_dim=1)
    x = torch.randn(4, 119, 1)  # batch=4, seq_len-1=119, features=1
    out = model(x)
    assert out.shape == (4, 1), f"Expected (4, 1), got {out.shape}"


def test_forward_single_sample():
    """Model should work with batch size 1."""
    model = PredictionModel(input_dim=1, hidden_dim=64, num_layers=3, output_dim=1)
    x = torch.randn(1, 119, 1)
    out = model(x)
    assert out.shape == (1, 1)


def test_forward_uses_input_device():
    """Hidden states should be created on the same device as input."""
    model = PredictionModel(input_dim=1, hidden_dim=64, num_layers=3, output_dim=1)
    x = torch.randn(2, 119, 1)  # CPU
    out = model(x)
    assert out.device.type == "cpu"
