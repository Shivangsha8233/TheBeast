import { RateLimiterStrategy } from './RateLimiterStrategy';

export class WaitingTokenBucket implements RateLimiterStrategy {
    public readonly name = 'WaitingTokenBucket';
    private tokens: number;
    private lastRefill: number;
    private readonly capacity: number;
    private readonly refillRate: number;
    private readonly maxQueueSize: number;
    private queue: Array<(value: { allowed: boolean; remaining: number; resetTimeMs: number }) => void>;

    constructor(capacity: number, refillRate: number, maxQueueSize: number = 10) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = capacity;
        this.lastRefill = Date.now();
        this.maxQueueSize = maxQueueSize;
        this.queue = [];
    }

    private refill(): void {
        const now = Date.now();
        const elapsedTime = (now - this.lastRefill) / 1000;
        const newTokens = elapsedTime * this.refillRate;
        this.tokens = Math.min(this.capacity, this.tokens + newTokens);
        this.lastRefill = now;
    }

    private processQueue(): void {
        this.refill();

        while (this.queue.length > 0 && this.tokens >= 1) {
            this.tokens -= 1;
            const resolve = this.queue.shift();
            if (resolve) {
                resolve({
                    allowed: true,
                    remaining: Math.floor(this.tokens),
                    resetTimeMs: Date.now() + (1 / this.refillRate) * 1000
                });
            }
        }

        if (this.queue.length > 0) {
            const timeToNextToken = (1 / this.refillRate) * 1000;
            setTimeout(() => this.processQueue(), timeToNextToken);
        }
    }

    public async isAllowed(key: string, limit: number, windowMs: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetTimeMs: number;
    }> {
        this.refill();

        if (this.tokens >= 1) {
            this.tokens -= 1;
            return {
                allowed: true,
                remaining: Math.floor(this.tokens),
                resetTimeMs: Date.now() + (1 / this.refillRate) * 1000
            };
        }

        if (this.queue.length < this.maxQueueSize) {
            return new Promise((resolve) => {
                this.queue.push(resolve);
                const timeToNextToken = (1 / this.refillRate) * 1000;
                setTimeout(() => this.processQueue(), timeToNextToken);
            });
        }

        return {
            allowed: false,
            remaining: 0,
            resetTimeMs: Date.now() + ((1 - this.tokens) / this.refillRate) * 1000
        };
    }
}
