"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlidingWindowLog = void 0;
class SlidingWindowLog {
    name = 'SlidingWindowLog';
    logs = [];
    async isAllowed(key, limit, windowMs) {
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
exports.SlidingWindowLog = SlidingWindowLog;
