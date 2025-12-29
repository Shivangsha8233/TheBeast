export interface RateLimiterStrategy {
  name: string;
  isAllowed(key: string, limit: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTimeMs: number;
  }>;
}
