# SPDD Frontend - CRM Stage Order Follow-Up

Fecha: 2026-05-28.

## Superficies cubiertas

- `Pedidos > Operacion`

## Contratos visibles

- `SummaryTile` de `Etapa CRM`
- `SummaryTile` de `Seguimiento`
- `OperationGuideCard` asociado a la ruta de cobro actual
- `CommercialTraceCard`
- mensajes operativos de confirmacion y rechazo

## Reglas visibles

- `crmStage` no se edita manualmente
- `commercialTrace` no es bitacora completa de CRM
- el usuario lee la ruta comercial desde `CommercialTraceCard`, no desde un
  timeline paralelo
- fulfillment, dispatch y vendedor quedan fuera del ownership visible del
  slice
- notifications solo aparece como side effect tecnico, no como UI principal

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md`
- `docs/fase-1-analisis-requerimientos/reglas/crm-stage-y-order-follow-up.md`

## Dependencias de Fase 3

- el ownership de `orders`
- la ADR de frontera entre `crmStage`, `commercialTrace` y side effects
  secundarios
