"""Authenticity detection heuristics for Ratefluencer.

Provides functions to compute engagement rate and an authenticity score (0-100)
based on common heuristics: purchased followers, bot activity, engagement pods,
and spike detection. This module is intentionally simple and explainable for demo.
"""
from typing import Dict
import math


def compute_engagement_rate(metrics: Dict) -> float:
    """Compute engagement rate = (likes + comments + shares + saves) / followers"""
    followers = max(metrics.get("followers", 1), 1)
    total = (
        metrics.get("avgLikes", 0)
        + metrics.get("avgComments", 0)
        + metrics.get("avgShares", 0)
        + metrics.get("avgSaves", 0)
    )
    return total / followers


def compute_suspicious_blend(quality: Dict) -> float:
    """Blend suspicious signals into a 0..1 score where higher is worse."""
    return (
        quality.get("purchasedFollowersScore", 0) * 0.4
        + quality.get("engagementPodScore", 0) * 0.3
        + quality.get("botActivityScore", 0) * 0.2
        + quality.get("spikeScore", 0) * 0.1
    )


def compute_authenticity_score(influencer: Dict) -> int:
    """Return authenticity score 0-100 where higher is more authentic.

    influencer: dict containing keys 'metrics' and 'quality'
    """
    metrics = influencer.get("metrics", {})
    quality = influencer.get("quality", {})

    engagement_rate = compute_engagement_rate(metrics)

    # engagement penalty: very low engagement suggests fake followers
    if engagement_rate < 0.005:
        engagement_penalty = 0.2
    elif engagement_rate < 0.02:
        engagement_penalty = 0.1
    else:
        engagement_penalty = 0.0

    suspicious = compute_suspicious_blend(quality)

    # quality boosts from comment and audience quality
    quality_boost = (quality.get("commentQuality", 0) + quality.get("audienceQuality", 0)) / 2.0

    raw = 1.0 - suspicious - engagement_penalty
    # blend raw with quality_boost to form final authenticity
    blended = raw * 0.65 + quality_boost * 0.35
    # clamp
    blended = max(0.0, min(1.0, blended))
    return int(round(blended * 100))


if __name__ == "__main__":
    # quick smoke test
    sample = {
        "id": "inf-001",
        "metrics": {"followers": 100000, "avgLikes": 1200, "avgComments": 40, "avgShares": 200, "avgSaves": 150},
        "quality": {"purchasedFollowersScore": 0.05, "engagementPodScore": 0.02, "botActivityScore": 0.03, "spikeScore": 0.01, "commentQuality": 0.8, "audienceQuality": 0.85},
    }
    print("engagement_rate:", compute_engagement_rate(sample["metrics"]))
    print("authenticity:", compute_authenticity_score(sample))
