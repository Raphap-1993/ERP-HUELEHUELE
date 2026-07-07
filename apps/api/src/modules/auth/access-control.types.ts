import type { AccessOverrideEffect, AccessScopeCode } from "@huelegood/shared";

export interface AccessControlGrantRecord {
  permissionCode: string;
  scopeCode: AccessScopeCode;
  source: string;
}

export interface AccessControlOverrideRecord extends AccessControlGrantRecord {
  effect: AccessOverrideEffect;
  startsAt: string;
  expiresAt: string;
}
