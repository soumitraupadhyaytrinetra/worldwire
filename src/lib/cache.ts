import { Redis } from "@upstash/redis";

const redis = process.env.REDIS_URL
  ? new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN || "" })
  : null;

const TTL = {
  HOMEPAGE: 300,
  CATEGORY: 600,
  ARTICLE: 900,
  TRENDS: 1800,
  SEARCH: 600,
};

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  if (!redis) return fetcher();

  const cached = await redis.get<T>(key);
  if (cached) return cached;

  const data = await fetcher();
  await redis.set(key, data, { ex: ttl });
  return data;
}

export { TTL };
