import { RoleCode } from "./enums";

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
  payments: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.OperadorPagos],
  vendors: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Ventas, RoleCode.SellerManager],
  commissions: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Ventas, RoleCode.SellerManager],
  products: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Marketing, RoleCode.Ventas],
  cms: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Marketing],
  wholesale: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Ventas, RoleCode.Marketing],
  loyalty: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Marketing, RoleCode.Ventas],
  marketing: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Marketing],
  crm: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Marketing, RoleCode.Ventas],
  notifications: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.Marketing, RoleCode.Ventas],
  observability: [RoleCode.SuperAdmin, RoleCode.Admin, RoleCode.OperadorPagos],
  configuration: [RoleCode.SuperAdmin, RoleCode.Admin],
  audit: [RoleCode.SuperAdmin, RoleCode.Admin],
  security: [RoleCode.SuperAdmin, RoleCode.Admin]
} as const;

export type AdminAccessModule = keyof typeof adminAccessRoles;

export function hasAdminAccess(
  userRoles: readonly RoleCode[] | undefined,
  requiredRoles: readonly RoleCode[] | undefined
) {
  if (!requiredRoles?.length) {
    return true;
  }

  if (!userRoles?.length) {
    return false;
  }

  if (userRoles.includes(RoleCode.SuperAdmin)) {
    return true;
  }

  return requiredRoles.some((role) => userRoles.includes(role));
}
