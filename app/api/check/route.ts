import { NextRequest, NextResponse } from "next/server";
import { checkClaim } from "@/lib/perplexity";
import type { CheckRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: CheckRequest = await request.json();

    if (!body.claim || body.claim.trim().length === 0) {
      return NextResponse.json({ error: "请输入论点" }, { status: 400 });
    }

    if (body.claim.length > 500) {
      return NextResponse.json(
        { error: "论点太长了，请精简一下" },
        { status: 400 },
      );
    }

    const result = await checkClaim(body.claim.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error("Check API error:", error);
    return NextResponse.json(
      { error: "查证失败，请稍后重试" },
      { status: 500 },
    );
  }
}
