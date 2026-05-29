# SPDD Frontend - Automatizacion Comercial Amplia

Fecha: 2026-05-29.

## Superficies cubiertas

- `/crm`
- detalle del cliente con bloque de journey
- bandeja filtrada de journeys dentro del mismo `/crm`

## Contratos visibles

- `customer_relationship_case` como base del slice
- `commercial_opportunity` como contexto ligado cuando aplique
- `journey_template`
- `journey_instance`
- estados `active`, `paused`, `completed`, `cancelled`
- `journeyAssignee`
- `wait`
- `condition`
- `manual_review`
- `create_followup_task`
- `suggest_priority`
- `enqueue_existing_campaign`
- `mark_journey_milestone`
- milestone trail
- razon de pausa o cancelacion

## Reglas visibles

- `/crm` sigue siendo la superficie del slice; no se abre ruta ni app nueva
- el detalle del cliente debe separar visualmente caso, deal y journey
- solo puede existir una instancia no terminal por `template + case`
- un mismo caso puede tener journeys activos de templates distintos
- `manual_review` bloquea hasta resolverse
- `journeyAssignee` se hereda del caso por defecto, pero puede ajustarse
- si el template usa oportunidad activa, el binding se mantiene estable al
  mismo deal
- la UI no presenta builder libre ni chaining entre journeys
- la UI no presenta mutacion automatica de `pipelineStage`, `status` ni
  `opportunityStage`

## Lecturas derivadas

- si no hay journeys activos, el detalle debe poder mostrar estado vacio o
  accion de lanzamiento manual excepcional
- la bandeja secundaria puede listar `completed` y `cancelled` como
  historico, pero por defecto prioriza `active` y `paused`
- la resolucion de un paso manual debe reanudar el journey sin exigir otra
  accion innecesaria
- milestones y trazas deben leerse como parte del mismo workbench comercial

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md`
- `docs/fase-1-analisis-requerimientos/reglas/automatizacion-comercial-amplia.md`

## Dependencias de Fase 3

- el anclaje del engine en `customer_relationship_case`
- el binding estable a la oportunidad activa
- la frontera entre acciones seguras del journey y estado comercial del caso
- la ejecucion mixta `inline + worker/BullMQ`
