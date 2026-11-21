export interface CounterStore {
  incr(key: string, ttlSeconds: number): Promise<number>;
}

export function memoryStore(): CounterStore {
  const counts = new Map<string, number>();
  return {
    async incr(key: string, _ttl: number): Promise<number> {
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      return next;
    },
  };
}

export function upstashStore(): CounterStore {
  const { Redis } = require("@upstash/redis");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return {
    async incr(key: string, ttl: number): Promise<number> {
      const count: number = await redis.incr(key);
      if (count === 1) await redis.expire(key, ttl);
      return count;
    },
  };
}
