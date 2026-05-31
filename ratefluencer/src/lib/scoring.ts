import type {
  BrandMatch,
  BrandProfile,
  InfluencerProfile,
  ScoredInfluencer,
  SummaryMetrics,
} from "./types";
import { getBrands, getInfluencers } from "./data";

const clamp = (value: number, min = 0, max = 1): number => {
  return Math.min(max, Math.max(min, value));
};

const normalize = (value: number, min: number, max: number): number => {
  if (max === min) {
    return 0;
  }
  return clamp((value - min) / (max - min));
};

const toScore = (value: number): number => {
  return Math.round(clamp(value) * 100);
};

const sigmoid = (value: number): number => {
  return 1 / (1 + Math.exp(-value));
};

const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
};

const hashToken = (token: string, size: number): number => {
  let hash = 0;
  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) % size;
  }
  return hash;
};

const buildEmbedding = (tokens: string[], size = 32): number[] => {
  const vector = new Array(size).fill(0);
  tokens.forEach((token) => {
    const slot = hashToken(token, size);
    vector[slot] += 1;
  });
  return vector;
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const getInfluencerTokens = (influencer: InfluencerProfile): string[] => {
  const base = [
    influencer.category,
    influencer.location,
    ...influencer.nicheTags,
    ...influencer.audience.topRegions,
    ...influencer.audience.interests,
  ];
  return base.flatMap((entry) => tokenize(entry));
};

const getBrandTokens = (brand: BrandProfile): string[] => {
  const base = [
    brand.industry,
    brand.tone,
    ...brand.targetAudience,
    ...brand.keywords,
    ...brand.brandValues,
  ];
  return base.flatMap((entry) => tokenize(entry));
};

const computeEngagementRate = (metrics: InfluencerProfile["metrics"]): number => {
  const total =
    metrics.avgLikes +
    metrics.avgComments +
    metrics.avgShares +
    metrics.avgSaves;
  return total / metrics.followers;
};

const computeShareRate = (metrics: InfluencerProfile["metrics"]): number => {
  return metrics.avgShares / Math.max(metrics.avgViews, 1);
};

const computeSaveRate = (metrics: InfluencerProfile["metrics"]): number => {
  return metrics.avgSaves / Math.max(metrics.avgViews, 1);
};

const computeAuthenticityScore = (
  influencer: InfluencerProfile,
  engagementRate: number,
): number => {
  const suspiciousBlend =
    influencer.quality.purchasedFollowersScore * 0.35 +
    influencer.quality.engagementPodScore * 0.25 +
    influencer.quality.botActivityScore * 0.25 +
    influencer.quality.spikeScore * 0.15;

  const engagementPenalty =
    engagementRate < 0.015 ? 0.1 : engagementRate > 0.18 ? 0.08 : 0;

  const qualityBoost =
    influencer.quality.commentQuality * 0.2 +
    influencer.quality.audienceQuality * 0.2;

  const raw = 1 - (suspiciousBlend + engagementPenalty);
  return toScore(raw * 0.7 + qualityBoost);
};

const computeGrowthScore = (influencer: InfluencerProfile): number => {
  const followerGrowth = normalize(influencer.growth.followerGrowth30d, 0, 0.2);
  const engagementGrowth = normalize(
    influencer.growth.engagementGrowth30d,
    0,
    0.2,
  );
  const audienceGrowth = normalize(influencer.growth.audienceExpansion30d, 0, 0.2);
  const blended =
    followerGrowth * 0.45 + engagementGrowth * 0.35 + audienceGrowth * 0.2;
  return toScore(blended);
};

const computeViralityScore = (
  engagementRate: number,
  shareRate: number,
  saveRate: number,
  influencer: InfluencerProfile,
): number => {
  const engagementScore = normalize(engagementRate, 0.01, 0.16);
  const shareScore = normalize(shareRate, 0.004, 0.06);
  const saveScore = normalize(saveRate, 0.006, 0.08);
  const blended =
    engagementScore * 0.35 +
    shareScore * 0.25 +
    saveScore * 0.2 +
    influencer.growth.engagementGrowth30d * 0.2;
  return toScore(blended);
};

const computeCampaignSuccess = (
  engagementRate: number,
  shareRate: number,
  saveRate: number,
  growthScore: number,
  influencer: InfluencerProfile,
): number => {
  const engagementScore = normalize(engagementRate, 0.01, 0.18);
  const shareScore = normalize(shareRate, 0.004, 0.07);
  const saveScore = normalize(saveRate, 0.006, 0.09);
  const growthNormalized = growthScore / 100;

  const suspiciousBlend =
    influencer.quality.purchasedFollowersScore * 0.4 +
    influencer.quality.engagementPodScore * 0.3 +
    influencer.quality.botActivityScore * 0.3;

  const z =
    -1.1 +
    engagementScore * 3.4 +
    shareScore * 2.2 +
    saveScore * 1.4 +
    influencer.quality.audienceQuality * 1.1 +
    influencer.quality.commentQuality * 0.9 +
    normalize(influencer.metrics.postsPerWeek, 1, 7) * 0.8 +
    growthNormalized * 1.2 -
    suspiciousBlend * 1.5;

  return toScore(sigmoid(z));
};

const buildBrandMatch = (
  influencer: InfluencerProfile,
  brand: BrandProfile,
): BrandMatch => {
  const influencerTokens = getInfluencerTokens(influencer);
  const brandTokens = getBrandTokens(brand);
  const embedding = buildEmbedding(influencerTokens);
  const brandEmbedding = buildEmbedding(brandTokens);
  const similarity = cosineSimilarity(embedding, brandEmbedding);

  const overlap = influencerTokens.filter((token) => brandTokens.includes(token));
  const uniqueOverlap = Array.from(new Set(overlap));

  const score = toScore(similarity);
  const rationaleTags = uniqueOverlap.slice(0, 3).join(", ");
  const topRegions = influencer.audience.topRegions.slice(0, 2).join(" and ");
  const rationale = rationaleTags
    ? `Aligned on ${rationaleTags}; strong audience in ${topRegions}.`
    : `Aligned audience in ${topRegions} with ${brand.tone} tone.`;

  return {
    brandId: brand.id,
    brandName: brand.name,
    score,
    rationale,
    overlappingTags: uniqueOverlap.slice(0, 4),
  };
};

const buildSignals = (
  influencer: InfluencerProfile,
  engagementRate: number,
  authenticityScore: number,
): string[] => {
  const signals: string[] = [];

  if (influencer.quality.botActivityScore > 0.14) {
    signals.push("Bot activity pattern above threshold");
  }
  if (influencer.quality.spikeScore > 0.16) {
    signals.push("Engagement spike detected in last 14 days");
  }
  if (influencer.quality.engagementPodScore > 0.12) {
    signals.push("Engagement pod behavior suspected");
  }
  if (engagementRate < 0.02) {
    signals.push("Low engagement relative to follower base");
  }
  if (influencer.quality.audienceQuality < 0.75) {
    signals.push("Audience quality below benchmark");
  }
  if (influencer.metrics.postsPerWeek < 2.5) {
    signals.push("Posting cadence below optimal range");
  }
  if (authenticityScore >= 85 && signals.length === 0) {
    signals.push("No anomalies detected in last 30 days");
  }

  return signals.slice(0, 4);
};

export const scoreInfluencer = (
  influencer: InfluencerProfile,
  brands: BrandProfile[],
): ScoredInfluencer => {
  const engagementRate = computeEngagementRate(influencer.metrics);
  const shareRate = computeShareRate(influencer.metrics);
  const saveRate = computeSaveRate(influencer.metrics);
  const postingConsistency = clamp(influencer.metrics.postsPerWeek / 7);

  const authenticity = computeAuthenticityScore(influencer, engagementRate);
  const growth = computeGrowthScore(influencer);
  const viralityScore = computeViralityScore(
    engagementRate,
    shareRate,
    saveRate,
    influencer,
  );

  const brandMatches = brands
    .map((brand) => buildBrandMatch(influencer, brand))
    .sort((a, b) => b.score - a.score);
  const brandMatchScore =
    brandMatches.slice(0, 3).reduce((sum, match) => sum + match.score, 0) /
    Math.max(1, Math.min(3, brandMatches.length));

  const campaignSuccess = computeCampaignSuccess(
    engagementRate,
    shareRate,
    saveRate,
    growth,
    influencer,
  );

  const ratefluencer = Math.round(
    authenticity * 0.28 +
      growth * 0.22 +
      brandMatchScore * 0.25 +
      campaignSuccess * 0.25,
  );

  const signals = buildSignals(influencer, engagementRate, authenticity);

  return {
    ...influencer,
    scores: {
      authenticity,
      growth,
      brandMatch: Math.round(brandMatchScore),
      campaignSuccess,
      ratefluencer,
      engagementRate,
      shareRate,
      saveRate,
      postingConsistency,
      commentQuality: influencer.quality.commentQuality,
      audienceQuality: influencer.quality.audienceQuality,
      viralityScore,
    },
    topBrands: brandMatches.slice(0, 3),
    signals,
  };
};

export const getScoredInfluencers = (): ScoredInfluencer[] => {
  const brands = getBrands();
  return getInfluencers()
    .map((influencer) => scoreInfluencer(influencer, brands))
    .sort((a, b) => b.scores.ratefluencer - a.scores.ratefluencer);
};

export const getSummaryMetrics = (
  influencers: ScoredInfluencer[],
): SummaryMetrics => {
  const total = influencers.length;
  const avg = (values: number[]): number => {
    if (values.length === 0) {
      return 0;
    }
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  };

  const viralCount = influencers.filter(
    (influencer) => influencer.scores.viralityScore >= 70,
  ).length;

  return {
    totalInfluencers: total,
    avgAuthenticity: avg(influencers.map((inf) => inf.scores.authenticity)),
    avgGrowth: avg(influencers.map((inf) => inf.scores.growth)),
    avgCampaignSuccess: avg(
      influencers.map((inf) => inf.scores.campaignSuccess),
    ),
    avgBrandMatch: avg(influencers.map((inf) => inf.scores.brandMatch)),
    avgRatefluencer: avg(influencers.map((inf) => inf.scores.ratefluencer)),
    predictedViralRate: total === 0 ? 0 : Math.round((viralCount / total) * 100),
  };
};
