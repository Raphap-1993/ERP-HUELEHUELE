import assert from "node:assert/strict";
import test from "node:test";
import type { AuthUserSummary } from "@huelegood/shared";
import { getSecurityWorkspaceCapabilities, getVisibleSecurityTabs } from "./security-workspace-state";

test("security workspace deja overrides en modo oculto si la sesión no tiene security.overrides.manage", () => {
  const user: AuthUserSummary = {
    id: "usr-readonly",
    name: "Readonly",
    email: "readonly@huelegood.com",
    accountType: "admin",
    roles: [{ code: "admin", label: "Admin", isSystem: true }],
    effectivePermissions: [
      {
        permissionCode: "security.roles.read",
        scopes: ["all"],
        sources: ["role:admin"]
      }
    ]
  };

  const capabilities = getSecurityWorkspaceCapabilities(user);

  assert.equal(capabilities.canReadRoles, true);
  assert.equal(capabilities.canManageOverrides, false);
  assert.deepEqual(getVisibleSecurityTabs(capabilities), ["roles", "navigation", "catalog"]);
});
