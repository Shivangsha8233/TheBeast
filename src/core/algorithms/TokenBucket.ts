import { RateLimiterStrategy } from './RateLimiterStrategy';

export class TokenBucket implements RateLimiterStrategy {
    public readonly name = 'TokenBucket';
    private tokens: number;
    private lastRefill: number;
    private readonly capacity: number;
    private readonly refillRate: number;

    constructor(capacity: number, refillRate: number) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = capacity;
        this.lastRefill = Date.now();
    }

    public async isAllowed(key: string, limit: number, windowMs: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetTimeMs: number;
    }> {
        const now = Date.now();
        const elapsedTime = (now - this.lastRefill) / 1000;
        const newTokens = elapsedTime * this.refillRate;

        this.tokens = Math.min(this.capacity, this.tokens + newTokens);
        this.lastRefill = now;

        if (this.tokens >= 1) {
            this.tokens -= 1;
            return {
                allowed: true,
                remaining: Math.floor(this.tokens),
                resetTimeMs: now + (1 / this.refillRate) * 1000
            };
        }

        return {
            allowed: false,
            remaining: 0,
            resetTimeMs: now + ((1 - this.tokens) / this.refillRate) * 1000
        };
    }
}
