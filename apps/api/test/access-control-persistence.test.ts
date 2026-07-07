import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";

function getModel(name: string) {
  const model = Prisma.dmmf.datamodel.models.find((entry) => entry.name === name);
  assert.ok(model, `Modelo Prisma faltante: ${name}`);
  return model;
}

function getFieldNames(modelName: string) {
  return new Set(getModel(modelName).fields.map((field) => field.name));
}

test("el schema Prisma expone enums y modelos base del nuevo access control", () => {
  const enumByName = new Map(Prisma.dmmf.datamodel.enums.map((entry) => [entry.name, entry]));

  assert.deepEqual(
    enumByName.get("AccessSurface")?.values.map((value) => value.name),
    ["public_web", "authenticated_portal", "internal_admin"]
  );
  assert.deepEqual(
    enumByName.get("AccessOverrideEffect")?.values.map((value) => value.name),
    ["grant", "revoke"]
  );
  assert.deepEqual(
    enumByName.get("AccessOverrideStatus")?.values.map((value) => value.name),
    ["scheduled", "active", "revoked", "expired"]
  );

  const roleFields = getFieldNames("Role");
  assert.ok(roleFields.has("description"));
  assert.ok(roleFields.has("surface"));
  assert.ok(roleFields.has("isAssignable"));
  assert.ok(roleFields.has("isActive"));

  const permissionFields = getFieldNames("Permission");
  assert.ok(permissionFields.has("description"));
  assert.ok(permissionFields.has("action"));
  assert.ok(permissionFields.has("supportedScopes"));
  assert.ok(permissionFields.has("isSystem"));
  assert.ok(permissionFields.has("isActive"));
});

test("role permissions, overrides y navigation registry quedan persistibles", () => {
  const rolePermission = getModel("RolePermission");
  assert.ok(
    rolePermission.uniqueFields.some((fields) => fields.join(":") === "roleId:permissionId:scopeCode"),
    "RolePermission debe soportar multiple scope por permiso"
  );

  const userRoleFields = getFieldNames("UserRole");
  assert.ok(userRoleFields.has("isPrimary"));
  assert.ok(userRoleFields.has("assignedAt"));
  assert.ok(userRoleFields.has("assignedByUserId"));

  const overrideFields = getFieldNames("UserPermissionOverride");
  assert.ok(overrideFields.has("scopeCode"));
  assert.ok(overrideFields.has("effect"));
  assert.ok(overrideFields.has("status"));
  assert.ok(overrideFields.has("reason"));
  assert.ok(overrideFields.has("approvedByUserId"));
  assert.ok(overrideFields.has("createdByUserId"));
  assert.ok(overrideFields.has("startsAt"));
  assert.ok(overrideFields.has("expiresAt"));

  const accessModuleFields = getFieldNames("AccessModule");
  assert.ok(accessModuleFields.has("surface"));
  assert.ok(accessModuleFields.has("route"));
  assert.ok(accessModuleFields.has("navGroup"));

  const navigationItemFields = getFieldNames("AccessNavigationItem");
  assert.ok(navigationItemFields.has("moduleCode"));
  assert.ok(navigationItemFields.has("navigationGroupId"));
  assert.ok(navigationItemFields.has("isVisible"));
});
