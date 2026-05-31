"""Train a baseline Ratefluencer scoring model using synthetic data.
Produces backend/ml/ratefluencer_model.joblib
"""
import os
import random
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import lightgbm as lgb

from ..auth import auth as auth_mod
from ..forecast import forecast as fc_mod


def generate_synthetic_influencers(n=500):
    rows = []
    for i in range(n):
        followers = int(10 ** random.uniform(3, 6))
        avgLikes = int(max(1, followers * random.uniform(0.001, 0.05)))
        avgComments = int(max(0, avgLikes * random.uniform(0.01, 0.1)))
        metrics = {"followers": followers, "avgLikes": avgLikes, "avgComments": avgComments, "avgShares": int(avgLikes * 0.05), "avgSaves": int(avgLikes * 0.02)}
        quality = {
            "purchasedFollowersScore": random.random() * 0.2,
            "engagementPodScore": random.random() * 0.2,
            "botActivityScore": random.random() * 0.2,
            "spikeScore": random.random() * 0.2,
            "commentQuality": random.random(),
            "audienceQuality": random.random(),
        }
        # synthetic timeseries
        today = pd.Timestamp.today().normalize()
        dates = [today - pd.Timedelta(days=7 * i) for i in range(8)][::-1]
        base = int(followers * 0.01)
        series = [{"ds": d.date().isoformat(), "y": float(base + (j * random.uniform(-5, 10)))} for j, d in enumerate(dates)]

        auth_score = auth_mod.compute_authenticity_score({"metrics": metrics, "quality": quality})
        growth = fc_mod.compute_growth_potential(series, periods=7)
        growth_score = int(growth.get("score", 50))

        rows.append({
            "followers": followers,
            "avgLikes": avgLikes,
            "avgComments": avgComments,
            "engagement_rate": auth_mod.compute_engagement_rate(metrics),
            "authenticity": auth_score,
            "growth_score": growth_score,
            # target: combined Ratefluencer score
            "ratefluencer_score": 0.5 * auth_score + 0.5 * growth_score + random.uniform(-5, 5),
        })
    return pd.DataFrame(rows)


def train_and_save(out_path: str):
    df = generate_synthetic_influencers(800)
    X = df[["followers", "avgLikes", "avgComments", "engagement_rate", "authenticity", "growth_score"]]
    y = df["ratefluencer_score"]
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    train_data = lgb.Dataset(X_train, label=y_train)
    val_data = lgb.Dataset(X_val, label=y_val)
    params = {"objective": "regression", "metric": "rmse", "verbosity": -1}
    model = lgb.train(params, train_data, valid_sets=[val_data], num_boost_round=100, early_stopping_rounds=10)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    joblib.dump(model, out_path)
    preds = model.predict(X_val)
    print("RMSE:", mean_squared_error(y_val, preds, squared=False))


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "ratefluencer_model.joblib")
    train_and_save(out)
