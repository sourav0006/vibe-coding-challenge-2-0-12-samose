/**
 * In-Memory Sliding Window Rate Limiter
 *
 * Provides brute-force and credential-stuffing defense for sensitive authentication endpoints.
 *
 * NOTE ON SERVERLESS LIMITATION:
 * In a multi-instance serverless or edge deployment, each instance maintains its own memory space.
 * For horizontally distributed serverless deployments, this implementation can be swapped
 * with a shared Redis/Upstash store without changing the caller interface.
 */

interface RateLimitRecord {
  timestamps: number[];
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Periodic sweep to prevent memory leaks from inactive keys
    if (typeof setInterval !== "undefined") {
      const timer = setInterval(() => this.cleanup(), 60000);
      if (typeof timer.unref === "function") {
        timer.unref();
      }
    }
  }

  /**
   * Attempts an action for a key. Returns true if allowed, false if rate limited.
   */
  public check(key: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Filter out timestamps outside the active sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= this.maxRequests) {
      const oldest = record.timestamps[0];
      const retryAfterSeconds = Math.ceil((oldest + this.windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(retryAfterSeconds, 1),
      };
    }

    record.timestamps.push(now);

    return {
      allowed: true,
      remaining: this.maxRequests - record.timestamps.length,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Resets the limit for a key upon successful authentication
   */
  public reset(key: string): void {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, record] of this.store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
      if (record.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }
}

// 5 login attempts per 15 minutes per identifier (IP + email)
export const loginRateLimiter = new InMemoryRateLimiter(15 * 60 * 1000, 5);

// 5 activation attempts per 15 minutes per IP
export const activationRateLimiter = new InMemoryRateLimiter(15 * 60 * 1000, 5);
