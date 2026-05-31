Ratefluencer ingestion helpers

This folder contains simple scripts used by the demo to collect trending headlines and normalize them into CSV for later experimentation.

Usage:

1. Install backend dependencies:

```
cd backend
pip install -r requirements.txt
```

2. Run the collector:

```
python ingest/collect.py
```

The script writes `backend/data/trends.csv` with fetched headlines from Hacker News and TechCrunch.
