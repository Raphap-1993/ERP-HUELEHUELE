import { RoleCode } from "./enums";
import {
  hasEffectivePermission,
  type AccessSurface,
  type EffectivePermissionSummary,
  type RequiredAccessPermission
} from "./access-control";

type AdminModulePermissionEntry = {
  read: readonly RequiredAccessPermission[];
  manage?: readonly RequiredAccessPermission[];
  review?: readonly RequiredAccessPermission[];
  export?: readonly RequiredAccessPermission[];
  payout?: readonly RequiredAccessPermission[];
  publish?: readonly RequiredAccessPermission[];
  execute?: readonly RequiredAccessPermission[];
};

export const internalAdminRoleCodes = [
  RoleCode.SuperAdmin,
  RoleCode.Admin,
  RoleCode.OperadorPagos,
  RoleCode.Ventas,
  RoleCode.Marketing,
  RoleCode.SellerManager
] as const;

export const adminModulePermissions = {
  dashboard: {
    read: [{ permissionCode: "dashboard.read" }]
  },
  reports: {
    read: [{ permissionCode: "dashboard.read" }],
    export: [{ permissionCode: "orders.export" }]
  },
  orders: {
    read: [{ permissionCode: "orders.read" }],
    manage: [{ permissionCode: "orders.manage" }]
  },
  dispatch: {
    read: [{ permissionCode: "dispatch.read" }],
    manage: [{ permissionCode: "dispatch.manage" }]
  },
  payments: {
    read: [{ permissionCode: "payments.read" }],
    review: [{ permissionCode: "payments.review" }]
  },
  inventory: {
    read: [{ permissionCode: "inventory.read" }],
    manage: [{ permissionCode: "inventory.manage" }]
  },
  transfers: {
    read: [{ permissionCode: "transfers.read" }],
    manage: [{ permissionCode: "transfers.manage" }]
  },
  warehouses: {
    read: [{ permissionCode: "warehouses.read" }],
    manage: [{ permissionCode: "warehouses.manage" }]
  },
  products: {
    read: [{ permissionCode: "products.read" }],
    manage: [{ permissionCode: "products.write" }]
  },
  cms: {
    read: [{ permissionCode: "cms.read" }],
    manage: [{ permissionCode: "cms.write" }],
    publish: [{ permissionCode: "cms.publish" }]
  },
  vendors: {
    read: [{ permissionCode: "vendors.read" }],
    manage: [{ permissionCode: "vendors.manage" }]
  },
  commissions: {
    read: [{ permissionCode: "commissions.read" }],
    manage: [{ permissionCode: "commissions.manage" }],
    payout: [{ permissionCode: "commissions.payout" }]
  },
  wholesale: {
    read: [{ permissionCode: "wholesale.read" }],
    manage: [{ permissionCode: "wholesale.manage" }]
  },
  commercialAccesses: {
    read: [{ permissionCode: "commercial_accesses.read" }],
    manage: [{ permissionCode: "commercial_accesses.manage" }]
  },
  crm: {
    read: [{ permissionCode: "crm.read" }],
    manage: [{ permissionCode: "crm.manage" }]
  },
  loyalty: {
    read: [{ permissionCode: "loyalty.read" }],
    manage: [{ permissionCode: "loyalty.manage" }]
  },
  marketing: {
    read: [{ permissionCode: "marketing.read" }],
    manage: [{ permissionCode: "marketing.write" }],
    execute: [{ permissionCode: "marketing.execute" }]
  },
  coupons: {
    read: [{ permissionCode: "coupons.read" }],
    manage: [{ permissionCode: "coupons.write" }]
  },
  notifications: {
    read: [{ permissionCode: "notifications.read" }],
    manage: [{ permissionCode: "notifications.manage" }]
  },
  observability: {
    read: [{ permissionCode: "observability.read" }]
  },
  audit: {
    read: [{ permissionCode: "audit.read" }]
  },
  configuration: {
    read: [{ permissionCode: "configuration.read" }],
    manage: [{ permissionCode: "configuration.manage" }]
  },
  security: {
    read: [{ permissionCode: "security.roles.read", scope: "all" }],
    manage: [{ permissionCode: "security.roles.manage", scope: "all" }]
  }
} as const satisfies Record<string, AdminModulePermissionEntry>;

export const adminAccessRoles = {
  dashboard: [
    RoleCode.SuperAdmin,
    RoleCode.Admin,
    RoleCode.OperadorPagos,
    RoleCode.Ventas,
    RoleCode.Marketing,
    RoleCode.SellerManager
  ],
  orders: [
    RoleCode.SuperAdmin,
    RoleCode.Admin,
    RoleCode.OperadorPagos,
    RoleCode.Ventas,
    RoleCode.SellerManager
  ],
  dispatch: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Ventas],
  inventory: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Ventas],
  transfers: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Ventas],
  payments: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.OperadorPagos],
  vendors: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Ventas, RoleCode.SellerManager],
  commissions: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Ventas, RoleCode.SellerManager],
  products: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Marketing, RoleCode.Ventas],
  warehouses: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Ventas],
  cms: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Marketing],
  wholesale: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Ventas, RoleCode.Marketing],
  loyalty: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Marketing, RoleCode.Ventas],
  marketing: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Marketing],
  crm: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Marketing, RoleCode.Ventas],
  notifications: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Marketing, RoleCode.Ventas],
  observability: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.OperadorPagos],
  coupons: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Ventas, RoleCode.Marketing],
  commercialAccesses: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Ventas, RoleCode.SellerManager],
  configuration: [RoleCode.SuperAdmin, RoleCode.Admin],
  audit: [RoleCode.SuperAdmin, RoleCode.Admin],
  security: [RoleCode.SuperAdmin, RoleCode.Admin]
} as const;

export type AdminAccessModule = keyof typeof adminAccessRoles;

export function canAccessAdminSurface(
  surfaces: readonly AccessSurface[] | undefined,
  userRoles: readonly string[] | undefined
) {
  if (userRoles?.includes(RoleCode.SuperAdmin)) {
    return true;
  }

  if (surfaces?.includes("internal_admin")) {
    return true;
  }

  return internalAdminRoleCodes.some((role) => userRoles?.includes(role));
}

export function hasRequiredPermissions(
  effectivePermissions: readonly EffectivePermissionSummary[] | undefined,
  requiredPermissions: readonly RequiredAccessPermission[] | undefined
) {
  if (!requiredPermissions?.length) {
    return true;
  }

  return requiredPermissions.every((permission) => hasEffectivePermission(effectivePermissions, permission));
}

export function hasAdminAccess(
  userRoles: readonly string[] | undefined,
  requiredRoles: readonly RoleCode[] | undefined,
  effectivePermissions?: readonly EffectivePermissionSummary[],
  requiredPermissions?: readonly RequiredAccessPermission[]
) {
  const hasRoleRequirement = Boolean(requiredRoles?.length);
  const hasPermissionRequirement = Boolean(requiredPermissions?.length);

  if (!hasRoleRequirement && !hasPermissionRequirement) {
    return true;
  }

  if (userRoles?.includes(RoleCode.SuperAdmin)) {
    return true;
  }

  const hasRoleAccess = hasRoleRequirement
    ? Boolean(userRoles?.length) && (requiredRoles?.some((role) => userRoles?.includes(role)) ?? false)
    : false;
  const hasPermissionAccess = hasPermissionRequirement
    ? hasRequiredPermissions(effectivePermissions, requiredPermissions)
    : false;

  if (hasRoleRequirement && hasPermissionRequirement) {
    return hasRoleAccess || hasPermissionAccess;
  }

  if (hasRoleRequirement) {
    return hasRoleAccess;
  }

  return hasPermissionAccess;
}
