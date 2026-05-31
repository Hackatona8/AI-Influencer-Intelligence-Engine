import importlib.util
from pathlib import Path


def load_main():
    spec = importlib.util.spec_from_file_location("backend_main", Path(__file__).parents[1] / "main.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_score_endpoint():
    mod = load_main()
    ScoreRequest = mod.ScoreRequest
    score_influencer = mod.score_influencer
    req = ScoreRequest(metrics={"followers": 5000, "avgLikes": 100, "avgComments": 5}, quality={})
    res = score_influencer(req)
    assert hasattr(res, "score")
    assert 0 <= res.score <= 100
