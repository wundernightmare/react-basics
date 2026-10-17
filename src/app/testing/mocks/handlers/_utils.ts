import { HttpResponse } from "msw/http";
import type { z } from "zod";

/** RFC 9457 problem-details body, as the API returns it. */
export type ProblemBody = {
  status: number;
  title: string;
  detail?: string;
};

/**
 * Schema-validated JSON response. Wrapping handler responses in the same Zod
 * schema the app consumes catches handler-vs-schema drift at test time: a
 * mismatch returns 500 with a clear message so the failing test points at the
 * handler, not at the consumer.
 */
export function typedJson<S extends z.ZodTypeAny>(
  schema: S,
  body: z.input<S>,
  init?: { status?: number; headers?: HeadersInit },
): HttpResponse<Record<string, unknown>> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return HttpResponse.json(
      { status: 500, title: "MSW handler/schema drift", detail: issues },
      { status: 500 },
    );
  }
  return HttpResponse.json(result.data as Record<string, unknown>, init);
}

/** RFC 9457 problem-details response. */
export function problem(status: number, title: string, detail?: string): HttpResponse<ProblemBody> {
  return HttpResponse.json(
    { status, title, ...(detail ? { detail } : {}) },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

export function notFound(detail = "Resource not found"): HttpResponse<ProblemBody> {
  return problem(404, "Not Found", detail);
}

export function now(): string {
  return new Date().toISOString();
}
