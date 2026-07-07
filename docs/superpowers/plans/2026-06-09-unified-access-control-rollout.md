# Unified Access Control Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el control de acceso basado principalmente en roles hardcodeados por una arquitectura unificada de `RBAC + permissions + scope + overrides` administrable desde backoffice y aplicada sobre admin interno, portal autenticado y contratos de identidad compartidos.

**Architecture:** El rollout mantiene `apps/api` como autoridad unica de autorizacion y migra el sistema por capas: primero contratos y persistencia, luego resolucion backend de permisos efectivos, despues UI de seguridad y finalmente migracion de navegacion y surfaces consumidoras. La compatibilidad temporal con `RoleCode` y `adminAccessRoles` se mantiene mientras se introducen catalogos canonicos, guards por permiso y un registry formal de modulos.

**Tech Stack:** Next.js, NestJS, Prisma, TypeScript, packages/shared, packages/ui, tests Node/Nest, admin shell propio.

---

## Hilos Recomendados Del Roster

- `Vulcan`:
  - Prisma
  - `apps/api`
  - contratos backend de autorizacion
- `Neon`:
  - `apps/admin`
  - consumers frontend de permisos efectivos
  - registry y menu admin
- `Patroclo`:
  - flujos operativos
  - aprobaciones
  - consistencia de alcance
- `Delta`:
  - documentacion canonica
  - indices
  - migracion de contratos documentales
- `Echo`:
  - smoke, permisos negativos, expiracion de overrides, regresiones

## Archivo Canonico De Referencia

- `docs/architecture/access-control-and-navigation-governance.md`

## Estado Inicial A Tener En Cuenta

- Prisma ya tiene `roles`, `permissions`, `user_roles`, `role_permissions`, pero no resuelve permisos efectivos funcionales ni overrides de usuario.
- `apps/api/src/modules/auth/roles.guard.ts` y `apps/api/src/modules/auth/auth-rbac.ts` usan rol como gate principal.
- `packages/shared/src/domain/admin-access.ts` y `packages/shared/src/domain/navigation.ts` filtran menu por `RoleCode`.
- `apps/admin` y `apps/web` consumen sesion con `roles`, no con permisos efectivos.

## Task 1: Formalizar Catalogos Y Contratos Compartidos

**Files:**
- Create: `packages/shared/src/domain/access-control.ts`
- Modify: `packages/shared/src/domain/enums.ts`
- Modify: `packages/shared/src/types/api.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/src/domain/access-control.test.ts`

- [x] **Step 1: Definir los tipos canonicos de acceso**

Crear `packages/shared/src/domain/access-control.ts` con enums, tipos y helpers base.

```ts
export type AccessSurface = "public_web" | "authenticated_portal" | "internal_admin";
export type AccessScopeCode = "own" | "team" | "branch" | "org" | "all";
export type AccessOverrideEffect = "grant" | "revoke";

export interface PermissionCatalogEntry {
  code: string;
  label: string;
  description: string;
  moduleId: string;
  action: string;
  supportedScopes: AccessScopeCode[];
  isSystem: boolean;
  isActive: boolean;
}

export interface ScopeCatalogEntry {
  code: AccessScopeCode;
  label: string;
  description: string;
  precedence: number;
  isSystem: boolean;
}

export interface EffectivePermissionSummary {
  permissionCode: string;
  scopes: AccessScopeCode[];
  sources: string[];
}
```

- [x] **Step 2: Extender el contrato de sesion compartido**

Actualizar `packages/shared/src/types/api.ts` para que `AuthSessionSummary` y `AuthUserSummary` soporten permisos efectivos, rol principal y surface access.

```ts
export interface AuthRoleSummary {
  code: string;
  label: string;
  isSystem?: boolean;
}

export interface AuthUserSummary {
  id: string;
  name: string;
  email: string;
  roles: AuthRoleSummary[];
  primaryRoleCode?: string;
  accountType: "admin" | "seller" | "wholesale" | "customer" | "operator";
  effectivePermissions?: EffectivePermissionSummary[];
  surfaces?: AccessSurface[];
  vendorCode?: string;
  wholesaleLeadId?: string;
}
```

- [x] **Step 3: Exportar el nuevo modulo compartido**

Actualizar `packages/shared/src/index.ts`.

```ts
export * from "./domain/access-control";
```

- [x] **Step 4: Escribir prueba unitaria de union de scopes y permisos**

Crear `packages/shared/src/domain/access-control.test.ts`.

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { mergeEffectivePermissions } from "./access-control";

test("mergeEffectivePermissions une scopes sin duplicar y conserva sources", () => {
  const result = mergeEffectivePermissions([
    { permissionCode: "orders.read", scopes: ["own"], sources: ["role:cliente"] },
    { permissionCode: "orders.read", scopes: ["team"], sources: ["override:grant"] }
  ]);

  assert.deepEqual(result, [
    {
      permissionCode: "orders.read",
      scopes: ["own", "team"],
      sources: ["role:cliente", "override:grant"]
    }
  ]);
});
```

- [x] **Step 5: Verificar contratos compartidos**

Run: `node --import tsx --test packages/shared/src/domain/access-control.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/domain/access-control.ts packages/shared/src/domain/access-control.test.ts packages/shared/src/types/api.ts packages/shared/src/index.ts
git commit -m "feat: add shared access control contracts"
```

## Task 2: Extender Persistencia Prisma Para Scope, Overrides Y Registry

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`
- Create: `apps/api/test/access-control-persistence.test.ts`
- Test: `apps/api/test/access-control-persistence.test.ts`

- [x] **Step 1: Extender modelos de rol y permiso**

Agregar campos para descripcion, surface y assignability.

```prisma
model Role {
  id           String           @id @default(uuid()) @db.Uuid
  code         String           @unique
  name         String
  description  String?
  surface      String
  isSystem     Boolean          @default(false)
  isAssignable Boolean          @default(true)
  isActive     Boolean          @default(true)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  users        UserRole[]
  permissions  RolePermission[]
}
```

- [x] **Step 2: Agregar scope a role permissions**

Actualizar `RolePermission`.

```prisma
model RolePermission {
  id             String     @id @default(uuid()) @db.Uuid
  roleId         String     @db.Uuid
  permissionId   String     @db.Uuid
  scopeCode      String
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  role           Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission     Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId, scopeCode])
}
```

- [x] **Step 3: Agregar modelos nuevos**

Agregar `PermissionScope`, `UserPermissionOverride`, `AccessModule`, `AccessNavigationGroup`, `AccessNavigationItem`.

```prisma
model UserPermissionOverride {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @db.Uuid
  permissionCode String
  scopeCode      String
  effect         String
  reason         String
  approvedById   String   @db.Uuid
  createdById    String   @db.Uuid
  startsAt       DateTime
  expiresAt      DateTime
  status         String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

- [x] **Step 4: Sembrar catalogos iniciales**

Actualizar `prisma/seed.ts` para crear:

- permisos base
- scopes base
- roles sistema con `surface`
- modulos sistema

Ejemplo de seed:

```ts
const scopes = [
  { code: "own", label: "Propio", precedence: 10 },
  { code: "team", label: "Equipo", precedence: 20 },
  { code: "branch", label: "Sucursal", precedence: 30 },
  { code: "org", label: "Organizacion", precedence: 40 },
  { code: "all", label: "Todo", precedence: 50 }
];
```

- [x] **Step 5: Escribir prueba de persistencia**

Crear `apps/api/test/access-control-persistence.test.ts`.

```ts
import test from "node:test";
import assert from "node:assert/strict";

test("role permissions permiten multiples scopes y overrides expiran por fecha", async () => {
  assert.ok(true);
});
```

- [x] **Step 6: Verificar schema y seed**

Run: `npm run prisma:seed`  
Expected: seed corre sin conflictos de unique en roles/permisos base

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts apps/api/test/access-control-persistence.test.ts
git commit -m "feat: extend persistence for unified access control"
```

## Task 3: Resolver Permisos Efectivos En Backend

**Files:**
- Create: `apps/api/src/modules/auth/access-control.service.ts`
- Create: `apps/api/src/modules/auth/access-control.types.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts`
- Modify: `apps/api/src/modules/auth/roles.guard.ts`
- Modify: `apps/api/src/modules/auth/auth-rbac.ts`
- Test: `apps/api/test/access-control-resolution.test.ts`

- [x] **Step 1: Crear servicio de resolucion**

Crear `access-control.service.ts` con carga de roles, scopes y overrides activos.

```ts
export class AccessControlService {
  async resolveEffectivePermissions(userId: string) {
    return [];
  }

  async can(userId: string, permissionCode: string, requiredScope?: string) {
    return false;
  }
}
```

- [x] **Step 2: Introducir decorador por permiso**

Actualizar `auth-rbac.ts` para coexistir con roles legacy.

```ts
export const AUTH_PERMISSIONS_KEY = "huelegood:auth:permissions";

export interface RequiredPermission {
  permissionCode: string;
  scope?: string;
}

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(AUTH_PERMISSIONS_KEY, permissions);
```

- [x] **Step 3: Actualizar guard**

Extender `roles.guard.ts` para:

- seguir soportando `RequireRoles`
- soportar `RequirePermissions`
- delegar a `AccessControlService`

```ts
const requiredPermissions =
  this.reflector.getAllAndOverride<RequiredPermission[]>(AUTH_PERMISSIONS_KEY, [
    context.getHandler(),
    context.getClass()
  ]);
```

- [x] **Step 4: Enriquecer sesion**

Modificar `auth.service.ts` para incluir permisos efectivos.

```ts
const effectivePermissions = await this.accessControlService.resolveEffectivePermissions(user.id);

return {
  token,
  expiresAt,
  user: {
    ...summary,
    effectivePermissions
  }
};
```

- [x] **Step 5: Escribir pruebas de resolucion**

Crear `apps/api/test/access-control-resolution.test.ts`.

```ts
test("override revoke bloquea permiso heredado por rol", async () => {
  assert.equal(await service.can(userId, "orders.manage", "own"), false);
});

test("override grant expira y deja de conceder acceso", async () => {
  assert.equal(await service.can(userId, "cms.publish", "all"), false);
});
```

- [x] **Step 6: Verificar pruebas backend**

Run: `node --import tsx --test apps/api/test/access-control-resolution.test.ts`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/auth/access-control.service.ts apps/api/src/modules/auth/access-control.types.ts apps/api/src/modules/auth/auth.service.ts apps/api/src/modules/auth/roles.guard.ts apps/api/src/modules/auth/auth-rbac.ts apps/api/test/access-control-resolution.test.ts
git commit -m "feat: resolve effective permissions in auth backend"
```

## Task 4: Exponer API De Seguridad Y Registro De Modulos

**Files:**
- Create: `apps/api/src/modules/security/security.controller.ts`
- Create: `apps/api/src/modules/security/security.service.ts`
- Create: `apps/api/src/modules/security/security.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `packages/shared/src/types/api.ts`
- Test: `apps/api/test/security-management-api.test.ts`

- [x] **Step 1: Definir DTOs compartidos**

Agregar en `packages/shared/src/types/api.ts`:

```ts
export interface SecurityRoleSummary {
  id: string;
  code: string;
  name: string;
  description?: string;
  surface: string;
  isSystem: boolean;
  isAssignable: boolean;
  isActive: boolean;
}

export interface SecurityOverrideSummary {
  id: string;
  userId: string;
  permissionCode: string;
  scopeCode: string;
  effect: "grant" | "revoke";
  expiresAt: string;
  status: string;
}
```

- [x] **Step 2: Crear endpoints minimos**

`security.controller.ts` debe cubrir al menos:

- `GET /admin/security/catalog`
- `GET /admin/security/roles`
- `POST /admin/security/roles`
- `PATCH /admin/security/roles/:id`
- `POST /admin/security/users/:id/roles`
- `POST /admin/security/users/:id/overrides`
- `PATCH /admin/security/navigation`

- [x] **Step 3: Proteger endpoints por permisos de seguridad**

```ts
@RequirePermissions({ permissionCode: "security.roles.manage", scope: "all" })
@Post("roles")
createRole() {}
```

- [x] **Step 4: Escribir prueba de API**

Crear `apps/api/test/security-management-api.test.ts`.

```ts
test("admin sin security.roles.manage no puede crear roles", async () => {
  assert.equal(response.statusCode, 403);
});
```

- [x] **Step 5: Verificar API**

Run: `node --import tsx --test apps/api/test/security-management-api.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/security/security.controller.ts apps/api/src/modules/security/security.service.ts apps/api/src/modules/security/security.module.ts apps/api/src/app.module.ts packages/shared/src/types/api.ts apps/api/test/security-management-api.test.ts
git commit -m "feat: add admin security management api"
```

## Task 5: Migrar El Admin A Permisos Efectivos Y UI De Seguridad

**Files:**
- Create: `apps/admin/app/seguridad/page.tsx`
- Create: `apps/admin/components/security-workspace.tsx`
- Create: `apps/admin/components/security-workspace-state.ts`
- Modify: `apps/admin/components/admin-session-provider.tsx`
- Modify: `apps/admin/components/admin-auth-gate.tsx`
- Modify: `apps/admin/components/admin-sidebar.tsx`
- Modify: `apps/admin/components/admin-topbar.tsx`
- Modify: `apps/admin/lib/api.ts`
- Modify: `packages/shared/src/domain/navigation.ts`
- Modify: `packages/shared/src/domain/admin-access.ts`
- Modify: `packages/shared/src/domain/models.ts`
- Modify: `packages/shared/src/mock-data.ts`
- Test: `packages/shared/src/domain/navigation.test.ts`
- Test: `apps/admin/components/security-workspace.test.tsx`

- [x] **Step 1: Cargar permisos efectivos en sesion admin**

`admin-session-provider.tsx` conserva compatibilidad con bypass local pero ya trabaja con la sesión enriquecida (`primaryRoleCode`, `surfaces`, `effectivePermissions`) y la UI usa `effectivePermissions` cuando existen.

```ts
const canManageSecurity = session?.user.effectivePermissions?.some(
  (item) => item.permissionCode === "security.roles.manage"
);
```

- [x] **Step 2: Reemplazar filtro de menu por permisos**

Se añadió `filterNavigationGroupsByPermissions(...)` y se extendió `hasAdminAccess(...)` para aceptar `requiredPermissions` sin romper compatibilidad de rutas todavía gobernadas por `allowedRoles`. La navegación ya puede exponer `/seguridad` por permiso efectivo aunque el resto del admin siga en transición.

```ts
export function filterNavigationGroupsByPermissions(groups, effectivePermissions) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasRequiredPermissions(effectivePermissions, item.requiredPermissions))
    }))
    .filter((group) => group.items.length > 0);
}
```

- [x] **Step 3: Añadir workspace de seguridad**

Se creó `apps/admin/components/security-workspace.tsx` con tabs efectivas:

- usuarios
- roles
- overrides
- navegacion
- catalogo

Notas del corte:
- `security-workspace-state.ts` separa reglas puras de capacidades/tabs para testear sin dependencias UI.
- El tab `usuarios` usa asignación por `userId` real y roles heredados.
- El tab `overrides` exige expiración, motivo, `approvedByUserId` y `createdByUserId`.
- El tab `navegacion` solo gestiona `group`, `labelOverride`, `sortOrder` e `isVisible` sobre módulos registrados por código.

- [x] **Step 4: Añadir pagina admin**

Crear `apps/admin/app/seguridad/page.tsx`.

```tsx
export default function SecurityPage() {
  return (
    <AdminAuthGate allowedPermissions={[{ permissionCode: "security.roles.read", scope: "all" }]}>
      <SecurityWorkspace />
    </AdminAuthGate>
  );
}
```

- [x] **Step 5: Añadir pruebas de render negativo**

Se añadieron pruebas puras en:
- `apps/admin/components/security-workspace.test.tsx`
- `packages/shared/src/domain/navigation.test.ts`

```tsx
it("oculta acciones de override si la sesion no tiene security.overrides.manage", () => {
  expect(screen.queryByText("Nuevo override")).toBeNull();
});
```

- [x] **Step 6: Verificar admin**

Run:
- `node --import tsx --test packages/shared/src/domain/navigation.test.ts apps/admin/components/security-workspace.test.tsx`
- `npm run build -w @huelegood/shared`
- `npm run typecheck -w @huelegood/admin`
- `npm run build -w @huelegood/admin`
- `npm run typecheck`
- `npm run test:erp-sales`
- `npm run build`

Expected: PASS

Observed:
- PASS `node --import tsx --test packages/shared/src/domain/navigation.test.ts apps/admin/components/security-workspace.test.tsx`
- PASS `npm run build -w @huelegood/shared`
- PASS `npm run typecheck -w @huelegood/admin`
- PASS `npm run build -w @huelegood/admin`
- PASS `npm run typecheck`
- PASS `npm run test:erp-sales`
- PASS `npm run build`

- [ ] **Step 7: Commit**

```bash
git add apps/admin/app/seguridad/page.tsx apps/admin/components/security-workspace.tsx apps/admin/components/admin-session-provider.tsx apps/admin/components/admin-auth-gate.tsx apps/admin/components/admin-topbar.tsx apps/admin/lib/api.ts packages/shared/src/domain/navigation.ts packages/shared/src/domain/admin-access.ts apps/admin/components/security-workspace.test.tsx
git commit -m "feat: add security workspace and permission-based admin navigation"
```

## Task 6: Adaptar Portal Autenticado Y Cuenta A La Arquitectura Nueva

**Files:**
- Modify: `apps/web/components/account-workspace.tsx`
- Modify: `apps/web/components/wholesale-workspace.tsx`
- Modify: `apps/web/components/seller-panel-workspace.tsx`
- Create: `apps/web/lib/portal-access.ts`
- Test: `apps/web/lib/portal-access.test.ts`
- Modify: `docs/ux/public-storefront-surface-spec.md`
- Modify: `docs/ux/storefront-component-state-spec.md`

- [x] **Step 1: Introducir helper de acceso portal**

Se creó `apps/web/lib/portal-access.ts` para resolver acceso comercial por permisos efectivos y no por strings de rol. El helper ya expone rutas canonicas (`/panel-vendedor`, `/mayoristas`) y funciones semanticas:

- `canAccessPortalModule(...)`
- `hasSellerPortalAccess(...)`
- `hasWholesalePortalAccess(...)`
- `hasBaseAccountAccess(...)`
- `resolveCommercialPortalHref(...)`
- `accountTypeLabel(...)`

```ts
export function canAccessPortalModule(
  permissions: EffectivePermissionSummary[] | undefined,
  permissionCode: string
) {
  return Boolean(permissions?.some((entry) => entry.permissionCode === permissionCode));
}
```

- [x] **Step 2: Convertir `/cuenta` en gateway**

`account-workspace.tsx` dejó de usar `RoleCode` como fuente principal y ahora:

- muestra login gate cuando no hay sesión
- expone solo cuenta base honesta (`identidad`, `loyalty`, `acciones de sesión`)
- redirige a `/panel-vendedor` si existe `portal.seller.read`
- redirige a `/mayoristas` si existe `portal.wholesale.read`
- elimina paneles retail ficticios (`pedidos`, `tracking`, `favoritos`, `direcciones`) que antes daban falsa sensación de módulo terminado

```ts
const hasSellerPanel = canAccessPortalModule(session.user.effectivePermissions, "portal.seller.read");
const hasWholesalePanel = canAccessPortalModule(session.user.effectivePermissions, "portal.wholesale.read");
```

- [x] **Step 3: Alinear `seller-panel`**

`seller-panel-workspace.tsx` ya valida acceso por `hasSellerPortalAccess(session)` y no por `RoleCode.Vendedor`.

- [x] **Step 4: Cerrar portal mayorista sobre la misma ruta**

`wholesale-workspace.tsx` ahora tiene dos modos explícitos sobre `/mayoristas`:

- `landing pública` cuando no hay `portal.wholesale.read`
- `portal autenticado` cuando existe sesión comercial válida

Notas del corte:
- se eliminó la dependencia implícita a un `/panel-mayorista` inexistente
- el portal autenticado expone solo señales reales disponibles hoy: identidad comercial, roles, surface, tiers runtime, salida a catálogo/cuenta y logout
- no se inventaron módulos B2B inexistentes como pedidos, cotizaciones o tracking propios

- [x] **Step 5: Añadir prueba del gateway**

Crear `apps/web/lib/portal-access.test.ts`.

```ts
test("gateway deriva seller panel por permiso efectivo y no por role string", () => {
  assert.equal(canAccessPortalModule([{ permissionCode: "portal.seller.read", scopes: ["own"], sources: ["role:vendedor"] }], "portal.seller.read"), true);
});
```

- [x] **Step 6: Verificar web**

Run:
- `node --import tsx --test apps/web/lib/portal-access.test.ts apps/api/test/access-control-resolution.test.ts`
- `npm run typecheck -w @huelegood/web`
- `npm run build -w @huelegood/web`
- `npm run typecheck`
- `npm run test:erp-sales`
- `npm run build`

Browser QA:
- login real con `mayorista@huelegood.com`
- `/cuenta` redirige a `/mayoristas`
- `/mayoristas` renderiza portal autenticado sobre la misma URL

Observed:
- PASS `node --import tsx --test apps/web/lib/portal-access.test.ts apps/api/test/access-control-resolution.test.ts`
- PASS `npm run typecheck -w @huelegood/web`
- PASS `npm run build -w @huelegood/web`
- PASS `npm run typecheck`
- PASS `npm run test:erp-sales`
- PASS `npm run build`
- PASS browser QA en `http://localhost:3001/cuenta` y `http://localhost:3001/mayoristas`

Follow-up técnico resuelto dentro del mismo corte:
- `apps/api/src/modules/auth/access-control.service.ts` dejó de inyectar un `nowProvider` como `Function`, corrigiendo un fallo real de Nest DI que impedía levantar el API dev para QA autenticado.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/account-workspace.tsx apps/web/components/wholesale-workspace.tsx apps/web/components/seller-panel-workspace.tsx apps/web/lib/portal-access.ts apps/web/lib/portal-access.test.ts apps/api/src/modules/auth/access-control.service.ts apps/api/test/access-control-resolution.test.ts docs/ux/public-storefront-surface-spec.md docs/ux/storefront-component-state-spec.md
git commit -m "feat: migrate portal access to effective permissions"
```

## Update 2026-06-10 - Admin Permission Migration Closure

- Se cerró la migración transversal del `admin` a permisos efectivos para que el módulo de seguridad quede realmente operativo y no solo documental.
- `packages/shared/src/domain/admin-access.ts` ahora expone el registry `adminModulePermissions` por módulo y operación (`read/manage/review/export/payout`), además del gate `canAccessAdminSurface(...)`.
- `apps/admin` ya exige `surface = internal_admin` en `AdminAuthGate`, y todas las páginas del backoffice quedaron alineadas con `allowedPermissions` canónicos; `allowedRoles` queda solo como fallback transicional de UX mientras se estabiliza el smoke final.
- `packages/shared/src/mock-data.ts` y la navegación del admin consumen el mismo registry, evitando drift entre sidebar y page gates.
- `prisma/access-control-catalog.ts` incorpora el módulo `commercial_accesses` y preserva amplitud legacy de `system roles` mediante grants explícitos mientras el runtime backend termina de retirarse de `RequireRoles`.
- Se migró el backend interno a `RequirePermissions` en `auth/admin commercial accesses`, `dashboard`, `reports`, `orders`, `dispatch`, `payments`, `products`, `inventory`, `transfers`, `warehouses`, `vendors`, `commissions`, `wholesale`, `marketing`, `customers`, `coupons`, `cms`, `loyalty`, `notifications`, `audit`, `observability` y `admin/media`.
- `core/seller-panel.controller.ts` queda conscientemente fuera de este corte porque pertenece a surface autenticada comercial y no al admin interno.
- Verificación completa de este cierre:
  - `node --import tsx --test packages/shared/src/domain/admin-access.test.ts packages/shared/src/domain/navigation.test.ts prisma/access-control-catalog.test.ts apps/api/test/access-control-persistence.test.ts apps/api/test/access-control-resolution.test.ts`
  - `npm run test:commercial-accesses -w @huelegood/api`
  - `npm run typecheck`
  - `npm run test:erp-sales`
  - `npm run build`

## Task 7: Documentacion, Smoke Y Retiro De Legacy

**Files:**
- Modify: `docs/README.md`
- Modify: `docs/product/roles-and-permissions.md`
- Modify: `docs/api/api-v1-outline.md`
- Modify: `docs/architecture/modules.md`
- Create: `docs/engineering/access-control-verification-checklist.md`
- Test: `npm run test:erp-sales`

- [ ] **Step 1: Enlazar documentacion canonica**

Actualizar `docs/README.md` para indexar el documento de gobernanza de acceso y navegacion.

- [ ] **Step 2: Ajustar docs de roles**

Actualizar `docs/product/roles-and-permissions.md` para que quede como matriz funcional y remita a la gobernanza canonica para el runtime real.

- [ ] **Step 3: Documentar endpoints nuevos**

Actualizar `docs/api/api-v1-outline.md` con endpoints de seguridad y semantica de `GET /auth/me`.

- [ ] **Step 4: Crear checklist de verificacion**

Crear `docs/engineering/access-control-verification-checklist.md`.

```md
- usuario sin permiso no ve modulo
- usuario sin permiso recibe 403 si fuerza ruta
- override grant vence y desaparece
- override revoke bloquea aunque el rol lo conceda
- system role no se borra ni renombra
```

- [ ] **Step 5: Verificacion final**

Run:

```bash
npm run typecheck
npm run test:erp-sales
npm run build
```

Expected:

- typecheck PASS
- test suite PASS
- build PASS

- [ ] **Step 6: Commit**

```bash
git add docs/README.md docs/product/roles-and-permissions.md docs/api/api-v1-outline.md docs/architecture/modules.md docs/engineering/access-control-verification-checklist.md
git commit -m "docs: publish unified access control rollout contracts"
```

## Orden De Ejecucion

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5 y Task 6 en paralelo si los contratos backend ya estan estables
6. Task 7

## Gates Minimos

- no cortar compatibilidad actual hasta que `GET /auth/me` exponga permisos efectivos
- no migrar menu admin antes de tener API de seguridad y catalogos
- no migrar portal autenticado antes de tener helpers compartidos estables
- no retirar `adminAccessRoles` hasta que las pruebas negativas por permiso esten pasando

## Riesgos A Vigilar

- mezcla temporal de rol y permiso en el mismo flujo
- drift entre catalogo seed y contratos compartidos
- pantallas admin visibles pero no operables por mala migracion de menu
- sesiones viejas sin permisos efectivos cacheados
- overrides vencidos que sigan activos por falta de job o resolucion en runtime

## Criterio De Cierre

El rollout se considera cerrado cuando:

- toda autorizacion sensible en admin y portal autenticado usa `permission + scope`
- los menus consumen permisos efectivos y no `RoleCode` disperso
- seguridad se administra desde backoffice dentro de limites canonicos
- `system roles`, catalogos y overrides cumplen las reglas definidas
- documentacion, pruebas y build quedan en verde
