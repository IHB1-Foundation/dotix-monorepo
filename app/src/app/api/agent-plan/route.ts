import { NextResponse } from "next/server";
import { AGENT_PLAN_SAMPLE } from "@/generated/agent-plan-sample.generated";

export const dynamic = "force-dynamic";

function sampleResponse() {
  return NextResponse.json({
    file: "local-generated-sample.json",
    payload: AGENT_PLAN_SAMPLE,
  });
}

export async function GET() {
  const upstreamUrl = process.env.AGENT_PLAN_URL;
  const upstreamApiKey = process.env.AGENT_PLAN_API_KEY;

  if (upstreamUrl) {
    try {
      const headers = new Headers();
      if (upstreamApiKey) {
        headers.set("x-api-key", upstreamApiKey);
      }

      const response = await fetch(upstreamUrl, {
        method: "GET",
        cache: "no-store",
        headers,
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        // Upstream down — fall back to sample data
        return sampleResponse();
      }

      const upstreamJson = (await response.json()) as { file?: string; payload?: unknown };
      if (upstreamJson.payload !== undefined) {
        return NextResponse.json({
          file: upstreamJson.file ?? "railway-live.json",
          payload: upstreamJson.payload,
        });
      }

      return NextResponse.json({
        file: "railway-live.json",
        payload: upstreamJson,
      });
    } catch {
      // Upstream unreachable — fall back to sample data
      return sampleResponse();
    }
  }

  return sampleResponse();
}
