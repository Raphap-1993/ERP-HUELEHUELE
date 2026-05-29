# Huele Huele Pipeline Comercial Amplio Design

Fecha: 2026-05-29.

## Objetivo

Definir el slice brownfield `011-pipeline-comercial-amplio` como la capa de
pipeline comercial manual sobre `customer_relationship_case`, para ordenar la
operacion comercial en `/crm` con etapas, prioridad, canal y criterios de
cierre sin abrir todavia oportunidades complejas, forecast, scoring
automatico ni automatizaciones comerciales.

## Contexto

La homologacion actual ya fijo:

- `007-customers-identity-conflicts` para identidad canonica del cliente;
- `009-crm-manual-ampliado` para seguimiento manual sobre pedidos
  especificos;
- `010-crm-transversal-por-cliente` para workbench transversal comercial
  sobre cliente canonico.

El gap que queda no es identidad, ni seguimiento puntual por pedido, ni
timeline transversal basico del cliente. El gap es el lenguaje comercial
amplio del caso: en que etapa comercial esta, con que prioridad se opera,
cual fue el canal principal, como se cierra como `won` o `lost`, y como se
trabaja una cola comercial seria sin convertir `/crm` en un CRM enterprise
completo.

## Decision De Perimetro

El slice `011` cubre:

- pipeline comercial amplio sobre `customer_relationship_case`
- `pipelineStage` manual
- `priority` manual
- `commercialChannel` como origen principal del caso
- `lostReason`
- `lastPipelineActivityAt`
- bandeja comercial filtrable dentro de `/crm`
- filtros por owner, assignee, etapa, prioridad, canal y status
- vistas de pendientes de hoy y vencidos usando `followUpAt`
- trazabilidad obligatoria de cambios de etapa
- cierre comercial `won` y `lost`

No cubre:

- `commercial_opportunity`
- forecast
- monto esperado
- probabilidad de cierre
- scoring automatico
- automatizaciones comerciales
- kanban visual complejo
- modulo separado fuera de `/crm`
- reescribir el modelo de `007`, `009` o `010`

## Agregado Principal

El agregado principal del slice sigue siendo `customer_relationship_case`.

Reglas canonicas:

- `011` no crea un agregado nuevo de oportunidad
- el pipeline se monta sobre el caso transversal del cliente
- sigue existiendo un solo caso por cliente canonico
- el pipeline comercial unifica la lectura de casos de `storefront`,
  `vendor`, `wholesale`, `manual_outreach`, `reactivation` y `referral`
- los canales se distinguen por filtro, no por subpipelines separados

## Ownership

- `ventas` es owner operativo principal
- `marketing` mantiene acceso operativo secundario
- `admin` y `super_admin` actuan como override
- `commercialOwner` sigue siendo responsable estable de la relacion
- `assignee` sigue siendo responsable operativo del siguiente movimiento

## Superficies

### Superficie principal

- detalle del cliente dentro de `/crm`

El detalle sigue siendo la superficie natural para entender el caso
transversal y ahora tambien su posicion dentro del pipeline comercial.

### Superficie secundaria

- bandeja comercial filtrable dentro de `/crm`

La bandeja no es kanban en este corte. Se canoniza como tabla o lista
filtrable para operar:

- `commercialOwner`
- `assignee`
- `pipelineStage`
- `priority`
- `commercialChannel`
- `status`
- `followUpAt`
- `lastPipelineActivityAt`

Ademas, dentro de la misma bandeja deben existir vistas de:

- pendientes de hoy
- vencidos

## Estado Operativo Vs Etapa Comercial

`011` conserva la separacion entre:

- `status` operativo del caso
- `pipelineStage` comercial del caso

`status` sigue usando:

- `open`
- `waiting_customer`
- `dormant`
- `resolved`

`pipelineStage` agrega una dimension distinta:

- `new`
- `contacted`
- `engaged`
- `nurturing`
- `won`
- `lost`

Reglas:

- `pipelineStage` es manual por ventas
- el sistema puede sugerir movimientos, pero no cambia la etapa por su
  cuenta
- se permiten saltos manuales entre etapas
- todo cambio de `pipelineStage` deja trazabilidad obligatoria en el
  timeline

## Cierre Comercial

### `lost`

`lost` cierra el pipeline comercial, pero no destruye el caso transversal.

Reglas:

- `lost` puede reabrirse comercialmente con trazabilidad
- pasar a `lost` exige `lostReason` obligatorio
- `lostReason` usa:
  - `no_response`
  - `price`
  - `timing`
  - `competition`
  - `not_fit`
  - `other`

### `won`

`won` representa cierre comercial manual por ventas.

Reglas:

- no se deriva automaticamente por evento del sistema
- se trata como cierre comercial estable
- no se revierte normalmente
- pasar a `won` exige:
  - nota de cierre
  - referencia o evidencia de cierre

`won` puede significar, segun el canal:

- pedido confirmado
- vendedor activado
- lead mayorista cerrado
- reactivacion concretada
- acuerdo comercial documentado

## Prioridad Comercial

El caso agrega `priority` manual.

Valores canonicos:

- `low`
- `medium`
- `high`

Reglas:

- la prioridad no se calcula automaticamente en este corte
- la prioridad sirve para ordenar la cola comercial antes de abrir scoring

## Canal Comercial

El caso agrega `commercialChannel` manual.

Valores canonicos:

- `storefront`
- `vendor`
- `wholesale`
- `manual_outreach`
- `reactivation`
- `referral`

Reglas:

- representa el origen principal de la relacion comercial
- no cambia libremente en cada movimiento del pipeline
- puede corregirse solo como decision operativa explicita

## Actividad Comercial

El caso agrega `lastPipelineActivityAt`.

Reglas:

- se actualiza con cambios de etapa
- se actualiza con actividad manual relevante del caso
- sirve para ordenar la cola sin obligar a leer todo el timeline

`followUpAt` sigue siendo la unica fecha objetivo operativa del caso. Este
slice no abre una segunda fecha comercial paralela.

## Inicializacion Del Pipeline

Al abrir un `customer_relationship_case`:

- `pipelineStage` nace por defecto en `new`
- `ventas` puede elegir otra etapa al abrir el caso si ya existe contexto
  comercial suficiente

Esto evita forzar que todos los casos pasen artificialmente por `new`.

## Reglas De Convivencia Entre `status` Y `pipelineStage`

El sistema mantiene ambos ejes separados, con guardrails suaves.

Reglas:

- el sistema no cambia `status` automaticamente por cambiar `pipelineStage`
- al pasar a `lost`, el sistema puede sugerir `dormant` o `resolved`
- al pasar a `won`, el sistema puede sugerir `resolved` si ya no queda
  trabajo activo

Guardrails minimos:

- `won` no deberia convivir con `dormant`
- `new` no deberia convivir con `resolved`
- `lost` no deberia convivir con `open` sin `lostReason`

## Timeline Y Trazabilidad

El timeline del caso transversal sigue siendo inmutable.

Reglas adicionales del slice:

- todo cambio de `pipelineStage` crea entrada obligatoria en el timeline
- `status_change` y cambios de etapa comercial deben poder leerse juntos
- la historia comercial no se pierde aunque el caso luego pase a `resolved`
  o `dormant`

## Relacion Con `010`

`010-crm-transversal-por-cliente` sigue resolviendo:

- la existencia del `customer_relationship_case`
- `commercialOwner`
- `assignee`
- `nextStep`
- `followUpAt`
- clasificacion comercial
- origen del caso
- timeline transversal base

`011-pipeline-comercial-amplio` agrega:

- etapa comercial amplia del caso
- prioridad comercial
- canal comercial principal
- motivo de perdida
- semantica de `won` y `lost`
- bandeja comercial operativa sobre el mismo caso

En otras palabras:

- `010` explica el workbench comercial transversal del cliente
- `011` explica el pipeline comercial amplio de ese mismo workbench

## Guardrails

- no abrir `commercial_opportunity`
- no mezclar este slice con scoring o automatizaciones comerciales
- no convertir la bandeja en kanban complejo por ahora
- no usar subpipelines separados por canal
- no acoplar automaticamente `pipelineStage` con `status`
- no marcar `won` automaticamente desde eventos del sistema
- no permitir cierres `lost` sin motivo
- no permitir cierres `won` sin nota ni evidencia

## Arquitectura Recomendada

La opcion recomendada es:

- ampliar `customer_relationship_case` con `pipelineStage`, `priority`,
  `commercialChannel`, `lostReason` y `lastPipelineActivityAt`
- mantener `ventas` como owner manual del pipeline
- operar el frente comercial dentro de `/crm`
- usar bandeja filtrable en vez de kanban
- sostener un pipeline unificado por cliente, filtrado por canal
- dejar scoring, automatizaciones y oportunidades complejas para slices
  posteriores

Se descartan por ahora:

- pipeline separado del caso transversal
- oportunidades por cliente desde este corte
- forecast o probabilidad
- scoring automatico
- kanban visual complejo
- cierre comercial automatico por sistema
