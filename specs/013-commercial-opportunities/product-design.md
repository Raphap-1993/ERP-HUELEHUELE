# Product Design - Commercial Opportunities

Fecha: 2026-05-29.

## Promesa de superficie

`Ventas` necesita operar una negociacion concreta con valor esperado dentro de
`/crm`, entendiendo en una sola lectura su etapa, valor, owner, referencias y
cierre, sin confundir ese deal puntual con el caso comercial general del
cliente ni abrir una app nueva.

## Componentes principales

- resumen general del cliente dentro de `/crm`
- bloque puntual de `commercial_opportunity`
- etapa propia de oportunidad
- `expectedValue`
- `currency`
- `targetCloseAt`
- `commercialOwner`
- `assignee`
- `commercialChannel`
- `opportunityType`
- referencias principal y secundarias
- timeline propio del deal
- tareas propias minimas
- cierre `won`
- cierre `lost` con `lostReason`

## Decisiones

- `013` extiende el `customer_relationship_case` documentado en `010` y el
  pipeline amplio fijado en `011`
- la oportunidad no reemplaza el caso transversal del cliente
- el deal puntual tiene su propio lifecycle y su propia traza
- el detalle del cliente sigue siendo la superficie principal
- la bandeja secundaria de oportunidades vive dentro del mismo `/crm`
- `commercialOwner`, `assignee` y `commercialChannel` se heredan por defecto,
  pero pueden ajustarse si el deal concreto lo requiere
- la oportunidad puede abrirse sin artefacto obligatorio, pero debe poder
  enlazar referencias despues
- `won` es cierre estable; `lost` permite reapertura controlada

## Contrato minimo del corte

- la oportunidad usa `qualified`, `proposal`, `negotiation`, `won` y `lost`
- `qualified`, `proposal` y `negotiation` exigen `expectedValue`, `currency`
  y `targetCloseAt`
- solo puede existir una oportunidad activa por caso
- `lost` puede reabrirse y vuelve a `negotiation`
- `won` no se reabre; un nuevo ciclo requiere nueva oportunidad historica
- `opportunityType` usa `storefront_recovery`, `wholesale_deal`,
  `vendor_activation` y `reactivation`
- `lostReason` reutiliza la taxonomia de `011`

## Lecturas secundarias

- la sugerencia de llevar el caso padre al menos a `engaged` es secundaria y
  no cambia el contrato principal del deal
- la bandeja puede servir para leer deals activos o historicos, sin forzar un
  kanban
- referencias y evidencia de cierre son lectura de soporte, no un modulo
  documental nuevo

## Tension principal

La superficie debe sentirse como una capa precisa y seria de negociacion
concreta dentro del mismo `/crm`: suficiente para operar deals reales, pero
sin prometer forecast, scoring adicional, automatizacion del lifecycle ni un
CRM de oportunidades enterprise.

## Resultado esperado

El slice puede pasar a arquitectura y SDD con una lectura comun entre caso
general del cliente, pipeline amplio y negociacion puntual, preservando
ownership, contexto y trazabilidad sin colapsar todo en una sola timeline.
