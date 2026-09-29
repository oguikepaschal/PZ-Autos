// Best-effort in-memory rate limiter shared by the public WhatsApp click
// endpoint and the admin API guard. This is a
// single-owner, low-traffic tool running on a small number of serverless
// instances — an in-memory window is a real gap on a multi-instance
// deployment (each instance counts independently) but is proportionate here;
// reach for a shared store (e.g. Upstash) only if abuse actually shows up.

const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 5

const hits = new Map<string, number[]>()

export function isRateLimited(key: string): boolean {
  const now = Date.now()
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(key, timestamps)
    return true
  }

  timestamps.push(now)
  hits.set(key, timestamps)
  return false
}
