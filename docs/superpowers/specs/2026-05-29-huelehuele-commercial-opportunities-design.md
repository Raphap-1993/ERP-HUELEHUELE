# Huele Huele Commercial Opportunities Design

Fecha: 2026-05-29.

## Objetivo

Definir el slice brownfield `013-commercial-opportunities` como la capa
minima de oportunidad comercial explicita sobre `customer_relationship_case`,
para modelar negociaciones concretas con valor esperado, cierre propio y
trazabilidad especifica dentro de `/crm`, sin reemplazar el workbench
transversal del cliente ni abrir todavia forecast, probabilidad, journeys o
un CRM de oportunidades mas pesado.

## Contexto

La homologacion actual ya fijo:

- `010-crm-transversal-por-cliente` para la relacion comercial general sobre
  cliente canonico;
- `011-pipeline-comercial-amplio` para el pipeline manual amplio del mismo
  caso;
- `012-scoring-y-automatizaciones-comerciales` para score derivado y
  automatizaciones simples sobre ese mismo caso.

El gap que queda no es ya la relacion comercial general del cliente, ni su
pipeline amplio, ni el score. El gap es una unidad comercial mas concreta:
cuando ya existe una negociacion con valor esperado, propuesta, cierre y
traza propios, el sistema necesita distinguirla del caso general para no
mezclar relationship management con deal execution.

## Decision De Perimetro

El slice `013` cubre:

- `commercial_opportunity` como subentidad de `customer_relationship_case`
- apertura manual o por conversion explicita desde el pipeline del caso
- una sola oportunidad activa por caso
- historico de oportunidades cerradas
- lifecycle propio de oportunidad
- `expectedValue`
- `currency`
- `targetCloseAt`
- `commercialOwner`
- `assignee`
- `commercialChannel`
- `opportunityType`
- `lostReason`
- referencia principal
- referencias secundarias opcionales
- timeline propio de la oportunidad
- tareas propias minimas de la oportunidad
- bandeja secundaria de oportunidades dentro de `/crm`

No cubre:

- reemplazar `customer_relationship_case`
- multiples oportunidades activas simultaneas por el mismo caso
- nurturing general o reactivacion difusa sin negociacion concreta
- forecast
- probabilidad de cierre
- pricing engine nuevo
- quote engine nuevo
- journeys
- automatizacion fuerte del lifecycle de oportunidad
- modulo separado fuera de `/crm`

## Agregado Principal

El agregado principal del slice sigue siendo `customer_relationship_case`,
pero ahora con una subentidad comercial mas concreta:

- `013` no reemplaza el caso transversal del cliente
- `commercial_opportunity` vive subordinada al caso
- un caso puede tener varias oportunidades historicas cerradas
- un caso solo puede tener una oportunidad activa a la vez
- la oportunidad existe solo cuando ya hay negociacion concreta con valor
  esperado

## Ownership

- `ventas` es owner operativo principal
- `marketing` mantiene acceso operativo secundario
- `admin` y `super_admin` actuan como override
- `commercialOwner` y `assignee` se heredan por defecto del caso
- ambos pueden ajustarse dentro de la oportunidad si la negociacion lo
  requiere

## Superficies

### Superficie principal

- detalle del cliente dentro de `/crm`

La oportunidad no abre una app separada. Vive como una capa mas especifica
dentro del mismo detalle comercial del cliente.

### Superficie secundaria

- bandeja filtrada de oportunidades dentro de `/crm`

La bandeja secundaria sirve para leer y operar negociaciones concretas sin
sacar el dominio del mismo modulo comercial.

## Apertura De La Oportunidad

La oportunidad puede nacer por:

- apertura manual de `ventas`
- conversion explicita desde el pipeline del caso

Reglas:

- el sistema no abre oportunidades automaticamente
- la oportunidad no se usa para nurturing general
- la oportunidad puede abrirse aunque todavia no exista quote u order formal
- la apertura puede sugerir que el caso padre este al menos en `engaged`
- esa sugerencia no mueve automaticamente el `pipelineStage` del caso

## Lifecycle Propio

La oportunidad tiene un lifecycle propio, separado del `pipelineStage`
general del caso:

- `qualified`
- `proposal`
- `negotiation`
- `won`
- `lost`

Reglas:

- el lifecycle es manual por `ventas`
- no reutiliza el `pipelineStage` general del caso
- `won` y `lost` cierran la oportunidad, no toda la relacion con el cliente

## Campos Canonicos Minimos

La oportunidad agrega:

- `expectedValue`
- `currency`
- `targetCloseAt`
- `commercialOwner`
- `assignee`
- `commercialChannel`
- `opportunityType`
- `lostReason`
- referencia principal
- referencias secundarias opcionales

Reglas:

- `expectedValue`, `currency` y `targetCloseAt` son obligatorios mientras la
  oportunidad este en `qualified`, `proposal` o `negotiation`
- esos campos quedan preservados como snapshot historico cuando la
  oportunidad cierra
- la oportunidad no usa probabilidad de cierre en este corte

## Tipo De Oportunidad

El slice fija tipos explicitos cortos:

- `storefront_recovery`
- `wholesale_deal`
- `vendor_activation`
- `reactivation`

Reglas:

- el sistema puede sugerir el tipo por contexto
- `ventas` confirma el tipo manualmente
- el tipo no abre subpipelines distintos; solo clasifica la oportunidad

## Canal Y Referencias

La oportunidad hereda por defecto:

- `commercialChannel` del caso

Pero puede corregirse si la negociacion concreta vino por otro frente.

Referencias:

- la oportunidad no exige artefacto fuente obligatorio al abrir
- puede abrirse con referencia principal vacia
- puede enlazar luego una referencia principal
- puede enlazar referencias secundarias opcionales

Ejemplos de referencia:

- `quote`
- `order`
- `lead`
- nota comercial
- evidencia de cierre

## Timeline Y Tareas Propias

La oportunidad necesita sus propias piezas operativas:

- timeline propio
- tareas propias minimas

Reglas:

- el timeline del caso sigue contando la relacion comercial general del
  cliente
- el timeline de la oportunidad cuenta la negociacion puntual
- las tareas de la oportunidad no reemplazan las del caso general
- el modelo de tarea puede mantenerse tan simple como el ya canonizado en
  slices previos

## Cierre Y Reapertura

### `lost`

La oportunidad perdida puede reabrirse.

Reglas:

- la reapertura deja trazabilidad en el timeline propio
- la reapertura desde `lost` vuelve a `negotiation`
- `lostReason` usa la misma taxonomia ya aprobada en `011`:
  - `no_response`
  - `price`
  - `timing`
  - `competition`
  - `not_fit`
  - `other`

### `won`

La oportunidad ganada cierra de forma estable.

Reglas:

- una oportunidad `won` no se reabre
- si existe un nuevo ciclo comercial, se abre una nueva oportunidad
  historica
- `won` preserva integridad historica del deal cerrado

## Impacto Sobre El Caso Padre

La oportunidad y el caso padre siguen relacionados, pero no acoplados en una
misma state machine.

Reglas:

- abrir una oportunidad puede sugerir que el caso este al menos en
  `engaged`
- esa sugerencia no mueve automaticamente el caso
- si la oportunidad queda `won`, el caso puede cerrarse tambien como ciclo
  comercial del cliente
- si la oportunidad queda `lost`, el caso no cae automaticamente a `lost`
- una oportunidad perdida solo sugiere revisar el estado general del caso

## Guardrails

- la oportunidad no reemplaza el workbench transversal del cliente
- la oportunidad no absorbe el pipeline general del caso
- la oportunidad no usa probabilidad de cierre en este corte
- la oportunidad no abre forecast
- la oportunidad no abre journeys ni automatizaciones fuertes
- la oportunidad no abre multiples oportunidades activas por caso
- la oportunidad no sale de `/crm`

## Resultado Esperado

El slice `013-commercial-opportunities` deja modelada una negociacion
comercial concreta, con valor esperado, cierre propio y contexto suficiente
para operar deals reales sobre el mismo cliente canonico, sin romper `010`,
`011` ni `012`, y sin sobredimensionar todavia el CRM comercial.
