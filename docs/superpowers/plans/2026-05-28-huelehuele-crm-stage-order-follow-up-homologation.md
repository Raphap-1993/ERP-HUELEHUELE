# Huele Huele CRM Stage Order Follow-Up Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir el slice canonico `008-crm-stage-order-follow-up` en `ERP-HUELEHUELE` como homologacion brownfield `as-is`, dejando Fases 1-4 y la capa transversal listas para el seguimiento operativo derivado del pedido que hoy vive en `orders`, con `crmStage`, `commercialTrace` y `Pedidos > Operacion` formalizados sin mezclar CRM manual, clientes, fulfillment ni notifications como dominios principales.

**Architecture:** La homologacion aterriza sobre el modulo `orders` ya vivo en runtime: `orders` como agregado principal, `crmStage` como estado derivado desde `orderStatus` y `paymentStatus`, `commercialTrace` como puente comercial de confirmacion con rutas `manual_direct`, `manual_request`, `openpay_backoffice` y `openpay_provider`, y la superficie visible `Pedidos > Operacion` como contrato UX principal del slice. La capa canonica debe fijar ownership de `Ventas`, el papel acotado de `OperadorPagos`, la relacion explicita entre `crmStage` y `commercialTrace`, el cierre negativo cuando el pedido cae, y la exclusion de CRM manual, fulfillment, despacho, vendor assignment y dashboards.

**Tech Stack:** Markdown, git worktree, monorepo `Next.js` + `NestJS` + `Prisma`, runtime real en `apps/admin`, `apps/api`, `packages/shared` y `apps/api/test`, verificacion documental con `git diff --check`, `rg`, `find`, `sed` y chequeo local de consistencia.

---

## File Structure

### Existing files to modify

- `docs/fase-1-analisis-requerimientos/README.md`
- `docs/fase-2-ux-ui/README.md`
- `docs/fase-3-arquitectura/README.md`
- `docs/fase-4-sdd/README.md`
- `docs/transversal/90.00-mapa-homologacion-brownfield.md`
- `AI_CONTEXT.md`
- `TRACEABILITY_MATRIX.md`
- `PROJECT_MAP.md`

### New Phase 1 files

- `docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-22-derivacion-de-etapa-crm-del-pedido.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-23-confirmacion-comercial-y-traza-operativa-del-pedido.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-24-cierre-derivado-del-seguimiento-del-pedido.md`
- `docs/fase-1-analisis-requerimientos/reglas/crm-stage-y-order-follow-up.md`

### New Phase 2 files

- `docs/fase-2-ux-ui/02.07-crm-stage-order-follow-up-ux-ui.md`
- `specs/008-crm-stage-order-follow-up/product-design.md`
- `specs/008-crm-stage-order-follow-up/spdd-frontend.md`

### New Phase 3 files

- `docs/fase-3-arquitectura/03.10-crm-stage-order-follow-up.md`
- `docs/fase-3-arquitectura/adr/ADR-008-orders-crm-follow-up-boundary.md`

### New Phase 4 files

- `specs/008-crm-stage-order-follow-up/spec-funcional.md`
- `specs/008-crm-stage-order-follow-up/spec-tecnica.md`
- `specs/008-crm-stage-order-follow-up/spec-tareas.md`
- `specs/008-crm-stage-order-follow-up/traceability.md`

### Responsibilities

- Fase 1 fija alcance funcional, actores, ownership, state machine de `crmStage`, semantica de `commercialTrace` y limites del slice.
- Fase 2 fija el contrato UX de `Pedidos > Operacion` para `Etapa CRM`, `Seguimiento` y `CommercialTraceCard`, sin convertir la vista en CRM manual ni en tablero global de operaciones.
- Fase 3 fija ownership entre `orders`, `Ventas`, `OperadorPagos` y notifications, mas los invariantes de derivacion, confirmacion, rechazo y cierre.
- Fase 4 convierte el slice en paquete SDD trazable para evolucion futura.
- La capa transversal actualiza el principal gap abierto del canon: ya no falta “CRM basico” sino el seguimiento derivado del pedido y, despues de eso, el CRM manual/ampliado que aun no tiene slice propio.

### Task 1: Abrir Fase 1 del slice `008-crm-stage-order-follow-up`

**Files:**
- Modify: `docs/fase-1-analisis-requerimientos/README.md`
- Create: `docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-22-derivacion-de-etapa-crm-del-pedido.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-23-confirmacion-comercial-y-traza-operativa-del-pedido.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-24-cierre-derivado-del-seguimiento-del-pedido.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/crm-stage-y-order-follow-up.md`

- [ ] **Step 1: Releer el runtime real de orders y seguimiento**

Run:

```bash
sed -n '1,120p' apps/admin/app/pedidos/page.tsx
sed -n '240,380p' apps/admin/components/orders-workspace.tsx
sed -n '1940,2185p' apps/admin/components/orders-workspace.tsx
sed -n '2588,2665p' apps/admin/components/orders-workspace.tsx
sed -n '250,320p' apps/api/src/modules/orders/orders.service.ts
sed -n '2320,2775p' apps/api/src/modules/orders/orders.service.ts
sed -n '2910,3075p' apps/api/src/modules/orders/orders.service.ts
sed -n '1330,1425p' packages/shared/src/types/api.ts
sed -n '45,60p' packages/shared/src/domain/enums.ts
```

Expected: evidencia clara de `crmStage`, `commercialTrace`, `CommercialTraceCard`, `CrmStage.ReadyForFollowUp`, `CrmStage.FollowUp`, `CrmStage.Closed`, rutas `manual_direct`, `manual_request`, `openpay_backoffice`, `openpay_provider` y estados `pending`, `confirmed`, `rejected`.

- [ ] **Step 2: Confirmar el ownership operativo y sus bordes**

Run:

```bash
sed -n '1,120p' packages/shared/src/domain/admin-access.ts
rg -n "followup|crmStage|commercialTrace|seguimiento CRM" docs/product/roles-and-permissions.md apps/admin/components/orders-workspace.tsx apps/api/src/modules/orders/orders.service.ts
```

Expected: evidencia de `adminAccessRoles.orders`, de `Ventas` como owner natural del seguimiento y de `OperadorPagos` actuando solo como actor de cobro/conciliacion.

- [ ] **Step 3: Actualizar el indice de Fase 1**

Anadir en `docs/fase-1-analisis-requerimientos/README.md`:

```md
## Slice 008 - CRM Stage Order Follow-Up
- [01.07-crm-stage-order-follow-up.md](01.07-crm-stage-order-follow-up.md)
- [casos-de-uso/UC-22-derivacion-de-etapa-crm-del-pedido.md](casos-de-uso/UC-22-derivacion-de-etapa-crm-del-pedido.md)
- [casos-de-uso/UC-23-confirmacion-comercial-y-traza-operativa-del-pedido.md](casos-de-uso/UC-23-confirmacion-comercial-y-traza-operativa-del-pedido.md)
- [casos-de-uso/UC-24-cierre-derivado-del-seguimiento-del-pedido.md](casos-de-uso/UC-24-cierre-derivado-del-seguimiento-del-pedido.md)
- [reglas/crm-stage-y-order-follow-up.md](reglas/crm-stage-y-order-follow-up.md)
```

- [ ] **Step 4: Crear el documento rector de Fase 1**

Crear `docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md` con esta estructura base:

```md
# Fase 1 - CRM Stage Order Follow-Up

## Objetivo
Homologar el seguimiento operativo derivado del pedido que hoy vive en `orders`, formalizando `crmStage`, `commercialTrace` y la vista `Pedidos > Operacion` sin convertir el slice en CRM manual ni absorber clientes, fulfillment o notifications como ownership principal.

## Dentro de alcance
- `orders`
- `Pedidos > Operacion`
- `crmStage` derivado
- `commercialTrace`
- `CommercialTraceCard`
- `manual_direct`
- `manual_request`
- `openpay_backoffice`
- `openpay_provider`
- estados `pending`, `confirmed`, `rejected`
- cierre `closed` por `Delivered` o `Completed`

## Fuera de alcance
- maestro de clientes
- conflictos de identidad
- notas manuales de seguimiento
- tareas comerciales
- timeline CRM completo
- fulfillment
- dispatch
- vendor assignment
- dashboard
- notifications como owner principal

## Regla critica
- `commercialTrace` explica la ruta y el hito comercial del pedido
- `crmStage` resume en que punto operativo/comercial queda el pedido
- si el pedido cae, `crmStage` se limpia y `commercialTrace` conserva el cierre comercial
```

- [ ] **Step 5: Crear los tres casos de uso canonicos**

Crear `UC-22-derivacion-de-etapa-crm-del-pedido.md`:

```md
# UC-22 Derivacion De Etapa CRM Del Pedido

## Actores
- ventas
- orders

## Flujo principal
1. el pedido cambia de estado o de situacion de pago
2. `orders` recalcula `crmStage`
3. el pedido queda en `ready_for_followup`, `followup` o `closed`
4. `Pedidos > Operacion` refleja la etapa y el seguimiento sin edicion manual
```

Crear `UC-23-confirmacion-comercial-y-traza-operativa-del-pedido.md`:

```md
# UC-23 Confirmacion Comercial Y Traza Operativa Del Pedido

## Actores
- ventas
- operador_pagos
- orders

## Flujo principal
1. una ruta de cobro o decision operativa confirma o rechaza comercialmente el pedido
2. `orders` registra o recalcula `commercialTrace`
3. la ruta queda como `manual_direct`, `manual_request`, `openpay_backoffice` u `openpay_provider`
4. la traza conserva `status`, `actor`, `reference`, `note` y evidencia cuando aplica
```

Crear `UC-24-cierre-derivado-del-seguimiento-del-pedido.md`:

```md
# UC-24 Cierre Derivado Del Seguimiento Del Pedido

## Actores
- ventas
- orders

## Flujo principal
1. el pedido avanza a `Delivered` o `Completed`
2. `orders` deriva `crmStage = closed`
3. `Pedidos > Operacion` muestra el cierre del seguimiento
4. si el pedido cae o el pago falla, `crmStage` se limpia y `commercialTrace` conserva el cierre rechazado
```

- [ ] **Step 6: Crear la hoja de reglas funcionales**

Crear `docs/fase-1-analisis-requerimientos/reglas/crm-stage-y-order-follow-up.md`:

```md
# Reglas De CRM Stage Y Order Follow-Up

- `orders` es el agregado principal
- `Pedidos > Operacion` es la superficie visible principal
- `ventas` es owner operativo principal
- `operador_pagos` solo empuja transiciones de cobro
- `crmStage` es estado derivado `as-is`, no workflow editable manualmente
- `crmStage` usa `ready_for_followup`, `followup` y `closed`
- `commercialTrace` es puente comercial de confirmacion, no bitacora completa de CRM
- `commercialTrace` usa `manual_direct`, `manual_request`, `openpay_backoffice` y `openpay_provider`
- `commercialTrace` usa `pending`, `confirmed` y `rejected`
- `commercialTrace.pending` forma parte del runtime canonico
- si el pedido cae o el pago falla/rechaza, `crmStage` se limpia y `commercialTrace` conserva el cierre comercial
- notifications entra solo como side effect secundario
```

- [ ] **Step 7: Verificar Fase 1 abierta**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort
rg -n "crmStage|commercialTrace|followup|openpay_provider|manual_request|Pedidos > Operacion|orders" docs/fase-1-analisis-requerimientos
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `008`.

- [ ] **Step 8: Commit de Fase 1**

```bash
git add docs/fase-1-analisis-requerimientos
git commit -m "docs: open crm stage order follow-up phase 1 slice"
```

### Task 2: Abrir Fase 2 y los artefactos UX del slice `008`

**Files:**
- Modify: `docs/fase-2-ux-ui/README.md`
- Create: `docs/fase-2-ux-ui/02.07-crm-stage-order-follow-up-ux-ui.md`
- Create: `specs/008-crm-stage-order-follow-up/product-design.md`
- Create: `specs/008-crm-stage-order-follow-up/spdd-frontend.md`

- [ ] **Step 1: Releer la superficie visible de `Pedidos > Operacion`**

Run:

```bash
sed -n '1940,2185p' apps/admin/components/orders-workspace.tsx
sed -n '2588,2665p' apps/admin/components/orders-workspace.tsx
```

Expected: contrato visible de `Etapa CRM`, `Seguimiento`, `CommercialTraceCard`, mensajes de impacto operativo y ausencia de CRM manual editable.

- [ ] **Step 2: Actualizar el indice de Fase 2**

Anadir en `docs/fase-2-ux-ui/README.md`:

```md
## Slice 008 - CRM Stage Order Follow-Up
- [02.07-crm-stage-order-follow-up-ux-ui.md](02.07-crm-stage-order-follow-up-ux-ui.md)
- [../../specs/008-crm-stage-order-follow-up/product-design.md](../../specs/008-crm-stage-order-follow-up/product-design.md)
- [../../specs/008-crm-stage-order-follow-up/spdd-frontend.md](../../specs/008-crm-stage-order-follow-up/spdd-frontend.md)
```

- [ ] **Step 3: Crear el documento de UX/UI de Fase 2**

Crear `docs/fase-2-ux-ui/02.07-crm-stage-order-follow-up-ux-ui.md`:

```md
# Fase 2 - CRM Stage Order Follow-Up UX/UI

## Objetivo
Formalizar la UX operativa vigente de `Pedidos > Operacion` para `crmStage` y `commercialTrace` sin convertirla en CRM manual ni mezclarla con fulfillment, despacho o vendedor.

## Superficies
- `SummaryTile` de `Etapa CRM`
- `SummaryTile` de `Seguimiento`
- `CommercialTraceCard`
- acciones de confirmacion o rechazo comercial

## Guardrails
- no abrir notas manuales de seguimiento
- no abrir tareas CRM
- no abrir timeline comercial completo
- no absorber fulfillment, dispatch ni vendor assignment
```

- [ ] **Step 4: Crear `product-design.md` del slice**

Crear `specs/008-crm-stage-order-follow-up/product-design.md`:

```md
# Product Design - CRM Stage Order Follow-Up

## Promesa de superficie
Ventas necesita ver de inmediato si el pedido ya esta listo para seguimiento, en seguimiento activo o cerrado, y entender por que ruta comercial quedo asi.

## Componentes principales
- summary tiles de `Etapa CRM` y `Seguimiento`
- `CommercialTraceCard`
- bloques operativos que disparan confirmacion o rechazo

## Decision clave
La vista explica el estado derivado del pedido y su traza comercial, pero no intenta reemplazar un CRM manual ni un tablero completo de operaciones.
```

- [ ] **Step 5: Crear `spdd-frontend.md` del slice**

Crear `specs/008-crm-stage-order-follow-up/spdd-frontend.md`:

```md
# SPDD Frontend - CRM Stage Order Follow-Up

## Superficies cubiertas
- `Pedidos > Operacion`

## Contratos visibles
- `Etapa CRM`
- `Seguimiento`
- `CommercialTraceCard`
- mensajes operativos de confirmacion y rechazo

## Reglas visibles
- `crmStage` no se edita manualmente
- `commercialTrace` no es bitacora completa de CRM
- fulfillment, despacho y vendedor quedan fuera del ownership del slice
```

- [ ] **Step 6: Verificar Fase 2 abierta**

Run:

```bash
find docs/fase-2-ux-ui -maxdepth 1 -type f | sort
find specs/008-crm-stage-order-follow-up -maxdepth 1 -type f | sort
rg -n "crmStage|commercialTrace|Seguimiento|Etapa CRM|CommercialTraceCard" docs/fase-2-ux-ui specs/008-crm-stage-order-follow-up
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `008`.

- [ ] **Step 7: Commit de Fase 2**

```bash
git add docs/fase-2-ux-ui specs/008-crm-stage-order-follow-up
git commit -m "docs: add crm stage order follow-up ux slice"
```

### Task 3: Abrir Fase 3 y la ADR del slice `008`

**Files:**
- Modify: `docs/fase-3-arquitectura/README.md`
- Create: `docs/fase-3-arquitectura/03.10-crm-stage-order-follow-up.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-008-orders-crm-follow-up-boundary.md`

- [ ] **Step 1: Releer la logica de derivacion y sincronizacion**

Run:

```bash
sed -n '250,320p' apps/api/src/modules/orders/orders.service.ts
sed -n '2910,3075p' apps/api/src/modules/orders/orders.service.ts
rg -n "crmStage =|syncCommercialTrace|resolveCommercialTrace|applyCommercialConfirmation" apps/api/src/modules/orders/orders.service.ts
```

Expected: evidencia de `resolveInitialCrmStage()`, `resolveOperationalCrmStage()`, `resolveCommercialTrace()` y `syncCommercialTrace()`.

- [ ] **Step 2: Actualizar el indice de Fase 3**

Anadir en `docs/fase-3-arquitectura/README.md`:

```md
## Slice 008 - CRM Stage Order Follow-Up
- [03.10-crm-stage-order-follow-up.md](03.10-crm-stage-order-follow-up.md)
- [adr/ADR-008-orders-crm-follow-up-boundary.md](adr/ADR-008-orders-crm-follow-up-boundary.md)
```

- [ ] **Step 3: Crear el documento de arquitectura del slice**

Crear `docs/fase-3-arquitectura/03.10-crm-stage-order-follow-up.md`:

```md
# 03.10 Arquitectura Canonica Brownfield CRM Stage Order Follow-Up

## Objetivo
Fijar la frontera canonica del seguimiento operativo derivado del pedido dentro de `orders`.

## Ownership
- `orders` gobierna `crmStage` y `commercialTrace`
- `Pedidos > Operacion` es la superficie visible
- `ventas` es owner operativo principal
- `operador_pagos` solo empuja transiciones de cobro
- notifications es side effect secundario

## Invariantes
- `crmStage` es derivado, no editable manualmente
- `commercialTrace` resume ruta y hito comercial
- `commercialTrace.pending` es canonico
- si el pedido cae, `crmStage` se limpia y `commercialTrace` conserva el cierre
```

- [ ] **Step 4: Crear la ADR del boundary**

Crear `docs/fase-3-arquitectura/adr/ADR-008-orders-crm-follow-up-boundary.md`:

```md
# ADR-008 Orders CRM Follow-Up Boundary

## Decision
Canonizar el seguimiento operativo del pedido dentro de `orders`, usando `crmStage` como estado derivado y `commercialTrace` como puente comercial de confirmacion.

## Guardrails
- no absorber clientes ni conflictos
- no abrir CRM manual
- no absorber fulfillment, dispatch ni vendor assignment
- no tratar notifications como owner
```

- [ ] **Step 5: Verificar Fase 3 abierta**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 1 -type f | sort
find docs/fase-3-arquitectura/adr -maxdepth 1 -type f | sort
rg -n "crmStage|commercialTrace|followup|orders|notifications" docs/fase-3-arquitectura
```

Expected: aparecen `03.10` y `ADR-008`, y el `rg` devuelve hits del slice `008`.

- [ ] **Step 6: Commit de Fase 3**

```bash
git add docs/fase-3-arquitectura
git commit -m "docs: add crm stage order follow-up architecture slice"
```

### Task 4: Abrir Fase 4 y el paquete SDD del slice `008`

**Files:**
- Modify: `docs/fase-4-sdd/README.md`
- Create: `specs/008-crm-stage-order-follow-up/spec-funcional.md`
- Create: `specs/008-crm-stage-order-follow-up/spec-tecnica.md`
- Create: `specs/008-crm-stage-order-follow-up/spec-tareas.md`
- Create: `specs/008-crm-stage-order-follow-up/traceability.md`

- [ ] **Step 1: Releer el baseline tecnico y las pruebas ya existentes**

Run:

```bash
sed -n '250,320p' apps/api/src/modules/orders/orders.service.ts
sed -n '2320,2775p' apps/api/src/modules/orders/orders.service.ts
sed -n '2910,3075p' apps/api/src/modules/orders/orders.service.ts
rg -n "commercialTrace|crmStage|openpay_backoffice|openpay_provider|manual_request|manual_direct" apps/api/test/erp-sales-flow.test.ts
```

Expected: evidencia de derivacion tecnica y de pruebas vivas sobre `commercialTrace`.

- [ ] **Step 2: Actualizar el indice de Fase 4**

Anadir en `docs/fase-4-sdd/README.md`:

```md
## Slice 008 - CRM Stage Order Follow-Up
- [../../specs/008-crm-stage-order-follow-up/spec-funcional.md](../../specs/008-crm-stage-order-follow-up/spec-funcional.md)
- [../../specs/008-crm-stage-order-follow-up/spec-tecnica.md](../../specs/008-crm-stage-order-follow-up/spec-tecnica.md)
- [../../specs/008-crm-stage-order-follow-up/spec-tareas.md](../../specs/008-crm-stage-order-follow-up/spec-tareas.md)
- [../../specs/008-crm-stage-order-follow-up/traceability.md](../../specs/008-crm-stage-order-follow-up/traceability.md)
```

- [ ] **Step 3: Crear `spec-funcional.md`**

Crear `specs/008-crm-stage-order-follow-up/spec-funcional.md` con estos ejes:

```md
# Spec Funcional - CRM Stage Order Follow-Up

## Reglas centrales
- `orders` es el agregado principal
- `crmStage` es derivado
- `commercialTrace` es puente comercial
- rutas: `manual_direct`, `manual_request`, `openpay_backoffice`, `openpay_provider`
- estados: `pending`, `confirmed`, `rejected`
- cierre negativo limpia `crmStage` y conserva `commercialTrace.rejected`
```

- [ ] **Step 4: Crear `spec-tecnica.md`**

Crear `specs/008-crm-stage-order-follow-up/spec-tecnica.md` con estos ejes:

```md
# Spec Tecnica - CRM Stage Order Follow-Up

## Baseline real
- `resolveInitialCrmStage()`
- `resolveOperationalCrmStage()`
- `resolveCommercialTrace()`
- `syncCommercialTrace()`
- `OrdersWorkspace`
- `CommercialTraceCard`
```

- [ ] **Step 5: Crear `spec-tareas.md`**

Crear `specs/008-crm-stage-order-follow-up/spec-tareas.md` con backlog tecnico para:

```md
# Spec Tareas - CRM Stage Order Follow-Up

## Tareas
- consolidar contratos compartidos del slice
- defender `Pedidos > Operacion` como superficie principal
- formalizar derivacion de `crmStage`
- formalizar semantica de `commercialTrace`
- blindar cierre negativo
- documentar side effects de notifications
- regression suite del slice
```

- [ ] **Step 6: Crear `traceability.md`**

Crear `specs/008-crm-stage-order-follow-up/traceability.md` con trazabilidad entre:

```md
# Traceability - CRM Stage Order Follow-Up

## Matriz
- ownership de `orders`
- `crmStage`
- `commercialTrace`
- rutas y estados
- `CommercialTraceCard`
- exclusion de CRM manual y fulfillment
```

- [ ] **Step 7: Verificar Fase 4 abierta**

Run:

```bash
find specs/008-crm-stage-order-follow-up -maxdepth 1 -type f | sort
rg -n "crmStage|commercialTrace|openpay_provider|manual_request|CommercialTraceCard|orders" specs/008-crm-stage-order-follow-up docs/fase-4-sdd/README.md
```

Expected: aparecen los cuatro archivos SDD y el indice de Fase 4 referencia el slice `008`.

- [ ] **Step 8: Commit de Fase 4**

```bash
git add docs/fase-4-sdd specs/008-crm-stage-order-follow-up
git commit -m "docs: add crm stage order follow-up canonical specs"
```

### Task 5: Sincronizar la capa transversal con el slice `008`

**Files:**
- Modify: `AI_CONTEXT.md`
- Modify: `TRACEABILITY_MATRIX.md`
- Modify: `PROJECT_MAP.md`
- Modify: `docs/transversal/90.00-mapa-homologacion-brownfield.md`

- [ ] **Step 1: Actualizar `AI_CONTEXT.md`**

Reflejar:

```md
- Fase activa: capa canonica intermedia extendida y sincronizada hasta el slice `008-crm-stage-order-follow-up`
- El siguiente gap ya no es seguimiento derivado del pedido, sino CRM manual/ampliado posterior
```

- [ ] **Step 2: Actualizar `TRACEABILITY_MATRIX.md`**

Reflejar:

```md
- Fases 1-4 backfilled/instanciadas para `001` a `008`
- `REQ-HH-005` ya incluye maestro de clientes y seguimiento derivado del pedido
- gap abierto: CRM manual/ampliado y automatizaciones posteriores
```

- [ ] **Step 3: Actualizar `PROJECT_MAP.md`**

Reflejar:

```md
- slices homologados `001` a `008`
- `specs/008-crm-stage-order-follow-up/`
```

- [ ] **Step 4: Actualizar `90.00-mapa-homologacion-brownfield.md`**

Reflejar:

```md
- `docs/product/requirements-impact-plan-2026-03.md` y `docs/architecture/modules.md` ahora tambien aterrizan en `008`
- el frente pendiente posterior pasa a CRM manual/ampliado
```

- [ ] **Step 5: Verificacion final del corte**

Run:

```bash
git diff --check
git status --short --branch
rg -n "008-crm-stage-order-follow-up|01.07|02.07|03.10|ADR-008" AI_CONTEXT.md PROJECT_MAP.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md docs/fase-1-analisis-requerimientos docs/fase-2-ux-ui docs/fase-3-arquitectura docs/fase-4-sdd specs/008-crm-stage-order-follow-up
```

Expected: `git diff --check` limpio, branch con cambios esperados del slice `008` y `rg` devolviendo referencias coherentes en todas las capas.

- [ ] **Step 6: Commit de sincronizacion transversal**

```bash
git add AI_CONTEXT.md PROJECT_MAP.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md
git commit -m "docs: align canonical layer for crm stage order follow-up"
```

## Order Recommended

1. `Task 1`
2. `Task 2`
3. `Task 3`
4. `Task 4`
5. `Task 5`

## Definition Of Done Del Slice

- `orders` queda fijado como agregado principal del seguimiento derivado del pedido
- `Pedidos > Operacion` queda defendido como superficie visible principal del slice
- `crmStage` queda canonizado como estado derivado `as-is`
- `commercialTrace` queda canonizado como puente comercial de confirmacion
- las rutas `manual_direct`, `manual_request`, `openpay_backoffice` y `openpay_provider` quedan formalizadas
- `pending`, `confirmed` y `rejected` quedan formalizados como estados de traza
- el cierre negativo limpia `crmStage` y conserva la evidencia comercial
- notifications queda documentado solo como side effect secundario
- el slice no abre CRM manual, fulfillment, despacho, vendor assignment ni dashboards
