# Huele Huele Customers Identity Conflicts Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir el slice canonico `007-customers-identity-conflicts` en `ERP-HUELEHUELE` como homologacion brownfield `as-is`, dejando Fases 1-4 y la capa transversal listas para el maestro real de clientes, conflictos de identidad y merge operativo sin mezclarlo con `crmStage`, campaigns ni CRM ampliado.

**Architecture:** La homologacion aterriza sobre el modulo `customers` ya vivo en runtime: `customers` como agregado principal, `/crm` como superficie visible, conflictos de identidad con acciones `assign_existing`, `merge` e `ignore`, clientes sinteticos o regularizados desde pedidos, y una frontera clara donde `customers` gobierna el perfil canonico mientras `orders` conserva snapshots historicos y `crmStage`. La capa canonica debe fijar ownership de `ventas`, prioridad de identidad, invariantes de merge, caracter excepcional de `deleteCustomer` y la lectura de pedidos recientes como contexto, no como transferencia de ownership.

**Tech Stack:** Markdown, git worktree, monorepo `Next.js` + `NestJS` + `Prisma`, runtime real en `apps/admin`, `apps/api` y `packages/shared`, verificacion documental con `git diff --check`, `rg`, `find` y chequeo local de consistencia.

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

- `docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-19-maestro-de-clientes-y-perfil-canonico.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-20-resolucion-de-conflictos-de-identidad.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-21-fusion-operativa-de-clientes.md`
- `docs/fase-1-analisis-requerimientos/reglas/customers-e-identity-conflicts.md`

### New Phase 2 files

- `docs/fase-2-ux-ui/02.06-customers-identity-conflicts-ux-ui.md`
- `specs/007-customers-identity-conflicts/product-design.md`
- `specs/007-customers-identity-conflicts/spdd-frontend.md`

### New Phase 3 files

- `docs/fase-3-arquitectura/03.09-customers-identity-conflicts.md`
- `docs/fase-3-arquitectura/adr/ADR-007-customers-orders-identity-boundary.md`

### New Phase 4 files

- `specs/007-customers-identity-conflicts/spec-funcional.md`
- `specs/007-customers-identity-conflicts/spec-tecnica.md`
- `specs/007-customers-identity-conflicts/spec-tareas.md`
- `specs/007-customers-identity-conflicts/traceability.md`

### Responsibilities

- Fase 1 fija alcance funcional, actores, ownership, prioridad de identidad, conflictos, merge y limites del slice.
- Fase 2 fija el contrato UX de `/crm` como modulo operativo de clientes, conflictos y merge, sin convertirlo en CRM comercial amplio.
- Fase 3 fija ownership entre `customers` y `orders`, mas los invariantes de merge, clientes sinteticos y restricciones de borrado.
- Fase 4 convierte el slice en paquete SDD trazable para evolucion futura.
- La capa transversal actualiza `REQ-HH-005` para reflejar que `customers/identity-conflicts` ya tiene slice propio y que el frente pendiente ya no es "CRM basico" generico sino CRM ampliado posterior.

### Task 1: Abrir Fase 1 del slice `007-customers-identity-conflicts`

**Files:**
- Modify: `docs/fase-1-analisis-requerimientos/README.md`
- Create: `docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-19-maestro-de-clientes-y-perfil-canonico.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-20-resolucion-de-conflictos-de-identidad.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-21-fusion-operativa-de-clientes.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/customers-e-identity-conflicts.md`

- [ ] **Step 1: Releer el runtime real de customers**

Run:

```bash
sed -n '1,220p' apps/admin/app/crm/page.tsx
sed -n '1,320p' apps/admin/components/crm-workspace.tsx
sed -n '320,760p' apps/admin/components/crm-workspace.tsx
sed -n '760,1180p' apps/admin/components/crm-workspace.tsx
sed -n '1,260p' apps/api/src/modules/customers/customers.controller.ts
sed -n '360,760p' apps/api/src/modules/customers/customers.service.ts
sed -n '1600,1765p' apps/api/src/modules/customers/customers.service.ts
sed -n '287,360p' packages/shared/src/types/api.ts
sed -n '1,120p' packages/shared/src/domain/enums.ts
```

Expected: evidencia clara de `/crm`, `customers`, `conflicts`, `merge`, `deleteCustomer`, `recentOrders`, `CustomerIdentityConflictSummary`, `CustomerMergeInput` y `CrmStage` fuera del ownership del modulo.

- [ ] **Step 2: Releer la frontera con orders**

Run:

```bash
rg -n "crmStage|customerConflictId|customerId|commercialTrace" apps/api/src/modules/orders/orders.service.ts
sed -n '1320,1455p' packages/shared/src/types/api.ts
```

Expected: evidencia de que `orders` conserva snapshots historicos, `customerId`, `customerConflictId`, `crmStage` y `commercialTrace`, mientras `customers` solo consume contexto y resuelve identidad.

- [ ] **Step 3: Actualizar el indice de Fase 1**

Anadir en `docs/fase-1-analisis-requerimientos/README.md`:

```md
## Slice 007 - Customers Identity Conflicts
- [01.06-customers-identity-conflicts.md](01.06-customers-identity-conflicts.md)
- [casos-de-uso/UC-19-maestro-de-clientes-y-perfil-canonico.md](casos-de-uso/UC-19-maestro-de-clientes-y-perfil-canonico.md)
- [casos-de-uso/UC-20-resolucion-de-conflictos-de-identidad.md](casos-de-uso/UC-20-resolucion-de-conflictos-de-identidad.md)
- [casos-de-uso/UC-21-fusion-operativa-de-clientes.md](casos-de-uso/UC-21-fusion-operativa-de-clientes.md)
- [reglas/customers-e-identity-conflicts.md](reglas/customers-e-identity-conflicts.md)
```

- [ ] **Step 4: Crear el documento rector de Fase 1**

Crear `docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md` con esta estructura base:

```md
# Fase 1 - Customers Identity Conflicts

## Objetivo
Homologar el modulo `customers` y la superficie `/crm` vigentes de Huele Huele sin convertirlos en CRM amplio ni absorber `crmStage`.

## Dentro de alcance
- `customers`
- `/crm`
- alta y edicion de cliente
- direcciones
- lectura de pedidos recientes
- conflictos de identidad
- `assign_existing`, `merge`, `ignore`
- clientes sinteticos o regularizados desde pedidos
- `deleteCustomer` como capacidad excepcional

## Fuera de alcance
- `crmStage`
- seguimiento comercial de pedidos
- campaigns
- wholesale
- loyalty
- timeline comercial amplio

## Regla critica
- `/crm` gobierna el perfil canonico del cliente
- `orders` conserva snapshots historicos
- merge y resolucion corrigen identidad viva sin reescribir historia arbitrariamente
```

- [ ] **Step 5: Crear los tres casos de uso canonicos**

Crear `UC-19-maestro-de-clientes-y-perfil-canonico.md`:

```md
# UC-19 Maestro De Clientes Y Perfil Canonico

## Actores
- ventas
- marketing
- admin
- customers

## Flujo principal
1. ventas abre `/crm`
2. crea o edita un cliente
3. el sistema persiste perfil, estado y direcciones
4. el detalle muestra pedidos recientes como contexto
5. el perfil canonico queda en `customers`, no en `orders`
```

Crear `UC-20-resolucion-de-conflictos-de-identidad.md`:

```md
# UC-20 Resolucion De Conflictos De Identidad

## Actores
- ventas
- customers
- orders

## Flujo principal
1. el sistema detecta conflicto por identidad desde pedidos
2. ventas revisa senales y candidatos
3. resuelve con `assign_existing`, `merge` o `ignore`
4. la resolucion actualiza el perfil vivo o la referencia operativa sin reescribir snapshots historicos
5. el conflicto queda trazado con estado y notas
```

Crear `UC-21-fusion-operativa-de-clientes.md`:

```md
# UC-21 Fusion Operativa De Clientes

## Actores
- ventas
- customers

## Flujo principal
1. ventas selecciona cliente fuente y cliente destino
2. el sistema valida que no tengan documentos canonicos distintos
3. el destino permanece activo
4. la fuente queda marcada como fusionada
5. no se borra historia ni se reescriben snapshots historicos arbitrariamente
```

- [ ] **Step 6: Crear la hoja de reglas funcionales**

Crear `docs/fase-1-analisis-requerimientos/reglas/customers-e-identity-conflicts.md`:

```md
# Reglas De Customers E Identity Conflicts

- `customers` es el agregado principal
- `/crm` es la superficie visible del slice
- `ventas` es owner operativo principal
- `marketing` tiene acceso operativo; `admin` y `super_admin` actuan como override
- la prioridad de identidad es `documento`, luego `email/telefono`, luego `nombre + direccion`
- los conflictos usan `open`, `resolved`, `ignored` y `merged`
- la resolucion operativa usa `assign_existing`, `merge` e `ignore`
- no se puede fusionar si ambos clientes ya tienen documentos canonicos distintos
- `orders` conserva snapshots historicos, `customerId`, `customerConflictId`, `crmStage` y `commercialTrace`
- clientes sinteticos o regularizados desde pedidos forman parte valida del runtime actual
```

- [ ] **Step 7: Verificar Fase 1 abierta**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort
rg -n "customer|crm|conflict|merge|documento|crmStage|orders" docs/fase-1-analisis-requerimientos
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `007`.

- [ ] **Step 8: Commit de Fase 1**

```bash
git add docs/fase-1-analisis-requerimientos
git commit -m "docs: open customers identity conflicts phase 1 slice"
```

### Task 2: Abrir Fase 2 y los artefactos UX del slice `007`

**Files:**
- Modify: `docs/fase-2-ux-ui/README.md`
- Create: `docs/fase-2-ux-ui/02.06-customers-identity-conflicts-ux-ui.md`
- Create: `specs/007-customers-identity-conflicts/product-design.md`
- Create: `specs/007-customers-identity-conflicts/spdd-frontend.md`

- [ ] **Step 1: Releer la superficie real del workbench de CRM**

Run:

```bash
sed -n '1,320p' apps/admin/components/crm-workspace.tsx
sed -n '320,760p' apps/admin/components/crm-workspace.tsx
sed -n '760,1180p' apps/admin/components/crm-workspace.tsx
```

Expected: contrato visible de `/crm`, metricas, tabla de clientes, tabla de conflictos, dialogos de detalle, formulario, merge y resolucion.

- [ ] **Step 2: Actualizar el indice de Fase 2**

Anadir en `docs/fase-2-ux-ui/README.md`:

```md
## Slice 007 - Customers Identity Conflicts
- [02.06-customers-identity-conflicts-ux-ui.md](02.06-customers-identity-conflicts-ux-ui.md)
- [../../specs/007-customers-identity-conflicts/product-design.md](../../specs/007-customers-identity-conflicts/product-design.md)
- [../../specs/007-customers-identity-conflicts/spdd-frontend.md](../../specs/007-customers-identity-conflicts/spdd-frontend.md)
```

- [ ] **Step 3: Crear el documento de UX/UI de Fase 2**

Crear `docs/fase-2-ux-ui/02.06-customers-identity-conflicts-ux-ui.md`:

```md
# Fase 2 - Customers Identity Conflicts UX/UI

## Objetivo
Formalizar la UX operativa vigente de `/crm` como workbench de clientes y conflictos de identidad.

## Superficies
- metricas de clientes
- tabla de clientes
- tabla de conflictos de identidad
- dialogo de detalle
- formulario create/edit
- dialogo de merge
- dialogo de resolucion de conflictos

## Guardrails
- no abrir `crmStage`
- no abrir pipeline comercial amplio
- no abrir campaigns ni wholesale
- no prometer reescritura historica de pedidos
```

- [ ] **Step 4: Crear `product-design.md` del slice**

Crear `specs/007-customers-identity-conflicts/product-design.md`:

```md
# Product Design - Customers Identity Conflicts

## Promesa de superficie
Ventas necesita operar el perfil canonico del cliente con contexto suficiente y resolver duplicados sin romper la historia operativa.

## Componentes principales
- metric cards
- customer table
- identity conflicts table
- customer detail dialog
- create/edit dialog
- conflict resolution dialog
- merge dialog

## Decision clave
`/crm` sirve para corregir la identidad viva del cliente; los pedidos recientes solo dan contexto y no transfieren ownership de `orders`.
```

- [ ] **Step 5: Crear `spdd-frontend.md` del slice**

Crear `specs/007-customers-identity-conflicts/spdd-frontend.md`:

```md
# SPDD Frontend - Customers Identity Conflicts

## Superficie cubierta
- `/crm`

## Contratos visibles
- metricas de clientes, activos, con pedidos, conflictos y opt-in
- tabla de conflictos con candidatos y accion `Resolver`
- tabla de clientes con `Ver`, `Editar`, `Fusionar` y `Eliminar`
- detalle con perfil, direcciones y pedidos recientes
- formularios de alta/edicion con estado, direcciones y password temporal al crear

## Regla visible
- el modulo resuelve identidad y perfil; no gobierna `crmStage` ni seguimiento comercial del pedido
```

- [ ] **Step 6: Verificar Fase 2 abierta**

Run:

```bash
find docs/fase-2-ux-ui -maxdepth 1 -type f | sort
find specs/007-customers-identity-conflicts -maxdepth 1 -type f | sort
rg -n "crm|customer|conflict|merge|pedido|orders" docs/fase-2-ux-ui specs/007-customers-identity-conflicts
```

Expected: aparecen los nuevos artefactos y el `rg` devuelve hits del slice `007`.

- [ ] **Step 7: Commit de Fase 2**

```bash
git add docs/fase-2-ux-ui specs/007-customers-identity-conflicts
git commit -m "docs: add customers identity conflicts ux slice"
```

### Task 3: Abrir Fase 3 y la ADR del slice `007`

**Files:**
- Modify: `docs/fase-3-arquitectura/README.md`
- Create: `docs/fase-3-arquitectura/03.09-customers-identity-conflicts.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-007-customers-orders-identity-boundary.md`

- [ ] **Step 1: Releer ownership y restricciones del servicio**

Run:

```bash
sed -n '560,760p' apps/api/src/modules/customers/customers.service.ts
sed -n '820,980p' apps/api/src/modules/customers/customers.service.ts
sed -n '1600,1765p' apps/api/src/modules/customers/customers.service.ts
sed -n '1320,1455p' packages/shared/src/types/api.ts
```

Expected: evidencia de `deleteCustomer`, `resolveCustomerConflict`, `mergeCustomersInternal`, restricciones por documentos distintos, `customerId`, `customerConflictId`, `crmStage` y `commercialTrace`.

- [ ] **Step 2: Actualizar el indice de Fase 3**

Anadir en `docs/fase-3-arquitectura/README.md`:

```md
## Slice 007 - Customers Identity Conflicts
- [03.09-customers-identity-conflicts.md](03.09-customers-identity-conflicts.md)
- [adr/ADR-007-customers-orders-identity-boundary.md](adr/ADR-007-customers-orders-identity-boundary.md)
```

- [ ] **Step 3: Crear el documento de arquitectura del slice**

Crear `docs/fase-3-arquitectura/03.09-customers-identity-conflicts.md`:

```md
# 03.09 Arquitectura Canonica Brownfield Customers Identity Conflicts

## Objetivo
Definir ownership, invariantes y fronteras entre `customers`, `/crm` y `orders`.

## Ownership
- `customers` gobierna el perfil canonico
- `/crm` opera el perfil vivo, conflictos y merge
- `orders` conserva snapshots historicos, `customerId`, `customerConflictId`, `crmStage` y `commercialTrace`

## Invariantes
- `documento` es senal principal de identidad
- no se puede fusionar si ambos clientes ya tienen documentos canonicos distintos
- merge deja un destino activo y una fuente fusionada
- clientes sinteticos o regularizados son parte valida del dominio
- `deleteCustomer` es excepcional y sujeto a restricciones
```

- [ ] **Step 4: Crear la ADR del boundary**

Crear `docs/fase-3-arquitectura/adr/ADR-007-customers-orders-identity-boundary.md`:

```md
# ADR-007 Customers Orders Identity Boundary

## Decision
`customers` gobierna el perfil canonico del cliente y `orders` conserva snapshots historicos y senales comerciales del pedido.

## Reglas
1. `customers` es el agregado principal del slice.
2. `orders` no cede ownership de `crmStage`.
3. merge y resolucion corrigen identidad viva sin reescribir historia arbitrariamente.
4. no se fusionan clientes con documentos canonicos distintos.
5. clientes sinteticos o regularizados desde pedidos siguen siendo validos en el runtime.
```

- [ ] **Step 5: Verificar Fase 3 abierta**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 2 -type f | sort
rg -n "customers|crm|conflict|merge|orders|crmStage|customerConflictId" docs/fase-3-arquitectura
```

Expected: aparecen los nuevos artefactos y el `rg` devuelve hits del slice `007`.

- [ ] **Step 6: Commit de Fase 3**

```bash
git add docs/fase-3-arquitectura
git commit -m "docs: add customers identity conflicts architecture slice"
```

### Task 4: Abrir Fase 4 y el paquete SDD del slice `007`

**Files:**
- Modify: `docs/fase-4-sdd/README.md`
- Create: `specs/007-customers-identity-conflicts/spec-funcional.md`
- Create: `specs/007-customers-identity-conflicts/spec-tecnica.md`
- Create: `specs/007-customers-identity-conflicts/spec-tareas.md`
- Create: `specs/007-customers-identity-conflicts/traceability.md`

- [ ] **Step 1: Releer el spec de diseno aprobado**

Run:

```bash
sed -n '1,320p' docs/superpowers/specs/2026-05-28-huelehuele-customers-identity-conflicts-design.md
```

Expected: alcance, ownership, reglas de merge, prioridad de identidad y limites del slice claramente fijados.

- [ ] **Step 2: Actualizar el indice de Fase 4**

Anadir en `docs/fase-4-sdd/README.md`:

```md
## Slice 007 - Customers Identity Conflicts
- [../../specs/007-customers-identity-conflicts/spec-funcional.md](../../specs/007-customers-identity-conflicts/spec-funcional.md)
- [../../specs/007-customers-identity-conflicts/spec-tecnica.md](../../specs/007-customers-identity-conflicts/spec-tecnica.md)
- [../../specs/007-customers-identity-conflicts/spec-tareas.md](../../specs/007-customers-identity-conflicts/spec-tareas.md)
- [../../specs/007-customers-identity-conflicts/traceability.md](../../specs/007-customers-identity-conflicts/traceability.md)
```

- [ ] **Step 3: Crear `spec-funcional.md`**

Crear `specs/007-customers-identity-conflicts/spec-funcional.md`:

```md
# Spec Funcional - Customers Identity Conflicts

## RF principales
- `customers` es el agregado principal
- `/crm` es la superficie visible del slice
- la prioridad de identidad es `documento`, luego `email/telefono`, luego `nombre + direccion`
- conflictos usan `assign_existing`, `merge` e `ignore`
- merge deja destino activo y fuente fusionada
- no se puede fusionar si ambos clientes tienen documentos canonicos distintos
- `orders` conserva snapshots, `customerId`, `customerConflictId`, `crmStage` y `commercialTrace`
```

- [ ] **Step 4: Crear `spec-tecnica.md`**

Crear `specs/007-customers-identity-conflicts/spec-tecnica.md`:

```md
# Spec Tecnica - Customers Identity Conflicts

## Baseline real
- `apps/admin/app/crm/page.tsx`
- `apps/admin/components/crm-workspace.tsx`
- `apps/api/src/modules/customers/customers.controller.ts`
- `apps/api/src/modules/customers/customers.service.ts`
- `packages/shared/src/types/api.ts`

## Reglas tecnicas
- `deleteCustomer` falla si el cliente ya fue fusionado, si es destino canonico, si comparte cuenta operativa o si sigue vinculado a pedidos
- `mergeCustomersInternal()` rechaza documentos canonicos distintos
- `resolveCustomerFromOrderSnapshot()` puede materializar o regularizar clientes desde pedidos
```

- [ ] **Step 5: Crear `spec-tareas.md`**

Crear `specs/007-customers-identity-conflicts/spec-tareas.md`:

```md
# Spec Tareas - Customers Identity Conflicts

## T1
Abrir Fase 1 y casos de uso del slice.

## T2
Abrir Fase 2 y artefactos UX de `/crm`.

## T3
Abrir Fase 3 y ADR de boundary `customers` vs `orders`.

## T4
Consolidar el paquete SDD y su trazabilidad.
```

- [ ] **Step 6: Crear `traceability.md`**

Crear `specs/007-customers-identity-conflicts/traceability.md`:

```md
# Traceability - Customers Identity Conflicts

## Reglas trazadas
- `customers` como agregado principal
- `/crm` como superficie visible
- prioridad de identidad
- conflictos con `assign_existing`, `merge` e `ignore`
- merge sin reescritura arbitraria de snapshots
- frontera `customers` vs `orders`
```

- [ ] **Step 7: Verificar paquete SDD**

Run:

```bash
find specs/007-customers-identity-conflicts -maxdepth 1 -type f | sort
rg -n "customers|crm|conflict|merge|orders|crmStage|snapshot" specs/007-customers-identity-conflicts docs/fase-4-sdd/README.md
```

Expected: aparecen los cuatro artefactos del paquete y el `rg` devuelve hits del slice `007`.

- [ ] **Step 8: Commit de Fase 4**

```bash
git add docs/fase-4-sdd specs/007-customers-identity-conflicts
git commit -m "docs: add customers identity conflicts canonical specs"
```

### Task 5: Sincronizar la capa transversal para el slice `007`

**Files:**
- Modify: `AI_CONTEXT.md`
- Modify: `TRACEABILITY_MATRIX.md`
- Modify: `PROJECT_MAP.md`
- Modify: `docs/transversal/90.00-mapa-homologacion-brownfield.md`

- [ ] **Step 1: Actualizar `AI_CONTEXT.md`**

Actualizar:

```md
- Fase activa: capa canonica intermedia extendida y sincronizada hasta el slice `007-customers-identity-conflicts`
- Extender la misma profundidad canonica al resto de slices mas alla de `001-007`
- Abrir el siguiente slice propio para CRM ampliado o automatizaciones posteriores a campaigns y customers
```

- [ ] **Step 2: Actualizar `TRACEABILITY_MATRIX.md`**

Actualizar:

```md
- Fases 1-4 backfilled o instanciadas para slices `001` a `007`
- `REQ-HH-005` pasa a reflejar: loyalty, CMS/editorial, campaigns y customers/identity-conflicts ya homologados; CRM ampliado sigue pendiente
```

- [ ] **Step 3: Actualizar `PROJECT_MAP.md`**

Anadir referencias a:

```md
- `docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md`
- `docs/fase-2-ux-ui/02.06-customers-identity-conflicts-ux-ui.md`
- `docs/fase-3-arquitectura/03.09-customers-identity-conflicts.md`
- `specs/007-customers-identity-conflicts/`
```

- [ ] **Step 4: Actualizar el mapa brownfield**

Actualizar `docs/transversal/90.00-mapa-homologacion-brownfield.md` para reflejar:

```md
- `customers` y `/crm` ya tienen aterrizaje canonico propio
- `REQ-HH-005` ya no deja "CRM basico" difuso; deja `CRM ampliado` como pendiente posterior
```

- [ ] **Step 5: Verificacion final del corte**

Run:

```bash
git status --short --branch
git diff --check
rg -n "007-customers-identity-conflicts|01.06|02.06|03.09|REQ-HH-005" AI_CONTEXT.md TRACEABILITY_MATRIX.md PROJECT_MAP.md docs/transversal/90.00-mapa-homologacion-brownfield.md docs/fase-1-analisis-requerimientos docs/fase-2-ux-ui docs/fase-3-arquitectura specs
```

Expected: branch limpia salvo los cambios del slice, `git diff --check` sin hallazgos, y referencias consistentes a `007`.

- [ ] **Step 6: Commit de sincronizacion transversal**

```bash
git add AI_CONTEXT.md TRACEABILITY_MATRIX.md PROJECT_MAP.md docs/transversal/90.00-mapa-homologacion-brownfield.md docs/fase-1-analisis-requerimientos docs/fase-2-ux-ui docs/fase-3-arquitectura docs/fase-4-sdd specs
git commit -m "docs: align canonical layer for customers identity conflicts"
```

## Self-Review

- Cobertura del spec: el plan cubre alcance, ownership, prioridad de identidad, conflictos, merge, clientes sinteticos, lectura de pedidos recientes y frontera con `orders`.
- Placeholder scan: no deja marcadores pendientes ni referencias ambiguas a tareas previas; cada task declara archivos, comandos y contenido base.
- Consistencia: la numeracion sigue la secuencia vigente del repo (`01.06`, `02.06`, `03.09`, `007`, `UC-19..21`, `ADR-007`) y mantiene el lenguaje aprobado del spec de diseno.
