import mongoose from "mongoose";
import { RateLimitModel } from "@/models/rate-limit.model";

/**
 * Hybrid Persistent & In-Memory Sliding Window Rate Limiter
 *
 * Provides brute-force and credential-stuffing defense for sensitive authentication endpoints.
 *
 * Features:
 * 1. Synchronous API (`check`, `refund`, `reset`) backed by in-memory sliding window for fast-path and unit tests.
 * 2. Asynchronous API (`checkAsync`, `refundAsync`, `resetAsync`) backed by MongoDB Atlas `RateLimitModel`
 *    with a TTL index for multi-instance serverless deployments (Next.js on Vercel).
 * 3. Graceful fallback: If MongoDB is unavailable or disconnected, automatically falls back to in-memory state.
 * 4. Refund capability: Allows removing false-positive penalties (e.g. valid credentials on wrong portal role).
 * 5. Cooldown: Configured to 2 minutes (~120s) with 5 failed attempts allowed before rate limiting.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface RateLimitRecord {
  timestamps: number[];
}

export class RateLimiter {
  private store = new Map<string, RateLimitRecord>();
  public readonly windowMs: number;
  public readonly maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Periodic sweep to prevent memory leaks from inactive keys in long-lived runtimes
    if (typeof setInterval !== "undefined") {
      const timer = setInterval(() => this.cleanup(), 60000);
      if (typeof timer.unref === "function") {
        timer.unref();
      }
    }
  }

  /**
   * Synchronous check against in-memory sliding window.
   */
  public check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Filter out timestamps outside active sliding window
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
   * Asynchronous check with MongoDB persistence for serverless multi-instance support.
   */
  public async checkAsync(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Fast-path in-memory check
    const memResult = this.check(key);
    if (!memResult.allowed) {
      return memResult;
    }

    // Persist and synchronize with MongoDB if connected
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const doc = await RateLimitModel.findOne({ key }).exec();
        const validDates = doc
          ? doc.timestamps.filter((d) => d.getTime() > windowStart)
          : [];

        if (validDates.length >= this.maxRequests) {
          const oldestTime = validDates[0].getTime();
          const retryAfterSeconds = Math.max(
            1,
            Math.ceil((oldestTime + this.windowMs - now) / 1000)
          );

          // Sync in-memory store to block subsequent calls
          this.store.set(key, { timestamps: validDates.map((d) => d.getTime()) });

          return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds,
          };
        }

        // Add current attempt and update doc with TTL
        const updatedDates = [...validDates, new Date(now)];
        const expiresAt = new Date(now + this.windowMs);

        await RateLimitModel.findOneAndUpdate(
          { key },
          {
            $set: {
              timestamps: updatedDates,
              expiresAt,
            },
          },
          { upsert: true, returnDocument: "after" }
        ).exec();

        // Sync in-memory timestamps
        this.store.set(key, { timestamps: updatedDates.map((d) => d.getTime()) });

        return {
          allowed: true,
          remaining: Math.max(0, this.maxRequests - updatedDates.length),
          retryAfterSeconds: 0,
        };
      } catch {
        // Fall back gracefully to in-memory result if MongoDB operation fails
        return memResult;
      }
    }

    return memResult;
  }

  /**
   * Removes the most recent attempt for this key (e.g. when valid credentials had wrong role).
   */
  public refund(key: string): void {
    const record = this.store.get(key);
    if (record && record.timestamps.length > 0) {
      record.timestamps.pop();
      if (record.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Asynchronously refunds the most recent attempt in both memory and MongoDB.
   */
  public async refundAsync(key: string): Promise<void> {
    this.refund(key);

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const doc = await RateLimitModel.findOne({ key }).exec();
        if (doc && doc.timestamps.length > 0) {
          doc.timestamps.pop();
          if (doc.timestamps.length === 0) {
            await RateLimitModel.deleteOne({ key }).exec();
          } else {
            await doc.save();
          }
        }
      } catch {
        // Ignore DB errors during refund
      }
    }
  }

  /**
   * Resets the limit for a key upon successful authentication.
   */
  public reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Asynchronously clears rate limiting for a key in both memory and MongoDB.
   */
  public async resetAsync(key: string): Promise<void> {
    this.reset(key);

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await RateLimitModel.deleteOne({ key }).exec();
      } catch {
        // Ignore DB errors during reset
      }
    }
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

// Backward-compatibility alias
export const InMemoryRateLimiter = RateLimiter;

// 5 login attempts per 2 minutes (~120s cooldown) per identifier (IP + email)
export const loginRateLimiter = new RateLimiter(2 * 60 * 1000, 5);

// 5 activation attempts per 2 minutes (~120s cooldown) per identifier
export const activationRateLimiter = new RateLimiter(2 * 60 * 1000, 5);
