import { RateLimiterStrategy } from './RateLimiterStrategy';

export class SlidingWindowLog implements RateLimiterStrategy {
    public readonly name = 'SlidingWindowLog';
    private logs: number[] = [];

    public async isAllowed(key: string, limit: number, windowMs: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetTimeMs: number;
    }> {
        const now = Date.now();
        const windowStart = now - windowMs;

        this.logs = this.logs.filter(timestamp => timestamp > windowStart);

        if (this.logs.length < limit) {
            this.logs.push(now);
            return {
                allowed: true,
                remaining: limit - this.logs.length,
                resetTimeMs: now + windowMs
            };
        }

        const oldestLog = this.logs[0] || now;
        return {
            allowed: false,
            remaining: 0,
            resetTimeMs: oldestLog + windowMs
        };
    }
}
