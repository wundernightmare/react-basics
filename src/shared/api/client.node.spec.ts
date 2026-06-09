import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { server } from "@app/testing/mocks/server";

import { ApiError, api } from "./client";

const Schema = z.object({ ok: z.boolean(), value: z.number() });

describe("api client", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it("parses a valid JSON response through the Zod schema", async () => {
    server.use(http.get("/api/test-ok", () => HttpResponse.json({ ok: true, value: 42 })));
    const result = await api.get("/test-ok", Schema);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it("throws when the response does not match the Zod schema", async () => {
    server.use(http.get("/api/test-bad", () => HttpResponse.json({ unexpected: "shape" })));
    await expect(api.get("/test-bad", Schema)).rejects.toThrow();
  });

  it("sends a JSON content-type and body on POST", async () => {
    let receivedBody: unknown = null;
    let receivedType: string | null = null;
    server.use(
      http.post("/api/echo", async ({ request }) => {
        receivedType = request.headers.get("content-type");
        receivedBody = await request.json();
        return HttpResponse.json({ ok: true, value: 1 });
      }),
    );
    await api.post("/echo", Schema, { hello: "world" });
    expect(receivedType).toContain("application/json");
    expect(receivedBody).toEqual({ hello: "world" });
  });

  it("throws ApiError with .status and .problem on a problem+json 4xx response", async () => {
    server.use(
      http.get("/api/test-problem", () =>
        HttpResponse.json(
          { type: "about:blank", title: "Bad", status: 400, detail: "nope" },
          { status: 400, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );
    const err = await api.get("/test-problem", Schema).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    const apiErr = err as ApiError;
    expect(apiErr.status).toBe(400);
    expect(apiErr.problem?.detail).toBe("nope");
    expect(apiErr.message).toBe("nope");
  });

  it("throws ApiError with a non-empty message on a non-JSON error response", async () => {
    server.use(
      http.get("/api/test-text", () =>
        HttpResponse.text("server exploded", {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        }),
      ),
    );
    const err = await api.get("/test-text", Schema).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
    expect((err as ApiError).message.length).toBeGreaterThan(0);
  });

  it("validates an empty 204 body against z.void()", async () => {
    server.use(http.delete("/api/thing", () => new HttpResponse(null, { status: 204 })));
    await expect(api.delete("/thing", z.void())).resolves.toBeUndefined();
  });
});
