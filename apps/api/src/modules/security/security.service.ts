import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  AccessOverrideStatus,
  Prisma,
  type AccessModule,
  type AccessNavigationGroup,
  type AccessNavigationItem,
  type AccessScope,
  type Permission,
  type Role
} from "@prisma/client";
import {
  type SecurityCatalogSummary,
  type SecurityNavigationItemSummary,
  type SecurityNavigationItemUpdateInput,
  type SecurityNavigationUpdateInput,
  type SecurityOverrideCreateInput,
  type SecurityOverrideSummary,
  type SecurityPermissionSummary,
  type SecurityRoleCreateInput,
  type SecurityRoleSummary,
  type SecurityRoleUpdateInput,
  type SecurityScopeSummary,
  type SecurityUserRoleAssignmentInput
} from "@huelegood/shared";
import { isConfigured } from "../../common/env";
import { actionResponse, wrapResponse } from "../../common/response";
import { getSecurityHeaders, getSecurityRateLimits, getSecurityTelemetry } from "../../common/security";
import { PrismaService } from "../../prisma/prisma.service";
import { revokeSessionsForUser } from "../auth/auth-session";
import { AuditService } from "../audit/audit.service";

type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: {
    permissions: {
      include: {
        permission: true;
      };
    };
  };
}>;

function nowIso() {
  return new Date().toISOString();
}

function parseSupportedScopes(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function normalizeRoleCode(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");

  if (!normalized) {
    throw new BadRequestException("El código del rol es obligatorio.");
  }

  if (!/^[a-z0-9_:-]+$/.test(normalized)) {
    throw new BadRequestException("El código del rol solo puede usar minúsculas, números, guiones, dos puntos o underscore.");
  }

  return normalized;
}

function normalizeOptionalText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function mapPermission(permission: Permission): SecurityPermissionSummary {
  return {
    code: permission.code,
    label: permission.name,
    description: permission.description ?? undefined,
    moduleId: permission.module,
    action: permission.action,
    supportedScopes: parseSupportedScopes(permission.supportedScopes),
    isSystem: permission.isSystem,
    isActive: permission.isActive
  };
}

function mapScope(scope: AccessScope): SecurityScopeSummary {
  return {
    code: scope.code,
    label: scope.label,
    description: scope.description ?? undefined,
    precedence: scope.precedence,
    isSystem: scope.isSystem,
    isActive: scope.isActive
  };
}

function mapModule(module: AccessModule) {
  return {
    code: module.code,
    label: module.label,
    description: module.description ?? undefined,
    surface: module.surface,
    route: module.route,
    navGroup: module.navGroup,
    isSystem: module.isSystem,
    isActive: module.isActive
  };
}

function mapNavigationGroup(group: AccessNavigationGroup) {
  return {
    code: group.code,
    label: group.label,
    surface: group.surface,
    sortOrder: group.sortOrder,
    isSystem: group.isSystem,
    isActive: group.isActive
  };
}

function mapNavigationItem(item: AccessNavigationItem & { navigationGroup?: AccessNavigationGroup | null }): SecurityNavigationItemSummary {
  return {
    moduleCode: item.moduleCode,
    navigationGroupCode: item.navigationGroup?.code,
    labelOverride: item.labelOverride ?? undefined,
    icon: item.icon ?? undefined,
    sortOrder: item.sortOrder,
    isVisible: item.isVisible
  };
}

function mapRole(role: RoleWithPermissions): SecurityRoleSummary {
  const permissionGrants = role.permissions
    .map((grant) => ({
      permissionCode: grant.permission.code,
      scopeCode: grant.scopeCode
    }))
    .sort((left, right) =>
      left.permissionCode === right.permissionCode
        ? left.scopeCode.localeCompare(right.scopeCode)
        : left.permissionCode.localeCompare(right.permissionCode)
    );

  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description ?? undefined,
    surface: role.surface,
    isSystem: role.isSystem,
    isAssignable: role.isAssignable,
    isActive: role.isActive,
    permissionGrants
  };
}

@Injectable()
export class SecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  getPosture() {
    const telemetry = getSecurityTelemetry();
    const auditOverview = this.auditService.getOverview().data;
    const summary = {
      service: "huelegood-api",
      cors: {
        enabled: true,
        credentials: true,
        originMode: "reflective",
        exposedHeaders: ["X-Request-Id", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]
      },
      trustProxy: true,
      requestIdHeader: "X-Request-Id",
      headers: getSecurityHeaders(),
      rateLimits: getSecurityRateLimits(),
      authPolicy: {
        sessionTtlHours: 24 * 7,
        passwordMinLength: 6,
        demoAccounts: false,
        bearerTokens: true
      },
      auditPolicy: {
        persistence: isConfigured(process.env.DATABASE_URL) ? "prisma" : "memory",
        lastAuditAt: auditOverview.logs[0]?.occurredAt,
        lastActionAt: auditOverview.actions[0]?.occurredAt
      },
      telemetry: {
        totalRequests: telemetry.totalRequests,
        blockedRequests: telemetry.blockedRequests,
        lastRequestAt: telemetry.lastRequestAt,
        lastBlockedAt: telemetry.lastBlockedAt
      },
      updatedAt: new Date().toISOString()
    };

    return summary;
  }

  async getCatalog() {
    const [permissions, scopes, modules, navigationGroups, navigationItems] = await Promise.all([
      this.prisma.permission.findMany({
        orderBy: [{ module: "asc" }, { code: "asc" }]
      }),
      this.prisma.accessScope.findMany({
        orderBy: { precedence: "asc" }
      }),
      this.prisma.accessModule.findMany({
        orderBy: [{ surface: "asc" }, { navGroup: "asc" }, { code: "asc" }]
      }),
      this.prisma.accessNavigationGroup.findMany({
        orderBy: [{ surface: "asc" }, { sortOrder: "asc" }, { code: "asc" }]
      }),
      this.prisma.accessNavigationItem.findMany({
        include: {
          navigationGroup: true
        },
        orderBy: [{ sortOrder: "asc" }, { moduleCode: "asc" }]
      })
    ]);

    const summary: SecurityCatalogSummary = {
      permissions: permissions.map(mapPermission),
      scopes: scopes.map(mapScope),
      modules: modules.map(mapModule),
      navigationGroups: navigationGroups.map(mapNavigationGroup),
      navigationItems: navigationItems.map(mapNavigationItem)
    };

    return wrapResponse(summary, {
      generatedAt: nowIso()
    });
  }

  async listRoles() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: [{ isSystem: "desc" }, { code: "asc" }]
    });

    return wrapResponse(roles.map(mapRole), {
      total: roles.length
    });
  }

  async createRole(input: SecurityRoleCreateInput) {
    const code = normalizeRoleCode(input.code);
    const permissionGrants = await this.resolveValidatedPermissionGrants(input.permissionGrants);

    try {
      const role = await this.prisma.role.create({
        data: {
          code,
          name: input.name.trim(),
          description: normalizeOptionalText(input.description),
          surface: input.surface,
          isSystem: false,
          isAssignable: input.isAssignable ?? true,
          isActive: input.isActive ?? true,
          permissions: {
            create: permissionGrants.map((grant) => ({
              permissionId: grant.permissionId,
              scopeCode: grant.scopeCode
            }))
          }
        },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });

      this.auditService.recordAdminAction({
        actionType: "security.role.created",
        targetType: "role",
        targetId: role.id,
        summary: `Se creó el rol ${role.code}.`,
        actorName: "security-admin",
        metadata: {
          code: role.code,
          surface: role.surface,
          grants: permissionGrants.map((grant) => ({
            permissionCode: grant.permissionCode,
            scopeCode: grant.scopeCode
          }))
        }
      });

      return wrapResponse(mapRole(role), {
        created: true
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException(`Ya existe un rol con código ${code}.`);
      }

      throw error;
    }
  }

  async updateRole(id: string, input: SecurityRoleUpdateInput) {
    const role = await this.prisma.role.findUnique({
      where: { id: id.trim() },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      throw new NotFoundException(`No encontramos un rol con id ${id}.`);
    }

    if (role.isSystem) {
      if (input.permissionGrants) {
        throw new BadRequestException("Los system roles no pueden cambiar grants desde UI.");
      }

      if (input.surface && input.surface !== role.surface) {
        throw new BadRequestException("Los system roles no pueden cambiar surface.");
      }

      if (input.name && input.name.trim() !== role.name) {
        throw new BadRequestException("Los system roles no pueden cambiar nombre.");
      }
    }

    const permissionGrants = input.permissionGrants
      ? await this.resolveValidatedPermissionGrants(input.permissionGrants)
      : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id: role.id },
        data: {
          name: input.name?.trim() || undefined,
          description: input.description !== undefined ? normalizeOptionalText(input.description) : undefined,
          surface: role.isSystem ? undefined : input.surface,
          isAssignable: input.isAssignable,
          isActive: input.isActive
        }
      });

      if (permissionGrants && !role.isSystem) {
        await tx.rolePermission.deleteMany({
          where: {
            roleId: role.id
          }
        });

        if (permissionGrants.length) {
          await tx.rolePermission.createMany({
            data: permissionGrants.map((grant) => ({
              roleId: role.id,
              permissionId: grant.permissionId,
              scopeCode: grant.scopeCode
            }))
          });
        }
      }

      return tx.role.findUniqueOrThrow({
        where: { id: role.id },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
    });

    this.auditService.recordAdminAction({
      actionType: "security.role.updated",
      targetType: "role",
      targetId: updated.id,
      summary: `Se actualizó el rol ${updated.code}.`,
      actorName: "security-admin",
      metadata: {
        roleId: updated.id,
        code: updated.code
      }
    });

    return wrapResponse(mapRole(updated), {
      updated: true
    });
  }

  async assignUserRoles(userId: string, input: SecurityUserRoleAssignmentInput) {
    const normalizedRoleIds = Array.from(new Set(input.roleIds.map((roleId) => roleId.trim()).filter(Boolean)));
    if (!normalizedRoleIds.length) {
      throw new BadRequestException("Debes asignar al menos un rol.");
    }

    const [user, roles] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId.trim() },
        select: { id: true }
      }),
      this.prisma.role.findMany({
        where: {
          id: {
            in: normalizedRoleIds
          }
        }
      })
    ]);

    if (!user) {
      throw new NotFoundException(`No encontramos un usuario con id ${userId}.`);
    }

    if (roles.length !== normalizedRoleIds.length) {
      throw new NotFoundException("Uno o más roles no existen.");
    }

    const nonAssignableRole = roles.find((role) => !role.isAssignable || !role.isActive);
    if (nonAssignableRole) {
      throw new BadRequestException(`El rol ${nonAssignableRole.code} no está disponible para asignación.`);
    }

    const primaryRoleId = input.primaryRoleId?.trim() || normalizedRoleIds[0];
    if (!normalizedRoleIds.includes(primaryRoleId)) {
      throw new BadRequestException("El rol principal debe pertenecer a la lista asignada.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: {
          userId: user.id
        }
      });

      await tx.userRole.createMany({
        data: normalizedRoleIds.map((roleId) => ({
          userId: user.id,
          roleId,
          isPrimary: roleId === primaryRoleId
        }))
      });
    });

    await revokeSessionsForUser(user.id);
    this.auditService.recordAdminAction({
      actionType: "security.user_roles.updated",
      targetType: "user",
      targetId: user.id,
      summary: `Se actualizaron los roles del usuario ${user.id}.`,
      actorName: "security-admin",
      metadata: {
        roleIds: normalizedRoleIds,
        primaryRoleId
      }
    });

    return wrapResponse(
      {
        userId: user.id,
        roleIds: normalizedRoleIds,
        primaryRoleId
      },
      {
        updated: true
      }
    );
  }

  async createOverride(userId: string, input: SecurityOverrideCreateInput) {
    const [targetUser, approverUser, creatorUser] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId.trim() }, select: { id: true } }),
      this.prisma.user.findUnique({ where: { id: input.approvedByUserId.trim() }, select: { id: true } }),
      this.prisma.user.findUnique({ where: { id: input.createdByUserId.trim() }, select: { id: true } })
    ]);

    if (!targetUser) {
      throw new NotFoundException(`No encontramos un usuario con id ${userId}.`);
    }

    if (!approverUser || !creatorUser) {
      throw new NotFoundException("El aprobador y el creador del override deben existir.");
    }

    const permission = await this.prisma.permission.findUnique({
      where: {
        code: input.permissionCode.trim()
      }
    });

    if (!permission || !permission.isActive) {
      throw new NotFoundException(`No encontramos el permiso ${input.permissionCode}.`);
    }

    const supportedScopes = parseSupportedScopes(permission.supportedScopes);
    if (!supportedScopes.includes(input.scopeCode)) {
      throw new BadRequestException(`El permiso ${permission.code} no soporta el scope ${input.scopeCode}.`);
    }

    const startsAt = new Date(input.startsAt);
    const expiresAt = new Date(input.expiresAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException("Las fechas del override no son válidas.");
    }

    if (expiresAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException("El override debe expirar después de empezar.");
    }

    const status = startsAt.getTime() > Date.now() ? AccessOverrideStatus.scheduled : AccessOverrideStatus.active;
    const created = await this.prisma.userPermissionOverride.create({
      data: {
        id: randomUUID(),
        userId: targetUser.id,
        permissionId: permission.id,
        scopeCode: input.scopeCode,
        effect: input.effect,
        status,
        reason: input.reason.trim(),
        approvedByUserId: approverUser.id,
        createdByUserId: creatorUser.id,
        startsAt,
        expiresAt
      },
      include: {
        permission: true
      }
    });

    if (status === AccessOverrideStatus.active) {
      await revokeSessionsForUser(targetUser.id);
    }

    this.auditService.recordAdminAction({
      actionType: "security.override.created",
      targetType: "user_permission_override",
      targetId: created.id,
      summary: `Se creó un override ${created.effect} para ${permission.code}.`,
      actorUserId: creatorUser.id,
      actorName: "security-admin",
      metadata: {
        userId: targetUser.id,
        permissionCode: permission.code,
        scopeCode: created.scopeCode,
        status: created.status
      }
    });

    return wrapResponse(this.mapOverride(created), {
      created: true
    });
  }

  async updateNavigation(input: SecurityNavigationUpdateInput) {
    const items = input.items ?? [];
    if (!items.length) {
      return wrapResponse<SecurityNavigationItemSummary[]>([], {
        updated: 0
      });
    }

    const moduleCodes = Array.from(new Set(items.map((item) => item.moduleCode.trim())));
    const groupCodes = Array.from(new Set(items.map((item) => item.navigationGroupCode.trim())));
    const [modules, groups] = await Promise.all([
      this.prisma.accessModule.findMany({
        where: {
          code: {
            in: moduleCodes
          }
        }
      }),
      this.prisma.accessNavigationGroup.findMany({
        where: {
          code: {
            in: groupCodes
          }
        }
      })
    ]);

    if (modules.length !== moduleCodes.length) {
      throw new NotFoundException("Uno o más módulos de navegación no existen.");
    }

    if (groups.length !== groupCodes.length) {
      throw new NotFoundException("Uno o más grupos de navegación no existen.");
    }

    const moduleByCode = new Map(modules.map((module) => [module.code, module]));
    const groupByCode = new Map(groups.map((group) => [group.code, group]));
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        const normalized = this.resolveNavigationInput(item, moduleByCode, groupByCode);
        const updated = await this.prisma.accessNavigationItem.upsert({
          where: {
            moduleCode_navigationGroupId: {
              moduleCode: normalized.module.code,
              navigationGroupId: normalized.group.id
            }
          },
          update: {
            labelOverride: normalized.labelOverride,
            icon: normalized.icon,
            sortOrder: normalized.sortOrder,
            isVisible: normalized.isVisible
          },
          create: {
            moduleCode: normalized.module.code,
            navigationGroupId: normalized.group.id,
            labelOverride: normalized.labelOverride,
            icon: normalized.icon,
            sortOrder: normalized.sortOrder,
            isVisible: normalized.isVisible
          },
          include: {
            navigationGroup: true
          }
        });

        return mapNavigationItem(updated);
      })
    );

    this.auditService.recordAdminAction({
      actionType: "security.navigation.updated",
      targetType: "navigation",
      targetId: "access_navigation_items",
      summary: `Se actualizaron ${updatedItems.length} items de navegación de seguridad.`,
      actorName: "security-admin",
      metadata: {
        updatedItems: updatedItems.map((item) => ({
          moduleCode: item.moduleCode,
          navigationGroupCode: item.navigationGroupCode ?? null,
          labelOverride: item.labelOverride ?? null,
          icon: item.icon ?? null,
          sortOrder: item.sortOrder,
          isVisible: item.isVisible
        }))
      }
    });

    return wrapResponse(updatedItems, {
      updated: updatedItems.length
    });
  }

  private mapOverride(
    override: Prisma.UserPermissionOverrideGetPayload<{
      include: {
        permission: true;
      };
    }>
  ): SecurityOverrideSummary {
    return {
      id: override.id,
      userId: override.userId,
      permissionCode: override.permission.code,
      scopeCode: override.scopeCode,
      effect: override.effect,
      expiresAt: override.expiresAt.toISOString(),
      status: override.status,
      reason: override.reason,
      approvedByUserId: override.approvedByUserId,
      createdByUserId: override.createdByUserId,
      startsAt: override.startsAt.toISOString()
    };
  }

  private async resolveValidatedPermissionGrants(
    grants: SecurityRoleCreateInput["permissionGrants"]
  ) {
    const normalizedGrants = Array.from(
      new Map(
        (grants ?? []).map((grant) => [
          `${grant.permissionCode.trim()}:${grant.scopeCode.trim()}`,
          {
            permissionCode: grant.permissionCode.trim(),
            scopeCode: grant.scopeCode.trim()
          }
        ])
      ).values()
    );

    if (!normalizedGrants.length) {
      return [];
    }

    const permissions = await this.prisma.permission.findMany({
      where: {
        code: {
          in: normalizedGrants.map((grant) => grant.permissionCode)
        }
      }
    });
    const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission]));

    for (const grant of normalizedGrants) {
      const permission = permissionByCode.get(grant.permissionCode);
      if (!permission || !permission.isActive) {
        throw new NotFoundException(`No encontramos el permiso ${grant.permissionCode}.`);
      }

      const supportedScopes = parseSupportedScopes(permission.supportedScopes);
      if (!supportedScopes.includes(grant.scopeCode)) {
        throw new BadRequestException(`El permiso ${permission.code} no soporta el scope ${grant.scopeCode}.`);
      }
    }

    return normalizedGrants.map((grant) => ({
      permissionCode: grant.permissionCode,
      scopeCode: grant.scopeCode,
      permissionId: permissionByCode.get(grant.permissionCode)!.id
    }));
  }

  private resolveNavigationInput(
    item: SecurityNavigationItemUpdateInput,
    moduleByCode: Map<string, AccessModule>,
    groupByCode: Map<string, AccessNavigationGroup>
  ) {
    const module = moduleByCode.get(item.moduleCode.trim());
    const group = groupByCode.get(item.navigationGroupCode.trim());
    if (!module || !group) {
      throw new NotFoundException("No encontramos el módulo o grupo de navegación solicitado.");
    }

    if (module.surface !== group.surface) {
      throw new BadRequestException(`El módulo ${module.code} no pertenece a la surface del grupo ${group.code}.`);
    }

    return {
      module,
      group,
      labelOverride: normalizeOptionalText(item.labelOverride),
      icon: normalizeOptionalText(item.icon),
      sortOrder: item.sortOrder ?? 0,
      isVisible: item.isVisible ?? true
    };
  }
}
