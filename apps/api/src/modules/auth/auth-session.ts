import { UnauthorizedException } from "@nestjs/common";
import type { AuthSessionSummary } from "@huelegood/shared";

const sessions = new Map<string, AuthSessionSummary>();

function parseAuthorization(authorization?: string | string[]) {
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

function isExpired(session: AuthSessionSummary) {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

export function storeSession(session: AuthSessionSummary) {
  sessions.set(session.token, session);
}

export function revokeSession(token: string) {
  sessions.delete(token);
}

export function resolveSession(
  authorization?: string | string[],
  options: {
    required?: boolean;
    missingMessage?: string;
    expiredMessage?: string;
  } = {}
) {
  const token = parseAuthorization(authorization);
  if (!token) {
    if (options.required) {
      throw new UnauthorizedException(options.missingMessage ?? "Sesión requerida.");
    }
    return null;
  }

  const session = sessions.get(token);
  if (!session || isExpired(session)) {
    if (session) {
      sessions.delete(token);
    }
    if (options.required) {
      throw new UnauthorizedException(options.expiredMessage ?? "Sesión inválida o expirada.");
    }
    return null;
  }

  return session;
}

export function parseAuthorizationToken(authorization?: string | string[]) {
  return parseAuthorization(authorization);
}
