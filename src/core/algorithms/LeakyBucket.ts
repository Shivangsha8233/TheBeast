import { RateLimiterStrategy } from './RateLimiterStrategy';

export class LeakyBucket implements RateLimiterStrategy {
    public readonly name = 'LeakyBucket';
    private queueSize: number;
    private lastLeak: number;
    private readonly capacity: number;
    private readonly leakRate: number;

    constructor(capacity: number, leakRate: number) {
        this.capacity = capacity;
        this.leakRate = leakRate;
        this.queueSize = 0;
        this.lastLeak = Date.now();
    }

    public async isAllowed(key: string, limit: number, windowMs: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetTimeMs: number;
    }> {
        const now = Date.now();
        const elapsedTime = (now - this.lastLeak) / 1000;
        const leakedAmount = elapsedTime * this.leakRate;

        this.queueSize = Math.max(0, this.queueSize - leakedAmount);
        this.lastLeak = now;

        if (this.queueSize < this.capacity) {
            this.queueSize += 1;
            return {
                allowed: true,
                remaining: Math.floor(this.capacity - this.queueSize),
                resetTimeMs: now
            };
        }

        return {
            allowed: false,
            remaining: 0,
            resetTimeMs: now + ((this.queueSize - this.capacity + 1) / this.leakRate) * 1000
        };
    }
}
