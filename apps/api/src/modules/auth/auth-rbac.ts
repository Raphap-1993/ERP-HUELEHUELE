import { SetMetadata } from "@nestjs/common";
import { RoleCode, type AccessScopeCode } from "@huelegood/shared";

export const AUTH_ROLES_KEY = "huelegood:auth:roles";
export const AUTH_PERMISSIONS_KEY = "huelegood:auth:permissions";

export interface RequiredPermission {
  permissionCode: string;
  scope?: AccessScopeCode;
}

export const RequireRoles = (...roles: RoleCode[]) => SetMetadata(AUTH_ROLES_KEY, roles);
export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(AUTH_PERMISSIONS_KEY, permissions);
