// TODO: wire up Redis client when caching is implemented
export const redisConfig = {
  enabled: false,
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
};
