from typing import List, Dict
import os
import math
import random
from datetime import datetime, timedelta

try:
    # optional dependency
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except Exception:
    PROPHET_AVAILABLE = False

import pandas as pd


def simple_trend_score(timeseries: List[Dict[str, float]], periods: int = 7) -> Dict:
    """Compute a simple growth forecast and return a score (0-100).

    timeseries: list of {"ds": "YYYY-MM-DD", "y": value}
    """
    if not timeseries:
        return {"score": 50, "trend": "flat", "forecast": []}

    df = pd.DataFrame(timeseries)
    df["ds"] = pd.to_datetime(df["ds"]).dt.date

    # basic growth rate: fit a linear slope
    try:
        x = (pd.to_datetime(df["ds"]).astype(int) // 10 ** 9).values.reshape(-1, 1)
    except Exception:
        x = (pd.to_datetime(df["ds"]).view(int) // 10 ** 9).values.reshape(-1, 1)

    y = df["y"].values
    if len(y) < 2 or all(math.isclose(v, y[0]) for v in y):
        return {"score": 50, "trend": "flat", "forecast": []}

    # compute slope via simple linear regression
    xm = x.mean()
    ym = y.mean()
    num = float(((x - xm) * (y - ym)).sum())
    den = float(((x - xm) ** 2).sum())
    slope = num / den if den != 0 else 0.0

    # normalize slope to a score
    raw = slope * 1e6
    score = max(0, min(100, int(50 + raw)))

    # classify
    trend = "up" if slope > 0 else "down" if slope < 0 else "flat"

    # simple forecast: repeat last value with small delta
    last = float(y[-1])
    forecast = []
    for i in range(1, periods + 1):
        delta = random.uniform(0, abs(raw) * 0.02)
        val = last + (i * delta if slope > 0 else -i * delta)
        ds = (pd.to_datetime(df["ds"].iloc[-1]) + pd.Timedelta(days=i)).date().isoformat()
        forecast.append({"ds": ds, "y": float(val)})

    return {"score": score, "trend": trend, "forecast": forecast}


def forecast_with_prophet(timeseries: List[Dict[str, float]], periods: int = 7) -> Dict:
    df = pd.DataFrame(timeseries)
    df["ds"] = pd.to_datetime(df["ds"])
    df = df[["ds", "y"]]
    m = Prophet(daily_seasonality=False)
    m.fit(df)
    future = m.make_future_dataframe(periods=periods)
    fc = m.predict(future)
    preds = fc[["ds", "yhat"]].tail(periods).to_dict(orient="records")
    # basic score by comparing latest y to mean of preds
    last = df["y"].iloc[-1]
    mean_pred = float(pd.Series([p["yhat"] for p in preds]).mean())
    score = max(0, min(100, int(50 + (mean_pred - last))))
    trend = "up" if mean_pred > last else "down" if mean_pred < last else "flat"
    forecast = [{"ds": p["ds"].date().isoformat(), "y": float(p["yhat"])} for p in preds]
    return {"score": score, "trend": trend, "forecast": forecast}


def compute_growth_potential(sample_series: List[Dict[str, float]], periods: int = 7) -> Dict:
    if PROPHET_AVAILABLE:
        try:
            return forecast_with_prophet(sample_series, periods=periods)
        except Exception:
            pass
    return simple_trend_score(sample_series, periods=periods)
