"""Evaluation suite for the Ratefluencer scoring model.

Generates a deterministic synthetic validation dataset, evaluates model quality,
and writes a JSON report in backend/eval/reports/.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

import joblib
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from backend.ml.train_ratefluencer import generate_synthetic_influencers, train_and_save


FEATURES = [
    "followers",
    "avgLikes",
    "avgComments",
    "engagement_rate",
    "authenticity",
    "growth_score",
]


@dataclass
class EvalReport:
    samples: int
    rmse: float
    mae: float
    r2: float
    mape: float


def _safe_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    denom = np.maximum(np.abs(y_true), 1e-6)
    return float(np.mean(np.abs((y_true - y_pred) / denom)) * 100.0)


def evaluate_model(model_path: Path, n_samples: int = 300) -> EvalReport:
    if not model_path.exists():
        train_and_save(str(model_path))

    model = joblib.load(model_path)
    df = generate_synthetic_influencers(n_samples)
    x = df[FEATURES]
    y = df["ratefluencer_score"].to_numpy()
    preds = np.asarray(model.predict(x))

    rmse = float(np.sqrt(mean_squared_error(y, preds)))
    mae = float(mean_absolute_error(y, preds))
    r2 = float(r2_score(y, preds))
    mape = _safe_mape(y, preds)

    return EvalReport(samples=n_samples, rmse=rmse, mae=mae, r2=r2, mape=mape)


def write_report(report: EvalReport, out_file: Path) -> None:
    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_text(json.dumps(asdict(report), indent=2), encoding="utf-8")


def run_evaluation() -> Path:
    root = Path(__file__).resolve().parents[1]
    model_path = root / "ml" / "ratefluencer_model.joblib"
    out_file = Path(__file__).resolve().parent / "reports" / "latest.json"
    report = evaluate_model(model_path=model_path, n_samples=300)
    write_report(report, out_file)
    return out_file
