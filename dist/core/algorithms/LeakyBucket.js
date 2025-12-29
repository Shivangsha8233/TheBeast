"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeakyBucket = void 0;
class LeakyBucket {
    name = 'LeakyBucket';
    queueSize;
    lastLeak;
    capacity;
    leakRate;
    constructor(capacity, leakRate) {
        this.capacity = capacity;
        this.leakRate = leakRate;
        this.queueSize = 0;
        this.lastLeak = Date.now();
    }
    async isAllowed(key, limit, windowMs) {
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
exports.LeakyBucket = LeakyBucket;
