import assert from "node:assert/strict";
import test from "node:test";
import {
  hasEffectivePermission,
  mergeEffectivePermissions,
  type EffectivePermissionSummary,
  type RequiredAccessPermission
} from "./access-control";

test("mergeEffectivePermissions une scopes y fuentes sin duplicar", () => {
  const merged = mergeEffectivePermissions([
    {
      permissionCode: "orders.read",
      scopes: ["own"],
      sources: ["role:cliente"]
    },
    {
      permissionCode: "orders.read",
      scopes: ["team"],
      sources: ["override:grant"]
    },
    {
      permissionCode: "orders.read",
      scopes: ["own"],
      sources: ["role:cliente"]
    }
  ]);

  assert.deepEqual(merged, [
    {
      permissionCode: "orders.read",
      scopes: ["own", "team"],
      sources: ["role:cliente", "override:grant"]
    }
  ] satisfies EffectivePermissionSummary[]);
});

test("hasEffectivePermission exige codigo y scope cuando aplica", () => {
  const permissions: EffectivePermissionSummary[] = [
    {
      permissionCode: "orders.read",
      scopes: ["own", "team"],
      sources: ["role:ventas"]
    }
  ];

  assert.equal(
    hasEffectivePermission(permissions, {
      permissionCode: "orders.read"
    } satisfies RequiredAccessPermission),
    true
  );
  assert.equal(
    hasEffectivePermission(permissions, {
      permissionCode: "orders.read",
      scope: "team"
    } satisfies RequiredAccessPermission),
    true
  );
  assert.equal(
    hasEffectivePermission(permissions, {
      permissionCode: "orders.read",
      scope: "all"
    } satisfies RequiredAccessPermission),
    false
  );
  assert.equal(
    hasEffectivePermission(permissions, {
      permissionCode: "cms.publish"
    } satisfies RequiredAccessPermission),
    false
  );
});
