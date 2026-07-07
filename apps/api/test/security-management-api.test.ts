import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  RoleCode,
  type SecurityRoleCreateInput,
  type AuthSessionSummary
} from "@huelegood/shared";
import { AccessControlService } from "../src/modules/auth/access-control.service";
import { RolesGuard } from "../src/modules/auth/roles.guard";
import { RequirePermissions, RequireRoles } from "../src/modules/auth/auth-rbac";
import { SecurityService } from "../src/modules/security/security.service";

class AuditStub {
  getOverview() {
    return {
      data: {
        logs: [],
        actions: []
      }
    };
  }

  recordAdminAction() {}
}

class EmptyAccessControlService extends AccessControlService {
  constructor() {
    super({} as never);
  }

  override async resolveEffectivePermissions() {
    return [];
  }
}

class PermissionProtectedRoute {
  @RequireRoles(RoleCode.Admin)
  @RequirePermissions({ permissionCode: "security.roles.manage", scope: "all" })
  createRole() {}
}

function createExecutionContext(session: AuthSessionSummary) {
  const route = new PermissionProtectedRoute();
  const handler = route.createRole as unknown as Function;

  return {
    getHandler: () => handler,
    getClass: () => PermissionProtectedRoute,
    switchToHttp: () => ({
      getRequest: () => ({
        authSession: session,
        authUser: session.user,
        headers: {}
      })
    })
  };
}

test("security service expone roles gestionables con grants serializados", async () => {
  const prismaStub = {
    role: {
      findMany: async () => [
        {
          id: "role-custom-sales",
          code: "custom_sales",
          name: "Custom Sales",
          description: "Derived sales role",
          surface: "internal_admin",
          isSystem: false,
          isAssignable: true,
          isActive: true,
          permissions: [
            {
              scopeCode: "team",
              permission: {
                code: "orders.read"
              }
            }
          ]
        }
      ]
    }
  };

  const service = new SecurityService(prismaStub as never, new AuditStub() as never);
  const response = await service.listRoles();

  assert.equal(response.data[0].code, "custom_sales");
  assert.equal(response.data[0].permissionGrants[0].permissionCode, "orders.read");
});

test("security service rechaza grants con scopes no soportados por el permiso", async () => {
  const prismaStub = {
    permission: {
      findMany: async () => [
        {
          id: "perm-orders-read",
          code: "orders.read",
          isActive: true,
          supportedScopes: ["own"]
        }
      ]
    }
  };

  const service = new SecurityService(prismaStub as never, new AuditStub() as never);

  await assert.rejects(
    () =>
      service.createRole({
        code: "invalid_scope_role",
        name: "Invalid scope role",
        description: "Role for invalid scope test",
        surface: "internal_admin",
        permissionGrants: [
          {
            permissionCode: "orders.read",
            scopeCode: "all"
          }
        ]
      }),
    BadRequestException
  );
});

test("admin sin security.roles.manage no puede crear roles", async () => {
  const guard = new RolesGuard(new Reflector(), new EmptyAccessControlService());
  const session: AuthSessionSummary = {
    token: "token-admin",
    expiresAt: "2099-01-01T00:00:00.000Z",
    user: {
      id: "usr-admin",
      name: "Admin",
      email: "admin@test.local",
      roles: [{ code: "admin", label: "Admin" }],
      accountType: "admin",
      effectivePermissions: [{ permissionCode: "security.roles.read", scopes: ["all"], sources: ["role:admin"] }]
    }
  };

  await assert.rejects(
    () => guard.canActivate(createExecutionContext(session) as never),
    ForbiddenException
  );
});
