import cluster from 'cluster';
import os from 'os';
import http from 'http';
import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';
import { RateLimiterFactory } from './core/RateLimiterFactory';

const numCPUs = os.cpus().length;
const PORT = Number(process.env.PORT) || 8080;

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    cluster.on('exit', (worker) => {
        console.log(`Worker ${worker.process.pid} died. Replacing...`);
        cluster.fork();
    });
} else {
    startWorker();
}

async function startWorker() {
    // Priority: REDIS_URL (Railway) -> Env Vars -> Localhost
    const redisUrl = process.env.REDIS_URL;
    const redisOptions = {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        enableOfflineQueue: false,
        retryStrategy: (times: number) => Math.min(times * 50, 2000)
    };

    const redis = redisUrl ? new Redis(redisUrl) : new Redis(redisOptions);

    redis.on('error', (err) => {
        console.error('[Redis] Connection Error. Is Docker running?');
    });

    const limiter = RateLimiterFactory.create('SLIDING_WINDOW_COUNTER', { redisClient: redis });
    const waitingLimiter = RateLimiterFactory.create('WAITING_TOKEN_BUCKET', { capacity: 5, refillRate: 2 }); // 2 tokens/sec

    const server = http.createServer(async (req, res) => {
        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // Serve Static Dashboard
        if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
            const indexPath = path.join(__dirname, '../public/index.html');
            fs.readFile(indexPath, (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error loading dashboard');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(data);
                }
            });
            return;
        }

        // Standard Limiter
        if (req.url?.startsWith('/api/limit')) {
            const urlParams = new URL(req.url, `http://${req.headers.host}`);
            const user = urlParams.searchParams.get('user') || 'default_user';
            try {
                const result = await limiter.isAllowed(`user:${user}`, 50, 10000);
                res.writeHead(result.allowed ? 200 : 429, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                console.error(error);
                res.writeHead(500); res.end(JSON.stringify({ error: 'Server Error' }));
            }
            return;
        }

        // Waiting Limiter
        if (req.url?.startsWith('/api/wait')) {
            const urlParams = new URL(req.url, `http://${req.headers.host}`);
            const user = urlParams.searchParams.get('user') || 'default_user';
            try {
                // Logic for waiting bucket
                const start = Date.now();
                const result = await waitingLimiter.isAllowed(`wait:${user}`, 1, 1000);
                const duration = Date.now() - start;

                const payload = { ...result, duration };
                res.writeHead(result.allowed ? 200 : 429, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(payload));
            } catch (error) {
                console.error(error);
                res.writeHead(500); res.end(JSON.stringify({ error: 'Server Error' }));
            }
            return;
        }

        res.writeHead(404);
        res.end('Not Found');
    });

    server.listen(PORT, () => {
        console.log(`Worker ${process.pid} listening on port ${PORT}`);
    });

    const shutdown = async () => {
        server.close();
        await redis.quit();
        process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
