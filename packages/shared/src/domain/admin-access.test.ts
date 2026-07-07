import assert from "node:assert/strict";
import test from "node:test";
import { RoleCode } from "./enums";
import { adminModulePermissions, canAccessAdminSurface, hasAdminAccess } from "./admin-access";

test("adminModulePermissions expone permisos de lectura para accesos comerciales", () => {
  assert.deepEqual(adminModulePermissions.commercialAccesses.read, [{ permissionCode: "commercial_accesses.read" }]);
  assert.deepEqual(adminModulePermissions.commercialAccesses.manage, [{ permissionCode: "commercial_accesses.manage" }]);
});

test("canAccessAdminSurface exige superficie interna o rol legacy interno", () => {
  assert.equal(canAccessAdminSurface(["internal_admin"], [RoleCode.Mayorista]), true);
  assert.equal(canAccessAdminSurface(undefined, [RoleCode.Admin]), true);
  assert.equal(canAccessAdminSurface(["authenticated_portal"], [RoleCode.Mayorista]), false);
});

test("hasAdminAccess permite permisos efectivos aunque el rol no sea legacy", () => {
  assert.equal(
    hasAdminAccess(
      ["custom_admin"],
      undefined,
      [
        {
          permissionCode: "dashboard.read",
          scopes: ["all"],
          sources: ["role:custom_admin"]
        }
      ],
      adminModulePermissions.dashboard.read
    ),
    true
  );
});
