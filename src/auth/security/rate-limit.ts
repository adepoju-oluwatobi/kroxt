import type { AuthAdapter } from "../adapters/index.js";

export interface RateLimitOptions {
    windowMs: number;
    max: number;
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * A zero-dependency in-memory store for rate limiting.
 * Used as a fallback if the provided AuthAdapter does not
 * implement `incrementRateLimit`.
 */
export class MemoryRateLimitStore {
    private hits = new Map<string, { count: number; resetTime: number }>();

    async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
        const now = Date.now();
        const record = this.hits.get(key);

        if (!record || now > record.resetTime) {
            const newRecord = { count: 1, resetTime: now + windowMs };
            this.hits.set(key, newRecord);
            return newRecord;
        }

        record.count += 1;
        return record;
    }

    async getRateLimit(key: string): Promise<{ count: number; resetTime: number } | null> {
        const now = Date.now();
        const record = this.hits.get(key);
        if (!record || now > record.resetTime) return null;
        return record;
    }
}

/**
 * Creates a rate limiter function that uses the Database Adapter
 * for state tracking (if supported), or falls back to Memory.
 */
export function createRateLimiter(adapter: AuthAdapter<any>, options?: RateLimitOptions) {
    if (!options) return null;

    const memoryFallback = new MemoryRateLimitStore();
    let hasWarned = false;

    return {
        async increment(key: string, overrideWindowMs?: number): Promise<RateLimitResult> {
            let result;
            const windowMs = overrideWindowMs || options.windowMs;

            if (adapter.incrementRateLimit) {
                result = await adapter.incrementRateLimit(key, windowMs);
            } else {
                if (!hasWarned && process.env.NODE_ENV !== "production") {
                    console.warn("[Kroxt] Warning: AuthAdapter does not implement incrementRateLimit. Falling back to in-memory rate limiter. This is not recommended for serverless or multi-instance deployments.");
                    hasWarned = true;
                }
                result = await memoryFallback.increment(key, windowMs);
            }

            return {
                success: result.count <= options.max,
                limit: options.max,
                remaining: Math.max(0, options.max - result.count),
                reset: result.resetTime,
            };
        },

        async check(key: string): Promise<{ count: number; resetTime: number } | null> {
            if (adapter.getRateLimit) {
                return await adapter.getRateLimit(key);
            }
            return memoryFallback.getRateLimit(key);
        }
    };
}
