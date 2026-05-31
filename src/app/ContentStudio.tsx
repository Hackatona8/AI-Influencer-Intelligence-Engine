"use client";

import { useState } from "react";
import {
  fetchTrendingTopics,
  generateContent,
  forecastTimeseries,
  updateApprovalStatus,
  type ApprovalStatus,
  type GenerateResponse,
  type TrendTopic,
  type ForecastResponse,
} from "@/lib/api";

const badgeColor = (score: number): string => {
  if (score >= 85) {
    return "bg-[color:var(--accent-2)] text-white";
  }
  if (score >= 75) {
    return "bg-[color:var(--accent-4)] text-[color:var(--ink)]";
  }
  return "bg-[color:var(--accent)] text-white";
};

export default function ContentStudio() {
  const [topics, setTopics] = useState<TrendTopic[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [generatingTopicId, setGeneratingTopicId] = useState<string | null>(null);
  const [generation, setGeneration] = useState<GenerateResponse | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState<{
    score: number;
    trend: string;
    forecast: { ds: string; y: number }[];
  } | null>(null);
  const [forecastByTopic, setForecastByTopic] = useState<Record<string, ForecastResponse | null>>({});
  const [forecastLoadingByTopic, setForecastLoadingByTopic] = useState<Record<string, boolean>>({});

  const Sparkline = ({ data }: { data: number[] }) => {
    if (!data || data.length === 0) return null;
    const w = 80;
    const h = 20;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
      })
      .join(" ");
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
        <polyline fill="none" stroke="#4F46E5" strokeWidth={1.5} points={points} />
      </svg>
    );
  };

  const handleFetchTrends = async () => {
    setIsLoadingTrends(true);
    setError(null);
    setNotice(null);
    setApprovalNotice(null);

    try {
      const data = await fetchTrendingTopics();
      setTopics(data);
      setNotice("Trends loaded. Pick a topic to generate assets.");
        // precompute lightweight growth estimates for each topic in background
        data.forEach((t) => fetchTopicForecast(t));
    } catch (err) {
      setError("Unable to load trends. Is the FastAPI server running?");
    } finally {
      setIsLoadingTrends(false);
    }
  };

  const handleGenerate = async (topicId: string) => {
    setGeneratingTopicId(topicId);
    setError(null);
    setNotice(null);
    setApprovalNotice(null);

    try {
      const response = await generateContent(topicId);
      setGeneration(response);
      setNotice(response.message);
    } catch (err) {
      setError("Generation failed. Try again in a moment.");
    } finally {
      setGeneratingTopicId(null);
    }
  };

  const buildSampleSeries = (base: number, trendScore: number) => {
    // create a simple weekly timeseries (8 points)
    const points = [] as { ds: string; y: number }[];
    const slope = (trendScore - 50) / 10; // modest slope
    const today = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i * 7);
      const noise = Math.round((Math.random() - 0.5) * base * 0.03);
      const y = Math.max(0, Math.round(base + (i - 3) * slope * base * 0.02 + noise));
      points.push({ ds: d.toISOString().slice(0, 10), y });
    }
    return points;
  };

  const handleForecast = async (topic: TrendTopic) => {
    setIsForecasting(true);
    setError(null);
    setForecastResult(null);
    try {
      const sample = buildSampleSeries(1000, topic.trendScore);
      const res = await forecastTimeseries(sample, 7);
      setForecastResult({ score: res.score, trend: res.trend, forecast: res.forecast });
      setNotice(`Growth potential: ${res.score} (${res.trend})`);
    } catch (err) {
      setError("Forecast failed. Ensure backend is running.");
    } finally {
      setIsForecasting(false);
    }
  };

  const fetchTopicForecast = async (topic: TrendTopic) => {
    setForecastLoadingByTopic((s) => ({ ...s, [topic.id]: true }));
    try {
      const sample = buildSampleSeries(1000, topic.trendScore);
      const res = await forecastTimeseries(sample, 7);
      setForecastByTopic((s) => ({ ...s, [topic.id]: res }));
    } catch (err) {
      setForecastByTopic((s) => ({ ...s, [topic.id]: null }));
    } finally {
      setForecastLoadingByTopic((s) => ({ ...s, [topic.id]: false }));
    }
  };

  const handleApproval = async (status: ApprovalStatus) => {
    if (!generation) {
      setError("Generate content before approving or rejecting.");
      return;
    }

    setIsApproving(true);
    setError(null);
    setApprovalNotice(null);

    try {
      const response = await updateApprovalStatus(generation.postId, status);
      setApprovalNotice(response.message);
    } catch (err) {
      setError("Approval update failed.");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="surface rounded-3xl p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Trend radar
            </div>
            <h2 className="font-heading text-2xl">AI influencer trend signals</h2>
          </div>
          <button
            className="rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleFetchTrends}
            disabled={isLoadingTrends}
          >
            {isLoadingTrends ? "Loading..." : "Find trends"}
          </button>
        </div>

        {/* Trends pulled from the FastAPI mock endpoint and rendered client-side. */}
        <div className="grid gap-3">
          {topics.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--line)] bg-white/70 p-4 text-sm text-[color:var(--muted)]">
              No trends yet. Click Find trends to load the latest signals.
            </div>
          ) : (
            topics.map((topic) => (
              <div
                key={topic.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-semibold">{topic.title}</div>
                  <div className="text-xs text-[color:var(--muted)]">
                    {topic.category} · {topic.insight}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeColor(
                      topic.trendScore,
                    )}`}
                  >
                    {topic.trendScore}
                  </span>
                  {forecastByTopic[topic.id] ? (
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-semibold">{forecastByTopic[topic.id]!.score}</div>
                      <div className="w-20 h-6">
                        <Sparkline data={forecastByTopic[topic.id]!.forecast.map((p) => p.y)} />
                      </div>
                    </div>
                  ) : forecastLoadingByTopic[topic.id] ? (
                    <div className="text-xs text-[color:var(--muted)]">Estimating...</div>
                  ) : null}
                  <button
                    className="rounded-full border border-[color:var(--line)] px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleGenerate(topic.id)}
                    disabled={generatingTopicId === topic.id}
                  >
                    {generatingTopicId === topic.id ? "Generating..." : "Generate content"}
                  </button>
                  <button
                    className="rounded-full border border-[color:var(--line)] px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleForecast(topic)}
                    disabled={isForecasting}
                  >
                    {isForecasting ? "Estimating..." : "Estimate growth"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="surface rounded-3xl p-6">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Content studio
          </div>
          <h2 className="font-heading text-2xl">Campaign assets in motion</h2>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[color:var(--accent)] bg-white/70 p-3 text-sm text-[color:var(--accent)]">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-2xl border border-[color:var(--line)] bg-white/70 p-3 text-sm text-[color:var(--muted)]">
            {notice}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 text-sm text-[color:var(--muted)]">
          <div className="rounded-2xl border border-[color:var(--line)] bg-white/70 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Latest generation
            </div>
            {generation ? (
              generation.content ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-[color:var(--line)] bg-white p-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
                      Viral Reel Script
                    </div>
                    <div className="mt-2 text-sm text-[color:var(--ink)] whitespace-pre-wrap">
                      {generation.content.reel_script}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[color:var(--line)] bg-white p-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
                      LinkedIn Post
                    </div>
                    <div className="mt-2 text-sm text-[color:var(--ink)] whitespace-pre-wrap">
                      {generation.content.linkedin_post}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[color:var(--line)] bg-white p-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
                      Instagram Caption
                    </div>
                    <div className="mt-2 text-sm text-[color:var(--ink)]">
                      {generation.content.instagram_caption}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-[color:var(--muted)]">
                  Content generation failed to parse. Please try again.
                </div>
              )
            ) : (
              <div className="mt-2 text-sm text-[color:var(--muted)]">
                Generate a topic to preview assets.
              </div>
            )}
          </div>
        </div>
            {forecastResult ? (
              <div className="mt-4 rounded-2xl border border-[color:var(--line)] bg-white/70 p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
                  Growth forecast
                </div>
                <div className="mt-2 text-sm text-[color:var(--ink)]">
                  Score: <span className="font-semibold">{forecastResult.score}</span> — Trend: <span className="font-semibold">{forecastResult.trend}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm">
                  {forecastResult.forecast.map((p) => (
                    <div key={p.ds} className="flex justify-between">
                      <div className="text-[color:var(--muted)]">{p.ds}</div>
                      <div className="font-mono">{Math.round(p.y)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-[color:var(--ink)] px-5 py-2 text-sm font-semibold text-[color:var(--surface)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => handleApproval("approved")}
            disabled={!generation || isApproving}
          >
            {isApproving ? "Saving..." : "Approve"}
          </button>
          <button
            className="rounded-full border border-[color:var(--line)] px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => handleApproval("rejected")}
            disabled={!generation || isApproving}
          >
            Reject
          </button>
        </div>

        {approvalNotice ? (
          <div className="mt-4 rounded-2xl border border-[color:var(--line)] bg-white/70 p-3 text-sm text-[color:var(--muted)]">
            {approvalNotice}
          </div>
        ) : null}
      </div>
    </section>
  );
}
