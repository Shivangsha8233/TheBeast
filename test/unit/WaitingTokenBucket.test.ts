import { WaitingTokenBucket } from '../../src/core/algorithms/WaitingTokenBucket';

describe('WaitingTokenBucket Strategy', () => {
    test('should queue requests when out of tokens', async () => {
        const capacity = 1;
        const refillRate = 10; // 10 per sec = 1 token every 100ms
        const bucket = new WaitingTokenBucket(capacity, refillRate);

        // 1. Consume capacity
        const r1 = await bucket.isAllowed('user', 1, 1000);
        expect(r1.allowed).toBe(true);

        // 2. Next request should queue (start time)
        const start = Date.now();
        const r2Promise = bucket.isAllowed('user', 1, 1000);

        const r2 = await r2Promise;
        const end = Date.now();

        expect(r2.allowed).toBe(true);
        // Should have waited approx 100ms
        expect(end - start).toBeGreaterThanOrEqual(90);
    });

    test('should reject when queue is full', async () => {
        const capacity = 1;
        const refillRate = 0.1; // Very slow: 1 token every 10s
        const maxQueue = 2; // Strict queue limit
        const bucket = new WaitingTokenBucket(capacity, refillRate, maxQueue);

        // Consume capacity
        await bucket.isAllowed('user', 1, 1000);

        // Fill queue
        bucket.isAllowed('user', 1, 1000); // Queue 1
        bucket.isAllowed('user', 1, 1000); // Queue 2

        // Reject
        const r4 = await bucket.isAllowed('user', 1, 1000);
        expect(r4.allowed).toBe(false);
    });
});
