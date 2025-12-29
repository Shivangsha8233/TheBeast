"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitingTokenBucket = void 0;
class WaitingTokenBucket {
    name = 'WaitingTokenBucket';
    tokens;
    lastRefill;
    capacity;
    refillRate;
    maxQueueSize;
    queue;
    constructor(capacity, refillRate, maxQueueSize = 10) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = capacity;
        this.lastRefill = Date.now();
        this.maxQueueSize = maxQueueSize;
        this.queue = [];
    }
    refill() {
        const now = Date.now();
        const elapsedTime = (now - this.lastRefill) / 1000;
        const newTokens = elapsedTime * this.refillRate;
        this.tokens = Math.min(this.capacity, this.tokens + newTokens);
        this.lastRefill = now;
    }
    processQueue() {
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
    async isAllowed(key, limit, windowMs) {
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
exports.WaitingTokenBucket = WaitingTokenBucket;
