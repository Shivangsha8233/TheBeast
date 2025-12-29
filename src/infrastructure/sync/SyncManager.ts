import { GossipService } from './GossipService';
import { GCounter } from './GCounter';

export class SyncManager {
    private gossip: GossipService;
    private counters: Map<string, GCounter>;
    private readonly nodeId: string;

    constructor(nodeId: string, gossipService: GossipService) {
        this.nodeId = nodeId;
        this.gossip = gossipService;
        this.counters = new Map();

        this.gossip.onMessage(this.handleMessage.bind(this));
    }

    public getCounter(key: string): GCounter {
        if (!this.counters.has(key)) {
            this.counters.set(key, new GCounter(this.nodeId));
        }
        return this.counters.get(key)!;
    }

    public increment(key: string, amount: number = 1): void {
        const counter = this.getCounter(key);
        counter.increment(amount);
        this.broadcastUpdate(key, counter);
    }

    private async broadcastUpdate(key: string, counter: GCounter): Promise<void> {
        const payload = JSON.stringify({
            type: 'MERGE',
            key,
            data: counter.toJSON()
        });
        const buffer = Buffer.from(payload);
        await this.gossip.broadcast(buffer);
    }

    private handleMessage(message: Uint8Array): void {
        try {
            const payload = JSON.parse(Buffer.from(message).toString());
            if (payload.type === 'MERGE' && payload.key && payload.data) {
                const localCounter = this.getCounter(payload.key);
                const remoteCounter = GCounter.fromJSON(this.nodeId, payload.data);
                localCounter.merge(remoteCounter);
            }
        } catch (e) {
            // invalid message ignored
        }
    }
}
