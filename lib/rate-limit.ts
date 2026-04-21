// In-memory sliding-window rate limiter.
// Keyed by identifier (user id, IP, or composite). Not clustered.

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const cutoff = now - opts.windowMs;

  let bucket = buckets.get(opts.key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(opts.key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= opts.limit) {
    const oldest = bucket.timestamps[0];
    return { ok: false, remaining: 0, resetMs: oldest + opts.windowMs - now };
  }

  bucket.timestamps.push(now);
  return { ok: true, remaining: opts.limit - bucket.timestamps.length, resetMs: opts.windowMs };
}

// Opportunistic cleanup to keep the Map from growing unbounded.
if (typeof globalThis !== "undefined" && !(globalThis as { __rlGC?: boolean }).__rlGC) {
  (globalThis as { __rlGC?: boolean }).__rlGC = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      bucket.timestamps = bucket.timestamps.filter((t) => now - t < 3600_000);
      if (bucket.timestamps.length === 0) buckets.delete(key);
    }
  }, 600_000).unref?.();
}
