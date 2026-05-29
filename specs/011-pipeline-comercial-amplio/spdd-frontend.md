# SPDD Frontend - Pipeline Comercial Amplio

Fecha: 2026-05-29.

## Superficies cubiertas

- `/crm`
- detalle del cliente con resumen de pipeline amplio
- bandeja comercial filtrable tipo tabla o lista dentro de `/crm`
- vistas de pendientes de hoy y vencidos basadas en `followUpAt`

## Contratos visibles

- un `customer_relationship_case` por cliente canonico como base del slice
- `commercialOwner`
- `assignee`
- `nextStep`
- `pipelineStage`
- `priority`
- `commercialChannel`
- `status`
- `followUpAt`
- `lastPipelineActivityAt`
- timeline con trazabilidad de cambios de etapa
- cierres manuales `won` y `lost`
- captura de `lostReason` al cerrar como `lost`

## Reglas visibles

- `/crm` sigue siendo la unica superficie del slice; no se abre app ni ruta
  nueva
- la bandeja comercial usa patron de busqueda, filtros y tabla o lista; no
  se presenta como kanban en este corte
- la bandeja comercial no usa drag and drop
- `pipelineStage` es manual y convive separado de `status`
- `commercialOwner`, `assignee` y `nextStep` se preservan del detalle
  heredado de `010` y se ven en la operacion del caso
- `priority` y `commercialChannel` son facetas manuales para triage y no
  scoring encubierto
- `followUpAt` sigue siendo la unica fecha objetivo operativa del caso
- `lastPipelineActivityAt` ordena actividad reciente sin obligar a leer
  todo el timeline
- `won` y `lost` exigen accion manual y trazabilidad visible
- `lost` exige `lostReason` y `won` exige nota con evidencia
- el slice no se presenta como forecast, automatizacion, scoring ni
  `commercial_opportunity`

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md`
- `docs/fase-1-analisis-requerimientos/reglas/pipeline-comercial-amplio.md`

## Dependencias de Fase 3

- la ampliacion de `customer_relationship_case` con `pipelineStage`,
  `priority`, `commercialChannel` y `lastPipelineActivityAt`
- la ADR que mantiene el pipeline amplio sobre el mismo caso transversal
- la trazabilidad obligatoria de cambios de etapa y de cierres `won` y
  `lost`
- la implementacion de filtros por `commercialOwner`, `assignee`,
  `pipelineStage`, `priority`, `commercialChannel` y `status`
