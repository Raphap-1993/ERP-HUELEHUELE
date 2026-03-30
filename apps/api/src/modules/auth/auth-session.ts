import type { AuthSessionSummary } from "@huelegood/shared";
import {
  closeAuthSessionStore,
  parseAuthorizationToken as parseStoredAuthorizationToken,
  resolveAuthSession,
  revokeAuthSession,
  storeAuthSession
} from "../../persistence/auth-session-store";

export async function storeSession(session: AuthSessionSummary) {
  await storeAuthSession(session);
}

export async function revokeSession(token: string) {
  await revokeAuthSession(token);
}

export async function resolveSession(
  authorization?: string | string[],
  options: {
    required?: boolean;
    missingMessage?: string;
    expiredMessage?: string;
  } = {}
) {
  return resolveAuthSession(authorization, options);
}

export function parseAuthorizationToken(authorization?: string | string[]) {
  return parseStoredAuthorizationToken(authorization);
}

export async function closeSessionStore() {
  await closeAuthSessionStore();
}
