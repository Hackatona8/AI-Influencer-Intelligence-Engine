"use client";

import { useState } from "react";
import {
  fetchTrendingTopics,
  generateContent,
  updateApprovalStatus,
  type ApprovalStatus,
  type GenerateResponse,
  type TrendTopic,
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

  const handleFetchTrends = async () => {
    setIsLoadingTrends(true);
    setError(null);
    setNotice(null);
    setApprovalNotice(null);

    try {
      const data = await fetchTrendingTopics();
      setTopics(data);
      setNotice("Trends loaded. Pick a topic to generate assets.");
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
                  <button
                    className="rounded-full border border-[color:var(--line)] px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleGenerate(topic.id)}
                    disabled={generatingTopicId === topic.id}
                  >
                    {generatingTopicId === topic.id
                      ? "Generating..."
                      : "Generate content"}
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
