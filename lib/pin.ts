export const PIN_COOKIE = "lanes_pin";
export const PIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Best-effort per-IP rate limit. Lives in module memory, so it resets on
 * cold start and isn't shared across concurrent instances — acceptable for
 * a low-traffic internal tool; see 09-auth-deploy.md.
 */
const attemptsByIp = new Map<string, number[]>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = (attemptsByIp.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  attemptsByIp.set(ip, attempts);
  return attempts.length >= RATE_LIMIT_MAX;
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const attempts = (attemptsByIp.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  attempts.push(now);
  attemptsByIp.set(ip, attempts);
}

export function verifyPin(candidate: string): boolean {
  const pin = process.env.DASHBOARD_PIN;
  if (!pin) return false;
  return candidate === pin;
}

/**
 * The client-facing entries of x-forwarded-for are attacker-controlled (a
 * client can send its own header and Vercel appends the real IP after it),
 * so the trustworthy value is the LAST entry, not the first. x-real-ip is
 * set directly by Vercel's edge and can't be overridden by the client.
 */
export function requestIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim());
    return parts[parts.length - 1] || "unknown";
  }
  return "unknown";
}
