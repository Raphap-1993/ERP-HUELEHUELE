import {
  RoleCode,
  type AccessScopeCode,
  type AccessSurface,
  type PermissionCatalogEntry,
  type ScopeCatalogEntry
} from "@huelegood/shared";

export interface SystemRoleCatalogEntry {
  code: RoleCode;
  name: string;
  description: string;
  surface: AccessSurface;
  isSystem: true;
  isAssignable: boolean;
  isActive: boolean;
}

export interface SystemAccessModuleEntry {
  code: string;
  label: string;
  description: string;
  surface: AccessSurface;
  route: string;
  navGroup: string;
  isSystem: true;
  isActive: boolean;
}

export interface SystemRolePermissionGrant {
  roleCode: RoleCode;
  permissionCode: string;
  scopeCode: AccessScopeCode;
}

function resolveGrantScope(permission: PermissionCatalogEntry): AccessScopeCode {
  const supportedScopeSet = new Set(permission.supportedScopes);

  for (const scope of [...systemAccessScopes].sort((left, right) => right.precedence - left.precedence)) {
    if (supportedScopeSet.has(scope.code)) {
      return scope.code;
    }
  }

  return "own";
}

export const systemAccessScopes: ScopeCatalogEntry[] = [
  { code: "own", label: "Propio", description: "Solo recursos del propio usuario o cuenta.", precedence: 10, isSystem: true },
  { code: "team", label: "Equipo", description: "Recursos de un equipo o cartera asignada.", precedence: 20, isSystem: true },
  { code: "branch", label: "Sucursal", description: "Recursos de una sucursal u operación local.", precedence: 30, isSystem: true },
  { code: "org", label: "Organización", description: "Recursos globales de la organización autenticada.", precedence: 40, isSystem: true },
  { code: "all", label: "Todo", description: "Acceso total dentro de la superficie autorizada.", precedence: 50, isSystem: true }
];

export const systemRoleCatalog: SystemRoleCatalogEntry[] = [
  {
    code: RoleCode.SuperAdmin,
    name: "Super Admin",
    description: "Control total del sistema y de la gobernanza de acceso.",
    surface: "internal_admin",
    isSystem: true,
    isAssignable: true,
    isActive: true
  },
  {
    code: RoleCode.Admin,
    name: "Admin",
    description: "Operación transversal del negocio sin seguridad crítica por defecto.",
    surface: "internal_admin",
    isSystem: true,
    isAssignable: true,
    isActive: true
  },
  {
    code: RoleCode.OperadorPagos,
    name: "Operador de pagos",
    description: "Gestión operativa de pagos y revisión de comprobantes.",
    surface: "internal_admin",
    isSystem: true,
    isAssignable: true,
    isActive: true
  },
  {
    code: RoleCode.Ventas,
    name: "Ventas",
    description: "Operación comercial de pedidos, catálogo y leads.",
    surface: "internal_admin",
    isSystem: true,
    isAssignable: true,
    isActive: true
  },
  {
    code: RoleCode.Marketing,
    name: "Marketing",
    description: "Operación de contenido, campañas y segmentos.",
    surface: "internal_admin",
    isSystem: true,
    isAssignable: true,
    isActive: true
  },
  {
    code: RoleCode.SellerManager,
    name: "Seller Manager",
    description: "Operación interna de vendedores, comisiones y accesos comerciales.",
    surface: "internal_admin",
    isSystem: true,
    isAssignable: true,
    isActive: true
  },
  {
    code: RoleCode.Vendedor,
    name: "Vendedor",
    description: "Portal comercial propio del vendedor.",
    surface: "authenticated_portal",
    isSystem: true,
    isAssignable: true,
    isActive: true
  },
  {
    code: RoleCode.Mayorista,
    name: "Mayorista",
    description: "Portal comercial propio del mayorista o distribuidor.",
    surface: "authenticated_portal",
    isSystem: true,
    isAssignable: true,
    isActive: true
  },
  {
    code: RoleCode.Cliente,
    name: "Cliente",
    description: "Cuenta autenticada de cliente retail.",
    surface: "authenticated_portal",
    isSystem: true,
    isAssignable: true,
    isActive: true
  }
];

export const systemAccessModules: SystemAccessModuleEntry[] = [
  { code: "dashboard", label: "Dashboard", description: "Resumen operativo interno.", surface: "internal_admin", route: "/", navGroup: "general", isSystem: true, isActive: true },
  { code: "orders", label: "Pedidos", description: "Operación y seguimiento de pedidos.", surface: "internal_admin", route: "/pedidos", navGroup: "ventas", isSystem: true, isActive: true },
  { code: "payments", label: "Pagos", description: "Revisión y conciliación de pagos.", surface: "internal_admin", route: "/pagos", navGroup: "ventas", isSystem: true, isActive: true },
  { code: "dispatch", label: "Despachos", description: "Packing, sticker y salida operativa.", surface: "internal_admin", route: "/despachos", navGroup: "operacion", isSystem: true, isActive: true },
  { code: "products", label: "Productos", description: "Catálogo y variantes.", surface: "internal_admin", route: "/productos", navGroup: "catalogo", isSystem: true, isActive: true },
  { code: "inventory", label: "Inventario", description: "Saldos, reservas y ajustes.", surface: "internal_admin", route: "/inventario", navGroup: "operacion", isSystem: true, isActive: true },
  { code: "warehouses", label: "Almacenes", description: "Nodos físicos y coberturas.", surface: "internal_admin", route: "/almacenes", navGroup: "operacion", isSystem: true, isActive: true },
  { code: "transfers", label: "Transferencias", description: "Movimiento entre almacenes.", surface: "internal_admin", route: "/transferencias", navGroup: "operacion", isSystem: true, isActive: true },
  { code: "vendors", label: "Vendedores", description: "Operación de vendedores.", surface: "internal_admin", route: "/vendedores", navGroup: "comercial", isSystem: true, isActive: true },
  { code: "commissions", label: "Comisiones", description: "Reglas, atribución y payouts.", surface: "internal_admin", route: "/comisiones", navGroup: "comercial", isSystem: true, isActive: true },
  { code: "wholesale", label: "Mayoristas", description: "Leads y operación mayorista.", surface: "internal_admin", route: "/mayoristas", navGroup: "comercial", isSystem: true, isActive: true },
  { code: "commercial_accesses", label: "Accesos", description: "Cuentas comerciales y credenciales web.", surface: "internal_admin", route: "/accesos", navGroup: "comercial", isSystem: true, isActive: true },
  { code: "crm", label: "CRM", description: "Seguimiento comercial y clientes.", surface: "internal_admin", route: "/crm", navGroup: "comercial", isSystem: true, isActive: true },
  { code: "cms", label: "CMS", description: "Contenido y branding del sitio.", surface: "internal_admin", route: "/cms", navGroup: "growth", isSystem: true, isActive: true },
  { code: "marketing", label: "Marketing", description: "Campañas y segmentos.", surface: "internal_admin", route: "/marketing", navGroup: "growth", isSystem: true, isActive: true },
  { code: "notifications", label: "Notificaciones", description: "Bandeja y dispatch.", surface: "internal_admin", route: "/notificaciones", navGroup: "growth", isSystem: true, isActive: true },
  { code: "loyalty", label: "Loyalty", description: "Puntos y canjes.", surface: "internal_admin", route: "/loyalty", navGroup: "growth", isSystem: true, isActive: true },
  { code: "coupons", label: "Cupones", description: "Promociones y cupones.", surface: "internal_admin", route: "/cupones", navGroup: "growth", isSystem: true, isActive: true },
  { code: "audit", label: "Auditoría", description: "Registro de acciones sensibles.", surface: "internal_admin", route: "/auditoria", navGroup: "gobernanza", isSystem: true, isActive: true },
  { code: "observability", label: "Observabilidad", description: "Telemetría y salud operativa.", surface: "internal_admin", route: "/observabilidad", navGroup: "gobernanza", isSystem: true, isActive: true },
  { code: "configuration", label: "Configuración", description: "Ajustes operativos y de sistema.", surface: "internal_admin", route: "/configuracion", navGroup: "gobernanza", isSystem: true, isActive: true },
  { code: "security", label: "Seguridad", description: "Usuarios, roles, overrides y navegación.", surface: "internal_admin", route: "/seguridad", navGroup: "gobernanza", isSystem: true, isActive: true },
  { code: "portal_account", label: "Cuenta", description: "Cuenta base del portal autenticado.", surface: "authenticated_portal", route: "/cuenta", navGroup: "portal", isSystem: true, isActive: true },
  { code: "portal_seller", label: "Panel vendedor", description: "Workspace propio del vendedor.", surface: "authenticated_portal", route: "/panel-vendedor", navGroup: "portal", isSystem: true, isActive: true },
  { code: "portal_wholesale", label: "Portal mayorista", description: "Workspace autenticado de mayoristas.", surface: "authenticated_portal", route: "/mayoristas", navGroup: "portal", isSystem: true, isActive: true }
];

export const systemPermissionCatalog: PermissionCatalogEntry[] = [
  { code: "dashboard.read", label: "Leer dashboard", description: "Ver resumen operativo.", moduleId: "dashboard", action: "read", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "orders.read", label: "Leer pedidos", description: "Consultar pedidos dentro del scope asignado.", moduleId: "orders", action: "read", supportedScopes: ["own", "team", "branch", "org", "all"], isSystem: true, isActive: true },
  { code: "orders.manage", label: "Gestionar pedidos", description: "Mutar estado y operación de pedidos.", moduleId: "orders", action: "manage", supportedScopes: ["team", "branch", "org", "all"], isSystem: true, isActive: true },
  { code: "orders.export", label: "Exportar pedidos", description: "Exportar reportes de pedidos.", moduleId: "orders", action: "export", supportedScopes: ["team", "branch", "org", "all"], isSystem: true, isActive: true },
  { code: "payments.read", label: "Leer pagos", description: "Consultar pagos y solicitudes.", moduleId: "payments", action: "read", supportedScopes: ["team", "org", "all"], isSystem: true, isActive: true },
  { code: "payments.review", label: "Revisar pagos", description: "Resolver pagos manuales.", moduleId: "payments", action: "review", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "dispatch.read", label: "Leer despachos", description: "Consultar cola de despacho.", moduleId: "dispatch", action: "read", supportedScopes: ["team", "branch", "org", "all"], isSystem: true, isActive: true },
  { code: "dispatch.manage", label: "Gestionar despachos", description: "Emitir sticker y operar despacho.", moduleId: "dispatch", action: "manage", supportedScopes: ["branch", "org", "all"], isSystem: true, isActive: true },
  { code: "products.read", label: "Leer productos", description: "Consultar catálogo interno.", moduleId: "products", action: "read", supportedScopes: ["org", "all"], isSystem: true, isActive: true },
  { code: "products.write", label: "Editar productos", description: "Crear y editar productos.", moduleId: "products", action: "write", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "inventory.read", label: "Leer inventario", description: "Consultar saldos y reservas.", moduleId: "inventory", action: "read", supportedScopes: ["branch", "org", "all"], isSystem: true, isActive: true },
  { code: "inventory.manage", label: "Gestionar inventario", description: "Ajustar y operar inventario.", moduleId: "inventory", action: "manage", supportedScopes: ["branch", "org", "all"], isSystem: true, isActive: true },
  { code: "warehouses.read", label: "Leer almacenes", description: "Consultar almacenes y cobertura.", moduleId: "warehouses", action: "read", supportedScopes: ["org", "all"], isSystem: true, isActive: true },
  { code: "warehouses.manage", label: "Gestionar almacenes", description: "Editar almacenes y cobertura.", moduleId: "warehouses", action: "manage", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "transfers.read", label: "Leer transferencias", description: "Consultar transferencias.", moduleId: "transfers", action: "read", supportedScopes: ["branch", "org", "all"], isSystem: true, isActive: true },
  { code: "transfers.manage", label: "Gestionar transferencias", description: "Crear y operar transferencias.", moduleId: "transfers", action: "manage", supportedScopes: ["branch", "org", "all"], isSystem: true, isActive: true },
  { code: "vendors.read", label: "Leer vendedores", description: "Consultar vendedores y solicitudes.", moduleId: "vendors", action: "read", supportedScopes: ["team", "org", "all"], isSystem: true, isActive: true },
  { code: "vendors.manage", label: "Gestionar vendedores", description: "Editar vendedores y accesos.", moduleId: "vendors", action: "manage", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "commissions.read", label: "Leer comisiones", description: "Consultar reglas y comisiones.", moduleId: "commissions", action: "read", supportedScopes: ["own", "team", "org", "all"], isSystem: true, isActive: true },
  { code: "commissions.manage", label: "Gestionar comisiones", description: "Editar reglas y operación.", moduleId: "commissions", action: "manage", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "commissions.payout", label: "Ejecutar payouts", description: "Programar y marcar pagos de comisión.", moduleId: "commissions", action: "payout", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "wholesale.read", label: "Leer mayoristas", description: "Consultar leads o portal B2B.", moduleId: "wholesale", action: "read", supportedScopes: ["own", "team", "org", "all"], isSystem: true, isActive: true },
  { code: "wholesale.manage", label: "Gestionar mayoristas", description: "Operar leads y pipeline mayorista.", moduleId: "wholesale", action: "manage", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "commercial_accesses.read", label: "Leer accesos comerciales", description: "Consultar accesos comerciales y credenciales web.", moduleId: "commercial_accesses", action: "read", supportedScopes: ["org", "all"], isSystem: true, isActive: true },
  { code: "commercial_accesses.manage", label: "Gestionar accesos comerciales", description: "Crear, editar y suspender accesos comerciales.", moduleId: "commercial_accesses", action: "manage", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "crm.read", label: "Leer CRM", description: "Consultar clientes y seguimiento.", moduleId: "crm", action: "read", supportedScopes: ["team", "org", "all"], isSystem: true, isActive: true },
  { code: "crm.manage", label: "Gestionar CRM", description: "Mutar seguimiento y datos operativos.", moduleId: "crm", action: "manage", supportedScopes: ["team", "org", "all"], isSystem: true, isActive: true },
  { code: "cms.read", label: "Leer CMS", description: "Consultar contenido y branding.", moduleId: "cms", action: "read", supportedScopes: ["org", "all"], isSystem: true, isActive: true },
  { code: "cms.write", label: "Editar CMS", description: "Editar contenido y branding.", moduleId: "cms", action: "write", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "cms.publish", label: "Publicar CMS", description: "Publicar cambios visibles.", moduleId: "cms", action: "publish", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "marketing.read", label: "Leer marketing", description: "Consultar campañas y segmentos.", moduleId: "marketing", action: "read", supportedScopes: ["org", "all"], isSystem: true, isActive: true },
  { code: "marketing.write", label: "Editar marketing", description: "Editar campañas y segmentos.", moduleId: "marketing", action: "write", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "marketing.execute", label: "Ejecutar campañas", description: "Lanzar campañas.", moduleId: "marketing", action: "execute", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "notifications.read", label: "Leer notificaciones", description: "Consultar bandeja de notificaciones.", moduleId: "notifications", action: "read", supportedScopes: ["org", "all"], isSystem: true, isActive: true },
  { code: "notifications.manage", label: "Gestionar notificaciones", description: "Operar notificaciones.", moduleId: "notifications", action: "manage", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "loyalty.read", label: "Leer loyalty", description: "Consultar puntos y canjes.", moduleId: "loyalty", action: "read", supportedScopes: ["own", "team", "org", "all"], isSystem: true, isActive: true },
  { code: "loyalty.manage", label: "Gestionar loyalty", description: "Operar puntos y canjes.", moduleId: "loyalty", action: "manage", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "coupons.read", label: "Leer cupones", description: "Consultar cupones y promociones.", moduleId: "coupons", action: "read", supportedScopes: ["org", "all"], isSystem: true, isActive: true },
  { code: "coupons.write", label: "Editar cupones", description: "Crear y editar cupones.", moduleId: "coupons", action: "write", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "audit.read", label: "Leer auditoría", description: "Consultar auditoría sensible.", moduleId: "audit", action: "read", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "observability.read", label: "Leer observabilidad", description: "Consultar telemetría y health.", moduleId: "observability", action: "read", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "configuration.read", label: "Leer configuración", description: "Consultar configuración operativa.", moduleId: "configuration", action: "read", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "configuration.manage", label: "Gestionar configuración", description: "Editar configuración operativa.", moduleId: "configuration", action: "manage", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "security.roles.read", label: "Leer roles", description: "Consultar catálogo de roles.", moduleId: "security", action: "roles.read", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "security.roles.manage", label: "Gestionar roles", description: "Crear, clonar y editar roles.", moduleId: "security", action: "roles.manage", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "security.users.manage", label: "Gestionar usuarios", description: "Asignar roles y activar usuarios.", moduleId: "security", action: "users.manage", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "security.overrides.manage", label: "Gestionar overrides", description: "Aplicar grants o revokes temporales.", moduleId: "security", action: "overrides.manage", supportedScopes: ["all"], isSystem: true, isActive: true },
  { code: "portal.account.read", label: "Leer cuenta propia", description: "Consultar la cuenta autenticada.", moduleId: "portal_account", action: "read", supportedScopes: ["own"], isSystem: true, isActive: true },
  { code: "portal.account.manage", label: "Gestionar cuenta propia", description: "Editar la cuenta autenticada.", moduleId: "portal_account", action: "manage", supportedScopes: ["own"], isSystem: true, isActive: true },
  { code: "portal.seller.read", label: "Leer panel vendedor", description: "Consultar el panel propio del vendedor.", moduleId: "portal_seller", action: "read", supportedScopes: ["own"], isSystem: true, isActive: true },
  { code: "portal.wholesale.read", label: "Leer portal mayorista", description: "Consultar el portal propio mayorista.", moduleId: "portal_wholesale", action: "read", supportedScopes: ["own"], isSystem: true, isActive: true }
];

export const systemRolePermissionGrants: SystemRolePermissionGrant[] = [
  ...systemPermissionCatalog.map((permission) => ({
    roleCode: RoleCode.SuperAdmin,
    permissionCode: permission.code,
    scopeCode: resolveGrantScope(permission)
  })),
  { roleCode: RoleCode.Admin, permissionCode: "dashboard.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "orders.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "orders.manage", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "orders.export", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "payments.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "payments.review", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "dispatch.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "dispatch.manage", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "products.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "products.write", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "inventory.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "inventory.manage", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "warehouses.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "warehouses.manage", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "transfers.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "transfers.manage", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "vendors.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "vendors.manage", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "commissions.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "commissions.manage", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "commissions.payout", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "wholesale.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "wholesale.manage", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "commercial_accesses.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "commercial_accesses.manage", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "crm.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "crm.manage", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "cms.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "cms.write", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "cms.publish", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "marketing.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "marketing.write", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "marketing.execute", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "notifications.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "notifications.manage", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "loyalty.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "loyalty.manage", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "coupons.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "coupons.write", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "audit.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "observability.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "configuration.read", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "configuration.manage", scopeCode: "all" },
  { roleCode: RoleCode.Admin, permissionCode: "security.roles.read", scopeCode: "all" },
  { roleCode: RoleCode.OperadorPagos, permissionCode: "dashboard.read", scopeCode: "all" },
  { roleCode: RoleCode.OperadorPagos, permissionCode: "orders.read", scopeCode: "all" },
  { roleCode: RoleCode.OperadorPagos, permissionCode: "orders.export", scopeCode: "all" },
  { roleCode: RoleCode.OperadorPagos, permissionCode: "payments.read", scopeCode: "all" },
  { roleCode: RoleCode.OperadorPagos, permissionCode: "payments.review", scopeCode: "all" },
  { roleCode: RoleCode.OperadorPagos, permissionCode: "observability.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "dashboard.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "orders.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "orders.manage", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "orders.export", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "dispatch.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "dispatch.manage", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "products.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "products.write", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "inventory.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "inventory.manage", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "warehouses.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "transfers.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "transfers.manage", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "vendors.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "vendors.manage", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "commissions.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "commissions.manage", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "commissions.payout", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "wholesale.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "wholesale.manage", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "commercial_accesses.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "commercial_accesses.manage", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "crm.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "crm.manage", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "notifications.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "notifications.manage", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "loyalty.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "loyalty.manage", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "coupons.read", scopeCode: "all" },
  { roleCode: RoleCode.Ventas, permissionCode: "coupons.write", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "dashboard.read", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "orders.export", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "cms.read", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "cms.write", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "cms.publish", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "wholesale.read", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "wholesale.manage", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "crm.read", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "crm.manage", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "marketing.read", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "marketing.write", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "marketing.execute", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "notifications.read", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "notifications.manage", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "loyalty.read", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "loyalty.manage", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "coupons.read", scopeCode: "all" },
  { roleCode: RoleCode.Marketing, permissionCode: "coupons.write", scopeCode: "all" },
  { roleCode: RoleCode.SellerManager, permissionCode: "dashboard.read", scopeCode: "all" },
  { roleCode: RoleCode.SellerManager, permissionCode: "orders.read", scopeCode: "team" },
  { roleCode: RoleCode.SellerManager, permissionCode: "orders.manage", scopeCode: "team" },
  { roleCode: RoleCode.SellerManager, permissionCode: "orders.export", scopeCode: "team" },
  { roleCode: RoleCode.SellerManager, permissionCode: "vendors.read", scopeCode: "all" },
  { roleCode: RoleCode.SellerManager, permissionCode: "vendors.manage", scopeCode: "all" },
  { roleCode: RoleCode.SellerManager, permissionCode: "commissions.read", scopeCode: "all" },
  { roleCode: RoleCode.SellerManager, permissionCode: "commissions.manage", scopeCode: "all" },
  { roleCode: RoleCode.SellerManager, permissionCode: "commissions.payout", scopeCode: "all" },
  { roleCode: RoleCode.SellerManager, permissionCode: "wholesale.read", scopeCode: "team" },
  { roleCode: RoleCode.SellerManager, permissionCode: "commercial_accesses.read", scopeCode: "all" },
  { roleCode: RoleCode.SellerManager, permissionCode: "commercial_accesses.manage", scopeCode: "all" },
  { roleCode: RoleCode.SellerManager, permissionCode: "security.roles.read", scopeCode: "all" },
  { roleCode: RoleCode.Vendedor, permissionCode: "portal.account.read", scopeCode: "own" },
  { roleCode: RoleCode.Vendedor, permissionCode: "portal.account.manage", scopeCode: "own" },
  { roleCode: RoleCode.Vendedor, permissionCode: "portal.seller.read", scopeCode: "own" },
  { roleCode: RoleCode.Vendedor, permissionCode: "orders.read", scopeCode: "own" },
  { roleCode: RoleCode.Vendedor, permissionCode: "commissions.read", scopeCode: "own" },
  { roleCode: RoleCode.Mayorista, permissionCode: "portal.account.read", scopeCode: "own" },
  { roleCode: RoleCode.Mayorista, permissionCode: "portal.account.manage", scopeCode: "own" },
  { roleCode: RoleCode.Mayorista, permissionCode: "portal.wholesale.read", scopeCode: "own" },
  { roleCode: RoleCode.Mayorista, permissionCode: "orders.read", scopeCode: "own" },
  { roleCode: RoleCode.Mayorista, permissionCode: "wholesale.read", scopeCode: "own" },
  { roleCode: RoleCode.Cliente, permissionCode: "portal.account.read", scopeCode: "own" },
  { roleCode: RoleCode.Cliente, permissionCode: "portal.account.manage", scopeCode: "own" },
  { roleCode: RoleCode.Cliente, permissionCode: "orders.read", scopeCode: "own" },
  { roleCode: RoleCode.Cliente, permissionCode: "loyalty.read", scopeCode: "own" }
];
