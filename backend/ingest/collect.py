"""Simple ingestion script for Ratefluencer.

Fetches top headlines from Hacker News and TechCrunch RSS,
normalizes them, and writes a CSV to backend/data/trends.csv.

Run: python ingest/collect.py
"""
from __future__ import annotations
import csv
import os
import random
import re
from datetime import datetime
from typing import List, Dict

try:
    import requests
    from bs4 import BeautifulSoup
except Exception as exc:
    print("Missing dependency:", exc)
    print("Install requirements with: pip install -r ../requirements.txt")
    raise


DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DATA_DIR = os.path.normpath(DATA_DIR)
os.makedirs(DATA_DIR, exist_ok=True)
OUT_CSV = os.path.join(DATA_DIR, "trends.csv")


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:64]


def fetch_hackernews(n: int = 10) -> List[Dict[str, str]]:
    url = "https://news.ycombinator.com/"
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    anchors = soup.select("a.storylink, a.titlelink")
    out = []
    seen = set()
    for a in anchors:
        title = (a.get_text() or "").strip()
        if not title or title in seen:
            continue
        seen.add(title)
        out.append({
            "id": "hn-" + slugify(title),
            "title": title,
            "source": "hackernews",
            "category": "tech",
            "score": str(random.randint(70, 99)),
            "insight": "Trending on Hacker News",
        })
        if len(out) >= n:
            break
    return out


def fetch_techcrunch_rss(n: int = 10) -> List[Dict[str, str]]:
    url = "https://techcrunch.com/feed/"
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    # Prefer XML parser, but fall back to html parser if lxml not installed
    try:
        soup = BeautifulSoup(resp.text, "xml")
    except Exception:
        soup = BeautifulSoup(resp.text, "html.parser")
    items = soup.find_all("item")
    out = []
    for it in items[:n]:
        title = (it.title.string or "").strip()
        if not title:
            continue
        out.append({
            "id": "tc-" + slugify(title),
            "title": title,
            "source": "techcrunch",
            "category": "tech",
            "score": str(random.randint(70, 99)),
            "insight": "From TechCrunch RSS",
        })
    return out


def write_csv(rows: List[Dict[str, str]]):
    fieldnames = ["id", "title", "source", "category", "score", "insight", "fetched_at"]
    now = datetime.utcnow().isoformat() + "Z"
    exists = os.path.exists(OUT_CSV)
    with open(OUT_CSV, "a", newline='', encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        if not exists:
            writer.writeheader()
        for r in rows:
            r_copy = r.copy()
            r_copy["fetched_at"] = now
            writer.writerow(r_copy)


def main():
    hn = fetch_hackernews(10)
    tc = fetch_techcrunch_rss(10)
    rows = hn + tc
    write_csv(rows)
    print(f"Wrote {len(rows)} rows to {OUT_CSV}")


if __name__ == "__main__":
    main()
