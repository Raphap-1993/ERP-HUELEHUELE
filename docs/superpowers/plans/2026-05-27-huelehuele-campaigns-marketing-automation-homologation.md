# Huele Huele Campaigns Marketing Automation Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir el slice canonico `006-campaigns-marketing-automation` en `ERP-HUELEHUELE` como homologacion brownfield `as-is`, dejando Fases 1-4 y la capa transversal listas para el modulo real de `marketing` sin mezclarlo con CRM ampliado ni con un journey engine.

**Architecture:** La homologacion aterriza sobre el modulo `marketing` ya vivo en runtime: `campaigns` como agregado principal, `segments` y `templates` como catalogos read-only, scheduling basico por `scheduledAt`, snapshot operativo congelado al crear, eventos del dominio y frontera de dispatch hacia `notifications/worker`. La capa canonica debe fijar ownership de `marketing`, reglas de nacimiento de campaña, estados, hard gates minimos reales y el hecho de que el dispatch pertenece a `notifications` y al `worker`, no al modulo `marketing`.

**Tech Stack:** Markdown, git worktree, monorepo `Next.js` + `NestJS` + `Prisma`, runtime real en `apps/admin`, `apps/api`, `apps/worker` y `packages/shared`, verificacion documental con `git diff --check`, `rg`, `find` y chequeo local de consistencia.

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

- `docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-16-creacion-y-programacion-de-campanas.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-17-seleccion-de-segmentos-y-plantillas-read-only.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-18-frontera-de-dispatch-marketing-notifications-worker.md`
- `docs/fase-1-analisis-requerimientos/reglas/campaigns-y-marketing-automation.md`

### New Phase 2 files

- `docs/fase-2-ux-ui/02.05-campaigns-marketing-automation-ux-ui.md`
- `specs/006-campaigns-marketing-automation/product-design.md`
- `specs/006-campaigns-marketing-automation/spdd-frontend.md`

### New Phase 3 files

- `docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md`
- `docs/fase-3-arquitectura/adr/ADR-006-marketing-notifications-dispatch-boundary.md`

### New Phase 4 files

- `specs/006-campaigns-marketing-automation/spec-funcional.md`
- `specs/006-campaigns-marketing-automation/spec-tecnica.md`
- `specs/006-campaigns-marketing-automation/spec-tareas.md`
- `specs/006-campaigns-marketing-automation/traceability.md`

### Responsibilities

- Fase 1 fija alcance funcional, actores, ownership, lifecycle de campañas, snapshot, catálogos read-only y frontera de dispatch.
- Fase 2 fija el contrato UX de `/marketing` como workbench operativo, sin abrir authoring completo ni journeys.
- Fase 3 fija ownership entre `marketing`, `notifications` y `worker`, más el límite entre orquestación y entrega real.
- Fase 4 convierte el slice en paquete SDD trazable para evolución futura.
- La capa transversal actualiza `REQ-HH-005` para reflejar que `loyalty + cms + campaigns` ya tienen slices propios, dejando `CRM ampliado` aparte.

### Task 1: Abrir Fase 1 del slice `006-campaigns-marketing-automation`

**Files:**
- Modify: `docs/fase-1-analisis-requerimientos/README.md`
- Create: `docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-16-creacion-y-programacion-de-campanas.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-17-seleccion-de-segmentos-y-plantillas-read-only.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-18-frontera-de-dispatch-marketing-notifications-worker.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/campaigns-y-marketing-automation.md`

- [ ] **Step 1: Releer el runtime real de marketing**

Run:

```bash
sed -n '1,260p' apps/api/src/modules/marketing/marketing.service.ts
sed -n '260,520p' apps/api/src/modules/marketing/marketing.service.ts
sed -n '1,220p' apps/api/src/modules/marketing/marketing.controller.ts
sed -n '1,260p' apps/admin/components/marketing-workspace.tsx
sed -n '260,520p' apps/admin/components/marketing-workspace.tsx
sed -n '120,190p' packages/shared/src/domain/enums.ts
sed -n '450,520p' packages/shared/src/types/api.ts
```

Expected: evidencia clara de `campaigns`, `segments`, `templates`, `scheduledAt`, `status`, `runStatus`, `events` y hard gate actual de canal/IDs existentes.

- [ ] **Step 2: Releer la frontera de dispatch**

Run:

```bash
sed -n '1,220p' apps/api/src/modules/notifications/notifications.service.ts
sed -n '1,180p' apps/worker/src/main.ts
sed -n '1,120p' docs/architecture/modules.md
```

Expected: evidencia de que `marketing` orquesta y `notifications/worker` procesan cola y entrega real.

- [ ] **Step 3: Actualizar el índice de Fase 1**

Añadir en `docs/fase-1-analisis-requerimientos/README.md`:

```md
## Slice 006 - Campaigns Marketing Automation
- [01.05-campaigns-marketing-automation.md](01.05-campaigns-marketing-automation.md)
- [casos-de-uso/UC-16-creacion-y-programacion-de-campanas.md](casos-de-uso/UC-16-creacion-y-programacion-de-campanas.md)
- [casos-de-uso/UC-17-seleccion-de-segmentos-y-plantillas-read-only.md](casos-de-uso/UC-17-seleccion-de-segmentos-y-plantillas-read-only.md)
- [casos-de-uso/UC-18-frontera-de-dispatch-marketing-notifications-worker.md](casos-de-uso/UC-18-frontera-de-dispatch-marketing-notifications-worker.md)
- [reglas/campaigns-y-marketing-automation.md](reglas/campaigns-y-marketing-automation.md)
```

- [ ] **Step 4: Crear el documento rector de Fase 1**

Crear `docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md` con esta estructura base:

```md
# Fase 1 - Campaigns Marketing Automation

## Objetivo
Homologar el módulo `marketing` vigente de Huele Huele sin convertirlo en journey engine ni mezclarlo con CRM ampliado.

## Dentro de alcance
- `campaigns`
- `segments` read-only
- `templates` read-only
- `scheduledAt`
- `status` y `runStatus`
- snapshot operativo congelado
- `events`
- frontera `marketing -> notifications/worker`

## Fuera de alcance
- journeys
- triggers multi-step
- authoring completo de segmentos
- authoring completo de plantillas
- CRM ampliado
- analytics avanzados

## Regla crítica
- `marketing` orquesta
- `notifications/worker` despachan
- el runtime actual valida existencia y compatibilidad de canal, no elegibilidad fuerte por estados de catálogo
```

- [ ] **Step 5: Crear los tres casos de uso canónicos**

Crear `UC-16-creacion-y-programacion-de-campanas.md`:

```md
# UC-16 Creacion Y Programacion De Campanas

## Actores
- marketing
- campaigns

## Flujo principal
1. marketing elige segmento, plantilla y canal
2. define nombre, objetivo y opcionalmente `scheduledAt`
3. si no hay `scheduledAt`, la campaña nace `running/running`
4. si hay `scheduledAt`, la campaña nace `scheduled/queued`
5. el sistema congela snapshot operativo de segmento y plantilla
```

Crear `UC-17-seleccion-de-segmentos-y-plantillas-read-only.md`:

```md
# UC-17 Seleccion De Segmentos Y Plantillas Read-Only

## Actores
- marketing
- segments
- templates

## Flujo principal
1. marketing consulta segmentos disponibles
2. marketing consulta plantillas disponibles
3. el sistema exige `segmentId` y `templateId` existentes
4. el sistema exige que `template.channel` coincida con `campaign.channel`
5. el slice no abre authoring completo de segmentos ni plantillas
```

Crear `UC-18-frontera-de-dispatch-marketing-notifications-worker.md`:

```md
# UC-18 Frontera De Dispatch Marketing Notifications Worker

## Actores
- marketing
- notifications
- worker

## Flujo principal
1. marketing registra campaña y evento operativo
2. notifications toma la intención de entrega y la encola
3. worker procesa el dispatch real por canal soportado
4. el resultado técnico vive en notifications y worker
5. marketing no realiza entrega directa por su cuenta
```

- [ ] **Step 6: Crear la hoja de reglas funcionales**

Crear `docs/fase-1-analisis-requerimientos/reglas/campaigns-y-marketing-automation.md`:

```md
# Reglas De Campaigns Y Marketing Automation

- `marketing` es dueño operativo del slice
- `campaigns` es el agregado principal
- `segments` y `templates` entran como catálogos read-only `as-is`
- sin `scheduledAt` la campaña nace `running/running`
- con `scheduledAt` la campaña nace `scheduled/queued`
- la campaña congela `segmentName`, `templateName`, `bodyPreview` y `recipients`
- el runtime actual exige existencia de IDs y compatibilidad de canal
- el runtime actual no bloquea por `segment.status = inactive` ni `template.status = draft`
- `marketing` no despacha; `notifications/worker` despachan
- journeys, CRM ampliado y automation multi-step quedan fuera
```

- [ ] **Step 7: Verificar Fase 1 abierta**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort
rg -n "campaign|segment|template|scheduledAt|runStatus|notifications|worker" docs/fase-1-analisis-requerimientos
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `006`.

- [ ] **Step 8: Commit de Fase 1**

```bash
git add docs/fase-1-analisis-requerimientos
git commit -m "docs: open campaigns marketing automation phase 1 slice"
```

### Task 2: Abrir Fase 2 y los artefactos UX del slice `006`

**Files:**
- Modify: `docs/fase-2-ux-ui/README.md`
- Create: `docs/fase-2-ux-ui/02.05-campaigns-marketing-automation-ux-ui.md`
- Create: `specs/006-campaigns-marketing-automation/product-design.md`
- Create: `specs/006-campaigns-marketing-automation/spdd-frontend.md`

- [ ] **Step 1: Releer la superficie real del workbench de marketing**

Run:

```bash
sed -n '1,260p' apps/admin/components/marketing-workspace.tsx
sed -n '260,520p' apps/admin/components/marketing-workspace.tsx
sed -n '520,860p' apps/admin/components/marketing-workspace.tsx
```

Expected: contrato visible de `/marketing`, métricas, lista de campañas, modal de creación, selección de segmento/plantilla/canal y programación.

- [ ] **Step 2: Actualizar el índice de Fase 2**

Añadir en `docs/fase-2-ux-ui/README.md`:

```md
## Slice 006 - Campaigns Marketing Automation
- [02.05-campaigns-marketing-automation-ux-ui.md](02.05-campaigns-marketing-automation-ux-ui.md)
- [../../specs/006-campaigns-marketing-automation/product-design.md](../../specs/006-campaigns-marketing-automation/product-design.md)
- [../../specs/006-campaigns-marketing-automation/spdd-frontend.md](../../specs/006-campaigns-marketing-automation/spdd-frontend.md)
```

- [ ] **Step 3: Crear el documento de UX/UI de Fase 2**

Crear `docs/fase-2-ux-ui/02.05-campaigns-marketing-automation-ux-ui.md`:

```md
# Fase 2 - Campaigns Marketing Automation UX/UI

## Objetivo
Formalizar la UX operativa vigente de `/marketing` como workbench de campañas.

## Superficies
- listado de campañas
- métricas de campañas
- modal de creación
- lectura de segmentos
- lectura de plantillas
- feedback de programación o corrida inmediata

## Guardrails
- no abrir builder de journeys
- no abrir editor completo de segmentos
- no abrir editor completo de plantillas
- no mezclar CRM ampliado en esta superficie
```

- [ ] **Step 4: Crear `product-design.md` del slice**

Crear `specs/006-campaigns-marketing-automation/product-design.md`:

```md
# Product Design - Campaigns Marketing Automation

## Promesa de superficie
Marketing necesita registrar campañas con trazabilidad operativa clara, no un motor complejo de journeys.

## Componentes principales
- summary metrics
- campaign table
- new campaign modal
- segment selector
- template selector
- channel selector
- scheduledAt input

## Decisión clave
La campaña se crea desde un formulario operativo simple y queda visible con snapshot y estado resultante.
```

- [ ] **Step 5: Crear `spdd-frontend.md` del slice**

Crear `specs/006-campaigns-marketing-automation/spdd-frontend.md`:

```md
# SPDD Frontend - Campaigns Marketing Automation

## Scope frontend real
- `apps/admin/components/marketing-workspace.tsx`

## Contratos visibles
- campañas cargadas por API
- segmentos y plantillas consumidos como catálogos read-only
- `scheduledAt` opcional
- feedback de error cuando faltan `segmentId` o `templateId`

## No scope
- builders
- analytics avanzados
- journeys
- edición completa de segmentos o templates
```

- [ ] **Step 6: Verificar Fase 2 abierta**

Run:

```bash
find docs/fase-2-ux-ui specs/006-campaigns-marketing-automation -maxdepth 2 -type f | sort
rg -n "campaign|segment|template|scheduledAt|marketing" docs/fase-2-ux-ui specs/006-campaigns-marketing-automation
```

Expected: aparecen los nuevos artefactos de Fase 2 y el `rg` devuelve hits del slice `006`.

- [ ] **Step 7: Commit de Fase 2**

```bash
git add docs/fase-2-ux-ui specs/006-campaigns-marketing-automation
git commit -m "docs: add campaigns marketing automation ux slice"
```

### Task 3: Abrir Fase 3 y el ADR del slice `006`

**Files:**
- Modify: `docs/fase-3-arquitectura/README.md`
- Create: `docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-006-marketing-notifications-dispatch-boundary.md`

- [ ] **Step 1: Releer ownership y persistencia del runtime**

Run:

```bash
sed -n '1,120p' docs/architecture/modules.md
sed -n '1,260p' apps/api/src/modules/marketing/marketing.service.ts
sed -n '260,520p' apps/api/src/modules/marketing/marketing.service.ts
sed -n '1,220p' apps/api/src/modules/notifications/notifications.service.ts
sed -n '1,180p' apps/worker/src/main.ts
```

Expected: evidencia de ownership `marketing`, module snapshot, eventos, cola de notifications y envío real por worker.

- [ ] **Step 2: Actualizar el índice de Fase 3**

Añadir en `docs/fase-3-arquitectura/README.md`:

```md
## Slice 006 - Campaigns Marketing Automation
- [03.08-campaigns-marketing-automation.md](03.08-campaigns-marketing-automation.md)
- [adr/ADR-006-marketing-notifications-dispatch-boundary.md](adr/ADR-006-marketing-notifications-dispatch-boundary.md)
```

- [ ] **Step 3: Crear el documento arquitectónico del slice**

Crear `docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md`:

```md
# Fase 3 - Campaigns Marketing Automation

## Ownership
- `marketing`: campañas, scheduling, snapshot, eventos
- `segments`: catálogo read-only
- `templates`: catálogo read-only
- `notifications`: cola y registro de entregas
- `worker`: dispatch real

## Reglas estructurales
- `campaigns` es el agregado principal
- `segments` y `templates` no abren authoring completo en este slice
- la campaña congela snapshot operativo al crear
- `marketing` no despacha directamente

## Frontera de runtime
- sin `scheduledAt` => `running/running`
- con `scheduledAt` => `scheduled/queued`
- validación actual mínima: IDs existentes + compatibilidad de canal
```

- [ ] **Step 4: Crear el ADR de frontera**

Crear `docs/fase-3-arquitectura/adr/ADR-006-marketing-notifications-dispatch-boundary.md`:

```md
# ADR-006 Marketing Notifications Dispatch Boundary

## Decision
El módulo `marketing` orquesta campañas y registra su estado, pero no ejecuta el dispatch real.

## Consecuencias
- `marketing` crea campañas y eventos
- `notifications` encola
- `worker` entrega
- el slice no se vende como automation engine completo
```

- [ ] **Step 5: Verificar Fase 3 abierta**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 2 -type f | sort
rg -n "campaign|segment|template|notifications|worker|scheduled|queued|snapshot" docs/fase-3-arquitectura
```

Expected: aparecen `03.08` y `ADR-006`, y el `rg` devuelve hits del slice `006`.

- [ ] **Step 6: Commit de Fase 3**

```bash
git add docs/fase-3-arquitectura
git commit -m "docs: add campaigns marketing automation architecture slice"
```

### Task 4: Crear el paquete SDD canónico del slice `006`

**Files:**
- Modify: `docs/fase-4-sdd/README.md`
- Create: `specs/006-campaigns-marketing-automation/spec-funcional.md`
- Create: `specs/006-campaigns-marketing-automation/spec-tecnica.md`
- Create: `specs/006-campaigns-marketing-automation/spec-tareas.md`
- Create: `specs/006-campaigns-marketing-automation/traceability.md`

- [ ] **Step 1: Actualizar el índice de Fase 4**

Añadir en `docs/fase-4-sdd/README.md`:

```md
## Slice 006 - Campaigns Marketing Automation
- [../../specs/006-campaigns-marketing-automation/spec-funcional.md](../../specs/006-campaigns-marketing-automation/spec-funcional.md)
- [../../specs/006-campaigns-marketing-automation/spec-tecnica.md](../../specs/006-campaigns-marketing-automation/spec-tecnica.md)
- [../../specs/006-campaigns-marketing-automation/spec-tareas.md](../../specs/006-campaigns-marketing-automation/spec-tareas.md)
- [../../specs/006-campaigns-marketing-automation/traceability.md](../../specs/006-campaigns-marketing-automation/traceability.md)
```

- [ ] **Step 2: Crear `spec-funcional.md`**

Crear `specs/006-campaigns-marketing-automation/spec-funcional.md`:

```md
# Spec Funcional - Campaigns Marketing Automation

## Objetivo
Formalizar el slice brownfield `as-is` de campañas, segmentos y plantillas con scheduling básico y frontera de dispatch separada.

## Reglas funcionales
- `campaigns` es el agregado principal
- `segments` y `templates` son catálogos read-only
- sin `scheduledAt` la campaña nace `running/running`
- con `scheduledAt` la campaña nace `scheduled/queued`
- la campaña congela `segmentName`, `templateName`, `bodyPreview` y `recipients`
- el runtime actual valida IDs existentes y compatibilidad de canal
- `marketing` no despacha; `notifications/worker` despachan
```

- [ ] **Step 3: Crear `spec-tecnica.md`**

Crear `specs/006-campaigns-marketing-automation/spec-tecnica.md`:

```md
# Spec Tecnica - Campaigns Marketing Automation

## Baseline técnico
- `apps/api/src/modules/marketing/marketing.service.ts`
- `apps/api/src/modules/marketing/marketing.controller.ts`
- `apps/admin/components/marketing-workspace.tsx`
- `apps/api/src/modules/notifications/notifications.service.ts`
- `apps/worker/src/main.ts`

## Fronteras
- `marketing` crea campañas
- `notifications` encola dispatch
- `worker` procesa entrega real

## Riesgos abiertos
- no hay authoring completo de segmentos/templates
- el hardening por estados de catálogo queda pendiente
- journeys y CRM ampliado quedan fuera
```

- [ ] **Step 4: Crear `spec-tareas.md`**

Crear `specs/006-campaigns-marketing-automation/spec-tareas.md`:

```md
# Spec Tareas - Campaigns Marketing Automation

## Backlog canónico
- contratos compartidos del módulo marketing
- lifecycle y snapshot de campañas
- frontera de dispatch con notifications/worker
- workbench admin de marketing
- traceabilidad y pruebas del slice
```

- [ ] **Step 5: Crear `traceability.md`**

Crear `specs/006-campaigns-marketing-automation/traceability.md`:

```md
# Traceability - Campaigns Marketing Automation

## Matriz base
- `marketing` owner operativo
- `campaigns` agregado principal
- `segments/templates` read-only
- `notifications/worker` frontera de entrega
- `scheduledAt` define nacimiento inmediato o programado
- snapshot congelado al crear
```

- [ ] **Step 6: Verificar Fase 4 abierta**

Run:

```bash
find specs/006-campaigns-marketing-automation -maxdepth 1 -type f | sort
rg -n "campaign|segment|template|scheduledAt|notifications|worker|snapshot" specs/006-campaigns-marketing-automation docs/fase-4-sdd/README.md
```

Expected: aparecen los cuatro artefactos SDD del slice `006` y el `rg` devuelve hits del nuevo paquete.

- [ ] **Step 7: Commit de Fase 4**

```bash
git add docs/fase-4-sdd specs/006-campaigns-marketing-automation
git commit -m "docs: add campaigns marketing automation canonical specs"
```

### Task 5: Sincronizar la capa transversal con el slice `006`

**Files:**
- Modify: `AI_CONTEXT.md`
- Modify: `TRACEABILITY_MATRIX.md`
- Modify: `PROJECT_MAP.md`
- Modify: `docs/transversal/90.00-mapa-homologacion-brownfield.md`

- [ ] **Step 1: Actualizar `AI_CONTEXT.md`**

Reflejar explícitamente:

```md
- Fase activa: capa canonica intermedia extendida y sincronizada hasta el slice `006-campaigns-marketing-automation`
- Fases 1-4 abiertas para los slices `001` a `006`
- CMS/editorial y campaigns ya separados en slices propios
- `CRM ampliado` sigue pendiente de slice propio
```

- [ ] **Step 2: Actualizar `TRACEABILITY_MATRIX.md`**

Reflejar explícitamente:

```md
- Fase 1-4 ya cubren `001` a `006`
- `REQ-HH-005` ya tiene `004-loyalty-points-redemptions`, `005-cms-content-blocks-marketing-surfaces` y `006-campaigns-marketing-automation`
- `CRM ampliado` sigue parcial / pendiente
```

- [ ] **Step 3: Actualizar `PROJECT_MAP.md`**

Reflejar explícitamente:

```md
- `docs/fase-1-analisis-requerimientos/` ya cubre slices `001` a `006`
- `docs/fase-2-ux-ui/` ya cubre slices `001` a `006`
- `docs/fase-3-arquitectura/` ya cubre slices `001` a `006`
- `docs/fase-4-sdd/` y `specs/` ya cubren slices `001` a `006`
```

- [ ] **Step 4: Actualizar el mapa brownfield**

En `docs/transversal/90.00-mapa-homologacion-brownfield.md`, añadir mapeos para:

```md
| `docs/architecture/modules.md` | `docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md`, `specs/006-campaigns-marketing-automation/` | Migrado | El ownership y la frontera marketing/notifications/worker ya quedan canonizados. |
| `docs/product/requirements-impact-plan-2026-03.md` | `docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md`, `docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md`, `specs/006-campaigns-marketing-automation/` | Parcial | Campaigns y scheduling básico ya aterrizan al canon; CRM ampliado sigue pendiente. |
```

Además, actualizar el resumen final:

```md
- `specs/006-campaigns-marketing-automation/` fija el sexto slice brownfield homologado para campaigns, catálogos read-only y dispatch separado.
```

- [ ] **Step 5: Verificar sincronización transversal**

Run:

```bash
rg -n "006-campaigns-marketing-automation|001` a `006|campaigns|CRM ampliado" AI_CONTEXT.md TRACEABILITY_MATRIX.md PROJECT_MAP.md docs/transversal/90.00-mapa-homologacion-brownfield.md
git diff --check -- AI_CONTEXT.md TRACEABILITY_MATRIX.md PROJECT_MAP.md docs/transversal/90.00-mapa-homologacion-brownfield.md
```

Expected: los cuatro entrypoints reflejan el slice `006` y `git diff --check` no reporta hallazgos.

- [ ] **Step 6: Commit de sincronización**

```bash
git add AI_CONTEXT.md TRACEABILITY_MATRIX.md PROJECT_MAP.md docs/transversal/90.00-mapa-homologacion-brownfield.md
git commit -m "docs: align canonical layer for campaigns marketing automation"
```

## Orden Recomendado

1. `Task 1`
2. `Task 2`
3. `Task 3`
4. `Task 4`
5. `Task 5`

## Definition Of Done Del Slice

- `marketing` queda homologado como bounded context operativo real
- `campaigns` queda fijado como agregado principal
- `segments` y `templates` quedan ubicados como catálogos read-only `as-is`
- `scheduledAt`, `status` y `runStatus` quedan formalizados
- el snapshot congelado de campaña queda explicitado
- la frontera `marketing -> notifications -> worker` queda clara
- el slice no abre journeys, CRM ampliado ni authoring completo inexistente
- la capa transversal refleja que `REQ-HH-005` ya está descompuesto en loyalty, CMS/editorial y campaigns
