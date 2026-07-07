import { Injectable } from "@nestjs/common";
import { AccessOverrideStatus } from "@prisma/client";
import {
  hasEffectivePermission,
  mergeEffectivePermissions,
  type AccessScopeCode,
  type EffectivePermissionSummary,
  type RequiredAccessPermission
} from "@huelegood/shared";
import { isConfigured } from "../../common/env";
import { PrismaService } from "../../prisma/prisma.service";
import type { AccessControlGrantRecord, AccessControlOverrideRecord } from "./access-control.types";

const scopeOrder: AccessScopeCode[] = ["own", "team", "branch", "org", "all"];

function sortScopes(scopes: Iterable<AccessScopeCode>) {
  return [...scopes].sort((left, right) => scopeOrder.indexOf(left) - scopeOrder.indexOf(right));
}

function expandScope(scopeCode: AccessScopeCode) {
  const index = scopeOrder.indexOf(scopeCode);
  if (index === -1) {
    return [scopeCode];
  }

  return scopeOrder.slice(0, index + 1);
}

function databaseAuthEnabled() {
  return isConfigured(process.env.DATABASE_URL);
}

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  protected getNow() {
    return new Date();
  }

  async resolveEffectivePermissions(userId: string): Promise<EffectivePermissionSummary[]> {
    if (!databaseAuthEnabled()) {
      return [];
    }

    const now = this.getNow();
    const [roleGrants, overrides] = await Promise.all([
      this.loadRoleGrantRecords(userId),
      this.loadOverrideRecords(userId, now)
    ]);

    return this.buildEffectivePermissions(roleGrants, overrides, now);
  }

  async can(userId: string, permissionCode: string, requiredScope?: AccessScopeCode) {
    const effectivePermissions = await this.resolveEffectivePermissions(userId);

    return hasEffectivePermission(effectivePermissions, {
      permissionCode,
      scope: requiredScope
    } satisfies RequiredAccessPermission);
  }

  protected async loadRoleGrantRecords(userId: string): Promise<AccessControlGrantRecord[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: {
          isActive: true
        }
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    return userRoles.flatMap((userRole) =>
      userRole.role.permissions.flatMap((grant) => {
        if (!grant.permission.isActive) {
          return [];
        }

        return [
          {
            permissionCode: grant.permission.code,
            scopeCode: grant.scopeCode as AccessScopeCode,
            source: `role:${userRole.role.code}`
          }
        ] satisfies AccessControlGrantRecord[];
      })
    );
  }

  protected async loadOverrideRecords(userId: string, now: Date): Promise<AccessControlOverrideRecord[]> {
    const overrides = await this.prisma.userPermissionOverride.findMany({
      where: {
        userId,
        status: {
          in: [AccessOverrideStatus.active, AccessOverrideStatus.scheduled]
        },
        startsAt: {
          lte: now
        },
        expiresAt: {
          gt: now
        },
        permission: {
          isActive: true
        }
      },
      include: {
        permission: true
      }
    });

    return overrides.map((override) => ({
      permissionCode: override.permission.code,
      scopeCode: override.scopeCode as AccessScopeCode,
      effect: override.effect,
      startsAt: override.startsAt.toISOString(),
      expiresAt: override.expiresAt.toISOString(),
      source: `override:${override.effect}`
    }));
  }

  protected buildEffectivePermissions(
    grants: readonly AccessControlGrantRecord[],
    overrides: readonly AccessControlOverrideRecord[],
    now: Date
  ) {
    const merged = new Map<string, { scopes: Set<AccessScopeCode>; sources: Set<string> }>();

    for (const grant of grants) {
      const entry = merged.get(grant.permissionCode) ?? {
        scopes: new Set<AccessScopeCode>(),
        sources: new Set<string>()
      };
      for (const scope of expandScope(grant.scopeCode)) {
        entry.scopes.add(scope);
      }
      entry.sources.add(grant.source);
      merged.set(grant.permissionCode, entry);
    }

    for (const override of overrides) {
      if (new Date(override.startsAt).getTime() > now.getTime() || new Date(override.expiresAt).getTime() <= now.getTime()) {
        continue;
      }

      const entry = merged.get(override.permissionCode) ?? {
        scopes: new Set<AccessScopeCode>(),
        sources: new Set<string>()
      };
      const overrideScopes = expandScope(override.scopeCode);

      if (override.effect === "grant") {
        for (const scope of overrideScopes) {
          entry.scopes.add(scope);
        }
        entry.sources.add(override.source);
        merged.set(override.permissionCode, entry);
        continue;
      }

      for (const scope of overrideScopes) {
        entry.scopes.delete(scope);
      }
      if (entry.scopes.size === 0) {
        merged.delete(override.permissionCode);
        continue;
      }

      merged.set(override.permissionCode, entry);
    }

    return mergeEffectivePermissions(
      Array.from(merged.entries()).map(([permissionCode, value]) => ({
        permissionCode,
        scopes: sortScopes(value.scopes),
        sources: [...value.sources]
      }))
    );
  }
}
