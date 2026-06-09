import { z } from "zod";

// Same-origin "/api" by default — the Vite dev server proxies /api/* to the
// backend, and the MSW handlers register on the same prefix. In production a
// `VITE_API_URL` injects the absolute API origin at build time. The trailing
// slash is stripped so callers compose `${BASE_URL}/tasks` cleanly.
export const BASE_URL = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

// ─── Error type ────────────────────────────────────────────────────────────────

/** RFC 9457 problem-details payload, as returned by the backend on 4xx/5xx. */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}

export class ApiError extends Error {
  readonly problem?: ProblemDetail;

  constructor(
    public readonly status: number,
    message: string,
    problem?: ProblemDetail,
  ) {
    super(message);
    this.name = "ApiError";
    this.problem = problem;
  }
}

// ─── Core request ───────────────────────────────────────────────────────────────

interface RequestConfig {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}

/**
 * Single fetch entry point. Every response is parsed through a Zod schema so a
 * shape mismatch between the backend and the frontend fails loudly at the call
 * site instead of leaking `undefined` deep into the UI. A 204 is validated
 * against the schema with `undefined` — pass `z.void()` for empty responses.
 */
async function request<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  config: RequestConfig = {},
): Promise<z.infer<S>> {
  const method = (config.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    ...(config.body === undefined ? {} : { "Content-Type": "application/json" }),
    ...config.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: config.body });

  if (!res.ok) {
    let problem: ProblemDetail | undefined;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("json")) {
      try {
        problem = (await res.json()) as ProblemDetail;
      } catch {
        // Non-JSON or empty error body — fall through to statusText.
      }
    }
    const message = problem?.detail ?? problem?.title ?? res.statusText;
    throw new ApiError(res.status, message, problem);
  }

  if (res.status === 204) return schema.parse(undefined) as z.infer<S>;
  return schema.parse(await res.json()) as z.infer<S>;
}

// ─── Verb helpers ─────────────────────────────────────────────────────────────

export const api = {
  get: <S extends z.ZodTypeAny>(path: string, schema: S, headers?: Record<string, string>) =>
    request(path, schema, { headers }),
  post: <S extends z.ZodTypeAny>(path: string, schema: S, body?: unknown) =>
    request(path, schema, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <S extends z.ZodTypeAny>(path: string, schema: S, body: unknown) =>
    request(path, schema, { method: "PATCH", body: JSON.stringify(body) }),
  put: <S extends z.ZodTypeAny>(path: string, schema: S, body: unknown) =>
    request(path, schema, { method: "PUT", body: JSON.stringify(body) }),
  delete: <S extends z.ZodTypeAny>(path: string, schema: S) =>
    request(path, schema, { method: "DELETE" }),
};
