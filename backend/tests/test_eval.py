import json
from pathlib import Path

from backend.eval.evaluate_ratefluencer import run_evaluation


def test_evaluation_report_generation():
    out = run_evaluation()
    assert Path(out).exists()

    payload = json.loads(Path(out).read_text(encoding="utf-8"))
    for key in ["samples", "rmse", "mae", "r2", "mape"]:
        assert key in payload
    assert payload["samples"] > 0
