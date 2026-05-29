# Spec Tareas - Scoring Y Automatizaciones Comerciales

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Scoring Y Automatizaciones Comerciales](../../docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md),
  [Reglas de scoring y automatizaciones comerciales](../../docs/fase-1-analisis-requerimientos/reglas/scoring-y-automatizaciones-comerciales.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md),
  [ADR-012 Customers Scoring Automation Boundary](../../docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md)

## Objetivo

Convertir la frontera canonica del score y de las automatizaciones simples en
un backlog tecnico ejecutable, preservando el boundary con `010`, `011` y
`006`, manteniendo `/crm` como superficie visible y evitando abrir journeys,
opportunities o un engine libre de reglas.

## Reglas De Ejecucion

- no abrir un agregado nuevo fuera de `customer_relationship_case`
- no reescribir `010` ni `011`; extenderlos de forma aditiva
- no mover el slice fuera de `customers`
- no abrir una ruta, app o dashboard nuevo fuera de `/crm`
- no hacer editable el score visible
- no exponer el puntaje interno en UI principal
- no permitir que `012` mueva `pipelineStage`, `status`, `commercialOwner` o
  `assignee`
- no abrir builder libre de reglas
- no abrir authoring de campaigns dentro de `/crm`

## Backlog Canonico

### T1. Extender contratos compartidos del caso con score y reglas simples

**Resultado esperado**

El lenguaje compartido del slice queda fijado como extension del mismo caso
transversal, con naming canonico y sin romper los contratos de `010` y `011`.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/admin-access.ts`

**Checklist**

- [ ] ampliar la proyeccion compartida de `customer_relationship_case` con
  `scoreTier` y razon visible
- [ ] introducir valores canonicos para triggers fuente
- [ ] introducir valores canonicos para eventos derivados
- [ ] introducir valores canonicos para acciones del catalogo cerrado
- [ ] introducir shape compartida para reglas simples con `active/inactive`,
  `order`, `cooldown`, filtros y accion
- [ ] preservar contratos heredados de `010` y `011`
- [ ] no abrir contratos de `commercial_opportunity`

### T2. Formalizar score derivado y trazabilidad dentro de `customers`

**Resultado esperado**

La API expresa el score visible y su explicacion corta como parte del mismo
`customer_relationship_case`.

**Rutas candidatas**

- `apps/api/src/modules/customers/customers.controller.ts`
- `apps/api/src/modules/customers/customers.service.ts`

**Checklist**

- [ ] exponer lectura de `scoreTier` y razon visible dentro del mismo caso
- [ ] recalcular score inline al procesar triggers del slice
- [ ] derivar `score_changed` cuando cambie el resultado efectivo
- [ ] derivar `followup_candidate_detected` cuando aplique
- [ ] preservar un solo `customer_relationship_case` por cliente canonico
- [ ] no mover ownership a `marketing`, `orders` ni `notifications`

### T3. Formalizar catalogo cerrado de reglas y filtros simples

**Resultado esperado**

`marketing` puede operar un catalogo predefinido de reglas simples sin abrir un
builder libre.

**Rutas candidatas**

- `apps/api/src/modules/marketing/marketing.service.ts`
- `packages/shared/src/types/api.ts`

**Checklist**

- [ ] formalizar `active/inactive`
- [ ] formalizar `order` de ejecucion determinista
- [ ] formalizar `cooldown`
- [ ] formalizar trigger, filtros y accion por regla
- [ ] limitar filtros a `commercialChannel`, `pipelineStage`, `scoreTier` y
  `status`
- [ ] limitar acciones a `recalculate_score`, `suggest_priority`,
  `create_followup_task` y `enqueue_existing_campaign`
- [ ] no abrir rule builder libre

### T4. Blindar idempotencia y cooldown por regla

**Resultado esperado**

Los side effects del slice se ejecutan una sola vez por regla, caso y tipo de
accion dentro de la ventana valida.

**Rutas candidatas**

- `apps/api/src/modules/customers/customers.service.ts`
- `apps/api/src/modules/marketing/marketing.service.ts`
- `apps/worker/src/main.ts`

**Checklist**

- [ ] deduplicar por `ruleId + customerRelationshipCaseId + actionType`
- [ ] aplicar `cooldown` configurable por regla
- [ ] dejar traza de bloqueo por deduplicacion o `cooldown`
- [ ] permitir recalculo del score aunque el side effect quede omitido
- [ ] no duplicar tareas automaticas
- [ ] no encolar campaigns repetidas para la misma regla y el mismo caso

### T5. Integrar side effects asincronos con la frontera de `006`

**Resultado esperado**

El slice reutiliza campaigns existentes y side effects asincronos sin romper la
frontera de `notifications/worker`.

**Rutas candidatas**

- `apps/api/src/modules/notifications/notifications.service.ts`
- `apps/worker/src/main.ts`
- `apps/api/src/modules/marketing/marketing.service.ts`

**Checklist**

- [ ] reutilizar solo campaigns existentes del slice `006`
- [ ] encolar `enqueue_existing_campaign` via `notifications/worker`
- [ ] no hacer authoring de campaigns desde `/crm`
- [ ] dejar trazabilidad de ejecucion asincrona
- [ ] no recalcular score ni mutar ownership desde el worker

### T6. Sostener `/crm` como superficie del slice

**Resultado esperado**

La UI opera score, sugerencias y side effects simples desde el mismo detalle y
bandeja de `/crm`.

**Rutas candidatas**

- `apps/admin/app/crm/page.tsx`
- `apps/admin/components/crm-workspace.tsx`
- `apps/admin/lib/api.ts`

**Checklist**

- [ ] extender el detalle del cliente con `scoreTier` y razon visible
- [ ] mostrar sugerencia de prioridad como sugerencia y no como cambio aplicado
- [ ] mostrar tareas automaticas en el mismo caso
- [ ] mostrar evidencia de campaigns encoladas como efecto derivado
- [ ] mostrar trazabilidad de side effects y bloqueos por deduplicacion o
  `cooldown`
- [ ] no abrir una ruta nueva para automation

### T7. Blindar la frontera con `011` y con futuros slices

**Resultado esperado**

El corte deja explicito que `012` es una capa derivada del mismo caso y que el
resto de capacidades comerciales quedan fuera de alcance.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `apps/api/src/modules/customers/customers.service.ts`
- `apps/admin/components/crm-workspace.tsx`

**Checklist**

- [ ] evitar que `012` absorba `priority`, `pipelineStage` o `status`
- [ ] evitar journeys multi-step
- [ ] evitar `commercial_opportunity`, forecast y probabilidad
- [ ] evitar IA opaca u override manual del score
- [ ] evitar una consola separada fuera de `/crm`

### T8. Regression suite y smokes de frontera

**Resultado esperado**

Los contratos criticos del slice quedan defendidos por pruebas y smokes que
protejan score, deduplicacion y fronteras con `006`, `010` y `011`.

**Rutas candidatas**

- pruebas de `customers`
- pruebas de `marketing`
- smokes de `/crm`
- contratos compartidos

**Checklist**

- [ ] probar que `012` reutiliza el mismo `customer_relationship_case`
- [ ] probar que el score es determinista y read-only
- [ ] probar que la UI visible solo usa `cold`, `warm` y `hot`
- [ ] probar que `score_changed` se deriva cuando cambia el tier efectivo
- [ ] probar que `followup_candidate_detected` se deriva cuando aplica
- [ ] probar que `suggest_priority` no cambia `priority` automaticamente
- [ ] probar que `012` no mueve `pipelineStage` ni `status`
- [ ] probar deduplicacion por `ruleId + customerRelationshipCaseId + actionType`
- [ ] probar `cooldown` por regla
- [ ] probar `enqueue_existing_campaign` reutilizando la frontera de `006`
- [ ] probar consumo visible dentro de `/crm`

## Orden Recomendado

1. `T1`
2. `T2`
3. `T3`
4. `T4`
5. `T5`
6. `T6`
7. `T7`
8. `T8`
