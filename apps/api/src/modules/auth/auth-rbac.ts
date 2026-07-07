import { SetMetadata } from "@nestjs/common";
import { RoleCode } from "@huelegood/shared";

export const AUTH_ROLES_KEY = "huelegood:auth:roles";

export const RequireRoles = (...roles: RoleCode[]) => SetMetadata(AUTH_ROLES_KEY, roles);
