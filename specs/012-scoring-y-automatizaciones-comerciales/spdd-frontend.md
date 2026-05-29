# SPDD Frontend - Scoring Y Automatizaciones Comerciales

Fecha: 2026-05-29.

## Superficies cubiertas

- `/crm`
- detalle del cliente con score visible y razon corta
- bandeja comercial con lectura secundaria de score y efectos simples
- timeline o traza del caso con automatizaciones evaluadas o ejecutadas

## Contratos visibles

- un `customer_relationship_case` por cliente canonico como base del slice
- `scoreTier`
- razon visible corta del score
- sugerencia de prioridad
- `followup_candidate_detected` como senal operativa visible
- tareas o recordatorios automaticos dentro del mismo caso
- evidencia visible de `enqueue_existing_campaign` cuando aplique
- traza de side effects y de bloqueos por deduplicacion o `cooldown`

## Reglas visibles

- `/crm` sigue siendo la unica superficie principal del slice
- el score visible usa solo `cold`, `warm` y `hot`
- la UI no expone el puntaje interno
- la razon del score debe ser corta, legible y operativa
- la sugerencia de prioridad no muta `priority` de forma automatica en la UI
- `scoreTier` no reemplaza `priority`, `pipelineStage`, `status` ni
  `followUpAt`
- las tareas automaticas se muestran dentro del caso del cliente y no sobre
  pedidos
- las campaigns encoladas se muestran como efecto derivado del caso, no como
  authoring desde `/crm`
- la traza puede mostrar que una regla fue omitida por deduplicacion o
  `cooldown`
- el slice no se presenta como journeys, forecast, opportunities ni IA

## Lecturas derivadas

- `score_changed` es lectura derivada del caso y no un flujo aparte
- `followup_candidate_detected` sirve para resaltar trabajo pendiente, no para
  mover automaticamente `pipelineStage` o `status`
- agregados visuales por score, reglas o campañas son secundarios y no cambian
  el contrato minimo del corte

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md`
- `docs/fase-1-analisis-requerimientos/reglas/scoring-y-automatizaciones-comerciales.md`

## Dependencias de Fase 3

- la ampliacion de `customer_relationship_case` con score visible y razon corta
- la ADR que mantiene automatizaciones simples sobre el mismo caso comercial
- la frontera con `notifications/worker` para campaigns encoladas
- la implementacion de trazabilidad e idempotencia por regla y por caso
