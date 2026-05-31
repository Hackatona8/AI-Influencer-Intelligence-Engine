export type AudienceSplit = {
  label: string;
  share: number;
};

export type AudienceProfile = {
  age: AudienceSplit[];
  gender: AudienceSplit[];
  topRegions: string[];
  interests: string[];
};

export type InfluencerMetrics = {
  followers: number;
  following: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgSaves: number;
  avgViews: number;
  postsPerWeek: number;
  avgWatchTimeSec: number;
};

export type GrowthSignals = {
  followerGrowth30d: number;
  engagementGrowth30d: number;
  audienceExpansion30d: number;
};

export type QualitySignals = {
  purchasedFollowersScore: number;
  engagementPodScore: number;
  botActivityScore: number;
  spikeScore: number;
  commentQuality: number;
  audienceQuality: number;
};

export type InfluencerProfile = {
  id: string;
  name: string;
  handle: string;
  category: string;
  nicheTags: string[];
  location: string;
  languages: string[];
  audience: AudienceProfile;
  metrics: InfluencerMetrics;
  growth: GrowthSignals;
  quality: QualitySignals;
};

export type BrandProfile = {
  id: string;
  name: string;
  industry: string;
  tone: string;
  targetAudience: string[];
  keywords: string[];
  brandValues: string[];
  budgetTier: "mid" | "premium" | "enterprise";
};

export type ScoreBreakdown = {
  authenticity: number;
  growth: number;
  brandMatch: number;
  campaignSuccess: number;
  ratefluencer: number;
  engagementRate: number;
  shareRate: number;
  saveRate: number;
  postingConsistency: number;
  commentQuality: number;
  audienceQuality: number;
  viralityScore: number;
};

export type BrandMatch = {
  brandId: string;
  brandName: string;
  score: number;
  rationale: string;
  overlappingTags: string[];
};

export type ScoredInfluencer = InfluencerProfile & {
  scores: ScoreBreakdown;
  topBrands: BrandMatch[];
  signals: string[];
};

export type SummaryMetrics = {
  totalInfluencers: number;
  avgAuthenticity: number;
  avgGrowth: number;
  avgCampaignSuccess: number;
  avgBrandMatch: number;
  avgRatefluencer: number;
  predictedViralRate: number;
};
