import { NextResponse } from "next/server";
import { AGENT_PLAN_SAMPLE } from "@/generated/agent-plan-sample.generated";

export const dynamic = "force-dynamic";

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
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Upstream plan API failed (${response.status})` },
          { status: 502 }
        );
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
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 502 });
    }
  }

  try {
    return NextResponse.json({
      file: "local-generated-sample.json",
      payload: AGENT_PLAN_SAMPLE,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
