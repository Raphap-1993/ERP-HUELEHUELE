import { randomUUID } from "node:crypto";

type RequestLike = {
  ip?: string;
  originalUrl?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  setHeader(name: string, value: string): unknown;
  status(code: number): ResponseLike;
  json(body: unknown): unknown;
};

type NextLike = () => void;

export interface SecurityHeaderRule {
  name: string;
  value: string;
  purpose: string;
}

export interface SecurityRateLimitRule {
  profile: string;
  routePrefix: string;
  limit: number;
  windowMs: number;
  totalRequests: number;
  blockedRequests: number;
  lastSeenAt?: string;
}

export interface SecurityTelemetrySnapshot {
  totalRequests: number;
  blockedRequests: number;
  lastRequestAt?: string;
  lastBlockedAt?: string;
  profiles: SecurityRateLimitRule[];
}

interface RateLimitProfileState {
  profile: string;
  routePrefix: string;
  limit: number;
  windowMs: number;
  totalRequests: number;
  blockedRequests: number;
  lastSeenAt?: string;
}

interface WindowBucket {
  count: number;
  resetAt: number;
}

const securityHeaders: SecurityHeaderRule[] = [
  {
    name: "X-Content-Type-Options",
    value: "nosniff",
    purpose: "Evita interpretaciones de contenido no deseado."
  },
  {
    name: "X-Frame-Options",
    value: "DENY",
    purpose: "Reduce la posibilidad de clickjacking."
  },
  {
    name: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
    purpose: "Limita la fuga de origen en los referrers."
  },
  {
    name: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
    purpose: "Deshabilita permisos de navegador no usados."
  },
  {
    name: "Cross-Origin-Opener-Policy",
    value: "same-origin",
    purpose: "Aísla el contexto de navegación."
  },
  {
    name: "Cross-Origin-Resource-Policy",
    value: "same-site",
    purpose: "Restringe el uso cruzado de recursos."
  }
];

const rateLimitProfiles: RateLimitProfileState[] = [
  {
    profile: "auth",
    routePrefix: "/auth",
    limit: 20,
    windowMs: 60_000,
    totalRequests: 0,
    blockedRequests: 0
  },
  {
    profile: "payments",
    routePrefix: "/checkout",
    limit: 45,
    windowMs: 60_000,
    totalRequests: 0,
    blockedRequests: 0
  },
  {
    profile: "admin",
    routePrefix: "/admin",
    limit: 180,
    windowMs: 60_000,
    totalRequests: 0,
    blockedRequests: 0
  },
  {
    profile: "public",
    routePrefix: "/",
    limit: 240,
    windowMs: 60_000,
    totalRequests: 0,
    blockedRequests: 0
  }
];

const rateLimitBuckets = new Map<string, WindowBucket>();

const telemetry = {
  totalRequests: 0,
  blockedRequests: 0,
  lastRequestAt: undefined as string | undefined,
  lastBlockedAt: undefined as string | undefined
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getPath(request: RequestLike) {
  const raw = request.originalUrl ?? request.url ?? "/";
  return raw.split("?")[0] ?? "/";
}

function isSensitivePath(path: string) {
  return path.startsWith("/api/v1/auth") || path.startsWith("/api/v1/admin") || path.startsWith("/api/v1/health");
}

function resolveProfile(path: string) {
  if (path.startsWith("/api/v1/auth")) {
    return rateLimitProfiles[0];
  }

  if (path.startsWith("/api/v1/store/checkout") || path.startsWith("/api/v1/admin/payments/manual-requests")) {
    return rateLimitProfiles[1];
  }

  if (path.startsWith("/api/v1/admin")) {
    return rateLimitProfiles[2];
  }

  return rateLimitProfiles[3];
}

function getClientKey(request: RequestLike, profile: RateLimitProfileState) {
  const ip = normalizeHeaderValue(request.headers?.["x-forwarded-for"]) ?? request.ip ?? "unknown";
  return `${ip}:${profile.profile}`;
}

export function createSecurityHeadersMiddleware() {
  return (request: RequestLike, response: ResponseLike, next: NextLike) => {
    const requestId = normalizeHeaderValue(request.headers?.["x-request-id"]) ?? randomUUID();

    for (const header of securityHeaders) {
      response.setHeader(header.name, header.value);
    }

    response.setHeader("X-Request-Id", requestId);

    if (isSensitivePath(getPath(request))) {
      response.setHeader("Cache-Control", "no-store, max-age=0");
      response.setHeader("Pragma", "no-cache");
    }

    next();
  };
}

export function createRateLimitMiddleware() {
  return (request: RequestLike, response: ResponseLike, next: NextLike) => {
    const path = getPath(request);

    if (path.startsWith("/api/v1/health")) {
      telemetry.totalRequests += 1;
      telemetry.lastRequestAt = nowIso();
      next();
      return;
    }

    const profile = resolveProfile(path);
    const key = getClientKey(request, profile);
    const now = Date.now();
    const currentWindow = rateLimitBuckets.get(key);

    if (!currentWindow || currentWindow.resetAt <= now) {
      rateLimitBuckets.set(key, {
        count: 1,
        resetAt: now + profile.windowMs
      });
    } else {
      currentWindow.count += 1;
      rateLimitBuckets.set(key, currentWindow);
    }

    const bucket = rateLimitBuckets.get(key)!;
    const remaining = Math.max(0, profile.limit - bucket.count);

    profile.totalRequests += 1;
    profile.lastSeenAt = nowIso();
    telemetry.totalRequests += 1;
    telemetry.lastRequestAt = profile.lastSeenAt;

    response.setHeader("X-RateLimit-Limit", String(profile.limit));
    response.setHeader("X-RateLimit-Remaining", String(remaining));
    response.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > profile.limit) {
      profile.blockedRequests += 1;
      telemetry.blockedRequests += 1;
      telemetry.lastBlockedAt = profile.lastSeenAt;
      response.status(429).json({
        statusCode: 429,
        message: "Demasiadas solicitudes. Intenta nuevamente en unos segundos.",
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
      });
      return;
    }

    next();
  };
}

export function getSecurityTelemetry(): SecurityTelemetrySnapshot {
  return {
    totalRequests: telemetry.totalRequests,
    blockedRequests: telemetry.blockedRequests,
    lastRequestAt: telemetry.lastRequestAt,
    lastBlockedAt: telemetry.lastBlockedAt,
    profiles: rateLimitProfiles.map((profile) => ({
      profile: profile.profile,
      routePrefix: profile.routePrefix,
      limit: profile.limit,
      windowMs: profile.windowMs,
      totalRequests: profile.totalRequests,
      blockedRequests: profile.blockedRequests,
      lastSeenAt: profile.lastSeenAt
    }))
  };
}

export function getSecurityHeaders() {
  return securityHeaders.map((header) => ({ ...header }));
}

export function getSecurityRateLimits() {
  return rateLimitProfiles.map((profile) => ({
    profile: profile.profile,
    routePrefix: profile.routePrefix,
    limit: profile.limit,
    windowMs: profile.windowMs,
    totalRequests: profile.totalRequests,
    blockedRequests: profile.blockedRequests,
    lastSeenAt: profile.lastSeenAt
  }));
}
