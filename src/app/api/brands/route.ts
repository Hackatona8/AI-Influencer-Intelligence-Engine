import { NextResponse } from "next/server";
import { getBrands } from "@/lib/data";

export const dynamic = "force-dynamic";

export function GET() {
  const brands = getBrands();
  return NextResponse.json({
    count: brands.length,
    brands,
  });
}
