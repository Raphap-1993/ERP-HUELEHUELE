# Huele Huele CRM Transversal Por Cliente Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir el slice canonico `010-crm-transversal-por-cliente` en `ERP-HUELEHUELE` como homologacion brownfield `as-is`, dejando Fases 1-4 y la capa transversal listas para un workbench comercial sobre el cliente canonico con `customer_relationship_case`, `commercialOwner`, `assignee`, `nextStep`, `followUpAt`, timeline transversal, tareas opcionales, clasificacion comercial y referencias read-only a pedidos y a casos `009`, sin mezclar identidad canonica, campaigns ni CRM comercial amplio.

**Architecture:** La homologacion aterriza sobre el modulo `customers` y la superficie real `/crm` ya viva en runtime, extendiendo el maestro canonico de `007` y relacionandose con `009` sin absorber el seguimiento manual por pedido. El nuevo slice define un `customer_relationship_case` unico por cliente canonico, con apertura manual sugerida por sistema, estados `open`, `waiting_customer`, `dormant` y `resolved`, resumen comercial corto en el detalle del cliente, bandeja secundaria dentro del mismo modulo y timeline inmutable con referencias automaticas `order_reference` y `follow_up_reference`.

**Tech Stack:** Markdown, git worktree, monorepo `Next.js` + `NestJS` + `Prisma`, runtime real en `apps/admin`, `apps/api`, `packages/shared` y `docs/product`, verificacion documental con `git diff --check`, `rg`, `find` y `sed`.

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

- `docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-28-apertura-y-clasificacion-del-caso-transversal-del-cliente.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-29-timeline-y-workbench-transversal-del-cliente.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-30-merge-cierre-y-reapertura-del-caso-transversal-del-cliente.md`
- `docs/fase-1-analisis-requerimientos/reglas/crm-transversal-por-cliente.md`

### New Phase 2 files

- `docs/fase-2-ux-ui/02.09-crm-transversal-por-cliente-ux-ui.md`
- `specs/010-crm-transversal-por-cliente/product-design.md`
- `specs/010-crm-transversal-por-cliente/spdd-frontend.md`

### New Phase 3 files

- `docs/fase-3-arquitectura/03.12-crm-transversal-por-cliente.md`
- `docs/fase-3-arquitectura/adr/ADR-010-customers-crm-transversal-boundary.md`

### New Phase 4 files

- `specs/010-crm-transversal-por-cliente/spec-funcional.md`
- `specs/010-crm-transversal-por-cliente/spec-tecnica.md`
- `specs/010-crm-transversal-por-cliente/spec-tareas.md`
- `specs/010-crm-transversal-por-cliente/traceability.md`

### Responsibilities

- Fase 1 fija alcance funcional, ownership, agregado `customer_relationship_case`, estados, clasificacion, origen, timeline transversal y reglas de merge/reapertura.
- Fase 2 fija el contrato UX del detalle de cliente en `/crm`, el resumen comercial y la bandeja secundaria del slice.
- Fase 3 fija la frontera entre `customers`, `007`, `009` y el nuevo workbench transversal del cliente.
- Fase 4 convierte el slice en paquete SDD trazable para evolucion futura.
- La capa transversal actualiza el gap principal del canon: ya no falta CRM manual sobre pedidos, sino pipeline comercial amplio, scoring o automatizaciones posteriores al CRM transversal por cliente.

### Task 1: Abrir Fase 1 del slice `010-crm-transversal-por-cliente`

**Files:**
- Modify: `docs/fase-1-analisis-requerimientos/README.md`
- Create: `docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-28-apertura-y-clasificacion-del-caso-transversal-del-cliente.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-29-timeline-y-workbench-transversal-del-cliente.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-30-merge-cierre-y-reapertura-del-caso-transversal-del-cliente.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/crm-transversal-por-cliente.md`

- [ ] **Step 1: Releer el runtime y los slices previos que fijan el contexto**

Run:

```bash
sed -n '1,220p' apps/admin/app/crm/page.tsx
sed -n '1,260p' apps/admin/components/crm-workspace.tsx
sed -n '760,980p' apps/admin/components/crm-workspace.tsx
sed -n '1,220p' docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md
sed -n '1,220p' docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md
sed -n '1,260p' docs/superpowers/specs/2026-05-28-huelehuele-crm-transversal-por-cliente-design.md
```

Expected: evidencia clara de que `/crm` ya es la superficie natural del detalle de cliente, de que `007` fija identidad canonica y de que `009` fija seguimiento manual por pedido, dejando a `010` como capa de relacion comercial transversal sobre cliente.

- [ ] **Step 2: Confirmar ownership operativo, roles y contratos compartidos**

Run:

```bash
sed -n '1,120p' packages/shared/src/domain/admin-access.ts
sed -n '287,390p' packages/shared/src/types/api.ts
sed -n '1,220p' apps/api/src/modules/customers/customers.controller.ts
sed -n '1,260p' apps/api/src/modules/customers/customers.service.ts
rg -n "crm|customer|ventas|marketing|merge|follow_up|followup|commercial" docs/product docs/flows apps/admin/components/crm-workspace.tsx apps/api/src/modules/customers packages/shared/src/types/api.ts
```

Expected: evidencia de `adminAccessRoles.crm`, de `Ventas` como owner operativo principal, de `Marketing` con acceso secundario y del contrato actual de `customers` al que el slice `010` debe anclarse sin reescribir `007`.

- [ ] **Step 3: Actualizar el indice de Fase 1**

Anadir en `docs/fase-1-analisis-requerimientos/README.md`:

```md
## Slice 010 - CRM Transversal Por Cliente
- [01.09-crm-transversal-por-cliente.md](01.09-crm-transversal-por-cliente.md)
- [casos-de-uso/UC-28-apertura-y-clasificacion-del-caso-transversal-del-cliente.md](casos-de-uso/UC-28-apertura-y-clasificacion-del-caso-transversal-del-cliente.md)
- [casos-de-uso/UC-29-timeline-y-workbench-transversal-del-cliente.md](casos-de-uso/UC-29-timeline-y-workbench-transversal-del-cliente.md)
- [casos-de-uso/UC-30-merge-cierre-y-reapertura-del-caso-transversal-del-cliente.md](casos-de-uso/UC-30-merge-cierre-y-reapertura-del-caso-transversal-del-cliente.md)
- [reglas/crm-transversal-por-cliente.md](reglas/crm-transversal-por-cliente.md)
```

- [ ] **Step 4: Crear el documento rector de Fase 1**

Crear `docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md` con esta estructura base:

```md
# Fase 1 - CRM Transversal Por Cliente

## Objetivo
Homologar el workbench comercial transversal sobre cliente canonico dentro de `/crm`, formalizando `customer_relationship_case`, `commercialOwner`, `assignee`, `nextStep`, `followUpAt`, timeline transversal, tareas opcionales, clasificacion comercial y origen canonico sin contaminar `007` ni absorber `009`.

## Dentro de alcance
- `customers`
- `/crm`
- `customer_relationship_case`
- resumen comercial corto
- bandeja secundaria dentro de `/crm`
- `commercialOwner`
- `assignee`
- `nextStep`
- `followUpAt`
- timeline transversal del cliente
- tareas opcionales
- `classification`
- `origin`
- referencias read-only a pedidos y casos `009`
- merge, cierre y reapertura con trazabilidad

## Fuera de alcance
- identidad canonica de `007` como dominio principal
- seguimiento manual detallado por pedido de `009`
- campaigns
- scoring automatico
- pipeline comercial amplio
- oportunidades complejas
- mensajeria enviada desde el sistema
- workbench separado fuera de `/crm`

## Regla critica
- existe un solo `customer_relationship_case` por cliente canonico
- el caso vive solo cuando hay trabajo comercial activo
- `nextStep` y `followUpAt` son obligatorios mientras el caso este en `open` o `waiting_customer`
```

- [ ] **Step 5: Crear los tres casos de uso canonicos**

Crear `UC-28-apertura-y-clasificacion-del-caso-transversal-del-cliente.md`:

```md
# UC-28 Apertura Y Clasificacion Del Caso Transversal Del Cliente

## Actores
- ventas
- marketing
- customers

## Flujo principal
1. el cliente canonico entra a trabajo comercial activo
2. `ventas` o `marketing` abren el caso transversal
3. se asigna `commercialOwner` y `assignee`
4. se registran `classification`, `origin`, `nextStep` y `followUpAt`
5. el cliente queda con un solo `customer_relationship_case` activo
```

Crear `UC-29-timeline-y-workbench-transversal-del-cliente.md`:

```md
# UC-29 Timeline Y Workbench Transversal Del Cliente

## Actores
- ventas
- marketing
- customers

## Flujo principal
1. el caso transversal ya existe
2. el operador agrega una entrada manual con `type` y `note`
3. el timeline tambien muestra `order_reference` y `follow_up_reference` read-only
4. el detalle del cliente mantiene `nextStep`, `followUpAt`, `commercialOwner` y `assignee`
5. las tareas opcionales pueden crearse, editarse y marcarse `done`
```

Crear `UC-30-merge-cierre-y-reapertura-del-caso-transversal-del-cliente.md`:

```md
# UC-30 Merge Cierre Y Reapertura Del Caso Transversal Del Cliente

## Actores
- ventas
- customers

## Flujo principal
1. el caso puede pasar a `resolved` o `dormant`
2. todo cambio de estado deja una entrada `status_change`
3. si el caso se reabre, vuelve a exigir `nextStep` y `followUpAt`
4. si `007` fusiona clientes, el caso se reancla al cliente canonico destino
5. no pueden quedar dos casos transversales activos para el mismo cliente canonico
```

- [ ] **Step 6: Crear la hoja de reglas funcionales**

Crear `docs/fase-1-analisis-requerimientos/reglas/crm-transversal-por-cliente.md`:

```md
# Reglas De CRM Transversal Por Cliente

- `customers` es el dominio ancla del slice
- `customer_relationship_case` vive sobre el cliente canonico
- solo existe un caso por cliente
- `ventas` es owner operativo principal
- `marketing` tiene acceso operativo secundario
- el caso usa `open`, `waiting_customer`, `dormant` y `resolved`
- `commercialOwner` y `assignee` son distintos
- `nextStep` y `followUpAt` son obligatorios en estados activos
- el timeline usa `note`, `call`, `whatsapp`, `email`, `status_change`, `order_reference` y `follow_up_reference`
- las entradas del timeline son inmutables
- `order_reference` y `follow_up_reference` son automaticas y read-only
- las tareas son opcionales, editables y usan `pending` y `done`
- `classification` vive en `010`, no en `007`
- `origin` explica por que existe el caso transversal
- el merge de `007` reancla el caso al cliente canonico destino
- el slice no abre pipeline amplio, scoring ni mensajeria real
```

- [ ] **Step 7: Verificar Fase 1 abierta**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort
rg -n "customer_relationship_case|commercialOwner|assignee|nextStep|followUpAt|order_reference|follow_up_reference|classification|origin" docs/fase-1-analisis-requerimientos
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `010`.

- [ ] **Step 8: Commit de Fase 1**

```bash
git add docs/fase-1-analisis-requerimientos
git commit -m "docs: open crm transversal por cliente phase 1 slice"
```

### Task 2: Abrir Fase 2 y los artefactos UX del slice `010`

**Files:**
- Modify: `docs/fase-2-ux-ui/README.md`
- Create: `docs/fase-2-ux-ui/02.09-crm-transversal-por-cliente-ux-ui.md`
- Create: `specs/010-crm-transversal-por-cliente/product-design.md`
- Create: `specs/010-crm-transversal-por-cliente/spdd-frontend.md`

- [ ] **Step 1: Releer la superficie visible de `/crm`**

Run:

```bash
sed -n '1,220p' apps/admin/app/crm/page.tsx
sed -n '760,980p' apps/admin/components/crm-workspace.tsx
```

Expected: contrato visible actual del detalle del cliente, perfil, direcciones, pedidos recientes y el hueco natural donde entra el resumen comercial y el workbench transversal del cliente.

- [ ] **Step 2: Actualizar el indice de Fase 2**

Anadir en `docs/fase-2-ux-ui/README.md`:

```md
## Slice 010 - CRM Transversal Por Cliente
- [02.09-crm-transversal-por-cliente-ux-ui.md](02.09-crm-transversal-por-cliente-ux-ui.md)
- [../../specs/010-crm-transversal-por-cliente/product-design.md](../../specs/010-crm-transversal-por-cliente/product-design.md)
- [../../specs/010-crm-transversal-por-cliente/spdd-frontend.md](../../specs/010-crm-transversal-por-cliente/spdd-frontend.md)
```

- [ ] **Step 3: Crear el documento de UX/UI de Fase 2**

Crear `docs/fase-2-ux-ui/02.09-crm-transversal-por-cliente-ux-ui.md`:

```md
# Fase 2 - CRM Transversal Por Cliente UX/UI

## Objetivo
Formalizar la UX operativa vigente o esperable del workbench comercial por cliente dentro de `/crm`, sin convertirlo en pipeline comercial amplio ni mezclarlo con campaigns o identidad canonica.

## Superficies
- resumen comercial en el detalle del cliente
- timeline transversal del cliente
- `commercialOwner`
- `assignee`
- `nextStep`
- `followUpAt`
- `classification`
- `origin`
- tareas opcionales
- bandeja filtrada de clientes con seguimiento activo dentro de `/crm`

## Guardrails
- no duplicar todo el historial transaccional
- no abrir pipeline amplio
- no abrir mensajeria real
- no sacar el workbench fuera de `/crm`
```

- [ ] **Step 4: Crear `product-design.md` del slice**

Crear `specs/010-crm-transversal-por-cliente/product-design.md`:

```md
# Product Design - CRM Transversal Por Cliente

## Promesa de superficie
Ventas necesita una lectura corta y seria de la relacion comercial con el cliente, sin perder el contexto de pedidos y seguimientos previos.

## Componentes principales
- resumen comercial del cliente
- timeline transversal
- `commercialOwner`
- `assignee`
- `nextStep`
- `followUpAt`
- tareas opcionales
- bandeja secundaria de casos activos

## Decision clave
La vista vive dentro de `/crm` y extiende el detalle del cliente; no abre un CRM separado.
```

- [ ] **Step 5: Crear `spdd-frontend.md` del slice**

Crear `specs/010-crm-transversal-por-cliente/spdd-frontend.md`:

```md
# SPDD Frontend - CRM Transversal Por Cliente

## Superficies cubiertas
- `/crm`
- detalle del cliente
- bandeja filtrada dentro de `/crm`

## Contratos visibles
- un `customer_relationship_case` por cliente
- resumen comercial corto
- timeline transversal inmutable
- referencias read-only a pedidos y a `009`
- tareas opcionales

## Reglas visibles
- `nextStep` y `followUpAt` son obligatorios si el caso esta activo
- la clasificacion comercial vive en este slice y no en `007`
- el slice no se presenta como campaigns ni como pipeline amplio
```

- [ ] **Step 6: Verificar Fase 2 abierta**

Run:

```bash
find docs/fase-2-ux-ui -maxdepth 1 -type f | sort
find specs/010-crm-transversal-por-cliente -maxdepth 1 -type f | sort
rg -n "customer_relationship_case|commercialOwner|assignee|nextStep|followUpAt|classification|order_reference|follow_up_reference|/crm" docs/fase-2-ux-ui specs/010-crm-transversal-por-cliente
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `010`.

- [ ] **Step 7: Commit de Fase 2**

```bash
git add docs/fase-2-ux-ui specs/010-crm-transversal-por-cliente
git commit -m "docs: add crm transversal por cliente ux slice"
```

### Task 3: Abrir Fase 3 y la ADR del slice `010`

**Files:**
- Modify: `docs/fase-3-arquitectura/README.md`
- Create: `docs/fase-3-arquitectura/03.12-crm-transversal-por-cliente.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-010-customers-crm-transversal-boundary.md`

- [ ] **Step 1: Releer la frontera de `customers`, `007` y `009`**

Run:

```bash
sed -n '1,240p' docs/fase-3-arquitectura/03.09-customers-identity-conflicts.md
sed -n '1,220p' docs/fase-3-arquitectura/adr/ADR-007-customers-orders-identity-boundary.md
sed -n '1,240p' docs/fase-3-arquitectura/03.11-crm-manual-ampliado.md
sed -n '1,220p' docs/fase-3-arquitectura/adr/ADR-009-orders-manual-follow-up-boundary.md
sed -n '1,260p' apps/api/src/modules/customers/customers.service.ts
```

Expected: evidencia de que `customers` gobierna el perfil canonico, `009` gobierna el seguimiento manual por pedido y `010` debe vivir encima del cliente sin absorber pedidos como agregado principal.

- [ ] **Step 2: Actualizar el indice de Fase 3**

Anadir en `docs/fase-3-arquitectura/README.md`:

```md
## Slice 010 - CRM Transversal Por Cliente
- [03.12-crm-transversal-por-cliente.md](03.12-crm-transversal-por-cliente.md)
- [adr/ADR-010-customers-crm-transversal-boundary.md](adr/ADR-010-customers-crm-transversal-boundary.md)
```

- [ ] **Step 3: Crear el documento de arquitectura del slice**

Crear `docs/fase-3-arquitectura/03.12-crm-transversal-por-cliente.md`:

```md
# 03.12 Arquitectura Canonica Brownfield CRM Transversal Por Cliente

## Objetivo
Fijar la frontera canonica del workbench comercial transversal sobre cliente canonico dentro de `customers` y `/crm`.

## Ownership
- `customers` gobierna `customer_relationship_case`
- `/crm` es la superficie visible principal
- `ventas` es owner operativo principal
- `marketing` tiene acceso operativo secundario
- `orders` y `009` solo aportan referencias read-only

## Invariantes
- un solo caso por cliente canonico
- `commercialOwner` y `assignee` son distintos
- `nextStep` y `followUpAt` obligatorios en estados activos
- timeline inmutable
- referencias automaticas a pedidos y a `009`
- merge de `007` reancla el caso al cliente destino
```

- [ ] **Step 4: Crear la ADR del boundary**

Crear `docs/fase-3-arquitectura/adr/ADR-010-customers-crm-transversal-boundary.md`:

```md
# ADR-010 Customers CRM Transversal Boundary

## Decision
Canonizar el seguimiento comercial transversal por cliente dentro de `customers`, usando `customer_relationship_case` como agregado de relacion comercial activa sobre el cliente canonico y manteniendo `009` como slice separado para trabajo manual por pedido.

## Guardrails
- no mover identidad comercial cambiante a `007`
- no mover el timeline transversal a `orders`
- no abrir mas de un caso por cliente
- no abrir campaigns, scoring, pipeline amplio ni mensajeria real
```

- [ ] **Step 5: Verificar Fase 3 abierta**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 1 -type f | sort
find docs/fase-3-arquitectura/adr -maxdepth 1 -type f | sort
rg -n "customer_relationship_case|commercialOwner|assignee|classification|origin|order_reference|follow_up_reference|customers|/crm" docs/fase-3-arquitectura
```

Expected: aparecen `03.12` y `ADR-010`, y el `rg` devuelve hits del slice `010`.

- [ ] **Step 6: Commit de Fase 3**

```bash
git add docs/fase-3-arquitectura
git commit -m "docs: add crm transversal por cliente architecture slice"
```

### Task 4: Abrir Fase 4 y el paquete SDD del slice `010`

**Files:**
- Modify: `docs/fase-4-sdd/README.md`
- Create: `specs/010-crm-transversal-por-cliente/spec-funcional.md`
- Create: `specs/010-crm-transversal-por-cliente/spec-tecnica.md`
- Create: `specs/010-crm-transversal-por-cliente/spec-tareas.md`
- Create: `specs/010-crm-transversal-por-cliente/traceability.md`

- [ ] **Step 1: Releer el baseline tecnico y los slices relacionados**

Run:

```bash
sed -n '1,260p' docs/superpowers/specs/2026-05-28-huelehuele-crm-transversal-por-cliente-design.md
sed -n '1,220p' specs/007-customers-identity-conflicts/spec-funcional.md
sed -n '1,240p' specs/007-customers-identity-conflicts/spec-tecnica.md
sed -n '1,220p' specs/009-crm-manual-ampliado/spec-funcional.md
sed -n '1,240p' specs/009-crm-manual-ampliado/spec-tecnica.md
```

Expected: evidencia de la relacion entre `007`, `009` y `010`, y del perimetro exacto del workbench comercial transversal del cliente.

- [ ] **Step 2: Actualizar el indice de Fase 4**

Anadir en `docs/fase-4-sdd/README.md`:

```md
## Slice 010 - CRM Transversal Por Cliente
- [../../specs/010-crm-transversal-por-cliente/spec-funcional.md](../../specs/010-crm-transversal-por-cliente/spec-funcional.md)
- [../../specs/010-crm-transversal-por-cliente/spec-tecnica.md](../../specs/010-crm-transversal-por-cliente/spec-tecnica.md)
- [../../specs/010-crm-transversal-por-cliente/spec-tareas.md](../../specs/010-crm-transversal-por-cliente/spec-tareas.md)
- [../../specs/010-crm-transversal-por-cliente/traceability.md](../../specs/010-crm-transversal-por-cliente/traceability.md)
```

- [ ] **Step 3: Crear `spec-funcional.md`**

Crear `specs/010-crm-transversal-por-cliente/spec-funcional.md` con estos ejes:

```md
# Spec Funcional - CRM Transversal Por Cliente

## Reglas centrales
- `customers` es el dominio ancla
- existe un solo `customer_relationship_case` por cliente
- `ventas` es owner principal
- estados: `open`, `waiting_customer`, `dormant`, `resolved`
- timeline transversal inmutable
- `commercialOwner`, `assignee`, `nextStep`, `followUpAt`, `classification` y `origin`
- referencias read-only a pedidos y a `009`
- merge de `007` reancla el caso al cliente canonico destino
```

- [ ] **Step 4: Crear `spec-tecnica.md`**

Crear `specs/010-crm-transversal-por-cliente/spec-tecnica.md` con estos ejes:

```md
# Spec Tecnica - CRM Transversal Por Cliente

## Baseline real
- `/crm`
- `customers`
- `CustomerDetail`
- `CustomerSummary`
- conflictos y merge de `007`
- referencias a pedidos recientes

## Boundary nuevo
- `customer_relationship_case`
- resumen comercial del cliente
- timeline transversal
- `commercialOwner`
- `assignee`
- `classification`
- `origin`
- referencias read-only a `orders` y `009`
```

- [ ] **Step 5: Crear `spec-tareas.md`**

Crear `specs/010-crm-transversal-por-cliente/spec-tareas.md` con backlog tecnico para:

```md
# Spec Tareas - CRM Transversal Por Cliente

## Tareas
- consolidar contratos compartidos del caso transversal
- defender `/crm` como superficie principal
- formalizar `customer_relationship_case`
- formalizar timeline transversal y resumen comercial
- blindar merge, cierre y reapertura
- regression suite del slice
```

- [ ] **Step 6: Crear `traceability.md`**

Crear `specs/010-crm-transversal-por-cliente/traceability.md` con trazabilidad entre:

```md
# Traceability - CRM Transversal Por Cliente

## Matriz
- ownership de `customers`
- `customer_relationship_case`
- `commercialOwner`
- `assignee`
- `nextStep`
- `followUpAt`
- `classification`
- `origin`
- referencias a `orders` y `009`
- exclusion de pipeline amplio y campaigns
```

- [ ] **Step 7: Verificar Fase 4 abierta**

Run:

```bash
find specs/010-crm-transversal-por-cliente -maxdepth 1 -type f | sort
rg -n "customer_relationship_case|commercialOwner|assignee|nextStep|followUpAt|classification|origin|order_reference|follow_up_reference|/crm|customers" specs/010-crm-transversal-por-cliente docs/fase-4-sdd/README.md
```

Expected: aparecen los cuatro archivos SDD y el indice de Fase 4 referencia el slice `010`.

- [ ] **Step 8: Commit de Fase 4**

```bash
git add docs/fase-4-sdd specs/010-crm-transversal-por-cliente
git commit -m "docs: add crm transversal por cliente canonical specs"
```

### Task 5: Sincronizar la capa transversal con el slice `010`

**Files:**
- Modify: `AI_CONTEXT.md`
- Modify: `TRACEABILITY_MATRIX.md`
- Modify: `PROJECT_MAP.md`
- Modify: `docs/transversal/90.00-mapa-homologacion-brownfield.md`

- [ ] **Step 1: Actualizar `AI_CONTEXT.md`**

Reflejar:

```md
- Fase activa: capa canonica intermedia extendida y sincronizada hasta el slice `010-crm-transversal-por-cliente`
- El siguiente gap ya no es CRM transversal por cliente, sino pipeline comercial amplio, scoring o automatizaciones posteriores al scheduling basico y al CRM transversal ya homologado
```

- [ ] **Step 2: Actualizar `TRACEABILITY_MATRIX.md`**

Reflejar:

```md
- Fases 1-4 backfilled/instanciadas para `001` a `010`
- `REQ-HH-005` ya incluye loyalty, CMS/editorial, campaigns, maestro de clientes, seguimiento derivado, CRM manual por pedido y CRM transversal por cliente
- gap abierto: pipeline comercial amplio, scoring o automatizaciones posteriores
```

- [ ] **Step 3: Actualizar `PROJECT_MAP.md`**

Reflejar:

```md
- slices homologados `001` a `010`
- `specs/010-crm-transversal-por-cliente/`
```

- [ ] **Step 4: Actualizar `90.00-mapa-homologacion-brownfield.md`**

Reflejar:

```md
- `docs/product/requirements-impact-plan-2026-03.md`, `docs/product/roles-and-permissions.md` y `docs/architecture/modules.md` ahora tambien aterrizan en `010`
- el frente pendiente posterior pasa a pipeline comercial amplio, scoring o automatizaciones posteriores al CRM transversal por cliente
```

- [ ] **Step 5: Verificacion final del corte**

Run:

```bash
git diff --check
git status --short --branch
rg -n "010-crm-transversal-por-cliente|01.09|02.09|03.12|ADR-010" AI_CONTEXT.md PROJECT_MAP.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md docs/fase-1-analisis-requerimientos docs/fase-2-ux-ui docs/fase-3-arquitectura docs/fase-4-sdd specs/010-crm-transversal-por-cliente
```

Expected: `git diff --check` limpio, branch con cambios esperados del slice `010` y `rg` devolviendo referencias coherentes en todas las capas.

- [ ] **Step 6: Commit de sincronizacion transversal**

```bash
git add AI_CONTEXT.md PROJECT_MAP.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md
git commit -m "docs: align canonical layer for crm transversal por cliente"
```

## Order Recommended

1. `Task 1`
2. `Task 2`
3. `Task 3`
4. `Task 4`
5. `Task 5`

## Definition Of Done Del Slice

- `customers` queda fijado como dominio ancla del CRM transversal por cliente
- `/crm` queda defendido como superficie visible principal del slice
- `customer_relationship_case` queda canonizado como agregado de relacion comercial activa
- `ventas` queda fijado como owner operativo principal y `marketing` como acceso secundario
- `commercialOwner`, `assignee`, `nextStep`, `followUpAt`, `classification`, `origin`, timeline transversal y tareas opcionales quedan formalizados
- el timeline transversal queda inmutable y las referencias a `orders` y `009` quedan automaticas y read-only
- el merge de `007` queda ligado al reanclaje del caso transversal sobre el cliente canonico destino
- el detalle de cliente y la bandeja secundaria dentro de `/crm` quedan formalizados
- el slice puede operar clientes sin pedidos y no contamina `007` ni absorbe `009`
- el slice no abre pipeline amplio, scoring, campaigns, mensajeria real ni workbench separado fuera de `/crm`
