# Huele Huele Scoring Y Automatizaciones Comerciales Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir el slice canonico `012-scoring-y-automatizaciones-comerciales` en `ERP-HUELEHUELE` como homologacion brownfield `as-is`, extendiendo `customer_relationship_case` con scoring determinista, razon visible del score, catalogo cerrado de reglas, eventos comerciales y automatizaciones simples auditables sin abrir journeys, opportunities ni IA opaca.

**Architecture:** La homologacion aterriza sobre `010-crm-transversal-por-cliente`, `011-pipeline-comercial-amplio` y `006-campaigns-marketing-automation`, manteniendo `customer_relationship_case` como agregado unico por cliente canonico. El slice agrega score derivado `cold/warm/hot`, triggers y eventos derivados simples, un catalogo cerrado de reglas con `active/inactive`, `order`, `cooldown`, filtros de elegibilidad y acciones acotadas, dejando `/crm` como superficie principal y `notifications/worker` como frontera de dispatch real para side effects.

**Tech Stack:** Markdown, git worktree, monorepo `Next.js` + `NestJS` + `Prisma`, runtime real en `apps/admin`, `apps/api`, `apps/worker`, `packages/shared` y `docs/product`, verificacion documental con `git diff --check`, `rg`, `find` y `sed`.

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

- `docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-34-calculo-y-explicacion-del-score-comercial.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-35-ejecucion-de-reglas-y-acciones-simples.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-36-idempotencia-y-cooldown-de-automatizaciones.md`
- `docs/fase-1-analisis-requerimientos/reglas/scoring-y-automatizaciones-comerciales.md`

### New Phase 2 files

- `docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md`
- `specs/012-scoring-y-automatizaciones-comerciales/product-design.md`
- `specs/012-scoring-y-automatizaciones-comerciales/spdd-frontend.md`

### New Phase 3 files

- `docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md`
- `docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md`

### New Phase 4 files

- `specs/012-scoring-y-automatizaciones-comerciales/spec-funcional.md`
- `specs/012-scoring-y-automatizaciones-comerciales/spec-tecnica.md`
- `specs/012-scoring-y-automatizaciones-comerciales/spec-tareas.md`
- `specs/012-scoring-y-automatizaciones-comerciales/traceability.md`

### Responsibilities

- Fase 1 fija el alcance funcional del score determinista, los triggers fuente, los eventos derivados, el catalogo cerrado de reglas, las acciones simples, la deduplicacion por `ruleId + customerRelationshipCaseId + actionType` y el `cooldown` por regla.
- Fase 2 fija el contrato UX en `/crm`: tier visible `cold/warm/hot`, razon visible corta del score, sugerencia de prioridad, tareas automaticas y trazabilidad de efectos simples, sin abrir consola separada ni builder libre.
- Fase 3 fija la frontera entre `customer_relationship_case`, `pipelineStage`, `priority`, `notifications/worker`, catalogo de campañas de `006` y futuras automatizaciones complejas o scoring mas avanzado.
- Fase 4 convierte el slice en paquete SDD trazable para evolucion futura sin romper `010`, `011` ni `006`.
- La capa transversal actualiza el principal gap del canon: ya no faltaria scoring y automatizaciones simples sobre el caso comercial, sino automatizacion comercial mas amplia o journeys futuros si el brownfield los justificara.

### Task 1: Abrir Fase 1 del slice `012-scoring-y-automatizaciones-comerciales`

**Files:**
- Modify: `docs/fase-1-analisis-requerimientos/README.md`
- Create: `docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-34-calculo-y-explicacion-del-score-comercial.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-35-ejecucion-de-reglas-y-acciones-simples.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-36-idempotencia-y-cooldown-de-automatizaciones.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/scoring-y-automatizaciones-comerciales.md`

- [ ] **Step 1: Releer el contexto canonico y el brownfield fuente**

Run:

```bash
sed -n '1,240p' docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md
sed -n '1,260p' docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md
sed -n '1,220p' docs/fase-1-analisis-requerimientos/reglas/pipeline-comercial-amplio.md
sed -n '1,220p' docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md
sed -n '1,260p' docs/superpowers/specs/2026-05-29-huelehuele-scoring-y-automatizaciones-comerciales-design.md
rg -n "trigger|score|automation|campaign|followup|priority|pipelineStage" docs/product docs/architecture packages/shared apps
```

Expected: evidencia de que `012` debe vivir sobre `customer_relationship_case`, reutilizar `006` para campaigns y fijar scoring/automatizacion simple sin abrir `commercial_opportunity` ni journeys.

- [ ] **Step 2: Actualizar el indice de Fase 1**

Anadir en `docs/fase-1-analisis-requerimientos/README.md`:

```md
## Slice 012 - Scoring Y Automatizaciones Comerciales
- [01.11-scoring-y-automatizaciones-comerciales.md](01.11-scoring-y-automatizaciones-comerciales.md)
- [casos-de-uso/UC-34-calculo-y-explicacion-del-score-comercial.md](casos-de-uso/UC-34-calculo-y-explicacion-del-score-comercial.md)
- [casos-de-uso/UC-35-ejecucion-de-reglas-y-acciones-simples.md](casos-de-uso/UC-35-ejecucion-de-reglas-y-acciones-simples.md)
- [casos-de-uso/UC-36-idempotencia-y-cooldown-de-automatizaciones.md](casos-de-uso/UC-36-idempotencia-y-cooldown-de-automatizaciones.md)
- [reglas/scoring-y-automatizaciones-comerciales.md](reglas/scoring-y-automatizaciones-comerciales.md)
```

- [ ] **Step 3: Crear el documento rector de Fase 1**

Crear `docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md` con esta estructura base:

```md
# Fase 1 - Scoring Y Automatizaciones Comerciales

## Objetivo
Homologar scoring determinista y automatizaciones comerciales simples sobre `customer_relationship_case`, formalizando tier visible, triggers fuente, eventos derivados, catalogo cerrado de reglas y side effects acotados sin abrir journeys, opportunities ni IA opaca.

## Dentro de alcance
- `customer_relationship_case`
- `scoreTier`
- razon visible corta del score
- triggers fuente
- eventos derivados simples
- catalogo cerrado de reglas
- `active/inactive`
- `order`
- `cooldown`
- `recalculate_score`
- `suggest_priority`
- `create_followup_task`
- `enqueue_existing_campaign`

## Fuera de alcance
- `commercial_opportunity`
- journeys multi-step
- builder libre de reglas
- override manual del score
- cambio automatico de `pipelineStage`
- cambio automatico de `status`
- IA opaca

## Regla critica
- el score es determinista y auditable
- solo se muestra el tier `cold/warm/hot`
- las automatizaciones no mueven `pipelineStage` ni `status`
```

- [ ] **Step 4: Crear los tres casos de uso canonicos**

Crear `UC-34-calculo-y-explicacion-del-score-comercial.md`:

```md
# UC-34 Calculo Y Explicacion Del Score Comercial

## Actores
- marketing
- ventas
- customers

## Flujo principal
1. un trigger fuente o derivado impacta el `customer_relationship_case`
2. el sistema recalcula el score de forma determinista
3. el puntaje interno se colapsa a `cold`, `warm` o `hot`
4. `/crm` muestra el tier visible y una razon corta del score
```

Crear `UC-35-ejecucion-de-reglas-y-acciones-simples.md`:

```md
# UC-35 Ejecucion De Reglas Y Acciones Simples

## Actores
- marketing
- ventas
- worker

## Flujo principal
1. una regla activa recibe un trigger valido
2. se evalua elegibilidad por filtros simples
3. la regla puede recalcular score, sugerir prioridad, crear tarea o encolar una campaña existente
4. el side effect queda trazado sobre el mismo caso
```

Crear `UC-36-idempotencia-y-cooldown-de-automatizaciones.md`:

```md
# UC-36 Idempotencia Y Cooldown De Automatizaciones

## Actores
- marketing
- worker

## Flujo principal
1. una regla intenta ejecutar una accion sobre un caso
2. el sistema deduplica por `ruleId + customerRelationshipCaseId + actionType`
3. si la ventana `cooldown` sigue activa, no repite el side effect
4. el score puede recalcularse aunque el side effect quede bloqueado por cooldown
```

- [ ] **Step 5: Crear la hoja de reglas funcionales**

Crear `docs/fase-1-analisis-requerimientos/reglas/scoring-y-automatizaciones-comerciales.md`:

```md
# Reglas De Scoring Y Automatizaciones Comerciales

- `012` vive sobre `customer_relationship_case`
- no abre `commercial_opportunity`
- el score es determinista y auditable
- el tier visible usa `cold`, `warm` y `hot`
- el puntaje interno no se muestra en UI
- el score no admite override manual
- triggers fuente: `pipeline_stage_changed`, `followup_due`, `followup_overdue`, `order_confirmed`, `payment_confirmed`, `case_reopened`
- eventos derivados: `score_changed`, `followup_candidate_detected`
- acciones cerradas: `recalculate_score`, `suggest_priority`, `create_followup_task`, `enqueue_existing_campaign`
- las reglas usan `active/inactive`, `order`, `cooldown` y filtros simples
- la deduplicacion base usa `ruleId + customerRelationshipCaseId + actionType`
- las automatizaciones no mueven `pipelineStage` ni `status`
```

- [ ] **Step 6: Verificar Fase 1 abierta**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort
rg -n "score|cold|warm|hot|cooldown|recalculate_score|enqueue_existing_campaign|followup_candidate_detected" docs/fase-1-analisis-requerimientos
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `012`.

- [ ] **Step 7: Commit de Fase 1**

```bash
git add docs/fase-1-analisis-requerimientos
git commit -m "docs: open scoring automations phase 1 slice"
```

### Task 2: Abrir Fase 2 y los artefactos UX del slice `012`

**Files:**
- Modify: `docs/fase-2-ux-ui/README.md`
- Create: `docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md`
- Create: `specs/012-scoring-y-automatizaciones-comerciales/product-design.md`
- Create: `specs/012-scoring-y-automatizaciones-comerciales/spdd-frontend.md`

- [ ] **Step 1: Releer la superficie UX existente en `/crm`**

Run:

```bash
sed -n '1,240p' docs/fase-2-ux-ui/02.09-crm-transversal-por-cliente-ux-ui.md
sed -n '1,260p' docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md
sed -n '1,220p' specs/011-pipeline-comercial-amplio/product-design.md
sed -n '1,220p' specs/011-pipeline-comercial-amplio/spdd-frontend.md
sed -n '1,260p' apps/admin/components/crm-workspace.tsx
```

Expected: base suficiente para describir tier visible, razon corta, sugerencia de prioridad y trazabilidad de automatizaciones dentro de `/crm` sin vender consola separada ni builder libre.

- [ ] **Step 2: Actualizar el indice de Fase 2**

Anadir en `docs/fase-2-ux-ui/README.md`:

```md
## Slice 012 - Scoring Y Automatizaciones Comerciales
- [02.11-scoring-y-automatizaciones-comerciales-ux-ui.md](02.11-scoring-y-automatizaciones-comerciales-ux-ui.md)
- [../../specs/012-scoring-y-automatizaciones-comerciales/product-design.md](../../specs/012-scoring-y-automatizaciones-comerciales/product-design.md)
- [../../specs/012-scoring-y-automatizaciones-comerciales/spdd-frontend.md](../../specs/012-scoring-y-automatizaciones-comerciales/spdd-frontend.md)
```

- [ ] **Step 3: Crear el contrato UX principal**

Crear `docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md`:

```md
# Fase 2 - Scoring Y Automatizaciones Comerciales UX/UI

## Superficie principal
- detalle del cliente dentro de `/crm`

## Superficie secundaria
- misma bandeja comercial de `/crm`

## Elementos visibles clave
- `scoreTier`
- razon visible corta del score
- sugerencia de prioridad
- tareas automaticas
- trazabilidad de automatizaciones simples

## Guardrails
- no mostrar puntaje interno
- no abrir consola separada de automation
- no vender journeys ni builder libre
```

- [ ] **Step 4: Crear `product-design.md`**

Crear `specs/012-scoring-y-automatizaciones-comerciales/product-design.md`:

```md
# Product Design - Scoring Y Automatizaciones Comerciales

## Objetivo de UX
Hacer visible el score comercial y sus efectos simples dentro de `/crm` sin romper la lectura del caso ni convertir el producto en una suite de automation compleja.

## Señales UX
- tier visible `cold/warm/hot`
- razon corta del score
- sugerencia de prioridad
- tarea automatica creada
- trazabilidad visible de la regla que actuó
```

- [ ] **Step 5: Crear `spdd-frontend.md`**

Crear `specs/012-scoring-y-automatizaciones-comerciales/spdd-frontend.md`:

```md
# SPDD Frontend - Scoring Y Automatizaciones Comerciales

## Superficie
- `/crm`

## Contrato minimo visible
- mostrar `scoreTier`
- mostrar razon corta del score
- mostrar sugerencia de prioridad sin autoescribir `priority`
- mostrar tareas o recordatorios automaticos del caso
- mostrar trazabilidad de automatizaciones simples

## No prometer
- score numerico visible
- builder de reglas
- consola separada
- journeys
```

- [ ] **Step 6: Verificar Fase 2 abierta**

Run:

```bash
find docs/fase-2-ux-ui specs/012-scoring-y-automatizaciones-comerciales -maxdepth 2 -type f | sort
rg -n "cold|warm|hot|score|automation|priority|campaign|cooldown" docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md specs/012-scoring-y-automatizaciones-comerciales
```

Expected: aparecen los tres artefactos UX y el `rg` devuelve hits del slice `012`.

- [ ] **Step 7: Commit de Fase 2**

```bash
git add docs/fase-2-ux-ui specs/012-scoring-y-automatizaciones-comerciales
git commit -m "docs: add scoring automations ux slice"
```

### Task 3: Abrir Fase 3 y la arquitectura del slice `012`

**Files:**
- Modify: `docs/fase-3-arquitectura/README.md`
- Create: `docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md`

- [ ] **Step 1: Releer fronteras arquitectonicas cercanas**

Run:

```bash
sed -n '1,260p' docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md
sed -n '1,260p' docs/fase-3-arquitectura/03.12-crm-transversal-por-cliente.md
sed -n '1,260p' docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md
sed -n '1,240p' docs/fase-3-arquitectura/adr/ADR-011-customers-commercial-pipeline-boundary.md
rg -n "trigger|campaign|worker|score|priority|crm" apps/api apps/worker packages/shared
```

Expected: evidencia para fijar que score y sugerencias van inline, mientras side effects salen por worker, sin mover `pipelineStage` ni `status`.

- [ ] **Step 2: Actualizar el indice de Fase 3**

Anadir en `docs/fase-3-arquitectura/README.md`:

```md
## Slice 012 - Scoring Y Automatizaciones Comerciales
- [03.14-scoring-y-automatizaciones-comerciales.md](03.14-scoring-y-automatizaciones-comerciales.md)
- [adr/ADR-012-customers-scoring-automation-boundary.md](adr/ADR-012-customers-scoring-automation-boundary.md)
```

- [ ] **Step 3: Crear el documento arquitectonico**

Crear `docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md`:

```md
# Fase 3 - Scoring Y Automatizaciones Comerciales

## Decision central
El scoring y las automatizaciones simples viven sobre `customer_relationship_case`.

## Fronteras
- score y sugerencias inline
- side effects por worker
- campaigns existentes de `006`
- sin `commercial_opportunity`
- sin journeys
- sin cambio automatico de `pipelineStage`
- sin cambio automatico de `status`

## Side effects permitidos
- `recalculate_score`
- `suggest_priority`
- `create_followup_task`
- `enqueue_existing_campaign`
```

- [ ] **Step 4: Crear el ADR**

Crear `docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md`:

```md
# ADR-012 Customers Scoring Automation Boundary

## Decision
Montar `012` sobre `customer_relationship_case`, con scoring determinista, reglas simples activables y side effects acotados, dejando `notifications/worker` como frontera de ejecucion para acciones async.

## Consecuencias
- el score sigue siendo auditable
- `/crm` sigue siendo la superficie principal
- `006` conserva el ownership de campañas y dispatch
- `011` conserva ownership de `pipelineStage` y `priority`
- journeys y automation compleja quedan fuera del slice
```

- [ ] **Step 5: Verificar Fase 3 abierta**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 2 -type f | sort
rg -n "score|automation|cooldown|worker|campaign|pipelineStage|status" docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md
```

Expected: aparecen el documento de arquitectura y el ADR del slice `012`, con su frontera ya fijada.

- [ ] **Step 6: Commit de Fase 3**

```bash
git add docs/fase-3-arquitectura
git commit -m "docs: add scoring automations architecture slice"
```

### Task 4: Abrir Fase 4 y el paquete SDD del slice `012`

**Files:**
- Modify: `docs/fase-4-sdd/README.md`
- Create: `specs/012-scoring-y-automatizaciones-comerciales/spec-funcional.md`
- Create: `specs/012-scoring-y-automatizaciones-comerciales/spec-tecnica.md`
- Create: `specs/012-scoring-y-automatizaciones-comerciales/spec-tareas.md`
- Create: `specs/012-scoring-y-automatizaciones-comerciales/traceability.md`

- [ ] **Step 1: Releer Fases 1-3 del slice y el design spec**

Run:

```bash
sed -n '1,260p' docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md
sed -n '1,240p' docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md
sed -n '1,240p' docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md
sed -n '1,220p' docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md
sed -n '1,320p' docs/superpowers/specs/2026-05-29-huelehuele-scoring-y-automatizaciones-comerciales-design.md
```

Expected: paquete suficiente para bajar el slice a SDD sin contradicciones entre score, eventos, reglas, worker y `/crm`.

- [ ] **Step 2: Actualizar el README de Fase 4**

Anadir en `docs/fase-4-sdd/README.md`:

```md
## Slice 012 - Scoring Y Automatizaciones Comerciales
- [../../specs/012-scoring-y-automatizaciones-comerciales/spec-funcional.md](../../specs/012-scoring-y-automatizaciones-comerciales/spec-funcional.md)
- [../../specs/012-scoring-y-automatizaciones-comerciales/spec-tecnica.md](../../specs/012-scoring-y-automatizaciones-comerciales/spec-tecnica.md)
- [../../specs/012-scoring-y-automatizaciones-comerciales/spec-tareas.md](../../specs/012-scoring-y-automatizaciones-comerciales/spec-tareas.md)
- [../../specs/012-scoring-y-automatizaciones-comerciales/traceability.md](../../specs/012-scoring-y-automatizaciones-comerciales/traceability.md)
```

- [ ] **Step 3: Crear `spec-funcional.md`**

Crear `specs/012-scoring-y-automatizaciones-comerciales/spec-funcional.md` con estas secciones:

```md
# Spec Funcional - Scoring Y Automatizaciones Comerciales

## Objetivo
Formalizar score determinista, razon visible, triggers, eventos derivados, reglas simples y acciones acotadas sobre `customer_relationship_case`.

## Reglas funcionales canonicas
- el score usa `cold`, `warm`, `hot`
- el score se recalcula por eventos
- el score no admite override manual
- el score no mueve `pipelineStage` ni `status`
- `suggest_priority` no autoescribe `priority`
- `create_followup_task` vive sobre el caso del cliente
- `enqueue_existing_campaign` reutiliza `006`
- deduplicacion por `ruleId + customerRelationshipCaseId + actionType`
```

- [ ] **Step 4: Crear `spec-tecnica.md`**

Crear `specs/012-scoring-y-automatizaciones-comerciales/spec-tecnica.md`:

```md
# Spec Tecnica - Scoring Y Automatizaciones Comerciales

## Baseline
- `customer_relationship_case` ya existe en `customers`
- `/crm` ya existe como superficie
- `006` ya resuelve campaigns y dispatch

## Frontera tecnica
- score y sugerencias inline
- side effects por worker
- lectura visible en `/crm`
- sin modulo de opportunity
- sin journey engine
```

- [ ] **Step 5: Crear `spec-tareas.md`**

Crear `specs/012-scoring-y-automatizaciones-comerciales/spec-tareas.md` con backlog minimo:

```md
# Spec Tareas - Scoring Y Automatizaciones Comerciales

## T1
Extender contratos compartidos para score, triggers, eventos derivados, reglas y acciones.

## T2
Formalizar scoring determinista y razon visible en `customers`.

## T3
Formalizar idempotencia, cooldown y side effects async.

## T4
Sostener `/crm` como superficie visible del score y sus efectos.

## T5
Blindar frontera con `006`, `010` y `011`.
```

- [ ] **Step 6: Crear `traceability.md`**

Crear `specs/012-scoring-y-automatizaciones-comerciales/traceability.md`:

```md
# Traceability - Scoring Y Automatizaciones Comerciales

- score determinista -> Fase 1, Fase 2, Fase 3, paquete SDD
- triggers y eventos derivados -> Fase 1, Fase 3, paquete SDD
- catalogo cerrado de reglas -> Fase 1, Fase 3, paquete SDD
- acciones acotadas -> Fase 1, Fase 2, Fase 3, paquete SDD
- idempotencia y cooldown -> Fase 1, Fase 3, paquete SDD
- `/crm` como superficie visible -> Fase 2, Fase 3, paquete SDD
```

- [ ] **Step 7: Verificar Fase 4 abierta**

Run:

```bash
find specs/012-scoring-y-automatizaciones-comerciales -maxdepth 2 -type f | sort
rg -n "cold|warm|hot|score|cooldown|recalculate_score|enqueue_existing_campaign|customer_relationship_case" specs/012-scoring-y-automatizaciones-comerciales docs/fase-4-sdd/README.md
git diff --check
```

Expected: aparecen los cuatro artefactos SDD, el `rg` devuelve hits del slice y `git diff --check` sale limpio.

- [ ] **Step 8: Commit de Fase 4**

```bash
git add docs/fase-4-sdd specs/012-scoring-y-automatizaciones-comerciales
git commit -m "docs: add scoring automations canonical specs"
```

### Task 5: Sincronizar la capa transversal para el slice `012`

**Files:**
- Modify: `AI_CONTEXT.md`
- Modify: `PROJECT_MAP.md`
- Modify: `TRACEABILITY_MATRIX.md`
- Modify: `docs/transversal/90.00-mapa-homologacion-brownfield.md`

- [ ] **Step 1: Releer el estado transversal vigente**

Run:

```bash
rg -n "011|pipeline comercial amplio|scoring|automatizaciones comerciales" AI_CONTEXT.md PROJECT_MAP.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md
```

Expected: evidencia de que los entrypoints globales aun presentan scoring/automation como gap principal posterior a `011`.

- [ ] **Step 2: Actualizar `AI_CONTEXT.md`**

Cambios esperados:

```md
- Fase activa: ... hasta el slice `012-scoring-y-automatizaciones-comerciales`
- Gates pendientes: journeys o automatizaciones comerciales mas amplias si el brownfield las justifica
- Blockers: `012` ya fija scoring y automatizaciones simples; el gap siguiente ya no es score simple
```

- [ ] **Step 3: Actualizar `PROJECT_MAP.md`**

Cambios esperados:

```md
- slices canonicos brownfield homologados `001` a `012`
- `specs/` ya incluye `012-scoring-y-automatizaciones-comerciales`
```

- [ ] **Step 4: Actualizar `TRACEABILITY_MATRIX.md`**

Cambios esperados:

```md
- Fases 1-4 ya cubren `012`
- `REQ-HH-005` ya incluye scoring y automatizaciones comerciales simples
- el siguiente gap pasa a journeys o automatizacion comercial mas amplia si existiera masa brownfield
```

- [ ] **Step 5: Actualizar el mapa brownfield**

Cambios esperados en `docs/transversal/90.00-mapa-homologacion-brownfield.md`:

```md
- agregar referencias a `01.11`, `02.11`, `03.14` y `specs/012`
- reflejar que scoring y automatizaciones simples ya aterrizaron al canon
- mover el gap siguiente a automation mas amplia si aun aplica
```

- [ ] **Step 6: Verificar sincronizacion transversal**

Run:

```bash
git diff --check
rg -n "012|scoring|automatizaciones comerciales" AI_CONTEXT.md PROJECT_MAP.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md
git status --short --branch
```

Expected: `git diff --check` limpio, hits consistentes del slice `012` en los cuatro archivos y branch adelantada respecto de `origin`.

- [ ] **Step 7: Commit de sincronizacion transversal**

```bash
git add AI_CONTEXT.md PROJECT_MAP.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md
git commit -m "docs: align canonical layer for scoring automations"
```

## Self-Review

- Cobertura de spec:
  - score determinista y auditable -> Tasks 1, 3 y 4
  - tier visible `cold/warm/hot` y razon corta -> Tasks 1, 2 y 4
  - triggers fuente y eventos derivados -> Tasks 1, 3 y 4
  - catalogo cerrado de reglas con `active/inactive`, `order`, `cooldown` -> Tasks 1 y 3
  - acciones `recalculate_score`, `suggest_priority`, `create_followup_task`, `enqueue_existing_campaign` -> Tasks 1, 3 y 4
  - idempotencia por `ruleId + customerRelationshipCaseId + actionType` -> Tasks 1, 3 y 4
  - score inline y side effects por worker -> Task 3
  - `/crm` como superficie principal -> Tasks 2, 3 y 4
  - exclusion de journeys, `commercial_opportunity`, override manual y cambios automaticos de `pipelineStage/status` -> Tasks 1, 3, 4 y 5
- Placeholder scan:
  - no se dejaron `TODO`, `TBD` ni referencias vacias
  - cada task incluye archivos, comandos y resultado esperado
- Type consistency:
  - naming canonico consistente con el spec: `customer_relationship_case`, `scoreTier`, `cold/warm/hot`, `recalculate_score`, `suggest_priority`, `create_followup_task`, `enqueue_existing_campaign`, `score_changed`, `followup_candidate_detected`
