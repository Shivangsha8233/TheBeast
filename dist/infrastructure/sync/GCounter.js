"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GCounter = void 0;
class GCounter {
    counts;
    nodeId;
    constructor(nodeId) {
        this.nodeId = nodeId;
        this.counts = new Map();
        this.counts.set(nodeId, 0);
    }
    increment(amount = 1) {
        const current = this.counts.get(this.nodeId) || 0;
        this.counts.set(this.nodeId, current + amount);
    }
    value() {
        let sum = 0;
        for (const count of this.counts.values()) {
            sum += count;
        }
        return sum;
    }
    merge(other) {
        for (const [node, count] of other.counts) {
            const localCount = this.counts.get(node) || 0;
            this.counts.set(node, Math.max(localCount, count));
        }
    }
    toJSON() {
        return Object.fromEntries(this.counts);
    }
    static fromJSON(nodeId, data) {
        const counter = new GCounter(nodeId);
        for (const [id, val] of Object.entries(data)) {
            counter.counts.set(id, val);
        }
        return counter;
    }
}
exports.GCounter = GCounter;
