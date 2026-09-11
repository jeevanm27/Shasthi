import Redis from 'ioredis';

let client;

export function getRedisClient() {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    client.on('connect', () => console.log('[redis] Connected'));
    client.on('error',   (err) => console.error('[redis] Error:', err.message));
    client.on('ready',   () => console.log('[redis] Ready'));
  }
  return client;
}

// Cart TTL: 7 days in seconds
export const CART_TTL_SECONDS = 7 * 24 * 60 * 60;
