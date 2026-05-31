import auth
import json

with open("sample_influencer.json") as fh:
    sample = json.load(fh)

print("Engagement rate:", auth.compute_engagement_rate(sample["metrics"]))
print("Authenticity score:", auth.compute_authenticity_score(sample))
