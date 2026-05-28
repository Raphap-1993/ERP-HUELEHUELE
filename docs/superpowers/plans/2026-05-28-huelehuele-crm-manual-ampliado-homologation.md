# Huele Huele CRM Manual Ampliado Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir el slice canonico `009-crm-manual-ampliado` en `ERP-HUELEHUELE` como homologacion brownfield `as-is`, dejando Fases 1-4 y la capa transversal listas para el workbench manual de seguimiento sobre pedidos ya elegibles, anclado a `orders`, con `order_follow_up_case`, timeline manual, `nextStep`, `followUpAt`, `assignee` y tareas opcionales formalizados sin mezclar customers, campaigns, fulfillment ni notifications como dominios principales.

**Architecture:** La homologacion aterriza sobre el modulo `orders` ya vivo en runtime y sobre la superficie `Pedidos > Operacion` ya homologada en `008`: el nuevo slice define un `order_follow_up_case` por pedido, con estados manuales `open`, `waiting_customer`, `resolved` y `cancelled`, apertura explicita por `ventas`, cierre automatico por lifecycle del pedido y una bandeja secundaria dentro del mismo modulo de pedidos. La capa canonica debe fijar ownership de `Ventas`, acceso secundario de `Marketing`, timeline manual inmutable, tareas opcionales editables, `nextStep` y `followUpAt` obligatorios mientras el caso este abierto, y la exclusion de CRM por cliente, mensajeria real, campaigns, fulfillment y dashboards.

**Tech Stack:** Markdown, git worktree, monorepo `Next.js` + `NestJS` + `Prisma`, runtime real en `apps/admin`, `apps/api`, `packages/shared` y `docs/product`, verificacion documental con `git diff --check`, `rg`, `find`, `sed` y chequeo local de consistencia.

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

- `docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-25-apertura-y-asignacion-del-caso-manual-de-pedido.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-26-timeline-manual-y-proximo-paso-del-pedido.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-27-cierre-y-reapertura-del-caso-manual.md`
- `docs/fase-1-analisis-requerimientos/reglas/crm-manual-ampliado.md`

### New Phase 2 files

- `docs/fase-2-ux-ui/02.08-crm-manual-ampliado-ux-ui.md`
- `specs/009-crm-manual-ampliado/product-design.md`
- `specs/009-crm-manual-ampliado/spdd-frontend.md`

### New Phase 3 files

- `docs/fase-3-arquitectura/03.11-crm-manual-ampliado.md`
- `docs/fase-3-arquitectura/adr/ADR-009-orders-manual-follow-up-boundary.md`

### New Phase 4 files

- `specs/009-crm-manual-ampliado/spec-funcional.md`
- `specs/009-crm-manual-ampliado/spec-tecnica.md`
- `specs/009-crm-manual-ampliado/spec-tareas.md`
- `specs/009-crm-manual-ampliado/traceability.md`

### Responsibilities

- Fase 1 fija alcance funcional, actores, ownership, agregado `order_follow_up_case`, estados, timeline manual, `nextStep`, `followUpAt`, tareas y limites del slice.
- Fase 2 fija el contrato UX de `Pedidos > Operacion` y de la bandeja filtrada de seguimiento manual dentro del mismo modulo de pedidos.
- Fase 3 fija ownership entre `orders`, `Ventas`, `Marketing`, side effects y lifecycle automatico de cierre/cancelacion.
- Fase 4 convierte el slice en paquete SDD trazable para evolucion futura.
- La capa transversal actualiza el gap principal del canon: ya no falta CRM manual basico sobre pedidos, sino CRM transversal por cliente o automatizaciones posteriores.

### Task 1: Abrir Fase 1 del slice `009-crm-manual-ampliado`

**Files:**
- Modify: `docs/fase-1-analisis-requerimientos/README.md`
- Create: `docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-25-apertura-y-asignacion-del-caso-manual-de-pedido.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-26-timeline-manual-y-proximo-paso-del-pedido.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-27-cierre-y-reapertura-del-caso-manual.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/crm-manual-ampliado.md`

- [ ] **Step 1: Releer el runtime y los slices previos que fijan el contexto**

Run:

```bash
sed -n '1940,2260p' apps/admin/components/orders-workspace.tsx
sed -n '2588,2665p' apps/admin/components/orders-workspace.tsx
sed -n '1,220p' docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md
sed -n '1,220p' docs/fase-2-ux-ui/02.07-crm-stage-order-follow-up-ux-ui.md
sed -n '1,220p' docs/fase-3-arquitectura/03.10-crm-stage-order-follow-up.md
sed -n '1,220p' specs/008-crm-stage-order-follow-up/spec-funcional.md
```

Expected: evidencia clara de que `Pedidos > Operacion` ya es la superficie principal, de que `orders` ya gobierna `crmStage` y `commercialTrace`, y de que `009` debe extender esa lectura sin mezclar customers, fulfillment o dashboard global.

- [ ] **Step 2: Confirmar ownership operativo y narrativa de roadmap**

Run:

```bash
sed -n '1,120p' packages/shared/src/domain/admin-access.ts
sed -n '1,220p' docs/product/roadmap.md
sed -n '1,220p' docs/product/roles-and-permissions.md
rg -n "crm|followup|seguimiento|Pedidos > Operacion|ventas|marketing" docs/product docs/flows apps/admin/components/orders-workspace.tsx apps/api/src/modules/orders/orders.service.ts
```

Expected: evidencia de `adminAccessRoles.orders`, de `Ventas` como owner natural del seguimiento, de `Marketing` con acceso operativo secundario y del gap real entre seguimiento derivado y CRM manual ampliado.

- [ ] **Step 3: Actualizar el indice de Fase 1**

Anadir en `docs/fase-1-analisis-requerimientos/README.md`:

```md
## Slice 009 - CRM Manual Ampliado
- [01.08-crm-manual-ampliado.md](01.08-crm-manual-ampliado.md)
- [casos-de-uso/UC-25-apertura-y-asignacion-del-caso-manual-de-pedido.md](casos-de-uso/UC-25-apertura-y-asignacion-del-caso-manual-de-pedido.md)
- [casos-de-uso/UC-26-timeline-manual-y-proximo-paso-del-pedido.md](casos-de-uso/UC-26-timeline-manual-y-proximo-paso-del-pedido.md)
- [casos-de-uso/UC-27-cierre-y-reapertura-del-caso-manual.md](casos-de-uso/UC-27-cierre-y-reapertura-del-caso-manual.md)
- [reglas/crm-manual-ampliado.md](reglas/crm-manual-ampliado.md)
```

- [ ] **Step 4: Crear el documento rector de Fase 1**

Crear `docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md` con esta estructura base:

```md
# Fase 1 - CRM Manual Ampliado

## Objetivo
Homologar el seguimiento manual ampliado sobre pedidos ya elegibles dentro de `orders`, formalizando `order_follow_up_case`, timeline manual, `assignee`, `nextStep`, `followUpAt` y tareas opcionales sin convertir el slice en CRM por cliente ni mezclarlo con campaigns, fulfillment o notifications.

## Dentro de alcance
- `orders`
- `order_follow_up_case`
- `Pedidos > Operacion`
- bandeja filtrada dentro de `Pedidos`
- `open`, `waiting_customer`, `resolved`, `cancelled`
- `assignee`
- `nextStep`
- `followUpAt`
- timeline manual
- tareas opcionales
- cierre y reapertura con trazabilidad

## Fuera de alcance
- CRM por cliente
- timeline comercial transversal
- mensajeria enviada desde el sistema
- campaigns
- fulfillment
- dispatch
- vendor assignment
- dashboards

## Regla critica
- solo existe un caso por pedido
- solo se abre sobre pedidos con `crmStage` relevante
- mientras el caso este abierto, `nextStep` y `followUpAt` son obligatorios
```

- [ ] **Step 5: Crear los tres casos de uso canonicos**

Crear `UC-25-apertura-y-asignacion-del-caso-manual-de-pedido.md`:

```md
# UC-25 Apertura Y Asignacion Del Caso Manual De Pedido

## Actores
- ventas
- orders

## Flujo principal
1. el pedido ya tiene `crmStage` relevante
2. `ventas` abre el caso manual
3. se asigna `assignee`
4. se registran `nextStep` y `followUpAt`
5. el pedido queda con un solo `order_follow_up_case` activo
```

Crear `UC-26-timeline-manual-y-proximo-paso-del-pedido.md`:

```md
# UC-26 Timeline Manual Y Proximo Paso Del Pedido

## Actores
- ventas
- marketing
- orders

## Flujo principal
1. el caso manual ya existe
2. el operador agrega una entrada al timeline con `type` y `note`
3. la entrada puede llevar referencia o evidencia opcional
4. el caso mantiene `nextStep` y `followUpAt` obligatorios mientras siga abierto
5. las tareas opcionales pueden crearse, editarse y marcarse `done`
```

Crear `UC-27-cierre-y-reapertura-del-caso-manual.md`:

```md
# UC-27 Cierre Y Reapertura Del Caso Manual

## Actores
- ventas
- orders

## Flujo principal
1. el caso puede pasar a `resolved` o `cancelled`
2. todo cambio de estado deja una entrada `status_change`
3. si el pedido llega a `Delivered` o `Completed`, el caso se resuelve automaticamente
4. si el pedido cae o falla comercialmente, el caso se cancela automaticamente
5. si el pedido sigue elegible, `ventas` puede reabrirlo exigiendo otra vez `nextStep` y `followUpAt`
```

- [ ] **Step 6: Crear la hoja de reglas funcionales**

Crear `docs/fase-1-analisis-requerimientos/reglas/crm-manual-ampliado.md`:

```md
# Reglas De CRM Manual Ampliado

- `orders` es el agregado principal
- `order_follow_up_case` vive dentro de `orders`
- solo existe un caso por pedido
- `ventas` es owner operativo principal
- `marketing` tiene acceso operativo secundario
- el caso usa `open`, `waiting_customer`, `resolved` y `cancelled`
- `nextStep` y `followUpAt` son obligatorios mientras el caso este abierto
- el timeline manual usa `note`, `call`, `whatsapp`, `email` y `status_change`
- toda transicion de estado deja `status_change`
- las entradas del timeline son inmutables
- las tareas son opcionales, editables y usan `pending` y `done`
- el cierre por lifecycle del pedido es automatico
- el slice no abre CRM por cliente ni mensajeria real
```

- [ ] **Step 7: Verificar Fase 1 abierta**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort
rg -n "order_follow_up_case|nextStep|followUpAt|waiting_customer|status_change|Pedidos > Operacion|orders" docs/fase-1-analisis-requerimientos
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `009`.

- [ ] **Step 8: Commit de Fase 1**

```bash
git add docs/fase-1-analisis-requerimientos
git commit -m "docs: open crm manual ampliado phase 1 slice"
```

### Task 2: Abrir Fase 2 y los artefactos UX del slice `009`

**Files:**
- Modify: `docs/fase-2-ux-ui/README.md`
- Create: `docs/fase-2-ux-ui/02.08-crm-manual-ampliado-ux-ui.md`
- Create: `specs/009-crm-manual-ampliado/product-design.md`
- Create: `specs/009-crm-manual-ampliado/spdd-frontend.md`

- [ ] **Step 1: Releer la superficie visible de `Pedidos > Operacion`**

Run:

```bash
sed -n '1940,2260p' apps/admin/components/orders-workspace.tsx
sed -n '2588,2665p' apps/admin/components/orders-workspace.tsx
```

Expected: contrato visible del tab `Operacion`, `Etapa CRM`, `Seguimiento`, `CommercialTraceCard` y el hueco natural donde entraria el workbench manual del caso.

- [ ] **Step 2: Actualizar el indice de Fase 2**

Anadir en `docs/fase-2-ux-ui/README.md`:

```md
## Slice 009 - CRM Manual Ampliado
- [02.08-crm-manual-ampliado-ux-ui.md](02.08-crm-manual-ampliado-ux-ui.md)
- [../../specs/009-crm-manual-ampliado/product-design.md](../../specs/009-crm-manual-ampliado/product-design.md)
- [../../specs/009-crm-manual-ampliado/spdd-frontend.md](../../specs/009-crm-manual-ampliado/spdd-frontend.md)
```

- [ ] **Step 3: Crear el documento de UX/UI de Fase 2**

Crear `docs/fase-2-ux-ui/02.08-crm-manual-ampliado-ux-ui.md`:

```md
# Fase 2 - CRM Manual Ampliado UX/UI

## Objetivo
Formalizar la UX operativa vigente o esperable del workbench manual sobre pedidos dentro de `Pedidos > Operacion`, sin convertirlo en CRM por cliente ni mezclarlo con fulfillment o campaigns.

## Superficies
- bloque principal del caso manual dentro de `Pedidos > Operacion`
- timeline manual
- `nextStep`
- `followUpAt`
- `assignee`
- tareas opcionales
- bandeja filtrada de casos abiertos dentro del mismo modulo de pedidos

## Guardrails
- no abrir timeline por cliente
- no abrir mensajeria CRM real
- no abrir dashboard separado
- no mezclar fulfillment, dispatch ni vendedor
```

- [ ] **Step 4: Crear `product-design.md` del slice**

Crear `specs/009-crm-manual-ampliado/product-design.md`:

```md
# Product Design - CRM Manual Ampliado

## Promesa de superficie
Ventas necesita un workbench simple y serio para saber quien sigue el pedido, que toca hacer y cuando toca volver a actuar.

## Componentes principales
- bloque del caso manual dentro de `Pedidos > Operacion`
- timeline manual
- `nextStep`
- `followUpAt`
- `assignee`
- tareas opcionales
- bandeja secundaria filtrada de casos abiertos

## Decision clave
La vista extiende `Pedidos > Operacion` y no abre un CRM general separado.
```

- [ ] **Step 5: Crear `spdd-frontend.md` del slice**

Crear `specs/009-crm-manual-ampliado/spdd-frontend.md`:

```md
# SPDD Frontend - CRM Manual Ampliado

## Superficies cubiertas
- `Pedidos > Operacion`
- bandeja filtrada de seguimiento manual dentro de `Pedidos`

## Contratos visibles
- un caso manual por pedido
- timeline manual
- `nextStep`
- `followUpAt`
- `assignee`
- tareas opcionales

## Reglas visibles
- el caso manual solo se abre sobre pedidos elegibles
- `nextStep` y `followUpAt` son obligatorios si el caso esta abierto
- el slice no se presenta como CRM por cliente ni como mensajeria
```

- [ ] **Step 6: Verificar Fase 2 abierta**

Run:

```bash
find docs/fase-2-ux-ui -maxdepth 1 -type f | sort
find specs/009-crm-manual-ampliado -maxdepth 1 -type f | sort
rg -n "order_follow_up_case|nextStep|followUpAt|assignee|timeline|waiting_customer|Pedidos > Operacion" docs/fase-2-ux-ui specs/009-crm-manual-ampliado
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `009`.

- [ ] **Step 7: Commit de Fase 2**

```bash
git add docs/fase-2-ux-ui specs/009-crm-manual-ampliado
git commit -m "docs: add crm manual ampliado ux slice"
```

### Task 3: Abrir Fase 3 y la ADR del slice `009`

**Files:**
- Modify: `docs/fase-3-arquitectura/README.md`
- Create: `docs/fase-3-arquitectura/03.11-crm-manual-ampliado.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-009-orders-manual-follow-up-boundary.md`

- [ ] **Step 1: Releer la frontera de `orders` y el slice `008`**

Run:

```bash
sed -n '1,240p' docs/fase-3-arquitectura/03.10-crm-stage-order-follow-up.md
sed -n '1,220p' docs/fase-3-arquitectura/adr/ADR-008-orders-crm-follow-up-boundary.md
sed -n '250,320p' apps/api/src/modules/orders/orders.service.ts
sed -n '2910,3075p' apps/api/src/modules/orders/orders.service.ts
```

Expected: evidencia de que `orders` ya es owner del seguimiento derivado y de que `009` debe vivir encima de esa frontera, no en `customers`.

- [ ] **Step 2: Actualizar el indice de Fase 3**

Anadir en `docs/fase-3-arquitectura/README.md`:

```md
## Slice 009 - CRM Manual Ampliado
- [03.11-crm-manual-ampliado.md](03.11-crm-manual-ampliado.md)
- [adr/ADR-009-orders-manual-follow-up-boundary.md](adr/ADR-009-orders-manual-follow-up-boundary.md)
```

- [ ] **Step 3: Crear el documento de arquitectura del slice**

Crear `docs/fase-3-arquitectura/03.11-crm-manual-ampliado.md`:

```md
# 03.11 Arquitectura Canonica Brownfield CRM Manual Ampliado

## Objetivo
Fijar la frontera canonica del seguimiento manual sobre pedidos dentro de `orders`.

## Ownership
- `orders` gobierna `order_follow_up_case`
- `Pedidos > Operacion` es la superficie visible principal
- `ventas` es owner operativo principal
- `marketing` tiene acceso operativo secundario
- notifications sigue siendo side effect

## Invariantes
- un solo caso por pedido
- solo sobre pedidos con `crmStage` relevante
- `nextStep` y `followUpAt` obligatorios mientras el caso este abierto
- timeline inmutable
- tareas opcionales editables
- cierre automatico por lifecycle del pedido
```

- [ ] **Step 4: Crear la ADR del boundary**

Crear `docs/fase-3-arquitectura/adr/ADR-009-orders-manual-follow-up-boundary.md`:

```md
# ADR-009 Orders Manual Follow-Up Boundary

## Decision
Canonizar el seguimiento manual ampliado dentro de `orders`, usando `order_follow_up_case` como agregado de trabajo humano sobre pedidos ya elegibles.

## Guardrails
- no mover el dominio a `customers`
- no abrir CRM transversal
- no abrir multi-caso por pedido
- no absorber campaigns, fulfillment ni mensajeria real
```

- [ ] **Step 5: Verificar Fase 3 abierta**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 1 -type f | sort
find docs/fase-3-arquitectura/adr -maxdepth 1 -type f | sort
rg -n "order_follow_up_case|nextStep|followUpAt|assignee|timeline|orders" docs/fase-3-arquitectura
```

Expected: aparecen `03.11` y `ADR-009`, y el `rg` devuelve hits del slice `009`.

- [ ] **Step 6: Commit de Fase 3**

```bash
git add docs/fase-3-arquitectura
git commit -m "docs: add crm manual ampliado architecture slice"
```

### Task 4: Abrir Fase 4 y el paquete SDD del slice `009`

**Files:**
- Modify: `docs/fase-4-sdd/README.md`
- Create: `specs/009-crm-manual-ampliado/spec-funcional.md`
- Create: `specs/009-crm-manual-ampliado/spec-tecnica.md`
- Create: `specs/009-crm-manual-ampliado/spec-tareas.md`
- Create: `specs/009-crm-manual-ampliado/traceability.md`

- [ ] **Step 1: Releer el baseline tecnico y el spec de diseño**

Run:

```bash
sed -n '1,260p' docs/superpowers/specs/2026-05-28-huelehuele-crm-manual-ampliado-design.md
sed -n '1,220p' specs/008-crm-stage-order-follow-up/spec-funcional.md
sed -n '1,240p' specs/008-crm-stage-order-follow-up/spec-tecnica.md
```

Expected: evidencia de la relacion entre `008` y `009`, y del perimetro exacto del seguimiento manual ampliado.

- [ ] **Step 2: Actualizar el indice de Fase 4**

Anadir en `docs/fase-4-sdd/README.md`:

```md
## Slice 009 - CRM Manual Ampliado
- [../../specs/009-crm-manual-ampliado/spec-funcional.md](../../specs/009-crm-manual-ampliado/spec-funcional.md)
- [../../specs/009-crm-manual-ampliado/spec-tecnica.md](../../specs/009-crm-manual-ampliado/spec-tecnica.md)
- [../../specs/009-crm-manual-ampliado/spec-tareas.md](../../specs/009-crm-manual-ampliado/spec-tareas.md)
- [../../specs/009-crm-manual-ampliado/traceability.md](../../specs/009-crm-manual-ampliado/traceability.md)
```

- [ ] **Step 3: Crear `spec-funcional.md`**

Crear `specs/009-crm-manual-ampliado/spec-funcional.md` con estos ejes:

```md
# Spec Funcional - CRM Manual Ampliado

## Reglas centrales
- `orders` es el agregado principal
- existe un solo `order_follow_up_case` por pedido
- `ventas` es owner principal
- estados: `open`, `waiting_customer`, `resolved`, `cancelled`
- timeline manual simple
- `nextStep` y `followUpAt` obligatorios mientras el caso este abierto
- cierre automatico por lifecycle del pedido
```

- [ ] **Step 4: Crear `spec-tecnica.md`**

Crear `specs/009-crm-manual-ampliado/spec-tecnica.md` con estos ejes:

```md
# Spec Tecnica - CRM Manual Ampliado

## Baseline real
- `orders`
- `Pedidos > Operacion`
- `crmStage`
- `commercialTrace`

## Boundary nuevo
- `order_follow_up_case`
- timeline manual
- tareas opcionales
- filtro de bandeja dentro de `Pedidos`
```

- [ ] **Step 5: Crear `spec-tareas.md`**

Crear `specs/009-crm-manual-ampliado/spec-tareas.md` con backlog tecnico para:

```md
# Spec Tareas - CRM Manual Ampliado

## Tareas
- consolidar contratos compartidos del caso manual
- defender `Pedidos > Operacion` como superficie principal
- formalizar `order_follow_up_case`
- formalizar timeline manual y tareas
- blindar cierre y reapertura
- regression suite del slice
```

- [ ] **Step 6: Crear `traceability.md`**

Crear `specs/009-crm-manual-ampliado/traceability.md` con trazabilidad entre:

```md
# Traceability - CRM Manual Ampliado

## Matriz
- ownership de `orders`
- `order_follow_up_case`
- `assignee`
- `nextStep`
- `followUpAt`
- timeline
- tareas
- exclusion de CRM por cliente y mensajeria real
```

- [ ] **Step 7: Verificar Fase 4 abierta**

Run:

```bash
find specs/009-crm-manual-ampliado -maxdepth 1 -type f | sort
rg -n "order_follow_up_case|nextStep|followUpAt|assignee|waiting_customer|timeline|orders" specs/009-crm-manual-ampliado docs/fase-4-sdd/README.md
```

Expected: aparecen los cuatro archivos SDD y el indice de Fase 4 referencia el slice `009`.

- [ ] **Step 8: Commit de Fase 4**

```bash
git add docs/fase-4-sdd specs/009-crm-manual-ampliado
git commit -m "docs: add crm manual ampliado canonical specs"
```

### Task 5: Sincronizar la capa transversal con el slice `009`

**Files:**
- Modify: `AI_CONTEXT.md`
- Modify: `TRACEABILITY_MATRIX.md`
- Modify: `PROJECT_MAP.md`
- Modify: `docs/transversal/90.00-mapa-homologacion-brownfield.md`

- [ ] **Step 1: Actualizar `AI_CONTEXT.md`**

Reflejar:

```md
- Fase activa: capa canonica intermedia extendida y sincronizada hasta el slice `009-crm-manual-ampliado`
- El siguiente gap ya no es CRM manual sobre pedidos, sino CRM transversal por cliente o automatizaciones posteriores
```

- [ ] **Step 2: Actualizar `TRACEABILITY_MATRIX.md`**

Reflejar:

```md
- Fases 1-4 backfilled/instanciadas para `001` a `009`
- `REQ-HH-005` ya incluye maestro de clientes, seguimiento derivado del pedido y CRM manual ampliado sobre pedidos
- gap abierto: CRM transversal/manual por cliente y automatizaciones posteriores
```

- [ ] **Step 3: Actualizar `PROJECT_MAP.md`**

Reflejar:

```md
- slices homologados `001` a `009`
- `specs/009-crm-manual-ampliado/`
```

- [ ] **Step 4: Actualizar `90.00-mapa-homologacion-brownfield.md`**

Reflejar:

```md
- `docs/product/requirements-impact-plan-2026-03.md` y `docs/architecture/modules.md` ahora tambien aterrizan en `009`
- el frente pendiente posterior pasa a CRM transversal/manual por cliente o automatizaciones posteriores
```

- [ ] **Step 5: Verificacion final del corte**

Run:

```bash
git diff --check
git status --short --branch
rg -n "009-crm-manual-ampliado|01.08|02.08|03.11|ADR-009" AI_CONTEXT.md PROJECT_MAP.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md docs/fase-1-analisis-requerimientos docs/fase-2-ux-ui docs/fase-3-arquitectura docs/fase-4-sdd specs/009-crm-manual-ampliado
```

Expected: `git diff --check` limpio, branch con cambios esperados del slice `009` y `rg` devolviendo referencias coherentes en todas las capas.

- [ ] **Step 6: Commit de sincronizacion transversal**

```bash
git add AI_CONTEXT.md PROJECT_MAP.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md
git commit -m "docs: align canonical layer for crm manual ampliado"
```

## Order Recommended

1. `Task 1`
2. `Task 2`
3. `Task 3`
4. `Task 4`
5. `Task 5`

## Definition Of Done Del Slice

- `orders` queda fijado como agregado principal del CRM manual ampliado sobre pedidos
- `Pedidos > Operacion` queda defendido como superficie visible principal del slice
- `order_follow_up_case` queda canonizado como agregado de seguimiento manual
- `ventas` queda fijado como owner operativo principal y `marketing` como acceso secundario
- el caso queda limitado a un pedido elegible y a una sola instancia por pedido
- `nextStep`, `followUpAt`, `assignee`, timeline manual y tareas opcionales quedan formalizados
- el timeline manual queda inmutable y las tareas quedan editables
- el cierre y la reapertura quedan ligados al lifecycle del pedido
- el slice no abre CRM por cliente, mensajeria real, campaigns, fulfillment, dispatch ni dashboards
