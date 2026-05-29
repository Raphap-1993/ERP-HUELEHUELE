# Huele Huele Pipeline Comercial Amplio Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir el slice canonico `011-pipeline-comercial-amplio` en `ERP-HUELEHUELE` como homologacion brownfield `as-is`, extendiendo `customer_relationship_case` con `pipelineStage`, `priority`, `commercialChannel`, `lostReason` y `lastPipelineActivityAt`, dejando Fases 1-4 y la capa transversal listas para un pipeline comercial amplio dentro de `/crm` sin abrir todavia opportunities, scoring ni automatizaciones comerciales.

**Architecture:** La homologacion aterriza sobre `010-crm-transversal-por-cliente`, manteniendo `customer_relationship_case` como agregado unico por cliente canonico y sumando una segunda dimension comercial `pipelineStage` separada del `status` operativo. La superficie visible sigue dentro de `/crm` con una bandeja filtrable por owner, assignee, etapa, prioridad, canal y status, mas vistas de pendientes de hoy y vencidos basadas en `followUpAt`, con cierres `won` y `lost` manuales y trazabilidad obligatoria en el timeline.

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

- `docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-31-apertura-y-etapado-del-caso-comercial.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-32-bandeja-y-priorizacion-del-pipeline-comercial.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-33-cierre-comercial-won-lost-y-reapertura.md`
- `docs/fase-1-analisis-requerimientos/reglas/pipeline-comercial-amplio.md`

### New Phase 2 files

- `docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md`
- `specs/011-pipeline-comercial-amplio/product-design.md`
- `specs/011-pipeline-comercial-amplio/spdd-frontend.md`

### New Phase 3 files

- `docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md`
- `docs/fase-3-arquitectura/adr/ADR-011-customers-commercial-pipeline-boundary.md`

### New Phase 4 files

- `specs/011-pipeline-comercial-amplio/spec-funcional.md`
- `specs/011-pipeline-comercial-amplio/spec-tecnica.md`
- `specs/011-pipeline-comercial-amplio/spec-tareas.md`
- `specs/011-pipeline-comercial-amplio/traceability.md`

### Responsibilities

- Fase 1 fija el alcance funcional del pipeline amplio sobre `customer_relationship_case`, `pipelineStage`, `priority`, `commercialChannel`, `lostReason`, `lastPipelineActivityAt`, cierres `won` y `lost`, y los guardrails con `status`.
- Fase 2 fija el contrato UX del pipeline dentro de `/crm`: detalle del cliente, bandeja comercial filtrable y vistas de pendientes/vencidos.
- Fase 3 fija la frontera entre `010`, el pipeline amplio, las futuras opportunities y el futuro scoring/automation.
- Fase 4 convierte el slice en paquete SDD trazable para evolucion futura.
- La capa transversal actualiza el principal gap del canon: ya no faltaria el pipeline comercial amplio, sino scoring y automatizaciones comerciales posteriores.

### Task 1: Abrir Fase 1 del slice `011-pipeline-comercial-amplio`

**Files:**
- Modify: `docs/fase-1-analisis-requerimientos/README.md`
- Create: `docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-31-apertura-y-etapado-del-caso-comercial.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-32-bandeja-y-priorizacion-del-pipeline-comercial.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-33-cierre-comercial-won-lost-y-reapertura.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/pipeline-comercial-amplio.md`

- [ ] **Step 1: Releer el runtime y los slices previos que fijan el contexto**

Run:

```bash
sed -n '1,240p' docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md
sed -n '1,220p' docs/fase-1-analisis-requerimientos/reglas/crm-transversal-por-cliente.md
sed -n '1,220p' docs/fase-3-arquitectura/adr/ADR-010-customers-crm-transversal-boundary.md
sed -n '1,220p' docs/superpowers/specs/2026-05-29-huelehuele-pipeline-comercial-amplio-design.md
sed -n '1,260p' apps/admin/components/crm-workspace.tsx
rg -n "pipeline|commercialOwner|assignee|followUpAt|crm" apps/admin/components/crm-workspace.tsx apps/admin/app/crm/page.tsx packages/shared/src/types/api.ts
```

Expected: evidencia de que `010` ya cerro el workbench transversal por cliente y de que `011` debe abrir pipeline amplio sobre el mismo caso, no sobre una nueva entidad de opportunity.

- [ ] **Step 2: Actualizar el indice de Fase 1**

Anadir en `docs/fase-1-analisis-requerimientos/README.md`:

```md
## Slice 011 - Pipeline Comercial Amplio
- [01.10-pipeline-comercial-amplio.md](01.10-pipeline-comercial-amplio.md)
- [casos-de-uso/UC-31-apertura-y-etapado-del-caso-comercial.md](casos-de-uso/UC-31-apertura-y-etapado-del-caso-comercial.md)
- [casos-de-uso/UC-32-bandeja-y-priorizacion-del-pipeline-comercial.md](casos-de-uso/UC-32-bandeja-y-priorizacion-del-pipeline-comercial.md)
- [casos-de-uso/UC-33-cierre-comercial-won-lost-y-reapertura.md](casos-de-uso/UC-33-cierre-comercial-won-lost-y-reapertura.md)
- [reglas/pipeline-comercial-amplio.md](reglas/pipeline-comercial-amplio.md)
```

- [ ] **Step 3: Crear el documento rector de Fase 1**

Crear `docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md` con esta estructura base:

```md
# Fase 1 - Pipeline Comercial Amplio

## Objetivo
Homologar el pipeline comercial amplio sobre `customer_relationship_case` dentro de `/crm`, formalizando `pipelineStage`, `priority`, `commercialChannel`, `lostReason`, `lastPipelineActivityAt` y los cierres `won` y `lost` sin abrir opportunities, scoring ni automatizaciones comerciales.

## Dentro de alcance
- `customer_relationship_case`
- `pipelineStage`
- `priority`
- `commercialChannel`
- `lostReason`
- `lastPipelineActivityAt`
- bandeja comercial filtrable
- vistas de pendientes de hoy y vencidos
- `won`
- `lost`

## Fuera de alcance
- `commercial_opportunity`
- forecast
- probabilidad
- monto esperado
- scoring automatico
- automatizaciones comerciales
- kanban complejo

## Regla critica
- el pipeline comercial vive sobre el caso transversal del cliente
- `pipelineStage` es manual por ventas
- `won` y `lost` son cierres comerciales, no cierres tecnicos del caso
```

- [ ] **Step 4: Crear los tres casos de uso canonicos**

Crear `UC-31-apertura-y-etapado-del-caso-comercial.md`:

```md
# UC-31 Apertura Y Etapado Del Caso Comercial

## Actores
- ventas
- marketing
- customers

## Flujo principal
1. el `customer_relationship_case` ya existe o se acaba de abrir
2. `ventas` inicializa `pipelineStage` en `new` o en otra etapa si ya hay contexto suficiente
3. el operador define `priority` y `commercialChannel`
4. todo cambio posterior de etapa queda trazado en el timeline
```

Crear `UC-32-bandeja-y-priorizacion-del-pipeline-comercial.md`:

```md
# UC-32 Bandeja Y Priorizacion Del Pipeline Comercial

## Actores
- ventas
- marketing

## Flujo principal
1. el operador entra a la bandeja comercial dentro de `/crm`
2. filtra por `commercialOwner`, `assignee`, `pipelineStage`, `priority`, `commercialChannel` y `status`
3. revisa las vistas de pendientes de hoy y vencidos usando `followUpAt`
4. decide el siguiente movimiento comercial del caso
```

Crear `UC-33-cierre-comercial-won-lost-y-reapertura.md`:

```md
# UC-33 Cierre Comercial Won Lost Y Reapertura

## Actores
- ventas

## Flujo principal
1. el operador decide cerrar el pipeline como `won` o `lost`
2. si marca `lost`, registra `lostReason`
3. si marca `won`, registra nota de cierre y evidencia o referencia
4. el timeline guarda el cambio de etapa
5. si el caso estaba `lost`, puede reabrirse comercialmente con trazabilidad
```

- [ ] **Step 5: Crear la hoja de reglas funcionales**

Crear `docs/fase-1-analisis-requerimientos/reglas/pipeline-comercial-amplio.md`:

```md
# Reglas De Pipeline Comercial Amplio

- `011` vive sobre `customer_relationship_case`
- no abre `commercial_opportunity`
- `pipelineStage` usa `new`, `contacted`, `engaged`, `nurturing`, `won` y `lost`
- `pipelineStage` es manual por ventas
- se permiten saltos manuales entre etapas
- todo cambio de etapa deja trazabilidad en el timeline
- `priority` usa `low`, `medium` y `high`
- `priority` es manual
- `commercialChannel` usa `storefront`, `vendor`, `wholesale`, `manual_outreach`, `reactivation` y `referral`
- `commercialChannel` es el origen principal del caso
- `lostReason` usa `no_response`, `price`, `timing`, `competition`, `not_fit` y `other`
- `lostReason` es obligatorio al pasar a `lost`
- `won` exige nota de cierre y evidencia o referencia
- `lastPipelineActivityAt` resume la ultima actividad comercial relevante
- `status` y `pipelineStage` son ejes separados con guardrails suaves
```

- [ ] **Step 6: Verificar Fase 1 abierta**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort
rg -n "pipelineStage|priority|commercialChannel|lostReason|lastPipelineActivityAt|won|lost" docs/fase-1-analisis-requerimientos
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `011`.

- [ ] **Step 7: Commit de Fase 1**

```bash
git add docs/fase-1-analisis-requerimientos
git commit -m "docs: open pipeline comercial amplio phase 1 slice"
```

### Task 2: Abrir Fase 2 y los artefactos UX del slice `011`

**Files:**
- Modify: `docs/fase-2-ux-ui/README.md`
- Create: `docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md`
- Create: `specs/011-pipeline-comercial-amplio/product-design.md`
- Create: `specs/011-pipeline-comercial-amplio/spdd-frontend.md`

- [ ] **Step 1: Releer la superficie UX existente en `/crm`**

Run:

```bash
sed -n '1,220p' docs/fase-2-ux-ui/02.09-crm-transversal-por-cliente-ux-ui.md
sed -n '1,220p' specs/010-crm-transversal-por-cliente/product-design.md
sed -n '1,220p' specs/010-crm-transversal-por-cliente/spdd-frontend.md
sed -n '1,260p' apps/admin/components/crm-workspace.tsx
```

Expected: base suficiente para describir la bandeja comercial dentro de `/crm` sin vender kanban ni una app nueva.

- [ ] **Step 2: Actualizar el indice de Fase 2**

Anadir en `docs/fase-2-ux-ui/README.md`:

```md
## Slice 011 - Pipeline Comercial Amplio
- [02.10-pipeline-comercial-amplio-ux-ui.md](02.10-pipeline-comercial-amplio-ux-ui.md)
- [../../specs/011-pipeline-comercial-amplio/product-design.md](../../specs/011-pipeline-comercial-amplio/product-design.md)
- [../../specs/011-pipeline-comercial-amplio/spdd-frontend.md](../../specs/011-pipeline-comercial-amplio/spdd-frontend.md)
```

- [ ] **Step 3: Crear el contrato UX principal**

Crear `docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md` con esta base:

```md
# Fase 2 - Pipeline Comercial Amplio UX/UI

## Superficie principal
- detalle del cliente en `/crm`

## Superficie secundaria
- bandeja comercial filtrable dentro de `/crm`

## Elementos visibles clave
- `pipelineStage`
- `priority`
- `commercialChannel`
- `commercialOwner`
- `assignee`
- `followUpAt`
- `lastPipelineActivityAt`
- vistas de pendientes de hoy y vencidos

## Guardrails UX
- no vender kanban complejo
- no vender opportunities
- no esconder que `won` y `lost` son manuales
```

- [ ] **Step 4: Crear `product-design.md` y `spdd-frontend.md`**

Crear `specs/011-pipeline-comercial-amplio/product-design.md`:

```md
# Product Design - Pipeline Comercial Amplio

- el pipeline se lee sobre el mismo `customer_relationship_case`
- la UI principal sigue en `/crm`
- la bandeja comercial es tabla o lista filtrable
- la prioridad y el canal deben poder verse sin abrir todo el timeline
- `won` y `lost` deben exigir contexto visible de cierre
```

Crear `specs/011-pipeline-comercial-amplio/spdd-frontend.md`:

```md
# SPDD Frontend - Pipeline Comercial Amplio

- `pipelineStage` es manual y separado de `status`
- la bandeja usa filtros por owner, assignee, etapa, prioridad, canal y status
- existen vistas de pendientes de hoy y vencidos basadas en `followUpAt`
- no se implementa kanban ni drag and drop
- el detalle del cliente conserva `commercialOwner`, `assignee`, `nextStep` y `followUpAt`
```

- [ ] **Step 5: Verificar Fase 2 abierta**

Run:

```bash
find docs/fase-2-ux-ui specs/011-pipeline-comercial-amplio -maxdepth 2 -type f | sort
rg -n "pipelineStage|priority|commercialChannel|followUpAt|won|lost" docs/fase-2-ux-ui specs/011-pipeline-comercial-amplio
```

Expected: aparecen los nuevos artefactos de UX y frontend del slice `011`.

- [ ] **Step 6: Commit de Fase 2**

```bash
git add docs/fase-2-ux-ui specs/011-pipeline-comercial-amplio
git commit -m "docs: add pipeline comercial amplio ux slice"
```

### Task 3: Abrir Fase 3 y la ADR del slice `011`

**Files:**
- Modify: `docs/fase-3-arquitectura/README.md`
- Create: `docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-011-customers-commercial-pipeline-boundary.md`

- [ ] **Step 1: Releer las fronteras de `010` y el gap metodologico actual**

Run:

```bash
sed -n '1,220p' docs/fase-3-arquitectura/03.12-crm-transversal-por-cliente.md
sed -n '1,220p' docs/fase-3-arquitectura/adr/ADR-010-customers-crm-transversal-boundary.md
sed -n '1,220p' AI_CONTEXT.md
sed -n '1,220p' TRACEABILITY_MATRIX.md
```

Expected: confirmar que `010` dejo explicitamente fuera pipeline amplio y que el siguiente gap real ahora es scoring o automatizaciones, no otra frontera basica de CRM.

- [ ] **Step 2: Actualizar el indice de Fase 3**

Anadir en `docs/fase-3-arquitectura/README.md`:

```md
## Slice 011 - Pipeline Comercial Amplio
- [03.13-pipeline-comercial-amplio.md](03.13-pipeline-comercial-amplio.md)
- [adr/ADR-011-customers-commercial-pipeline-boundary.md](adr/ADR-011-customers-commercial-pipeline-boundary.md)
```

- [ ] **Step 3: Crear el documento de arquitectura**

Crear `docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md`:

```md
# Fase 3 - Pipeline Comercial Amplio

## Dominio ancla
- `customers`

## Agregado principal
- `customer_relationship_case`

## Ampliaciones de `011`
- `pipelineStage`
- `priority`
- `commercialChannel`
- `lostReason`
- `lastPipelineActivityAt`

## Frontera
- no se abre `commercial_opportunity`
- no se abre scoring
- no se abren automatizaciones comerciales
- la superficie sigue dentro de `/crm`
```

- [ ] **Step 4: Crear la ADR de frontera**

Crear `docs/fase-3-arquitectura/adr/ADR-011-customers-commercial-pipeline-boundary.md` con esta base:

```md
# ADR-011 Customers Commercial Pipeline Boundary

## Decision
El pipeline comercial amplio se canoniza dentro de `customers`, ampliando `customer_relationship_case` con `pipelineStage`, `priority`, `commercialChannel`, `lostReason` y `lastPipelineActivityAt`, sin abrir `commercial_opportunity` ni mover el workbench fuera de `/crm`.

## Guardrails
1. `pipelineStage` es manual por ventas
2. `status` y `pipelineStage` son ejes separados
3. `won` y `lost` son cierres comerciales manuales
4. no se abre scoring ni automatizaciones comerciales
5. no se abre kanban complejo
```

- [ ] **Step 5: Verificar Fase 3 abierta**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 2 -type f | sort
rg -n "pipelineStage|commercial_opportunity|lostReason|lastPipelineActivityAt|won|lost" docs/fase-3-arquitectura
```

Expected: aparecen el documento de arquitectura y la ADR del slice `011`.

- [ ] **Step 6: Commit de Fase 3**

```bash
git add docs/fase-3-arquitectura
git commit -m "docs: add pipeline comercial amplio architecture slice"
```

### Task 4: Abrir Fase 4 y el paquete SDD del slice `011`

**Files:**
- Modify: `docs/fase-4-sdd/README.md`
- Create: `specs/011-pipeline-comercial-amplio/spec-funcional.md`
- Create: `specs/011-pipeline-comercial-amplio/spec-tecnica.md`
- Create: `specs/011-pipeline-comercial-amplio/spec-tareas.md`
- Create: `specs/011-pipeline-comercial-amplio/traceability.md`

- [ ] **Step 1: Releer el design aprobado y los specs del slice `010`**

Run:

```bash
sed -n '1,260p' docs/superpowers/specs/2026-05-29-huelehuele-pipeline-comercial-amplio-design.md
sed -n '1,260p' specs/010-crm-transversal-por-cliente/spec-funcional.md
sed -n '1,260p' specs/010-crm-transversal-por-cliente/spec-tecnica.md
sed -n '1,260p' specs/010-crm-transversal-por-cliente/spec-tareas.md
sed -n '1,260p' specs/010-crm-transversal-por-cliente/traceability.md
```

Expected: base suficiente para armar el paquete `011` como extension controlada de `010`.

- [ ] **Step 2: Actualizar el indice de Fase 4**

Anadir en `docs/fase-4-sdd/README.md`:

```md
## Slice 011 - Pipeline Comercial Amplio
- [../fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md](../fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md)
- [../fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md](../fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md)
- [../../specs/011-pipeline-comercial-amplio/product-design.md](../../specs/011-pipeline-comercial-amplio/product-design.md)
- [../../specs/011-pipeline-comercial-amplio/spdd-frontend.md](../../specs/011-pipeline-comercial-amplio/spdd-frontend.md)
- [../fase-3-arquitectura/03.13-pipeline-comercial-amplio.md](../fase-3-arquitectura/03.13-pipeline-comercial-amplio.md)
- [../fase-3-arquitectura/adr/ADR-011-customers-commercial-pipeline-boundary.md](../fase-3-arquitectura/adr/ADR-011-customers-commercial-pipeline-boundary.md)
- [../../specs/011-pipeline-comercial-amplio/spec-funcional.md](../../specs/011-pipeline-comercial-amplio/spec-funcional.md)
- [../../specs/011-pipeline-comercial-amplio/spec-tecnica.md](../../specs/011-pipeline-comercial-amplio/spec-tecnica.md)
- [../../specs/011-pipeline-comercial-amplio/spec-tareas.md](../../specs/011-pipeline-comercial-amplio/spec-tareas.md)
- [../../specs/011-pipeline-comercial-amplio/traceability.md](../../specs/011-pipeline-comercial-amplio/traceability.md)
```

- [ ] **Step 3: Crear los cuatro artefactos SDD**

Crear `spec-funcional.md` con esta base:

```md
# Spec Funcional - Pipeline Comercial Amplio

## Requisitos funcionales clave
- `pipelineStage` manual
- `priority` manual
- `commercialChannel` principal
- `lostReason` obligatorio al cerrar como `lost`
- `won` con nota y evidencia
- bandeja comercial filtrable
- vistas de pendientes de hoy y vencidos
```

Crear `spec-tecnica.md` con esta base:

```md
# Spec Tecnica - Pipeline Comercial Amplio

## Decisiones tecnicas
- extender `customer_relationship_case`
- no abrir `commercial_opportunity`
- mantener timeline inmutable
- mantener `status` y `pipelineStage` desacoplados
```

Crear `spec-tareas.md` con esta base:

```md
# Spec Tareas - Pipeline Comercial Amplio

- preservar la frontera con `010`
- no meter scoring ni automatizaciones
- mantener `/crm` como superficie visible
- cubrir los cierres `won` y `lost`
```

Crear `traceability.md` con esta base:

```md
# Traceability - Pipeline Comercial Amplio

- TR-01 `011` vive sobre `customer_relationship_case`
- TR-02 `pipelineStage` es manual
- TR-03 `priority` es manual
- TR-04 `lostReason` es obligatorio al pasar a `lost`
- TR-05 `won` exige nota y evidencia
- TR-06 la bandeja vive dentro de `/crm`
```

- [ ] **Step 4: Verificar el paquete SDD**

Run:

```bash
find specs/011-pipeline-comercial-amplio -maxdepth 2 -type f | sort
rg -n "pipelineStage|priority|commercialChannel|lostReason|won|lost|customer_relationship_case" specs/011-pipeline-comercial-amplio docs/fase-4-sdd/README.md
```

Expected: aparecen los cuatro artefactos SDD y el indice de Fase 4 enlaza el slice `011`.

- [ ] **Step 5: Commit de Fase 4**

```bash
git add docs/fase-4-sdd specs/011-pipeline-comercial-amplio
git commit -m "docs: add pipeline comercial amplio canonical specs"
```

### Task 5: Sincronizar la capa transversal y cerrar el gap canonico

**Files:**
- Modify: `AI_CONTEXT.md`
- Modify: `PROJECT_MAP.md`
- Modify: `TRACEABILITY_MATRIX.md`
- Modify: `docs/transversal/90.00-mapa-homologacion-brownfield.md`

- [ ] **Step 1: Releer el estado transversal actual**

Run:

```bash
sed -n '1,240p' AI_CONTEXT.md
sed -n '1,260p' PROJECT_MAP.md
sed -n '1,260p' TRACEABILITY_MATRIX.md
sed -n '1,260p' docs/transversal/90.00-mapa-homologacion-brownfield.md
```

Expected: detectar los bullets y tablas que todavia marcan pipeline comercial amplio como gap pendiente.

- [ ] **Step 2: Actualizar `AI_CONTEXT.md`**

Reflejar:

```md
- Fase activa: capa canonica intermedia extendida y sincronizada hasta el slice `011-pipeline-comercial-amplio`
- Gates pendientes: scoring y automatizaciones comerciales posteriores al pipeline amplio
- Proximos pasos: priorizar scoring o automatizaciones posteriores
```

- [ ] **Step 3: Actualizar `TRACEABILITY_MATRIX.md`**

Reflejar:

```md
- Fases 1-4 backfilled para `011-pipeline-comercial-amplio`
- `REQ-HH-005`: pipeline comercial amplio ya backfilled; scoring y automatizaciones posteriores siguen pendientes
- gap principal: scoring y automatizaciones mas alla del pipeline amplio
```

- [ ] **Step 4: Actualizar `PROJECT_MAP.md` y `90.00-mapa-homologacion-brownfield.md`**

Reflejar:

```md
- la capa canonica ya cubre slices `001` a `011`
- `/crm` ya incluye identidad, CRM manual por pedido, CRM transversal por cliente y pipeline comercial amplio
- el siguiente hueco metodologico ya es scoring o automation posteriores
```

- [ ] **Step 5: Verificacion final del corte**

Run:

```bash
git diff --check
rg -n "pipeline comercial amplio|011-pipeline-comercial-amplio|scoring|automatizaciones comerciales" AI_CONTEXT.md PROJECT_MAP.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md docs/fase-1-analisis-requerimientos docs/fase-2-ux-ui docs/fase-3-arquitectura docs/fase-4-sdd specs/011-pipeline-comercial-amplio
git status --short --branch
```

Expected: `git diff --check` limpio, referencias del slice `011` presentes y arbol listo para commit final.

- [ ] **Step 6: Commit final de sincronizacion**

```bash
git add AI_CONTEXT.md PROJECT_MAP.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md docs/fase-1-analisis-requerimientos docs/fase-2-ux-ui docs/fase-3-arquitectura docs/fase-4-sdd specs/011-pipeline-comercial-amplio
git commit -m "docs: align canonical layer for pipeline comercial amplio"
```

## Self-Review

- Cobertura del spec: el plan abre Fases 1-4 y sincroniza la capa transversal para `011`, cubriendo `pipelineStage`, `priority`, `commercialChannel`, `lostReason`, `lastPipelineActivityAt`, la bandeja comercial, los cierres `won/lost` y la frontera con `010`.
- Placeholder scan: no usar marcadores vacios ni referencias incompletas; si aparece alguna, sustituirla antes de ejecutar.
- Consistencia de tipos: mantener exactamente `customer_relationship_case`, `pipelineStage`, `priority`, `commercialChannel`, `lostReason`, `lastPipelineActivityAt`, `won`, `lost`, `commercialOwner`, `assignee`, `nextStep` y `followUpAt` en todos los artefactos.
