export interface GossipService {
    broadcast(message: Uint8Array): Promise<void>;
    onMessage(handler: (message: Uint8Array) => void): void;
    getPeers(): string[];
}
