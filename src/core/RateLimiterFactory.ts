import Redis from 'ioredis';
import { RateLimiterStrategy } from './algorithms/RateLimiterStrategy';
import { TokenBucket } from './algorithms/TokenBucket';
import { LeakyBucket } from './algorithms/LeakyBucket';
import { SlidingWindowLog } from './algorithms/SlidingWindowLog';
import { SlidingWindowCounter } from './algorithms/SlidingWindowCounter';
import { WaitingTokenBucket } from './algorithms/WaitingTokenBucket';

export type AlgorithmType = 'TOKEN_BUCKET' | 'LEAKY_BUCKET' | 'SLIDING_WINDOW_LOG' | 'SLIDING_WINDOW_COUNTER' | 'WAITING_TOKEN_BUCKET';

export interface FactoryConfig {
    redisClient?: Redis;
    capacity?: number;
    refillRate?: number;
    leakRate?: number;
}

export class RateLimiterFactory {
    public static create(type: AlgorithmType, config: FactoryConfig = {}): RateLimiterStrategy {
        switch (type) {
            case 'TOKEN_BUCKET':
                if (!config.capacity || !config.refillRate) {
                    throw new Error('TokenBucket requires capacity and refillRate');
                }
                return new TokenBucket(config.capacity, config.refillRate);

            case 'LEAKY_BUCKET':
                if (!config.capacity || !config.leakRate) {
                    throw new Error('LeakyBucket requires capacity and leakRate');
                }
                return new LeakyBucket(config.capacity, config.leakRate);

            case 'SLIDING_WINDOW_LOG':
                return new SlidingWindowLog();

            case 'SLIDING_WINDOW_COUNTER':
                if (!config.redisClient) {
                    throw new Error('SlidingWindowCounter requires redisClient');
                }
                return new SlidingWindowCounter(config.redisClient);

            case 'WAITING_TOKEN_BUCKET':
                if (!config.capacity || !config.refillRate) {
                    throw new Error('WaitingTokenBucket requires capacity and refillRate');
                }
                return new WaitingTokenBucket(config.capacity, config.refillRate);

            default:
                throw new Error(`Unknown algorithm type: ${type}`);
        }
    }
}
