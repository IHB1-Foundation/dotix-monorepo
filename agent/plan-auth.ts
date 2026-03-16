import type http from "node:http";

export function isAuthorizedRequest(
  headers: http.IncomingHttpHeaders,
  expectedApiKey = process.env.AGENT_PLAN_API_KEY
): boolean {
  if (!expectedApiKey) {
    return false;
  }

  const provided = headers["x-api-key"];
  if (typeof provided !== "string") {
    return false;
  }

  return provided === expectedApiKey;
}
