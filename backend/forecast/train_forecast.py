"""Train a Prophet forecasting model on sample timeseries extracted from backend/data/trends.csv
Produces a saved model at backend/forecast/prophet_model.joblib
"""
import os
import pandas as pd
from prophet import Prophet
import joblib


def load_sample_series(csv_path: str):
    # assume CSV has columns: source,title,date,metric
    if not os.path.exists(csv_path):
        raise FileNotFoundError(csv_path)
    df = pd.read_csv(csv_path)
    # basic aggregation: use 'date' and median metric per date
    if "date" not in df.columns or "metric" not in df.columns:
        # fallback: create artificial series
        today = pd.Timestamp.today().normalize()
        dates = [today - pd.Timedelta(days=7 * i) for i in range(8)][::-1]
        return pd.DataFrame({"ds": dates, "y": [100 + i * 5 for i in range(len(dates))]})

    df["ds"] = pd.to_datetime(df["date"]).dt.normalize()
    ts = df.groupby("ds").metric.median().reset_index().rename(columns={"metric": "y"})
    return ts


def train_and_save(csv_path: str, out_path: str):
    ts = load_sample_series(csv_path)
    m = Prophet(daily_seasonality=False)
    m.fit(ts)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    joblib.dump(m, out_path)
    print("Saved model to", out_path)


if __name__ == "__main__":
    csv = os.path.join(os.path.dirname(__file__), "..", "data", "trends.csv")
    csv = os.path.normpath(csv)
    out = os.path.join(os.path.dirname(__file__), "prophet_model.joblib")
    train_and_save(csv, out)
