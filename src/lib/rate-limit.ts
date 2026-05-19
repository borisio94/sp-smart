/**
 * Limiteur de débit simple en mémoire (par IP + action).
 * Suffisant pour protéger les formulaires du spam basique.
 * (En production multi-instances, envisager Upstash Redis.)
 */
type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true, retryAfter: 0 };
}
