import assert from "node:assert/strict";
import test from "node:test";
import type { AuthSessionSummary } from "@huelegood/shared";
import {
  SELLER_PANEL_PATH,
  WHOLESALE_PORTAL_PATH,
  canAccessPortalModule,
  hasSellerPortalAccess,
  hasWholesalePortalAccess,
  resolveCommercialPortalHref
} from "./portal-access";

function buildSession(permissionCodes: string[]): AuthSessionSummary {
  return {
    token: "test-token",
    expiresAt: "2099-12-31T23:59:59.000Z",
    user: {
      id: "usr-portal",
      name: "Portal User",
      email: "portal@huelegood.com",
      accountType: "customer",
      roles: [{ code: "partner_ops", label: "Partner Ops" }],
      effectivePermissions: permissionCodes.map((permissionCode) => ({
        permissionCode,
        scopes: ["own"],
        sources: ["role:partner_ops"]
      }))
    }
  };
}

test("canAccessPortalModule resuelve acceso seller por permiso efectivo y no por role string", () => {
  assert.equal(
    canAccessPortalModule(
      [{ permissionCode: "portal.seller.read", scopes: ["own"], sources: ["role:partner_ops"] }],
      "portal.seller.read",
      "own"
    ),
    true
  );
});

test("resolveCommercialPortalHref deriva seller panel por permiso efectivo", () => {
  const session = buildSession(["portal.account.read", "portal.seller.read"]);

  assert.equal(hasSellerPortalAccess(session), true);
  assert.equal(resolveCommercialPortalHref(session), SELLER_PANEL_PATH);
});

test("resolveCommercialPortalHref deriva portal mayorista por permiso efectivo", () => {
  const session = buildSession(["portal.account.read", "portal.wholesale.read"]);

  assert.equal(hasWholesalePortalAccess(session), true);
  assert.equal(resolveCommercialPortalHref(session), WHOLESALE_PORTAL_PATH);
});

test("resolveCommercialPortalHref no redirige si la cuenta solo tiene acceso base", () => {
  const session = buildSession(["portal.account.read"]);

  assert.equal(hasSellerPortalAccess(session), false);
  assert.equal(hasWholesalePortalAccess(session), false);
  assert.equal(resolveCommercialPortalHref(session), null);
});
