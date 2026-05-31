from typing import Dict, List, Literal, Optional
import uuid
import os
import random
import json
import re

import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Any

try:
    import openai
except Exception:
    openai = None

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY and openai is not None:
    openai.api_key = OPENAI_API_KEY

app = FastAPI(title="Ratefluencer API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TrendTopic(BaseModel):
    id: str
    title: str
    category: str
    trendScore: int
    insight: str


class GenerateRequest(BaseModel):
    topic_id: Optional[str] = None
    topic_title: Optional[str] = None


class GenerateResponse(BaseModel):
    success: bool
    postId: str
    topicId: Optional[str]
    assets: Dict[str, bool]
    message: str
    # optional content payload returned from the LLM
    content: Optional[Dict[str, str]] = None


class ApprovalRequest(BaseModel):
    post_id: str
    status: Literal["approved", "rejected"]


class ApprovalResponse(BaseModel):
    success: bool
    postId: str
    status: Literal["approved", "rejected"]
    message: str


class ForecastPoint(BaseModel):
    ds: str
    y: float


class ForecastRequest(BaseModel):
    timeseries: List[ForecastPoint]
    periods: Optional[int] = 7


class ForecastResponse(BaseModel):
    success: bool
    score: int
    trend: str
    forecast: List[Dict[str, Any]]


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or uuid.uuid4().hex[:8]


def fetch_hackernews_top(n: int = 5) -> List[TrendTopic]:
    """Scrape Hacker News frontpage headlines and return a list of TrendTopic.

    Uses requests + BeautifulSoup to extract the top N titles.
    """
    url = "https://news.ycombinator.com/"
    try:
        resp = requests.get(url, timeout=8)
        resp.raise_for_status()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch trends: {exc}")

    soup = BeautifulSoup(resp.text, "html.parser")
    # Hacker News titles are in <a class="storylink"> or <a class="titlelink"> depending on markup
    anchors = soup.select("a.storylink, a.titlelink, a[href^='item?id=']")
    topics: List[TrendTopic] = []
    seen = set()
    for a in anchors:
        title = (a.get_text() or "").strip()
        if not title:
            continue
        if title in seen:
            continue
        seen.add(title)
        tid = slugify(title)[:40]
        score = random.randint(70, 99)
        insight = "Trending on Hacker News"
        topics.append(
            TrendTopic(id=f"hn-{tid}", title=title, category="Tech", trendScore=score, insight=insight)
        )
        if len(topics) >= n:
            break

    if not topics:
        raise HTTPException(status_code=502, detail="No trends discovered")
    return topics


@app.get("/api/trends", response_model=List[TrendTopic])
def get_trends() -> List[TrendTopic]:
    # Fetch real headlines from Hacker News to simulate trending topics
    return fetch_hackernews_top(5)


def extract_json_from_text(text: str) -> Optional[dict]:
    # Try to pull a JSON object from an LLM response even if wrapped in markdown
    m = re.search(r"\{[\s\S]*\}", text)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        # attempt to fix common issues (converting single quotes)
        try:
            cleaned = m.group(0).replace("'", '"')
            return json.loads(cleaned)
        except Exception:
            return None


@app.post("/api/generate", response_model=GenerateResponse)
def generate_content(payload: GenerateRequest) -> GenerateResponse:
    # Validate input
    topic_id = payload.topic_id
    title = payload.topic_title or topic_id or "Untitled topic"

    if openai is None or OPENAI_API_KEY is None:
        # Fail gracefully when SDK/key not available
        post_id = f"post-{uuid.uuid4().hex[:8]}"
        return GenerateResponse(
            success=True,
            postId=post_id,
            topicId=topic_id,
            assets={"reelScript": True, "instagramCaption": True, "linkedinPost": True},
            message=(
                "OpenAI SDK or API key not configured. Returning placeholder content."
            ),
            content={
                "reel_script": "[Placeholder] 30s script for: " + title,
                "linkedin_post": "[Placeholder] LinkedIn post for: " + title,
                "instagram_caption": "[Placeholder] Caption #hashtag",
            },
        )

    # Build a deterministic prompt instructing the model to return strict JSON
    system = (
        "You are an assistant that outputs a JSON object only. Do NOT output any text outside of JSON."
    )
    user = (
        "Generate content assets for the following topic. Return a single JSON object with EXACT keys:"
        " 'reel_script', 'linkedin_post', 'instagram_caption'.\n"
        "- 'reel_script': a 30-second video script with sections Hook, Body, Call-to-Action.\n"
        "- 'linkedin_post': a professional LinkedIn post (use line breaks) with engagement hooks.\n"
        "- 'instagram_caption': a catchy caption and EXACTLY 5 relevant hashtags as a space-separated string.\n"
        f"Topic: {title}\n"
        "Respond ONLY with valid JSON."
    )

    try:
        resp = openai.ChatCompletion.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.7,
            max_tokens=800,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LLM request failed: {exc}")

    text = ""
    try:
        # ChatCompletion may return multiple choices
        if isinstance(resp, dict):
            choices = resp.get("choices", [])
            if choices:
                text = choices[0].get("message", {}).get("content", "")
        else:
            text = str(resp)
    except Exception:
        text = str(resp)

    parsed = extract_json_from_text(text)
    if parsed is None:
        # fallback: wrap the entire text
        parsed = {"reel_script": text, "linkedin_post": text, "instagram_caption": text}

    post_id = f"post-{uuid.uuid4().hex[:8]}"
    return GenerateResponse(
        success=True,
        postId=post_id,
        topicId=topic_id,
        assets={"reelScript": bool(parsed.get("reel_script")), "instagramCaption": bool(parsed.get("instagram_caption")), "linkedinPost": bool(parsed.get("linkedin_post"))},
        message="Content generated by LLM.",
        content={
            "reel_script": parsed.get("reel_script", ""),
            "linkedin_post": parsed.get("linkedin_post", ""),
            "instagram_caption": parsed.get("instagram_caption", ""),
        },
    )


@app.post("/api/approve", response_model=ApprovalResponse)
def approve_content(payload: ApprovalRequest) -> ApprovalResponse:
    verdict = "approved" if payload.status == "approved" else "rejected"
    return ApprovalResponse(
        success=True,
        postId=payload.post_id,
        status=payload.status,
        message=f"Post {payload.post_id} marked as {verdict}.",
    )


@app.post("/api/forecast", response_model=ForecastResponse)
def forecast(payload: ForecastRequest) -> ForecastResponse:
    # Convert incoming pydantic points to expected simple dict list
    series = [{"ds": p.ds, "y": p.y} for p in payload.timeseries]
    # import local forecast module
    try:
        from .forecast.forecast import compute_growth_potential
    except Exception:
        # try relative import fallback
        from forecast.forecast import compute_growth_potential

    result = compute_growth_potential(series, periods=payload.periods or 7)
    return ForecastResponse(
        success=True,
        score=int(result.get("score", 50)),
        trend=result.get("trend", "flat"),
        forecast=result.get("forecast", []),
    )
