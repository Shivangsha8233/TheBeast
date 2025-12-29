"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncManager = void 0;
const GCounter_1 = require("./GCounter");
class SyncManager {
    gossip;
    counters;
    nodeId;
    constructor(nodeId, gossipService) {
        this.nodeId = nodeId;
        this.gossip = gossipService;
        this.counters = new Map();
        this.gossip.onMessage(this.handleMessage.bind(this));
    }
    getCounter(key) {
        if (!this.counters.has(key)) {
            this.counters.set(key, new GCounter_1.GCounter(this.nodeId));
        }
        return this.counters.get(key);
    }
    increment(key, amount = 1) {
        const counter = this.getCounter(key);
        counter.increment(amount);
        this.broadcastUpdate(key, counter);
    }
    async broadcastUpdate(key, counter) {
        const payload = JSON.stringify({
            type: 'MERGE',
            key,
            data: counter.toJSON()
        });
        const buffer = Buffer.from(payload);
        await this.gossip.broadcast(buffer);
    }
    handleMessage(message) {
        try {
            const payload = JSON.parse(Buffer.from(message).toString());
            if (payload.type === 'MERGE' && payload.key && payload.data) {
                const localCounter = this.getCounter(payload.key);
                const remoteCounter = GCounter_1.GCounter.fromJSON(this.nodeId, payload.data);
                localCounter.merge(remoteCounter);
            }
        }
        catch (e) {
        }
    }
}
exports.SyncManager = SyncManager;
