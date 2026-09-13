// ponytail: simple in-memory rate limiter for edge runtime.
// 100 req/min per IP. Resets on cold start. Sufficient for solo SaaS up to ~10k MAU.
// For higher scale, switch to Cloudflare KV or Upstash Redis.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const LIMIT = 100;
const WINDOW_MS = 60_000;

export function rateLimit(ip: string, limit = LIMIT, windowMs = WINDOW_MS): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt < now) {
    const fresh = { count: 1, resetAt: now + windowMs };
    buckets.set(ip, fresh);
    return { ok: true, remaining: limit - 1, resetAt: fresh.resetAt };
  }

  bucket.count++;
  const remaining = Math.max(0, limit - bucket.count);
  return { ok: bucket.count <= limit, remaining, resetAt: bucket.resetAt };
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimitResponse(resetAt: number) {
  return new Response(JSON.stringify({ ok: false, error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
    },
  });
}
