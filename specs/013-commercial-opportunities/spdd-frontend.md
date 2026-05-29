# SPDD Frontend - Commercial Opportunities

Fecha: 2026-05-29.

## Superficies cubiertas

- `/crm`
- detalle del cliente con bloque de oportunidad puntual
- bandeja filtrada de oportunidades dentro del mismo `/crm`

## Contratos visibles

- `customer_relationship_case` como base del slice
- `commercial_opportunity` como subentidad del caso
- `qualified`
- `proposal`
- `negotiation`
- `won`
- `lost`
- `expectedValue`
- `currency`
- `targetCloseAt`
- `commercialOwner`
- `assignee`
- `commercialChannel`
- `opportunityType`
- `lostReason`
- referencia principal
- referencias secundarias
- timeline propio del deal
- tareas minimas del deal

## Reglas visibles

- `/crm` sigue siendo la superficie del slice; no se abre ruta ni app nueva
- el detalle del cliente debe separar visualmente caso general y oportunidad
  puntual
- solo puede existir una oportunidad activa por caso
- `qualified`, `proposal` y `negotiation` exigen `expectedValue`, `currency`
  y `targetCloseAt`
- `commercialOwner`, `assignee` y `commercialChannel` pueden heredarse del
  caso y luego ajustarse
- `lost` puede reabrirse y vuelve a `negotiation`
- `won` no se reabre
- `opportunityType` usa `storefront_recovery`, `wholesale_deal`,
  `vendor_activation` y `reactivation`
- `lostReason` usa `no_response`, `price`, `timing`, `competition`,
  `not_fit` y `other`
- el slice no se presenta como forecast, probabilidad, journeys ni modulo
  separado

## Lecturas derivadas

- si no hay oportunidad activa, el detalle debe poder mostrar estado vacio o
  accion de apertura/conversion
- la bandeja secundaria puede listar historico de deals, pero la regla de una
  activa por caso sigue intacta
- el impacto sobre el `pipelineStage` del caso padre es sugerido, no automatico
- referencias principal/secundarias son soporte de contexto y evidencia, no un
  authoring documental nuevo

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md`
- `docs/fase-1-analisis-requerimientos/reglas/commercial-opportunities.md`

## Dependencias de Fase 3

- la ampliacion de `customer_relationship_case` con `commercial_opportunity`
- la ADR que mantiene la oportunidad como subentidad y no como agregado raiz
- la frontera entre timeline general del caso y timeline propio del deal
- la regla de una sola oportunidad activa por caso
