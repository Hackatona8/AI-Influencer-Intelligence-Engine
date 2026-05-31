import { formatCompact, formatPercent } from "@/lib/format";
import { getScoredInfluencers, getSummaryMetrics } from "@/lib/scoring";
import ContentStudio from "./ContentStudio";

const scoreColor = (score: number): string => {
  if (score >= 80) {
    return "bg-[color:var(--accent-2)]";
  }
  if (score >= 65) {
    return "bg-[color:var(--accent-4)]";
  }
  return "bg-[color:var(--accent)]";
};

const ScoreBar = ({
  label,
  value,
}: {
  label: string;
  value: number;
}) => (
  <div className="flex items-center gap-3">
    <div className="w-28 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
      {label}
    </div>
    <div className="h-2 flex-1 rounded-full bg-black/10">
      <div
        className={`${scoreColor(value)} h-2 rounded-full transition-all`}
        style={{ width: `${value}%` }}
      />
    </div>
    <div className="w-9 text-right text-sm font-semibold">{value}</div>
  </div>
);

export default function Home() {
  const influencers = getScoredInfluencers();
  const summary = getSummaryMetrics(influencers);
  const topInfluencers = influencers.slice(0, 6);
  const rising = [...influencers]
    .sort((a, b) => b.scores.growth - a.scores.growth)
    .slice(0, 3);
  const matchSamples = influencers.slice(0, 3);

  const stats = [
    {
      label: "Influencers scanned",
      value: summary.totalInfluencers.toString(),
      hint: "Last 30 days",
    },
    {
      label: "Avg authenticity",
      value: `${summary.avgAuthenticity}/100`,
      hint: "Bot risk filtered",
    },
    {
      label: "Avg growth",
      value: `${summary.avgGrowth}/100`,
      hint: "Growth velocity",
    },
    {
      label: "Predicted viral rate",
      value: `${summary.predictedViralRate}%`,
      hint: "High virality signals",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(239,108,47,0.35),_transparent_70%)] blur-3xl animate-float" />
        <div className="absolute right-[-8rem] top-[-6rem] h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(27,154,170,0.35),_transparent_70%)] blur-3xl animate-float-slow" />
        <div className="absolute bottom-[-10rem] left-[30%] h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(242,201,76,0.35),_transparent_70%)] blur-3xl animate-float" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(26,23,20,0.05)_1px,_transparent_0)] [background-size:18px_18px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-10">
        <header className="flex flex-col gap-10">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--accent-3)] text-white shadow-lg">
                RF
              </div>
              <div>
                <div className="text-lg font-semibold">Ratefluencer AI</div>
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Intelligence Engine
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Demo build
              </span>
              <button className="rounded-full bg-[color:var(--ink)] px-5 py-2 text-sm font-semibold text-[color:var(--surface)]">
                Request pilot
              </button>
            </div>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col gap-6">
              <h1 className="font-heading text-4xl leading-tight sm:text-5xl lg:text-6xl">
                Predict creator impact before the campaign ships.
              </h1>
              <p className="max-w-xl text-lg text-[color:var(--muted)]">
                Ratefluencer scores creators on authenticity, growth, brand fit, and
                campaign success probability so teams stop guessing and start
                investing with confidence.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg">
                  Run intelligence scan
                </button>
                <button className="rounded-full border border-[color:var(--line)] px-6 py-3 text-sm font-semibold">
                  View model overview
                </button>
              </div>
              <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                <span>Authenticity detection</span>
                <span>Growth forecasting</span>
                <span>Brand matching</span>
                <span>ML scoring</span>
              </div>
            </div>
            <div className="surface flex flex-col gap-6 rounded-3xl p-6 shadow-lg">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Campaign success radar
                </div>
                <div className="font-heading text-3xl">{summary.avgCampaignSuccess}</div>
                <div className="text-sm text-[color:var(--muted)]">Avg success score</div>
              </div>
              <div className="flex flex-col gap-4">
                <ScoreBar label="Authenticity" value={summary.avgAuthenticity} />
                <ScoreBar label="Growth" value={summary.avgGrowth} />
                <ScoreBar label="Brand fit" value={summary.avgBrandMatch} />
                <ScoreBar label="Ratefluencer" value={summary.avgRatefluencer} />
              </div>
              <div className="rounded-2xl bg-[color:var(--accent-2)] px-4 py-3 text-sm text-white">
                Model confidence 92% based on synthetic training data.
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="surface rounded-2xl p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                {stat.label}
              </div>
              <div className="font-heading text-2xl">{stat.value}</div>
              <div className="text-sm text-[color:var(--muted)]">{stat.hint}</div>
            </div>
          ))}
        </section>

        <ContentStudio />

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="surface rounded-3xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Live ranking
                </div>
                <h2 className="font-heading text-2xl">Top creators by impact</h2>
              </div>
              <span className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Updated hourly
              </span>
            </div>
            <div className="grid gap-4">
              {topInfluencers.map((creator, index) => (
                <div
                  key={creator.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--accent-3)] text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{creator.name}</div>
                      <div className="text-xs text-[color:var(--muted)]">
                        {creator.handle} · {creator.category}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-xs text-[color:var(--muted)]">
                      Success {formatPercent(creator.scores.campaignSuccess / 100, 0)}
                    </div>
                    <div className="text-lg font-semibold">
                      {creator.scores.ratefluencer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface rounded-3xl p-6">
            <div className="mb-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Momentum board
              </div>
              <h2 className="font-heading text-2xl">Fastest growth signals</h2>
            </div>
            <div className="flex flex-col gap-4">
              {rising.map((creator) => (
                <div
                  key={creator.id}
                  className="rounded-2xl border border-[color:var(--line)] bg-white/70 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{creator.name}</div>
                      <div className="text-xs text-[color:var(--muted)]">
                        {creator.category} · {formatCompact(creator.metrics.followers)} followers
                      </div>
                    </div>
                    <div className="rounded-full bg-[color:var(--accent-4)] px-3 py-1 text-xs font-semibold">
                      {creator.scores.growth} growth
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--muted)]">
                    <span>Engagement +{formatPercent(creator.growth.engagementGrowth30d, 0)}</span>
                    <span>Audience +{formatPercent(creator.growth.audienceExpansion30d, 0)}</span>
                    <span>Virality {creator.scores.viralityScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Influencer intelligence
              </div>
              <h2 className="font-heading text-3xl">Deep creator profiles</h2>
            </div>
            <div className="text-sm text-[color:var(--muted)]">
              Signals include fake follower detection, engagement pods, and spikes.
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {influencers.map((creator) => (
              <div
                key={creator.id}
                className="surface rounded-3xl p-6 transition-transform hover:-translate-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent-3)] text-sm font-semibold text-white">
                      {creator.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{creator.name}</div>
                      <div className="text-xs text-[color:var(--muted)]">
                        {creator.handle} · {creator.location}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-sm font-semibold text-white">
                    {creator.scores.ratefluencer} score
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <ScoreBar label="Authenticity" value={creator.scores.authenticity} />
                  <ScoreBar label="Growth" value={creator.scores.growth} />
                  <ScoreBar label="Brand match" value={creator.scores.brandMatch} />
                  <ScoreBar label="Campaign" value={creator.scores.campaignSuccess} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {creator.nicheTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs text-[color:var(--muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 text-sm text-[color:var(--muted)]">
                  <div className="flex flex-wrap justify-between gap-3">
                    <span>{formatCompact(creator.metrics.followers)} followers</span>
                    <span>{formatPercent(creator.scores.engagementRate, 1)} engagement</span>
                    <span>{formatPercent(creator.scores.shareRate, 1)} share rate</span>
                    <span>{formatPercent(creator.scores.saveRate, 1)} save rate</span>
                  </div>
                  <div className="rounded-2xl border border-[color:var(--line)] bg-white/70 p-3 text-xs">
                    <div className="mb-2 uppercase tracking-[0.2em] text-[color:var(--muted)]">
                      Risk signals
                    </div>
                    <ul className="grid gap-1">
                      {creator.signals.map((signal) => (
                        <li key={signal}>{signal}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    Top brand matches
                  </div>
                  {creator.topBrands.map((brand) => (
                    <div
                      key={brand.brandId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[color:var(--line)] bg-white/70 px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="font-semibold">{brand.brandName}</div>
                        <div className="text-xs text-[color:var(--muted)]">
                          {brand.rationale}
                        </div>
                      </div>
                      <div className="rounded-full bg-[color:var(--accent-2)] px-3 py-1 text-xs font-semibold text-white">
                        {brand.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="surface rounded-3xl p-6">
            <div className="mb-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Brand match engine
              </div>
              <h2 className="font-heading text-2xl">RAG-style recommendations</h2>
            </div>
            <div className="grid gap-4">
              {matchSamples.map((creator) => (
                <div key={creator.id} className="rounded-2xl border border-[color:var(--line)] bg-white/70 p-4">
                  <div className="text-sm font-semibold">
                    {creator.name} + {creator.topBrands[0]?.brandName}
                  </div>
                  <div className="text-xs text-[color:var(--muted)]">
                    {creator.topBrands[0]?.rationale}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <span className="rounded-full bg-[color:var(--accent-3)] px-3 py-1 text-white">
                      Match {creator.topBrands[0]?.score}
                    </span>
                    <span className="text-[color:var(--muted)]">
                      Campaign success {formatPercent(creator.scores.campaignSuccess / 100, 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface rounded-3xl p-6">
            <div className="mb-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                AI workflow
              </div>
              <h2 className="font-heading text-2xl">End-to-end intelligence pipeline</h2>
            </div>
            <div className="grid gap-4">
              {[
                {
                  title: "Ingest + normalize",
                  detail: "Scrape follower, engagement, and audience signals across platforms.",
                },
                {
                  title: "Authenticity detection",
                  detail: "Detect bots, pods, purchased followers, and spike anomalies.",
                },
                {
                  title: "Growth forecasting",
                  detail: "Predict follower and engagement growth using time series features.",
                },
                {
                  title: "Brand matching",
                  detail: "Embed creator and brand intent, then run similarity search.",
                },
                {
                  title: "Ratefluencer scoring",
                  detail: "ML model outputs campaign success probability and final score.",
                },
              ].map((step, index) => (
                <div key={step.title} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{step.title}</div>
                    <div className="text-xs text-[color:var(--muted)]">{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[color:var(--line)] bg-white/70 px-6 py-5 text-sm text-[color:var(--muted)]">
          <div>Ratefluencer AI Hackathon Prototype · May 31, 2026</div>
          <div className="flex flex-wrap gap-4">
            <span>API: /api/influencers</span>
            <span>/api/brands</span>
            <span>/api/summary</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
