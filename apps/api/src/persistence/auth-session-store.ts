import { ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import Redis from "ioredis";
import type { AuthSessionSummary } from "@huelegood/shared";
import { parseRedisConnection } from "@huelegood/shared";
import { isConfigured, isProductionRuntime } from "../common/env";

const SESSION_KEY_PREFIX = "auth:session:";

const memorySessions = new Map<string, AuthSessionSummary>();

let redisClient: Redis | null = null;
let redisConnectPromise: Promise<Redis | null> | null = null;
let storageMode: "unset" | "redis" | "memory" = "unset";

function sessionKey(token: string) {
  return `${SESSION_KEY_PREFIX}${token}`;
}

function isExpired(session: AuthSessionSummary) {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

function normalizeAuthorization(authorization?: string | string[]) {
  if (!authorization) {
    return null;
  }

  const value = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!value) {
    return null;
  }

  const [scheme, token] = value.split(" ");
  if (scheme?.toLowerCase() === "bearer" && token) {
    return token.trim();
  }

  return value.trim();
}

function buildUnavailableError() {
  return new ServiceUnavailableException("No podemos validar sesiones porque Redis no está disponible.");
}

function createRedisClient() {
  const connection = parseRedisConnection(process.env.REDIS_URL);
  const client = new Redis({
    ...connection,
    lazyConnect: true,
    enableReadyCheck: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 1200
  });

  client.on("error", (error) => {
    console.warn("[auth-session] redis error", error);
  });

  return client;
}

async function connectRedisClient() {
  if (!isConfigured(process.env.REDIS_URL)) {
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  if (!redisConnectPromise) {
    redisClient = createRedisClient();
    redisConnectPromise = redisClient
      .connect()
      .then(() => redisClient)
      .catch((error) => {
        console.warn("[auth-session] no pudimos conectar Redis para sesiones", error);
        redisClient?.disconnect();
        redisClient = null;
        redisConnectPromise = null;
        throw error;
      });
  }

  return redisConnectPromise;
}

async function resolveStorageMode() {
  if (storageMode !== "unset") {
    return storageMode;
  }

  if (!isConfigured(process.env.REDIS_URL)) {
    if (isProductionRuntime()) {
      throw buildUnavailableError();
    }

    storageMode = "memory";
    return storageMode;
  }

  try {
    const client = await connectRedisClient();
    if (!client) {
      if (isProductionRuntime()) {
        throw buildUnavailableError();
      }

      storageMode = "memory";
      return storageMode;
    }

    storageMode = "redis";
    return storageMode;
  } catch (error) {
    if (isProductionRuntime()) {
      throw buildUnavailableError();
    }

    console.warn("[auth-session] fallback a memoria porque Redis no respondió", error);
    storageMode = "memory";
    return storageMode;
  }
}

async function withSessionStorage<T>(onRedis: (client: Redis) => Promise<T>, onMemory: () => Promise<T>) {
  const mode = await resolveStorageMode();
  if (mode === "memory") {
    return onMemory();
  }

  const client = await connectRedisClient();
  if (!client) {
    if (isProductionRuntime()) {
      throw buildUnavailableError();
    }

    return onMemory();
  }

  try {
    return await onRedis(client);
  } catch (error) {
    if (isProductionRuntime()) {
      throw buildUnavailableError();
    }

    console.warn("[auth-session] fallback a memoria durante una operación Redis", error);
    storageMode = "memory";
    return onMemory();
  }
}

export async function storeAuthSession(session: AuthSessionSummary) {
  if (isExpired(session)) {
    return;
  }

  await withSessionStorage(
    async (client) => {
      const ttlMs = new Date(session.expiresAt).getTime() - Date.now();
      if (ttlMs <= 0) {
        await client.del(sessionKey(session.token));
        return;
      }

      await client.set(sessionKey(session.token), JSON.stringify(session), "PX", ttlMs);
    },
    async () => {
      memorySessions.set(session.token, session);
    }
  );
}

export async function revokeAuthSession(token: string) {
  await withSessionStorage(
    async (client) => {
      await client.del(sessionKey(token));
    },
    async () => {
      memorySessions.delete(token);
    }
  );
}

export async function revokeAuthSessionsForUser(userId: string) {
  await withSessionStorage(
    async (client) => {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await client.scan(cursor, "MATCH", `${SESSION_KEY_PREFIX}*`, "COUNT", "100");
        cursor = nextCursor;
        if (!keys.length) {
          continue;
        }

        const sessions = await client.mget(keys);
        const tokensToRevoke = sessions.flatMap((raw, index) => {
          if (!raw) {
            return [];
          }

          try {
            const parsed = JSON.parse(raw) as AuthSessionSummary;
            return parsed?.user?.id === userId ? [keys[index]] : [];
          } catch {
            return [keys[index]];
          }
        });

        if (tokensToRevoke.length) {
          await client.del(...tokensToRevoke);
        }
      } while (cursor !== "0");
    },
    async () => {
      for (const [token, session] of memorySessions.entries()) {
        if (session.user.id === userId) {
          memorySessions.delete(token);
        }
      }
    }
  );
}

export async function resolveAuthSession(
  authorization?: string | string[],
  options: {
    required?: boolean;
    missingMessage?: string;
    expiredMessage?: string;
  } = {}
) {
  const token = normalizeAuthorization(authorization);
  if (!token) {
    if (options.required) {
      throw new UnauthorizedException(options.missingMessage ?? "Sesión requerida.");
    }
    return null;
  }

  const session = await withSessionStorage<AuthSessionSummary | null>(
    async (client) => {
      const raw = await client.get(sessionKey(token));
      if (!raw) {
        return null;
      }

      try {
        const parsed = JSON.parse(raw) as AuthSessionSummary;
        if (!parsed?.token || !parsed?.expiresAt || !parsed?.user) {
          await client.del(sessionKey(token));
          return null;
        }

        if (isExpired(parsed)) {
          await client.del(sessionKey(token));
          return null;
        }

        return parsed;
      } catch {
        await client.del(sessionKey(token));
        return null;
      }
    },
    async () => {
      const cached = memorySessions.get(token) ?? null;
      if (!cached || isExpired(cached)) {
        if (cached) {
          memorySessions.delete(token);
        }
        return null;
      }

      return cached;
    }
  );

  if (!session) {
    if (options.required) {
      throw new UnauthorizedException(options.expiredMessage ?? "Sesión inválida o expirada.");
    }

    return null;
  }

  return session;
}

export function parseAuthorizationToken(authorization?: string | string[]) {
  return normalizeAuthorization(authorization);
}

export async function closeAuthSessionStore() {
  storageMode = "unset";
  redisConnectPromise = null;
  memorySessions.clear();

  if (!redisClient) {
    return;
  }

  const client = redisClient;
  redisClient = null;

  try {
    await client.quit();
  } catch {
    client.disconnect();
  }
}
