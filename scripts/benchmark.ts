import http from 'http';

const REQUESTS = 2000;
const CONCURRENCY = 20;

console.log(`Starting benchmark...`);
console.log(`Endpoint: /api/wait (Testing WaitingTokenBucket)`);

const start = process.hrtime();
let completed = 0;
let success = 0;
let throttled = 0;
let errors = 0;

const makeRequest = () => {
    return new Promise<void>((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 8080,
            path: '/api/wait?user=bench',
            method: 'GET',
            agent: false
        }, (res) => {
            if (res.statusCode === 200) success++;
            else if (res.statusCode === 429) throttled++;
            else errors++;
            res.on('data', () => { });
            res.on('end', resolve);
        });
        req.on('error', () => { errors++; resolve(); });
        req.end();
    });
};

const worker = async () => {
    while (completed < REQUESTS) {
        completed++;
        await makeRequest();
    }
};

Promise.all(Array(CONCURRENCY).fill(null).map(worker)).then(() => {
    const [sec, nano] = process.hrtime(start);
    const duration = sec + nano / 1e9;

    console.log(`\n--- RESULT ---`);
    console.log(`Time: ${duration.toFixed(3)}s`);
    console.log(`RPS: ${(REQUESTS / duration).toFixed(2)}`);
    console.log(`OK: ${success}`);
    console.log(`429: ${throttled}`);
});
