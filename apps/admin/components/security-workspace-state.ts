import { RoleCode, hasEffectivePermission, type AuthUserSummary } from "@huelegood/shared";

export type SecurityWorkspaceTab = "roles" | "users" | "overrides" | "navigation" | "catalog";

export type SecurityWorkspaceCapabilities = {
  isSuperAdmin: boolean;
  canReadRoles: boolean;
  canManageRoles: boolean;
  canManageUsers: boolean;
  canManageOverrides: boolean;
};

export function getSecurityWorkspaceCapabilities(
  user?: Pick<AuthUserSummary, "roles" | "effectivePermissions"> | null
): SecurityWorkspaceCapabilities {
  const roleCodes = user?.roles.map((role) => role.code) ?? [];
  const effectivePermissions = user?.effectivePermissions;
  const isSuperAdmin = roleCodes.includes(RoleCode.SuperAdmin);
  const canReadRoles = isSuperAdmin || hasEffectivePermission(effectivePermissions, { permissionCode: "security.roles.read", scope: "all" });
  const canManageRoles = isSuperAdmin || hasEffectivePermission(effectivePermissions, { permissionCode: "security.roles.manage", scope: "all" });
  const canManageUsers = isSuperAdmin || hasEffectivePermission(effectivePermissions, { permissionCode: "security.users.manage", scope: "all" });
  const canManageOverrides =
    isSuperAdmin || hasEffectivePermission(effectivePermissions, { permissionCode: "security.overrides.manage", scope: "all" });

  return {
    isSuperAdmin,
    canReadRoles,
    canManageRoles,
    canManageUsers,
    canManageOverrides
  };
}

export function getVisibleSecurityTabs(capabilities: SecurityWorkspaceCapabilities): SecurityWorkspaceTab[] {
  const tabs: SecurityWorkspaceTab[] = [];

  if (capabilities.canReadRoles || capabilities.canManageRoles) {
    tabs.push("roles");
  }

  if (capabilities.canManageUsers) {
    tabs.push("users");
  }

  if (capabilities.canManageOverrides) {
    tabs.push("overrides");
  }

  if (capabilities.canReadRoles || capabilities.canManageRoles) {
    tabs.push("navigation", "catalog");
  }

  return tabs;
}
