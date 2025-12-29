"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiterFactory = void 0;
const TokenBucket_1 = require("./algorithms/TokenBucket");
const LeakyBucket_1 = require("./algorithms/LeakyBucket");
const SlidingWindowLog_1 = require("./algorithms/SlidingWindowLog");
const SlidingWindowCounter_1 = require("./algorithms/SlidingWindowCounter");
const WaitingTokenBucket_1 = require("./algorithms/WaitingTokenBucket");
class RateLimiterFactory {
    static create(type, config = {}) {
        switch (type) {
            case 'TOKEN_BUCKET':
                if (!config.capacity || !config.refillRate) {
                    throw new Error('TokenBucket requires capacity and refillRate');
                }
                return new TokenBucket_1.TokenBucket(config.capacity, config.refillRate);
            case 'LEAKY_BUCKET':
                if (!config.capacity || !config.leakRate) {
                    throw new Error('LeakyBucket requires capacity and leakRate');
                }
                return new LeakyBucket_1.LeakyBucket(config.capacity, config.leakRate);
            case 'SLIDING_WINDOW_LOG':
                return new SlidingWindowLog_1.SlidingWindowLog();
            case 'SLIDING_WINDOW_COUNTER':
                if (!config.redisClient) {
                    throw new Error('SlidingWindowCounter requires redisClient');
                }
                return new SlidingWindowCounter_1.SlidingWindowCounter(config.redisClient);
            case 'WAITING_TOKEN_BUCKET':
                if (!config.capacity || !config.refillRate) {
                    throw new Error('WaitingTokenBucket requires capacity and refillRate');
                }
                return new WaitingTokenBucket_1.WaitingTokenBucket(config.capacity, config.refillRate);
            default:
                throw new Error(`Unknown algorithm type: ${type}`);
        }
    }
}
exports.RateLimiterFactory = RateLimiterFactory;
