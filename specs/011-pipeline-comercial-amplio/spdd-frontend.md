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
- `origin`
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
- `pipelineStage` es manual, convive separado de `status`, usa `new`,
  `contacted`, `engaged`, `nurturing`, `won` y `lost`, nace en `new` por
  defecto y no puede quedar nulo al abrir el caso
- la reapertura comercial desde `lost` devuelve `pipelineStage` a
  `contacted`
- `commercialOwner`, `assignee`, `origin`, `nextStep` y `followUpAt` se
  preservan del detalle heredado de `010` y siguen visibles en la operacion
  del caso
- `nextStep` y `followUpAt` siguen siendo obligatorios mientras el caso
  esta activo
- `priority` usa `low`, `medium` y `high`
- `commercialChannel` usa `storefront`, `vendor`, `wholesale`,
  `manual_outreach`, `reactivation` y `referral`
- `commercialChannel` convive con `origin`: `origin` conserva el origen del
  caso heredado de `010`, mientras `commercialChannel` fija el canal
  principal del pipeline amplio
- `lostReason` usa `no_response`, `price`, `timing`, `competition`,
  `not_fit` y `other`
- `lastPipelineActivityAt` ordena actividad reciente sin obligar a leer
  todo el timeline
- `won` y `lost` exigen accion manual y trazabilidad visible
- `lost` exige `lostReason` y `won` exige nota con evidencia o referencia
- el slice no se presenta como forecast, automatizacion, scoring ni
  `commercial_opportunity`

## Lecturas derivadas

- pendientes de hoy y vencidos son lecturas derivadas desde `followUpAt`
- sugerencias de `status` despues de `won` o `lost` son comportamiento
  secundario y no cambian el contrato minimo del corte
- agregados visuales por etapa, prioridad o canal son capa operativa
  secundaria y no requisito para que `011` sea una ampliacion seria de `010`

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
