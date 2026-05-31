import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("backend_main", Path(__file__).parent / "main.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

ScoreRequest = mod.ScoreRequest
score_influencer = mod.score_influencer

req = ScoreRequest(metrics={"followers": 10000, "avgLikes": 200, "avgComments": 10}, quality={})
res = score_influencer(req)
print(res)
