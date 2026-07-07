import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import {
  type SecurityNavigationUpdateInput,
  type SecurityOverrideCreateInput,
  type SecurityRoleCreateInput,
  type SecurityRoleUpdateInput,
  type SecurityUserRoleAssignmentInput
} from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { SecurityService } from "./security.service";

@Controller("admin/security")
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get()
  @RequirePermissions({ permissionCode: "security.roles.read", scope: "all" })
  posture() {
    return this.securityService.getPosture();
  }

  @Get("catalog")
  @RequirePermissions({ permissionCode: "security.roles.read", scope: "all" })
  catalog() {
    return this.securityService.getCatalog();
  }

  @Get("roles")
  @RequirePermissions({ permissionCode: "security.roles.read", scope: "all" })
  listRoles() {
    return this.securityService.listRoles();
  }

  @Post("roles")
  @RequirePermissions({ permissionCode: "security.roles.manage", scope: "all" })
  createRole(@Body() body: SecurityRoleCreateInput) {
    return this.securityService.createRole(body);
  }

  @Patch("roles/:id")
  @RequirePermissions({ permissionCode: "security.roles.manage", scope: "all" })
  updateRole(@Param("id") id: string, @Body() body: SecurityRoleUpdateInput) {
    return this.securityService.updateRole(id, body);
  }

  @Post("users/:id/roles")
  @RequirePermissions({ permissionCode: "security.users.manage", scope: "all" })
  assignUserRoles(@Param("id") id: string, @Body() body: SecurityUserRoleAssignmentInput) {
    return this.securityService.assignUserRoles(id, body);
  }

  @Post("users/:id/overrides")
  @RequirePermissions({ permissionCode: "security.overrides.manage", scope: "all" })
  createOverride(@Param("id") id: string, @Body() body: SecurityOverrideCreateInput) {
    return this.securityService.createOverride(id, body);
  }

  @Patch("navigation")
  @RequirePermissions({ permissionCode: "security.roles.manage", scope: "all" })
  updateNavigation(@Body() body: SecurityNavigationUpdateInput) {
    return this.securityService.updateNavigation(body);
  }
}
