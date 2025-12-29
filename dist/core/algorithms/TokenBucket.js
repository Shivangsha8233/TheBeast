"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenBucket = void 0;
class TokenBucket {
    name = 'TokenBucket';
    tokens;
    lastRefill;
    capacity;
    refillRate;
    constructor(capacity, refillRate) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = capacity;
        this.lastRefill = Date.now();
    }
    async isAllowed(key, limit, windowMs) {
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
exports.TokenBucket = TokenBucket;
