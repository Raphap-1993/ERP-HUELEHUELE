import { hasEffectivePermission, type AccessScopeCode, type AuthSessionSummary, type EffectivePermissionSummary } from "@huelegood/shared";

export const SELLER_PANEL_PATH = "/panel-vendedor";
export const WHOLESALE_PORTAL_PATH = "/mayoristas";

export function canAccessPortalModule(
  permissions: readonly EffectivePermissionSummary[] | undefined,
  permissionCode: string,
  scope?: AccessScopeCode
) {
  return hasEffectivePermission(permissions, scope ? { permissionCode, scope } : { permissionCode });
}

export function hasSellerPortalAccess(session: AuthSessionSummary | null | undefined) {
  return Boolean(session && canAccessPortalModule(session.user.effectivePermissions, "portal.seller.read", "own"));
}

export function hasWholesalePortalAccess(session: AuthSessionSummary | null | undefined) {
  return Boolean(session && canAccessPortalModule(session.user.effectivePermissions, "portal.wholesale.read", "own"));
}

export function hasBaseAccountAccess(session: AuthSessionSummary | null | undefined) {
  return Boolean(session && canAccessPortalModule(session.user.effectivePermissions, "portal.account.read", "own"));
}

export function resolveCommercialPortalHref(session: AuthSessionSummary | null | undefined) {
  if (!session) {
    return null;
  }

  if (hasSellerPortalAccess(session)) {
    return SELLER_PANEL_PATH;
  }

  if (hasWholesalePortalAccess(session)) {
    return WHOLESALE_PORTAL_PATH;
  }

  return null;
}

export function accountTypeLabel(accountType: AuthSessionSummary["user"]["accountType"]) {
  if (accountType === "wholesale") {
    return "Mayorista";
  }

  if (accountType === "seller") {
    return "Vendedor";
  }

  if (accountType === "admin") {
    return "Admin";
  }

  if (accountType === "operator") {
    return "Operador";
  }

  return "Cliente";
}
