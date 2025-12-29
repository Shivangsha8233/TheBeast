import Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';
import { RateLimiterStrategy } from './RateLimiterStrategy';

export class SlidingWindowCounter implements RateLimiterStrategy {
    public readonly name = 'SlidingWindowCounter';
    private redis: Redis;
    private luaScript: string;

    constructor(redisClient: Redis) {
        this.redis = redisClient;
        // Helper to resolve path relative to built project or src
        // __dirname is .../core/algorithms
        // ../../ resolves to .../ (src or dist)
        // Then into infrastructure/redis/sliding_window.lua
        const scriptPath = path.join(__dirname, '../../infrastructure/redis/sliding_window.lua');
        // Using sync read since this happens only once at startup
        this.luaScript = fs.readFileSync(scriptPath, 'utf8');
    }

    public async isAllowed(key: string, limit: number, windowMs: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetTimeMs: number;
    }> {
        const now = Date.now();

        // redis.eval(script, numKeys, key, arg1, arg2, arg3)
        const result = await this.redis.eval(
            this.luaScript,
            1,
            key,
            windowMs,
            limit,
            now
        ) as [number, number];

        const isAllowed = result[0] === 1;
        const remaining = result[1];

        return {
            allowed: isAllowed,
            remaining: remaining,
            // If allowed, reset is sliding, roughly now + window. 
            // If blocked, we'd need to query TTL, but for high-perf just returning window end is often acceptable approximation
            resetTimeMs: now + windowMs
        };
    }
}
