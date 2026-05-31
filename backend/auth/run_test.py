import auth
import json
from pathlib import Path

sample_path = Path(__file__).parent / "sample_influencer.json"
with open(sample_path) as fh:
    sample = json.load(fh)

print("Engagement rate:", auth.compute_engagement_rate(sample["metrics"]))
print("Authenticity score:", auth.compute_authenticity_score(sample))
