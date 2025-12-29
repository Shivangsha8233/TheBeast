import Redis from 'ioredis';
import { SlidingWindowCounter } from '../../src/core/algorithms/SlidingWindowCounter';

describe('SlidingWindowCounter Integration', () => {
    let redis: Redis;
    let limiter: SlidingWindowCounter;

    beforeAll(() => {
        redis = new Redis({ host: 'localhost', port: 6379 });
        limiter = new SlidingWindowCounter(redis);
    });

    afterAll(async () => {
        await redis.flushall();
        await redis.quit();
    });

    test('should atomically limit requests across parallel execution', async () => {
        const key = 'concurrent-test';
        const limit = 5;
        const windowMs = 1000;

        const requests = Array(10).fill(null).map(() =>
            limiter.isAllowed(key, limit, windowMs)
        );

        const results = await Promise.all(requests);
        const allowedCount = results.filter(r => r.allowed).length;

        expect(allowedCount).toBe(limit);
    });
});
