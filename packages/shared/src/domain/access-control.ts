export type AccessSurface = "public_web" | "authenticated_portal" | "internal_admin";

export type AccessScopeCode = "own" | "team" | "branch" | "org" | "all";

export type AccessOverrideEffect = "grant" | "revoke";

export interface PermissionCatalogEntry {
  code: string;
  label: string;
  description: string;
  moduleId: string;
  action: string;
  supportedScopes: AccessScopeCode[];
  isSystem: boolean;
  isActive: boolean;
}

export interface ScopeCatalogEntry {
  code: AccessScopeCode;
  label: string;
  description: string;
  precedence: number;
  isSystem: boolean;
}

export interface EffectivePermissionSummary {
  permissionCode: string;
  scopes: AccessScopeCode[];
  sources: string[];
}

export interface RequiredAccessPermission {
  permissionCode: string;
  scope?: AccessScopeCode;
}

export function mergeEffectivePermissions(
  entries: readonly EffectivePermissionSummary[]
): EffectivePermissionSummary[] {
  const merged = new Map<string, EffectivePermissionSummary>();

  for (const entry of entries) {
    const existing = merged.get(entry.permissionCode);

    if (!existing) {
      merged.set(entry.permissionCode, {
        permissionCode: entry.permissionCode,
        scopes: [...entry.scopes],
        sources: [...entry.sources]
      });
      continue;
    }

    for (const scope of entry.scopes) {
      if (!existing.scopes.includes(scope)) {
        existing.scopes.push(scope);
      }
    }

    for (const source of entry.sources) {
      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
      }
    }
  }

  return Array.from(merged.values());
}

export function hasEffectivePermission(
  entries: readonly EffectivePermissionSummary[] | undefined,
  required: RequiredAccessPermission
) {
  const match = entries?.find((entry) => entry.permissionCode === required.permissionCode);

  if (!match) {
    return false;
  }

  if (!required.scope) {
    return true;
  }

  return match.scopes.includes(required.scope);
}
