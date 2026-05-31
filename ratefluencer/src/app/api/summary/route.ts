import { NextResponse } from "next/server";
import { getScoredInfluencers, getSummaryMetrics } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export function GET() {
  const influencers = getScoredInfluencers();
  const summary = getSummaryMetrics(influencers);

  return NextResponse.json({
    summary,
  });
}
