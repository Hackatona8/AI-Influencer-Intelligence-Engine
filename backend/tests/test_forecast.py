from backend.forecast import forecast


def test_simple_forecast():
    series = [{"ds": "2026-05-01", "y": 100}, {"ds": "2026-05-08", "y": 110}, {"ds": "2026-05-15", "y": 130}]
    res = forecast.compute_growth_potential(series, periods=3)
    assert "score" in res and "forecast" in res
    assert isinstance(res["forecast"], list)
