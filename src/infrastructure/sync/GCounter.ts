export class GCounter {
    private counts: Map<string, number>;
    public readonly nodeId: string;

    constructor(nodeId: string) {
        this.nodeId = nodeId;
        this.counts = new Map();
        this.counts.set(nodeId, 0);
    }

    public increment(amount: number = 1): void {
        const current = this.counts.get(this.nodeId) || 0;
        this.counts.set(this.nodeId, current + amount);
    }

    public value(): number {
        let sum = 0;
        for (const count of this.counts.values()) {
            sum += count;
        }
        return sum;
    }

    public merge(other: GCounter): void {
        for (const [node, count] of other.counts) {
            const localCount = this.counts.get(node) || 0;
            this.counts.set(node, Math.max(localCount, count));
        }
    }

    public toJSON(): object {
        return Object.fromEntries(this.counts);
    }

    public static fromJSON(nodeId: string, data: Record<string, number>): GCounter {
        const counter = new GCounter(nodeId);
        for (const [id, val] of Object.entries(data)) {
            counter.counts.set(id, val);
        }
        return counter;
    }
}
