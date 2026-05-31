import { NextResponse } from "next/server";
import { getScoredInfluencers } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export function GET() {
  const influencers = getScoredInfluencers();
  return NextResponse.json({
    count: influencers.length,
    influencers,
  });
}
