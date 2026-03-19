export interface RedisConnection {
  host: string;
  port: number;
  password?: string;
  username?: string;
  db?: number;
}

export function parseRedisConnection(redisUrl?: string | null): RedisConnection {
  const fallback: RedisConnection = {
    host: "127.0.0.1",
    port: 6379
  };

  const normalizedUrl = redisUrl?.trim();
  if (!normalizedUrl) {
    return fallback;
  }

  try {
    const url = new URL(normalizedUrl);
    return {
      host: url.hostname,
      port: Number(url.port || 6379),
      password: url.password || undefined,
      username: url.username || undefined,
      db: url.pathname ? Number(url.pathname.replace("/", "")) || undefined : undefined
    };
  } catch {
    return fallback;
  }
}
