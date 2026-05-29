# Huele Huele Commercial Opportunities Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir el slice canonico `013-commercial-opportunities` en `ERP-HUELEHUELE` como homologacion brownfield `as-is`, formalizando `commercial_opportunity` como subentidad de `customer_relationship_case` para modelar negociaciones concretas con valor esperado, cierre propio, referencias comerciales y trazabilidad especifica dentro de `/crm`, sin reemplazar el caso transversal del cliente ni abrir forecast, probabilidad o opportunities como dominio separado.

**Architecture:** La homologacion aterriza sobre `010-crm-transversal-por-cliente`, `011-pipeline-comercial-amplio` y `012-scoring-y-automatizaciones-comerciales`, manteniendo `customer_relationship_case` como agregado transversal del cliente y agregando `commercial_opportunity` subordinada al caso. Cada caso puede tener una sola oportunidad activa y multiples oportunidades historicas cerradas, con lifecycle propio `qualified -> proposal -> negotiation -> won/lost`, `expectedValue`, `currency`, `targetCloseAt`, `commercialOwner`, `assignee`, `commercialChannel`, `opportunityType`, `lostReason`, timeline propio, tareas minimas y una bandeja secundaria dentro de `/crm`.

**Tech Stack:** Markdown, git worktree, monorepo `Next.js` + `NestJS` + `Prisma`, runtime real en `apps/admin`, `apps/api`, `packages/shared` y `docs/product`, verificacion documental con `git diff --check`, `rg`, `find`, `sed` y `git status`.

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

- `docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-37-apertura-y-conversion-de-la-oportunidad-comercial.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-38-negociacion-y-cierre-de-la-oportunidad-comercial.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-39-reapertura-e-historico-de-oportunidades-comerciales.md`
- `docs/fase-1-analisis-requerimientos/reglas/commercial-opportunities.md`

### New Phase 2 files

- `docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md`
- `specs/013-commercial-opportunities/product-design.md`
- `specs/013-commercial-opportunities/spdd-frontend.md`

### New Phase 3 files

- `docs/fase-3-arquitectura/03.15-commercial-opportunities.md`
- `docs/fase-3-arquitectura/adr/ADR-013-customers-commercial-opportunity-boundary.md`

### New Phase 4 files

- `specs/013-commercial-opportunities/spec-funcional.md`
- `specs/013-commercial-opportunities/spec-tecnica.md`
- `specs/013-commercial-opportunities/spec-tareas.md`
- `specs/013-commercial-opportunities/traceability.md`

### Responsibilities

- Fase 1 fija el alcance funcional de `commercial_opportunity`: apertura manual o por conversion explicita, una sola oportunidad activa por caso, lifecycle propio, `expectedValue`, `currency`, `targetCloseAt`, `opportunityType`, `lostReason`, referencias y reglas de cierre/reapertura.
- Fase 2 fija la superficie UX en `/crm`: detalle del cliente con bloque de oportunidad y bandeja secundaria de oportunidades, sin abrir modulo aparte.
- Fase 3 fija la frontera entre `customer_relationship_case`, `pipelineStage`, scoring, timeline del caso y timeline/tareas de la oportunidad.
- Fase 4 convierte el slice en paquete SDD trazable para evolucion futura sin romper `010`, `011` ni `012`.
- La capa transversal actualiza el principal gap del canon: ya no faltaria modelado explicito de deals concretos; el siguiente frente natural pasaria a ser automatizacion comercial mas amplia o expansion posterior de opportunities si el brownfield la justificara.

### Task 1: Abrir Fase 1 del slice `013-commercial-opportunities`

**Files:**
- Modify: `docs/fase-1-analisis-requerimientos/README.md`
- Create: `docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-37-apertura-y-conversion-de-la-oportunidad-comercial.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-38-negociacion-y-cierre-de-la-oportunidad-comercial.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-39-reapertura-e-historico-de-oportunidades-comerciales.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/commercial-opportunities.md`

- [ ] **Step 1: Releer el contexto canonico y el brownfield fuente**

Run:

```bash
sed -n '1,260p' docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md
sed -n '1,260p' docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md
sed -n '1,240p' docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md
sed -n '1,260p' docs/superpowers/specs/2026-05-29-huelehuele-commercial-opportunities-design.md
rg -n "opportunit|negotiat|expectedValue|targetCloseAt|reactivation|wholesale|vendor|proposal" docs/product docs/architecture apps packages
```

Expected: evidencia suficiente de que el brownfield ya pide separar negociacion concreta del caso transversal del cliente, sin reemplazar `customer_relationship_case`.

- [ ] **Step 2: Actualizar el indice de Fase 1**

Anadir en `docs/fase-1-analisis-requerimientos/README.md`:

```md
## Slice 013 - Commercial Opportunities
- [01.12-commercial-opportunities.md](01.12-commercial-opportunities.md)
- [casos-de-uso/UC-37-apertura-y-conversion-de-la-oportunidad-comercial.md](casos-de-uso/UC-37-apertura-y-conversion-de-la-oportunidad-comercial.md)
- [casos-de-uso/UC-38-negociacion-y-cierre-de-la-oportunidad-comercial.md](casos-de-uso/UC-38-negociacion-y-cierre-de-la-oportunidad-comercial.md)
- [casos-de-uso/UC-39-reapertura-e-historico-de-oportunidades-comerciales.md](casos-de-uso/UC-39-reapertura-e-historico-de-oportunidades-comerciales.md)
- [reglas/commercial-opportunities.md](reglas/commercial-opportunities.md)
```

- [ ] **Step 3: Crear el documento rector de Fase 1**

Crear `docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md` con esta estructura base:

```md
# Fase 1 - Commercial Opportunities

## Objetivo
Homologar `commercial_opportunity` como negociacion concreta con valor esperado dentro de `customer_relationship_case`, formalizando su apertura, conversion, lifecycle propio, cierre, reapertura, referencias y ownership sin abrir forecast, probabilidad ni modulo aparte.

## Dentro de alcance
- `commercial_opportunity`
- una sola oportunidad activa por caso
- historico de oportunidades cerradas
- apertura manual
- conversion explicita desde el pipeline
- `qualified`
- `proposal`
- `negotiation`
- `won`
- `lost`
- `expectedValue`
- `currency`
- `targetCloseAt`
- `opportunityType`
- `lostReason`
- referencia principal
- referencias secundarias
- timeline y tareas propias

## Fuera de alcance
- multiples oportunidades activas por el mismo caso
- probabilidad de cierre
- forecast
- quote engine nuevo
- pricing engine nuevo
- modulo separado fuera de `/crm`
- automatizacion fuerte del lifecycle

## Regla critica
- la oportunidad es subordinada al caso comercial del cliente
- solo existe cuando ya hay negociacion concreta con valor esperado
- `won` cierra de forma estable
- `lost` puede reabrirse a `negotiation`
```

- [ ] **Step 4: Crear los tres casos de uso canonicos**

Crear `UC-37-apertura-y-conversion-de-la-oportunidad-comercial.md`:

```md
# UC-37 Apertura Y Conversion De La Oportunidad Comercial

## Actores
- ventas
- marketing

## Flujo principal
1. existe un `customer_relationship_case` con contexto comercial real
2. `ventas` abre una oportunidad manualmente o convierte el caso desde el pipeline
3. la oportunidad hereda `commercialOwner`, `assignee` y `commercialChannel` por defecto
4. `ventas` confirma `opportunityType`
5. el sistema sugiere que el caso padre este al menos en `engaged`, sin moverlo automaticamente
```

Crear `UC-38-negociacion-y-cierre-de-la-oportunidad-comercial.md`:

```md
# UC-38 Negociacion Y Cierre De La Oportunidad Comercial

## Actores
- ventas
- marketing

## Flujo principal
1. la oportunidad entra en `qualified`, `proposal` o `negotiation`
2. el sistema exige `expectedValue`, `currency` y `targetCloseAt`
3. `ventas` actualiza timeline y tareas propias de la negociacion
4. la oportunidad puede cerrar como `won` o `lost`
5. `won` deja cierre estable y `lost` exige `lostReason`
```

Crear `UC-39-reapertura-e-historico-de-oportunidades-comerciales.md`:

```md
# UC-39 Reapertura E Historico De Oportunidades Comerciales

## Actores
- ventas
- admin

## Flujo principal
1. una oportunidad cerrada como `lost` puede reabrirse
2. la reapertura vuelve a `negotiation`
3. el timeline propio conserva la traza del cierre y la reapertura
4. una oportunidad `won` no se reabre
5. si nace un nuevo ciclo comercial, se crea una nueva oportunidad historica
```

- [ ] **Step 5: Crear la hoja de reglas funcionales**

Crear `docs/fase-1-analisis-requerimientos/reglas/commercial-opportunities.md`:

```md
# Reglas De Commercial Opportunities

- `013` vive sobre `customer_relationship_case`
- la oportunidad no reemplaza el caso transversal del cliente
- solo puede existir una oportunidad activa por caso
- puede haber multiples oportunidades historicas cerradas
- apertura: manual o por conversion explicita desde el pipeline
- no existe apertura automatica
- lifecycle: `qualified`, `proposal`, `negotiation`, `won`, `lost`
- `expectedValue`, `currency` y `targetCloseAt` son obligatorios en estados activos
- `commercialOwner`, `assignee` y `commercialChannel` se heredan por defecto
- `opportunityType`: `storefront_recovery`, `wholesale_deal`, `vendor_activation`, `reactivation`
- `lostReason` reutiliza la taxonomia de `011`
- `lost` puede reabrirse a `negotiation`
- `won` es cierre estable
- no hay probabilidad de cierre en este corte
- no hay forecast
```

- [ ] **Step 6: Verificar Fase 1 abierta**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort
rg -n "commercial_opportunity|expectedValue|targetCloseAt|opportunityType|lostReason|negotiation|proposal" docs/fase-1-analisis-requerimientos
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `013`.

- [ ] **Step 7: Commit de Fase 1**

```bash
git add docs/fase-1-analisis-requerimientos
git commit -m "docs: open commercial opportunities phase 1 slice"
```

### Task 2: Abrir Fase 2 y los artefactos UX del slice `013`

**Files:**
- Modify: `docs/fase-2-ux-ui/README.md`
- Create: `docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md`
- Create: `specs/013-commercial-opportunities/product-design.md`
- Create: `specs/013-commercial-opportunities/spdd-frontend.md`

- [ ] **Step 1: Releer la superficie UX existente en `/crm`**

Run:

```bash
sed -n '1,240p' docs/fase-2-ux-ui/02.09-crm-transversal-por-cliente-ux-ui.md
sed -n '1,240p' docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md
sed -n '1,220p' docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md
sed -n '1,220p' specs/011-pipeline-comercial-amplio/product-design.md
sed -n '1,260p' apps/admin/components/crm-workspace.tsx
```

Expected: base suficiente para describir un bloque de oportunidad en el detalle del cliente y una bandeja secundaria de deals sin abrir modulo aparte.

- [ ] **Step 2: Actualizar el indice de Fase 2**

Anadir en `docs/fase-2-ux-ui/README.md`:

```md
## Slice 013 - Commercial Opportunities
- [02.12-commercial-opportunities-ux-ui.md](02.12-commercial-opportunities-ux-ui.md)
- [../../specs/013-commercial-opportunities/product-design.md](../../specs/013-commercial-opportunities/product-design.md)
- [../../specs/013-commercial-opportunities/spdd-frontend.md](../../specs/013-commercial-opportunities/spdd-frontend.md)
```

- [ ] **Step 3: Crear la guia UX del slice**

Crear `docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md` describiendo:

- bloque principal de oportunidad dentro del detalle del cliente
- lista secundaria de oportunidades dentro de `/crm`
- campos visibles: etapa, valor esperado, moneda, `targetCloseAt`, owner, assignee, tipo, canal y motivo de perdida si aplica
- timeline propio y tareas propias minimas
- reglas de reapertura y cierre estable

- [ ] **Step 4: Crear `product-design.md`**

Crear `specs/013-commercial-opportunities/product-design.md` con:

- objetivo del deal workspace
- jerarquia visual entre caso general y oportunidad puntual
- estados vacios
- tratamiento de cierre `won/lost`
- lectura de referencias principal/secundarias

- [ ] **Step 5: Crear `spdd-frontend.md`**

Crear `specs/013-commercial-opportunities/spdd-frontend.md` con:

- surface principal en `/crm`
- componentes esperados: resumen de oportunidad, timeline, tareas, references rail y bandeja secundaria
- estados de carga, vacio y cierre
- guardrails para no mezclar timeline del caso con timeline del deal

- [ ] **Step 6: Verificar Fase 2 abierta**

Run:

```bash
find docs/fase-2-ux-ui specs/013-commercial-opportunities -maxdepth 2 -type f | sort
rg -n "opportunity|expectedValue|targetCloseAt|won|lost|timeline|tasks" docs/fase-2-ux-ui specs/013-commercial-opportunities
```

Expected: aparecen los nuevos artefactos UX del slice `013`.

- [ ] **Step 7: Commit de Fase 2**

```bash
git add docs/fase-2-ux-ui specs/013-commercial-opportunities
git commit -m "docs: add commercial opportunities ux slice"
```

### Task 3: Abrir Fase 3 y la arquitectura del slice `013`

**Files:**
- Modify: `docs/fase-3-arquitectura/README.md`
- Create: `docs/fase-3-arquitectura/03.15-commercial-opportunities.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-013-customers-commercial-opportunity-boundary.md`

- [ ] **Step 1: Releer arquitectura previa relevante**

Run:

```bash
sed -n '1,260p' docs/fase-3-arquitectura/03.12-crm-transversal-por-cliente.md
sed -n '1,260p' docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md
sed -n '1,260p' docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md
sed -n '1,220p' docs/fase-3-arquitectura/adr/ADR-010-customers-crm-transversal-boundary.md
sed -n '1,220p' docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md
```

Expected: claridad sobre la frontera entre caso comercial del cliente, pipeline, score y oportunidad concreta.

- [ ] **Step 2: Actualizar el indice de Fase 3**

Anadir en `docs/fase-3-arquitectura/README.md`:

```md
## Slice 013 - Commercial Opportunities
- [03.15-commercial-opportunities.md](03.15-commercial-opportunities.md)
- [adr/ADR-013-customers-commercial-opportunity-boundary.md](adr/ADR-013-customers-commercial-opportunity-boundary.md)
```

- [ ] **Step 3: Crear la arquitectura del slice**

Crear `docs/fase-3-arquitectura/03.15-commercial-opportunities.md` cubriendo:

- `commercial_opportunity` como subentidad de `customer_relationship_case`
- una sola oportunidad activa por caso
- lifecycle propio y manual
- herencia y override controlado de owner, assignee y channel
- timeline/tareas propias
- cierre estable en `won`
- reapertura de `lost` a `negotiation`
- relacion suave con `pipelineStage` del caso padre

- [ ] **Step 4: Crear ADR de frontera**

Crear `docs/fase-3-arquitectura/adr/ADR-013-customers-commercial-opportunity-boundary.md` con decision, contexto y consecuencias:

- `commercial_opportunity` no reemplaza `customer_relationship_case`
- el deal puntual vive dentro del cliente y no fuera de `/crm`
- no se abre oportunidad separada como agregado raiz ni multiple activa por caso
- `won` historiza y obliga nuevo ciclo para nuevas negociaciones

- [ ] **Step 5: Verificar Fase 3 abierta**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 2 -type f | sort
rg -n "commercial_opportunity|expectedValue|targetCloseAt|won|lost|negotiation|customer_relationship_case" docs/fase-3-arquitectura
```

Expected: Fase 3 del slice `013` visible y coherente con slices `010-012`.

- [ ] **Step 6: Commit de Fase 3**

```bash
git add docs/fase-3-arquitectura
git commit -m "docs: add commercial opportunities architecture slice"
```

### Task 4: Abrir Fase 4 y el paquete SDD del slice `013`

**Files:**
- Modify: `docs/fase-4-sdd/README.md`
- Create: `specs/013-commercial-opportunities/spec-funcional.md`
- Create: `specs/013-commercial-opportunities/spec-tecnica.md`
- Create: `specs/013-commercial-opportunities/spec-tareas.md`
- Create: `specs/013-commercial-opportunities/traceability.md`

- [ ] **Step 1: Releer paquetes SDD vecinos**

Run:

```bash
sed -n '1,240p' specs/010-crm-transversal-por-cliente/spec-funcional.md
sed -n '1,240p' specs/011-pipeline-comercial-amplio/spec-funcional.md
sed -n '1,240p' specs/012-scoring-y-automatizaciones-comerciales/spec-funcional.md
sed -n '1,220p' docs/superpowers/specs/2026-05-29-huelehuele-commercial-opportunities-design.md
```

Expected: estructura suficiente para bajar el slice `013` a paquete SDD consistente con el canon ya abierto.

- [ ] **Step 2: Actualizar el indice de Fase 4**

Anadir en `docs/fase-4-sdd/README.md`:

```md
## Slice 013 - Commercial Opportunities
- [../../specs/013-commercial-opportunities/spec-funcional.md](../../specs/013-commercial-opportunities/spec-funcional.md)
- [../../specs/013-commercial-opportunities/spec-tecnica.md](../../specs/013-commercial-opportunities/spec-tecnica.md)
- [../../specs/013-commercial-opportunities/spec-tareas.md](../../specs/013-commercial-opportunities/spec-tareas.md)
- [../../specs/013-commercial-opportunities/traceability.md](../../specs/013-commercial-opportunities/traceability.md)
```

- [ ] **Step 3: Crear `spec-funcional.md`**

Debe incluir:

- alcance del deal puntual
- actores y ownership
- lifecycle
- reglas de apertura, conversion, cierre, reapertura
- campos obligatorios
- reglas de una activa por caso
- referencias y evidencia

- [ ] **Step 4: Crear `spec-tecnica.md`**

Debe incluir:

- agregado `customer_relationship_case` con subentidad `commercial_opportunity`
- modelo de estado
- validaciones de obligatoriedad
- frontera con timeline/tareas del caso
- reglas de historico y reapertura
- puntos de integracion con `/crm`

- [ ] **Step 5: Crear `spec-tareas.md`**

Desglosar implementacion futura por:

- modelo de datos
- API/admin contract
- UI `/crm`
- timeline y tareas de oportunidad
- guardrails de cierre/reapertura

- [ ] **Step 6: Crear `traceability.md`**

Mapear:

- `REQ-HH-*` relevante
- Fase 1
- Fase 2
- Fase 3
- Fase 4
- ADR

- [ ] **Step 7: Verificar Fase 4 abierta**

Run:

```bash
find specs/013-commercial-opportunities -maxdepth 2 -type f | sort
rg -n "commercial_opportunity|expectedValue|targetCloseAt|opportunityType|lostReason|won|lost" specs/013-commercial-opportunities docs/fase-4-sdd/README.md
```

Expected: paquete SDD completo del slice `013`.

- [ ] **Step 8: Commit de Fase 4**

```bash
git add docs/fase-4-sdd/README.md specs/013-commercial-opportunities
git commit -m "docs: add commercial opportunities canonical specs"
```

### Task 5: Sincronizar la capa transversal para el slice `013`

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

Expected: claridad sobre donde registrar que `013` ya cubre deals concretos dentro del CRM.

- [ ] **Step 2: Actualizar `AI_CONTEXT.md`**

Reflejar que el canon ya incluye:

- `010-crm-transversal-por-cliente`
- `011-pipeline-comercial-amplio`
- `012-scoring-y-automatizaciones-comerciales`
- `013-commercial-opportunities`

Y que el siguiente gap ya no es deal tracking explicito, sino automatizacion comercial mas amplia o expansion posterior del modelo de opportunities.

- [ ] **Step 3: Actualizar `TRACEABILITY_MATRIX.md`**

Registrar el slice `013` en la trazabilidad del requerimiento comercial correspondiente.

- [ ] **Step 4: Actualizar `PROJECT_MAP.md`**

Reflejar en los entrypoints globales que ya existe paquete canonico de `013` y su relacion con `010-012`.

- [ ] **Step 5: Actualizar `90.00-mapa-homologacion-brownfield.md`**

Dejar explicito que:

- el caso comercial transversal del cliente ya esta canonizado
- el pipeline comercial amplio ya esta canonizado
- el score y las automatizaciones simples ya estan canonizados
- ahora tambien la negociacion concreta con valor esperado ya tiene slice propio

- [ ] **Step 6: Verificar sincronizacion transversal**

Run:

```bash
rg -n "013|commercial opportunities|commercial_opportunity|opportunity" AI_CONTEXT.md TRACEABILITY_MATRIX.md PROJECT_MAP.md docs/transversal/90.00-mapa-homologacion-brownfield.md
git diff --check
```

Expected: la capa transversal referencia el slice `013` y `git diff --check` sigue limpio.

- [ ] **Step 7: Commit transversal**

```bash
git add AI_CONTEXT.md TRACEABILITY_MATRIX.md PROJECT_MAP.md docs/transversal/90.00-mapa-homologacion-brownfield.md
git commit -m "docs: align canonical layer for commercial opportunities"
```
