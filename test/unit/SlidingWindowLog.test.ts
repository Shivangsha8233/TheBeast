import { SlidingWindowLog } from '../../src/core/algorithms/SlidingWindowLog';

describe('SlidingWindowLog Strategy', () => {
    test('should correctly deny requests over limit', async () => {
        const limiter = new SlidingWindowLog();
        const limit = 2;
        const windowMs = 1000;
        const key = 'test-swl';

        expect((await limiter.isAllowed(key, limit, windowMs)).allowed).toBe(true);
        expect((await limiter.isAllowed(key, limit, windowMs)).allowed).toBe(true);
        expect((await limiter.isAllowed(key, limit, windowMs)).allowed).toBe(false);
    });

    test('should cleanup old logs to prevent memory leaks', async () => {
        const limiter = new SlidingWindowLog();
        const limit = 5;
        const windowMs = 100;
        const key = 'test-cleanup';

        await limiter.isAllowed(key, limit, windowMs);

        // access private property for testing verification (casting to any)
        const logsBefore = (limiter as any).logs.length;
        expect(logsBefore).toBe(1);

        await new Promise(r => setTimeout(r, 150));

        await limiter.isAllowed(key, limit, windowMs);
        // Should have filtered out the old one, so length should be 1 (the new one only)
        const logsAfter = (limiter as any).logs.length;
        expect(logsAfter).toBe(1);
    });
});
