import json
from backend.auth import auth


def test_engagement_rate():
    metrics = {"followers": 1000, "avgLikes": 50, "avgComments": 5, "avgShares": 2, "avgSaves": 3}
    er = auth.compute_engagement_rate(metrics)
    assert er > 0


def test_authenticity_range():
    sample = {
        "metrics": {"followers": 1000, "avgLikes": 50, "avgComments": 5, "avgShares": 2, "avgSaves": 3},
        "quality": {"purchasedFollowersScore": 0.0, "engagementPodScore": 0.0, "botActivityScore": 0.0, "spikeScore": 0.0, "commentQuality": 1.0, "audienceQuality": 1.0},
    }
    score = auth.compute_authenticity_score(sample)
    assert 0 <= score <= 100
