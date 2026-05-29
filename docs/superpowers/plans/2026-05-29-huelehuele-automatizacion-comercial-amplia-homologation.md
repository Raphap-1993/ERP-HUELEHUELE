# Huele Huele Automatizacion Comercial Amplia Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir el slice canonico `014-automatizacion-comercial-amplia` en `ERP-HUELEHUELE` como homologacion brownfield `as-is`, formalizando journeys comerciales multi-step sobre `customer_relationship_case`, con templates cerrados, waits, branches simples, pasos manuales, binding estable a oportunidad activa y side effects seguros sin abrir inbox, builder libre ni chaining entre journeys.

**Architecture:** La homologacion aterriza sobre `010-crm-transversal-por-cliente`, `011-pipeline-comercial-amplio`, `012-scoring-y-automatizaciones-comerciales` y `013-commercial-opportunities`, manteniendo `customer_relationship_case` como ancla del engine y usando `commercial_opportunity` solo como contexto ligado cuando exista. El slice agrega un catalogo cerrado de `journey templates`, instancias con estado propio `active/paused/completed/cancelled`, `journeyAssignee`, `wait`, `condition`, pasos manuales bloqueantes, reentrada por template y ejecucion mixta `inline + worker/BullMQ`, preservando `/crm` como superficie principal y `notifications/worker` como frontera de efectos y campañas ya existentes.

**Tech Stack:** Markdown, git worktree, monorepo `Next.js` + `NestJS` + `Prisma`, runtime real en `apps/admin`, `apps/api`, `apps/worker`, `packages/shared` y `docs/product`, verificacion documental con `git diff --check`, `rg`, `find`, `sed` y `git status`.

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

- `docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-40-instanciacion-y-ejecucion-del-journey-comercial.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-41-pasos-manuales-esperas-y-reanudacion-del-journey.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-42-reentrada-cancelacion-y-trazabilidad-del-journey.md`
- `docs/fase-1-analisis-requerimientos/reglas/automatizacion-comercial-amplia.md`

### New Phase 2 files

- `docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md`
- `specs/014-automatizacion-comercial-amplia/product-design.md`
- `specs/014-automatizacion-comercial-amplia/spdd-frontend.md`

### New Phase 3 files

- `docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md`
- `docs/fase-3-arquitectura/adr/ADR-014-customers-commercial-journey-boundary.md`

### New Phase 4 files

- `specs/014-automatizacion-comercial-amplia/spec-funcional.md`
- `specs/014-automatizacion-comercial-amplia/spec-tecnica.md`
- `specs/014-automatizacion-comercial-amplia/spec-tareas.md`
- `specs/014-automatizacion-comercial-amplia/traceability.md`

### Responsibilities

- Fase 1 fija el alcance funcional de los journeys: templates cerrados, auto-start por trigger canonico, lanzamiento manual excepcional, una instancia activa por `template + case`, waits, branches simples, pasos manuales, binding estable a oportunidad activa y reentrada por template.
- Fase 2 fija la superficie UX dentro de `/crm`: detalle del cliente con journeys activos/pausados, pasos manuales, hitos y bandeja secundaria de instancias, sin abrir otra consola ni un builder libre.
- Fase 3 fija la frontera entre `customer_relationship_case`, `commercial_opportunity`, `notifications/worker`, `BullMQ`, las acciones seguras del engine y las incompatibilidades fuertes o blandas.
- Fase 4 convierte el slice en paquete SDD trazable para evolucion futura sin romper `010`, `011`, `012` ni `013`.
- La capa transversal actualiza el principal gap del canon: ya no faltaria automation comercial multi-step sobre caso y oportunidad; el siguiente frente natural pasaria a ser expansion de canales, inbox o automatizacion mas avanzada solo si el brownfield lo justificara.

### Task 1: Abrir Fase 1 del slice `014-automatizacion-comercial-amplia`

**Files:**
- Modify: `docs/fase-1-analisis-requerimientos/README.md`
- Create: `docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-40-instanciacion-y-ejecucion-del-journey-comercial.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-41-pasos-manuales-esperas-y-reanudacion-del-journey.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-42-reentrada-cancelacion-y-trazabilidad-del-journey.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/automatizacion-comercial-amplia.md`

- [ ] **Step 1: Releer el contexto canonico y el brownfield fuente**

Run:

```bash
sed -n '1,260p' docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md
sed -n '1,260p' docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md
sed -n '1,260p' docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md
sed -n '1,260p' docs/superpowers/specs/2026-05-29-huelehuele-automatizacion-comercial-amplia-design.md
rg -n "journey|automation|trigger|BullMQ|worker|campaign|manual_review|wait|condition" docs/product docs/architecture apps packages
```

Expected: evidencia de que el brownfield ya permite journeys multi-step sobre `customer_relationship_case`, reutilizando `worker`, `campaigns` y pasos humanos sin convertir el engine en un workflow builder libre.

- [ ] **Step 2: Actualizar el indice de Fase 1**

Anadir en `docs/fase-1-analisis-requerimientos/README.md`:

```md
## Slice 014 - Automatizacion Comercial Amplia
- [01.13-automatizacion-comercial-amplia.md](01.13-automatizacion-comercial-amplia.md)
- [casos-de-uso/UC-40-instanciacion-y-ejecucion-del-journey-comercial.md](casos-de-uso/UC-40-instanciacion-y-ejecucion-del-journey-comercial.md)
- [casos-de-uso/UC-41-pasos-manuales-esperas-y-reanudacion-del-journey.md](casos-de-uso/UC-41-pasos-manuales-esperas-y-reanudacion-del-journey.md)
- [casos-de-uso/UC-42-reentrada-cancelacion-y-trazabilidad-del-journey.md](casos-de-uso/UC-42-reentrada-cancelacion-y-trazabilidad-del-journey.md)
- [reglas/automatizacion-comercial-amplia.md](reglas/automatizacion-comercial-amplia.md)
```

- [ ] **Step 3: Crear el documento rector de Fase 1**

Crear `docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md` con esta estructura base:

```md
# Fase 1 - Automatizacion Comercial Amplia

## Objetivo
Homologar journeys comerciales multi-step sobre `customer_relationship_case`, con binding estable a la oportunidad activa cuando aplique, templates cerrados, waits, condiciones simples, pasos manuales y side effects seguros sin abrir inbox, chaining entre journeys ni builder libre.

## Dentro de alcance
- `journey_template`
- `journey_instance`
- auto-start por trigger canonico
- lanzamiento manual excepcional
- una instancia activa por `template + case`
- multiples templates activos sobre el mismo caso
- `active`
- `paused`
- `completed`
- `cancelled`
- `journeyAssignee`
- `wait`
- `condition`
- `manual_review`
- `create_followup_task`
- `suggest_priority`
- `enqueue_existing_campaign`
- `mark_journey_milestone`
- `reentryCooldown`
- binding estable a oportunidad activa

## Fuera de alcance
- builder libre de journeys
- chaining entre journeys
- inbox comercial
- mensajeria bidireccional real
- mutacion automatica de `pipelineStage`
- mutacion automatica de `status`
- mutacion automatica de `opportunityStage`
- apertura automatica de `commercial_opportunity`

## Regla critica
- el journey vive anclado a `customer_relationship_case`
- la oportunidad activa es solo contexto ligado
- los pasos automaticos son seguros
- toda transicion y todo paso dejan traza obligatoria
```

- [ ] **Step 4: Crear los tres casos de uso canonicos**

Crear `UC-40-instanciacion-y-ejecucion-del-journey-comercial.md`:

```md
# UC-40 Instanciacion Y Ejecucion Del Journey Comercial

## Actores
- marketing
- ventas
- worker

## Flujo principal
1. ocurre un trigger canonico elegible para un template cerrado
2. el sistema valida que no exista otra instancia activa del mismo `template + case`
3. se crea la instancia con snapshot del template
4. el journey ejecuta pasos inmediatos `inline`
5. si aparece un `wait`, la continuacion queda delegada a `worker/BullMQ`
```

Crear `UC-41-pasos-manuales-esperas-y-reanudacion-del-journey.md`:

```md
# UC-41 Pasos Manuales Esperas Y Reanudacion Del Journey

## Actores
- ventas
- marketing
- worker

## Flujo principal
1. una instancia activa alcanza un paso `manual_review` o un `wait`
2. el paso manual bloquea la continuacion del journey
3. `ventas` o `marketing` lo resuelven desde `/crm`
4. al resolverse el paso manual, la instancia reanuda automaticamente si no queda otra condicion pendiente
5. los `wait` y reintentos temporales se reanudan por `worker/BullMQ`
```

Crear `UC-42-reentrada-cancelacion-y-trazabilidad-del-journey.md`:

```md
# UC-42 Reentrada Cancelacion Y Trazabilidad Del Journey

## Actores
- marketing
- ventas
- admin

## Flujo principal
1. una instancia puede completar por exito o cancelarse por incompatibilidad fuerte
2. si la incompatibilidad es blanda, la instancia puede pausarse
3. un template puede reingresar sobre el mismo caso tras `completed` o `cancelled` segun su politica
4. la reentrada respeta `reentryCooldown`
5. inicio, pausa, reanudacion, branch, paso manual, cancelacion y completion quedan trazados en el timeline del caso
```

- [ ] **Step 5: Crear la hoja de reglas funcionales**

Crear `docs/fase-1-analisis-requerimientos/reglas/automatizacion-comercial-amplia.md`:

```md
# Reglas De Automatizacion Comercial Amplia

- `014` vive sobre `customer_relationship_case`
- `marketing` es owner del catalogo de templates
- `ventas` consume efectos y resuelve pasos humanos dentro de `/crm`
- una sola instancia activa por `template + customer_relationship_case`
- un mismo caso puede tener varios journeys activos si son de templates distintos
- templates cerrados: `followup_recovery`, `reactivation_nurture`, `opportunity_progression`, `post_loss_recovery`
- estados de instancia: `active`, `paused`, `completed`, `cancelled`
- tipos de paso: `wait`, `condition`, `create_followup_task`, `manual_review`, `suggest_priority`, `enqueue_existing_campaign`, `mark_journey_milestone`
- las condiciones solo usan senales canonizadas del caso y de la oportunidad
- no se disparan otros journeys desde una instancia
- no se mutan automaticamente `pipelineStage`, `status` ni `opportunityStage`
- no se crea `commercial_opportunity` automaticamente
- el binding con oportunidad activa es estable al deal original
- incompatibilidad fuerte cancela
- incompatibilidad blanda pausa o desvia
- toda transicion y todo paso dejan traza obligatoria
```

- [ ] **Step 6: Verificar Fase 1 abierta**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort
rg -n "journey|manual_review|reentryCooldown|followup_recovery|opportunity_progression|enqueue_existing_campaign" docs/fase-1-analisis-requerimientos
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `014`.

- [ ] **Step 7: Commit de Fase 1**

```bash
git add docs/fase-1-analisis-requerimientos
git commit -m "docs: open automation journeys phase 1 slice"
```

### Task 2: Abrir Fase 2 y los artefactos UX del slice `014`

**Files:**
- Modify: `docs/fase-2-ux-ui/README.md`
- Create: `docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md`
- Create: `specs/014-automatizacion-comercial-amplia/product-design.md`
- Create: `specs/014-automatizacion-comercial-amplia/spdd-frontend.md`

- [ ] **Step 1: Releer la superficie UX existente en `/crm`**

Run:

```bash
sed -n '1,260p' docs/fase-2-ux-ui/02.09-crm-transversal-por-cliente-ux-ui.md
sed -n '1,240p' docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md
sed -n '1,240p' docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md
sed -n '1,240p' docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md
sed -n '1,260p' apps/admin/components/crm-workspace.tsx
```

Expected: base suficiente para describir journeys activos/pausados, pasos manuales, milestone trail y bandeja secundaria dentro del mismo `/crm`.

- [ ] **Step 2: Actualizar el indice de Fase 2**

Anadir en `docs/fase-2-ux-ui/README.md`:

```md
## Slice 014 - Automatizacion Comercial Amplia
- [02.13-automatizacion-comercial-amplia-ux-ui.md](02.13-automatizacion-comercial-amplia-ux-ui.md)
- [../../specs/014-automatizacion-comercial-amplia/product-design.md](../../specs/014-automatizacion-comercial-amplia/product-design.md)
- [../../specs/014-automatizacion-comercial-amplia/spdd-frontend.md](../../specs/014-automatizacion-comercial-amplia/spdd-frontend.md)
```

- [ ] **Step 3: Crear la guia UX del slice**

Crear `docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md` describiendo:

- bloque de journeys en el detalle del cliente
- vista de pasos actuales, ultimo milestone y razon de pausa/cancelacion
- resolucion de `manual_review` dentro del mismo `/crm`
- bandeja secundaria de journeys `active/paused` con filtros para `completed/cancelled`
- lectura del binding a oportunidad activa cuando exista
- guardrails para no vender builder libre ni chaining

- [ ] **Step 4: Crear `product-design.md`**

Crear `specs/014-automatizacion-comercial-amplia/product-design.md` con:

- objetivo del journey workspace
- jerarquia visual entre caso comercial, oportunidad activa y journey
- lectura de estado de instancia
- tratamiento de pasos manuales bloqueantes
- tratamiento de waits, pausas y completions

- [ ] **Step 5: Crear `spdd-frontend.md`**

Crear `specs/014-automatizacion-comercial-amplia/spdd-frontend.md` con:

- surface principal dentro de `/crm`
- componentes esperados: resumen de instancia, step rail, manual review card, milestone list y bandeja secundaria
- estados de carga, vacio, pausado, cancelado y completado
- guardrails para no mezclar estado del caso, estado del deal y estado del journey

- [ ] **Step 6: Verificar Fase 2 abierta**

Run:

```bash
find docs/fase-2-ux-ui specs/014-automatizacion-comercial-amplia -maxdepth 2 -type f | sort
rg -n "journey|manual_review|paused|completed|cancelled|milestone|opportunity" docs/fase-2-ux-ui specs/014-automatizacion-comercial-amplia
```

Expected: aparecen los nuevos artefactos UX del slice `014`.

- [ ] **Step 7: Commit de Fase 2**

```bash
git add docs/fase-2-ux-ui specs/014-automatizacion-comercial-amplia
git commit -m "docs: add automation journeys ux slice"
```

### Task 3: Abrir Fase 3 y la arquitectura del slice `014`

**Files:**
- Modify: `docs/fase-3-arquitectura/README.md`
- Create: `docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-014-customers-commercial-journey-boundary.md`

- [ ] **Step 1: Releer arquitectura previa relevante**

Run:

```bash
sed -n '1,260p' docs/fase-3-arquitectura/03.12-crm-transversal-por-cliente.md
sed -n '1,260p' docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md
sed -n '1,260p' docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md
sed -n '1,260p' docs/fase-3-arquitectura/03.15-commercial-opportunities.md
sed -n '1,220p' docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md
sed -n '1,220p' docs/fase-3-arquitectura/adr/ADR-013-customers-commercial-opportunity-boundary.md
```

Expected: claridad sobre la frontera entre el caso comercial, la oportunidad activa, el worker, las campañas y el engine de journeys.

- [ ] **Step 2: Actualizar el indice de Fase 3**

Anadir en `docs/fase-3-arquitectura/README.md`:

```md
## Slice 014 - Automatizacion Comercial Amplia
- [03.16-automatizacion-comercial-amplia.md](03.16-automatizacion-comercial-amplia.md)
- [adr/ADR-014-customers-commercial-journey-boundary.md](adr/ADR-014-customers-commercial-journey-boundary.md)
```

- [ ] **Step 3: Crear el documento rector de arquitectura**

Crear `docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md` describiendo:

- `customer_relationship_case` como ancla del journey
- `commercial_opportunity` como contexto ligado opcional
- catalogo cerrado de templates y snapshot al instanciar
- estados de instancia y tipos de paso
- ejecucion `inline + worker/BullMQ`
- incompatibilidades fuertes vs blandas
- reentrada por template
- traza obligatoria dentro del mismo `/crm`

- [ ] **Step 4: Crear el ADR de frontera**

Crear `docs/fase-3-arquitectura/adr/ADR-014-customers-commercial-journey-boundary.md` con:

- Decision: journeys anclados al caso, no a la oportunidad como raiz
- Consequence: binding estable al deal original
- Consequence: no chaining entre journeys
- Consequence: acciones automaticas seguras sin mutar estados comerciales
- Consequence: `worker` opera timers y continuaciones sin adueñarse del dominio comercial

- [ ] **Step 5: Verificar Fase 3 abierta**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 2 -type f | sort
rg -n "journey|template|BullMQ|manual_review|reentry|incompatibil|customer_relationship_case|commercial_opportunity" docs/fase-3-arquitectura
```

Expected: aparecen el documento `03.16` y el ADR `014`, con la terminologia del slice `014`.

- [ ] **Step 6: Commit de Fase 3**

```bash
git add docs/fase-3-arquitectura
git commit -m "docs: add automation journeys architecture slice"
```

### Task 4: Abrir Fase 4 y el paquete canonico del slice `014`

**Files:**
- Modify: `docs/fase-4-sdd/README.md`
- Create: `specs/014-automatizacion-comercial-amplia/spec-funcional.md`
- Create: `specs/014-automatizacion-comercial-amplia/spec-tecnica.md`
- Create: `specs/014-automatizacion-comercial-amplia/spec-tareas.md`
- Create: `specs/014-automatizacion-comercial-amplia/traceability.md`

- [ ] **Step 1: Releer los paquetes canonicos previos**

Run:

```bash
sed -n '1,260p' specs/012-scoring-y-automatizaciones-comerciales/spec-funcional.md
sed -n '1,280p' specs/012-scoring-y-automatizaciones-comerciales/spec-tecnica.md
sed -n '1,240p' specs/013-commercial-opportunities/spec-funcional.md
sed -n '1,280p' specs/013-commercial-opportunities/spec-tecnica.md
sed -n '1,220p' docs/fase-4-sdd/README.md
```

Expected: referencia suficiente para estructurar `014` sin romper el tono ni la profundidad del paquete SDD existente.

- [ ] **Step 2: Actualizar el indice de Fase 4**

Anadir en `docs/fase-4-sdd/README.md`:

```md
## Slice 014 - Automatizacion Comercial Amplia
- [../../specs/014-automatizacion-comercial-amplia/spec-funcional.md](../../specs/014-automatizacion-comercial-amplia/spec-funcional.md)
- [../../specs/014-automatizacion-comercial-amplia/spec-tecnica.md](../../specs/014-automatizacion-comercial-amplia/spec-tecnica.md)
- [../../specs/014-automatizacion-comercial-amplia/spec-tareas.md](../../specs/014-automatizacion-comercial-amplia/spec-tareas.md)
- [../../specs/014-automatizacion-comercial-amplia/traceability.md](../../specs/014-automatizacion-comercial-amplia/traceability.md)
```

- [ ] **Step 3: Crear `spec-funcional.md`**

Crear `specs/014-automatizacion-comercial-amplia/spec-funcional.md` con secciones para:

- objetivo del journey engine
- templates canonicos
- triggers de inicio
- elegibilidad por contexto comercial
- estados de instancia
- tipos de paso
- binding con oportunidad activa
- pausa, cancelacion, completion y reentrada
- trazabilidad obligatoria
- limites explicitos del slice

- [ ] **Step 4: Crear `spec-tecnica.md`**

Crear `specs/014-automatizacion-comercial-amplia/spec-tecnica.md` con:

- modelo conceptual de `journey_template`
- modelo de `journey_instance`
- snapshot del template
- `journeyAssignee`
- estados de instancia
- step execution model `inline + worker/BullMQ`
- contrato de `manual_review`
- contrato de binding estable con oportunidad
- guardrails de idempotencia y reentrada

- [ ] **Step 5: Crear `spec-tareas.md`**

Crear `specs/014-automatizacion-comercial-amplia/spec-tareas.md` con backlog canonico tipo:

- persistencia de templates e instancias
- motor de evaluacion y gating
- scheduler para waits
- resolucion de pasos manuales
- timeline y milestones
- bandeja `/crm`
- integracion con campañas existentes
- verificaciones de pausa/cancelacion/reentrada

- [ ] **Step 6: Crear `traceability.md`**

Crear `specs/014-automatizacion-comercial-amplia/traceability.md` mapeando:

- requerimientos del spec de `014`
- artefactos de Fase 1, 2 y 3
- dependencia hacia `006`, `010`, `011`, `012` y `013`
- limites explicitamente no absorbidos por `014`

- [ ] **Step 7: Verificar Fase 4 abierta**

Run:

```bash
find specs/014-automatizacion-comercial-amplia -maxdepth 2 -type f | sort
rg -n "journey|template|manual_review|BullMQ|reentry|completion|cancelled|commercial_opportunity" specs/014-automatizacion-comercial-amplia
```

Expected: aparecen los cuatro artefactos canonicos del slice `014` y el `rg` devuelve hits consistentes con el engine multi-step.

- [ ] **Step 8: Commit de Fase 4**

```bash
git add docs/fase-4-sdd specs/014-automatizacion-comercial-amplia
git commit -m "docs: add automation journeys canonical specs"
```

### Task 5: Sincronizar la capa transversal y cerrar el canon del slice `014`

**Files:**
- Modify: `AI_CONTEXT.md`
- Modify: `TRACEABILITY_MATRIX.md`
- Modify: `PROJECT_MAP.md`
- Modify: `docs/transversal/90.00-mapa-homologacion-brownfield.md`

- [ ] **Step 1: Releer la capa transversal vigente**

Run:

```bash
sed -n '1,260p' AI_CONTEXT.md
sed -n '1,260p' TRACEABILITY_MATRIX.md
sed -n '1,260p' PROJECT_MAP.md
sed -n '1,260p' docs/transversal/90.00-mapa-homologacion-brownfield.md
```

Expected: claridad sobre como registrar `014` sin desalinear el estado global del programa de homologacion.

- [ ] **Step 2: Actualizar `AI_CONTEXT.md`**

Registrar en `AI_CONTEXT.md`:

- que `014-automatizacion-comercial-amplia` ya canoniza journeys multi-step
- que el engine sigue anclado a `customer_relationship_case`
- que la oportunidad activa es contexto ligado, no agregado raiz
- que el siguiente gap ya no es automation multi-step basica, sino expansion de canales o inbox si el brownfield la valida

- [ ] **Step 3: Actualizar `TRACEABILITY_MATRIX.md`**

Anadir o ajustar trazabilidad para reflejar:

- triggers y journeys multi-step sobre el caso comercial
- waits, pasos manuales, reentrada y binding con oportunidad
- dependencia explicita en `006`, `012` y `013`

- [ ] **Step 4: Actualizar `PROJECT_MAP.md` y el mapa brownfield**

Actualizar `PROJECT_MAP.md` y `docs/transversal/90.00-mapa-homologacion-brownfield.md` para:

- incluir el slice `014`
- ubicarlo despues de `013-commercial-opportunities`
- dejar asentado el nuevo frente pendiente despues de journeys comerciales multi-step

- [ ] **Step 5: Verificacion final del corte**

Run:

```bash
git diff --check
rg -n "014-automatizacion-comercial-amplia|journey|manual_review|reentryCooldown|followup_recovery|opportunity_progression" AI_CONTEXT.md TRACEABILITY_MATRIX.md PROJECT_MAP.md docs/transversal/90.00-mapa-homologacion-brownfield.md docs/fase-1-analisis-requerimientos docs/fase-2-ux-ui docs/fase-3-arquitectura specs/014-automatizacion-comercial-amplia
git status --short --branch
```

Expected: sin whitespace errors, hits consistentes del slice `014` en todas las capas y branch con cambios listos para commit.

- [ ] **Step 6: Commit de sincronizacion transversal**

```bash
git add AI_CONTEXT.md TRACEABILITY_MATRIX.md PROJECT_MAP.md docs/transversal/90.00-mapa-homologacion-brownfield.md
git add docs/fase-1-analisis-requerimientos docs/fase-2-ux-ui docs/fase-3-arquitectura docs/fase-4-sdd specs/014-automatizacion-comercial-amplia
git commit -m "docs: align canonical layer for automation journeys"
```
