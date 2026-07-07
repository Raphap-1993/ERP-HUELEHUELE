import assert from "node:assert/strict";
import test from "node:test";
import type { NavigationGroupWithVisibility } from "./navigation";
import { filterNavigationGroupsByPermissions } from "./navigation";

test("filterNavigationGroupsByPermissions oculta items cuando falta el permiso requerido", () => {
  const groups: NavigationGroupWithVisibility[] = [
    {
      title: "Sistema",
      items: [
        {
          label: "Seguridad",
          href: "/seguridad",
          requiredPermissions: [{ permissionCode: "security.roles.read", scope: "all" }]
        }
      ]
    }
  ];

  assert.deepEqual(filterNavigationGroupsByPermissions(groups, undefined), []);
});

test("filterNavigationGroupsByPermissions conserva items cuando el permiso efectivo existe", () => {
  const groups: NavigationGroupWithVisibility[] = [
    {
      title: "Sistema",
      items: [
        {
          label: "Seguridad",
          href: "/seguridad",
          requiredPermissions: [{ permissionCode: "security.roles.read", scope: "all" }]
        }
      ]
    }
  ];

  const visible = filterNavigationGroupsByPermissions(groups, [
    {
      permissionCode: "security.roles.read",
      scopes: ["all"],
      sources: ["role:admin"]
    }
  ]);

  assert.equal(visible.length, 1);
  assert.equal(visible[0]?.items.length, 1);
  assert.equal(visible[0]?.items[0]?.href, "/seguridad");
});
