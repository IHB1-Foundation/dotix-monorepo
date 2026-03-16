import { describe, expect, it } from "bun:test";

import { isAuthorizedRequest } from "./plan-auth";

describe("isAuthorizedRequest", () => {
  it("rejects requests when the API key is missing from env", () => {
    expect(isAuthorizedRequest({})).toBe(false);
  });

  it("rejects requests with no x-api-key header", () => {
    expect(isAuthorizedRequest({}, "expected-key")).toBe(false);
  });

  it("rejects requests with the wrong x-api-key header", () => {
    expect(isAuthorizedRequest({ "x-api-key": "wrong-key" }, "expected-key")).toBe(false);
  });

  it("accepts requests with the matching x-api-key header", () => {
    expect(isAuthorizedRequest({ "x-api-key": "expected-key" }, "expected-key")).toBe(true);
  });
});
