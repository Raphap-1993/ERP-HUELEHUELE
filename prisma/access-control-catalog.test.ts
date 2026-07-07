import assert from "node:assert/strict";
import test from "node:test";
import {
  systemAccessModules,
  systemAccessScopes,
  systemPermissionCatalog,
  systemRoleCatalog,
  systemRolePermissionGrants
} from "./access-control-catalog";

test("el catalogo base incluye scopes canonicos con precedencia estable", () => {
  assert.deepEqual(
    systemAccessScopes.map((scope) => scope.code),
    ["own", "team", "branch", "org", "all"]
  );
  assert.deepEqual(
    systemAccessScopes.map((scope) => scope.precedence),
    [10, 20, 30, 40, 50]
  );
});

test("los modulos y permisos de seguridad critica existen en el catalogo", () => {
  assert.ok(systemAccessModules.some((module) => module.code === "security"));
  assert.ok(systemAccessModules.some((module) => module.code === "commercial_accesses"));
  assert.ok(systemPermissionCatalog.some((permission) => permission.code === "security.roles.manage"));
  assert.ok(systemPermissionCatalog.some((permission) => permission.code === "security.users.manage"));
  assert.ok(systemPermissionCatalog.some((permission) => permission.code === "security.overrides.manage"));
  assert.ok(systemPermissionCatalog.some((permission) => permission.code === "commercial_accesses.read"));
  assert.ok(systemPermissionCatalog.some((permission) => permission.code === "commercial_accesses.manage"));
});

test("los roles sistema quedan marcados y sus grants apuntan a permisos existentes", () => {
  assert.ok(systemRoleCatalog.every((role) => role.isSystem));

  const permissionCodes = new Set(systemPermissionCatalog.map((permission) => permission.code));

  for (const grant of systemRolePermissionGrants) {
    assert.ok(permissionCodes.has(grant.permissionCode));
  }
});

test("cada grant usa un scope soportado por el permiso canonico", () => {
  const permissionByCode = new Map(systemPermissionCatalog.map((permission) => [permission.code, permission]));

  for (const grant of systemRolePermissionGrants) {
    const permission = permissionByCode.get(grant.permissionCode);
    assert.ok(permission, `Permiso faltante para grant ${grant.roleCode}:${grant.permissionCode}`);
    assert.ok(
      permission.supportedScopes.includes(grant.scopeCode),
      `Grant invalido ${grant.roleCode}:${grant.permissionCode}:${grant.scopeCode}`
    );
  }
});

test("los roles internos que hoy operan accesos comerciales mantienen grants canonicos", () => {
  const commercialAccessGrantMatrix = new Set(
    systemRolePermissionGrants
      .filter((grant) => grant.permissionCode.startsWith("commercial_accesses."))
      .map((grant) => `${grant.roleCode}:${grant.permissionCode}:${grant.scopeCode}`)
  );

  assert.ok(commercialAccessGrantMatrix.has("admin:commercial_accesses.read:all"));
  assert.ok(commercialAccessGrantMatrix.has("admin:commercial_accesses.manage:all"));
  assert.ok(commercialAccessGrantMatrix.has("ventas:commercial_accesses.read:all"));
  assert.ok(commercialAccessGrantMatrix.has("ventas:commercial_accesses.manage:all"));
  assert.ok(commercialAccessGrantMatrix.has("seller_manager:commercial_accesses.read:all"));
  assert.ok(commercialAccessGrantMatrix.has("seller_manager:commercial_accesses.manage:all"));
});
