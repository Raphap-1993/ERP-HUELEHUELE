# Huele Huele Scoring Y Automatizaciones Comerciales Design

Fecha: 2026-05-29.

## Objetivo

Definir el slice brownfield
`012-scoring-y-automatizaciones-comerciales` como la capa de scoring
determinista y automatizacion comercial simple sobre
`customer_relationship_case`, para enriquecer `/crm` con score visible,
razon corta del score, reglas cerradas de automatizacion y side effects
seguros sin abrir todavia oportunidades complejas, journeys multi-step ni
un engine amplio de automatizacion comercial.

## Contexto

La homologacion actual ya fijo:

- `006-campaigns-marketing-automation` para campañas, segmentos,
  plantillas y frontera de dispatch desacoplada;
- `010-crm-transversal-por-cliente` para el workbench transversal del caso
  comercial sobre cliente canonico;
- `011-pipeline-comercial-amplio` para etapa comercial, prioridad,
  canal, cierres `won/lost` y bandeja filtrable dentro de `/crm`.

El gap que queda no es ya el pipeline manual del caso ni la operacion del
timeline comercial, sino la capa derivada que ayuda a priorizar y activar
acciones simples sin meter todavia un journey builder, un CRM automation
suite completo ni heuristicas opacas.

## Decision De Perimetro

El slice `012` cubre:

- score comercial determinista y auditable sobre
  `customer_relationship_case`
- tier visible:
  - `cold`
  - `warm`
  - `hot`
- puntaje interno por reglas + umbrales
- razon visible corta del score
- triggers fuente y eventos derivados simples
- catalogo cerrado de reglas de automatizacion
- filtros simples de elegibilidad por regla
- acciones automaticas acotadas y auditables
- tareas o recordatorios simples sobre el caso transversal del cliente
- encolado opcional de campañas simples ya existentes del slice `006`
- ejecucion mixta:
  - calculo inline del score
  - side effects por job/worker
- trazabilidad e idempotencia con ventana de enfriamiento

No cubre:

- `commercial_opportunity`
- journeys multi-step
- rule builder libre
- IA opaca o scoring heuristico no auditable
- override manual del score
- cambio automatico de `pipelineStage`
- cambio automatico de `status`
- forecast
- probabilidad de cierre
- consola separada de automation fuera de `/crm`

## Agregado Principal

El agregado principal del slice sigue siendo `customer_relationship_case`.

Reglas canonicas:

- `012` no crea un agregado nuevo
- el score y las automatizaciones simples se montan sobre el mismo caso
  transversal del cliente
- sigue existiendo un solo caso por cliente canonico
- las tareas automaticas viven sobre el caso transversal del cliente, no
  sobre pedidos
- `009` sigue gobernando seguimiento manual por pedido
- `010` y `011` siguen gobernando estado y pipeline manual del caso

## Ownership

- `marketing` es owner operativo principal del catalogo de reglas
- `ventas` consume los efectos y señales dentro de `/crm`
- `admin` y `super_admin` actuan como override
- `notifications` y `worker` conservan ownership del dispatch real cuando
  una regla encola una campaña existente

## Superficies

### Superficie principal

- detalle del cliente dentro de `/crm`

El detalle sigue siendo la superficie natural para leer el caso
transversal y ahora tambien su score, su razon visible y sus efectos
automaticos simples.

### Superficie operativa secundaria

- misma bandeja de `/crm`

La bandeja conserva el slice `011` como base y agrega lectura de score
visible, señales derivadas y efectos relevantes, sin abrir una nueva app de
automation.

### Catalogo operativo

- gestion minima del catalogo de reglas simples en backoffice

El catalogo no es un builder. Es un set cerrado de reglas con activacion,
orden de ejecucion, cooldown y filtros simples.

## Scoring Comercial

El score es determinista y auditable.

Modelo:

- internamente usa un puntaje calculado por reglas
- ese puntaje se colapsa a un tier visible:
  - `cold`
  - `warm`
  - `hot`
- el puntaje interno no se muestra en UI
- el tier si se muestra en `/crm`
- el caso expone una razon visible corta para explicar el tier

Reglas:

- el score no admite override manual en este corte
- el score se recalcula automaticamente por eventos
- el score no reemplaza `priority`
- el score puede sugerir prioridad, pero no escribirla por su cuenta

## Fuentes Del Score

El score se alimenta de señales comerciales y transaccionales visibles del
brownfield.

Fuentes principales:

- `pipelineStage`
- actividad reciente del caso
- `followUpAt`
- cierres y reaperturas
- `reactivation`
- señales duras de pedidos y cobros

## Eventos Del Slice

### Triggers fuente canonicos

- `pipeline_stage_changed`
- `followup_due`
- `followup_overdue`
- `order_confirmed`
- `payment_confirmed`
- `case_reopened`

### Eventos derivados simples

- `score_changed`
- `followup_candidate_detected`

Reglas:

- `012` puede usar eventos fuente del brownfield
- `012` puede derivar eventos simples del mismo caso
- `012` no abre un event engine mas amplio en este corte

## Catalogo De Reglas

El slice usa un catalogo cerrado de reglas simples.

Cada regla expone:

- `active` o `inactive`
- `order` de ejecucion determinista
- `cooldown` configurable
- trigger
- filtros simples de elegibilidad
- accion

Filtros tipicos:

- `commercialChannel`
- `pipelineStage`
- `scoreTier`
- `status`

Reglas:

- no existe builder libre de reglas
- las reglas son predefinidas, activables y auditables
- el orden evita resultados no reproducibles cuando varias reglas aplican
  al mismo caso

## Idempotencia Y Cooldown

Los side effects deben ser idempotentes.

Deduplicacion base:

- `ruleId + customerRelationshipCaseId + actionType`

Reglas:

- la misma regla sobre el mismo caso no debe crear tareas duplicadas ni
  encolar campañas repetidas dentro de la ventana activa
- cada regla puede definir su propio `cooldown`
- la deduplicacion no debe impedir recalcular el score cuando toque

## Catalogo De Acciones

El catalogo de acciones del slice queda cerrado en:

- `recalculate_score`
- `suggest_priority`
- `create_followup_task`
- `enqueue_existing_campaign`

Reglas:

- `followup_candidate` queda como señal derivada, no como accion propia
- `suggest_priority` no cambia `priority` automaticamente
- `create_followup_task` opera sobre el caso transversal del cliente
- `enqueue_existing_campaign` solo usa campañas ya existentes del slice
  `006`

## Efectos Automaticos Permitidos

Las reglas activas pueden ejecutar acciones simples sin aprobacion humana
previa si son seguras y reversibles.

Efectos permitidos:

- recalcular score
- sugerir prioridad
- marcar candidato a follow-up
- crear tarea o recordatorio simple
- encolar una campaña simple ya existente

Efectos no permitidos:

- mover `pipelineStage`
- mover `status`
- abrir un ciclo comercial nuevo
- alterar el ownership del caso

## Ejecucion Tecnica

El modelo tecnico del slice es mixto.

### Inline

- recalculo de score
- razon visible del score
- sugerencia de prioridad
- derivacion de señales simples

### Async por worker

- creacion de tarea o recordatorio simple
- encolado de campaña existente
- side effects con necesidad de deduplicacion y cooldown

Reglas:

- el score debe quedar vivo con el evento
- los side effects deben salir por job/worker para proteger trazabilidad y
  seguridad operativa

## Relacion Con Otros Slices

- `006` sigue gobernando campañas simples, templates, segmentos y frontera
  de dispatch
- `010` sigue gobernando el caso transversal del cliente
- `011` sigue gobernando `pipelineStage`, `priority`, `commercialChannel`,
  `won` y `lost`
- `012` agrega score, razon visible y automatizacion simple sobre ese mismo
  caso

## Visibilidad En `/crm`

`/crm` debe mostrar:

- tier visible del score
- razon visible corta del score
- sugerencia de prioridad
- señales de follow-up candidato
- tareas automaticas creadas
- trazabilidad de automatizaciones simples sobre el mismo caso

No debe mostrar:

- puntaje interno crudo
- builder de reglas
- journey editor
- consola separada de automation

## Taxonomia Minima Del Score

### Tiers visibles

- `cold`
- `warm`
- `hot`

### Razon visible corta

La razon visible debe explicar el score sin exponer toda la mecanica
interna.

Ejemplos validos:

- `actividad reciente + etapa engaged + follow-up vencido`
- `pedido confirmado + reactivacion reciente`
- `sin actividad reciente + follow-up vencido`

## Limites Explicitos

- no abrir `commercial_opportunity`
- no abrir scoring numerico visible en UI
- no abrir IA o modelos opacos
- no abrir rule builder libre
- no abrir journeys ni secuencias multi-step
- no mover automaticamente `pipelineStage`
- no mover automaticamente `status`
- no mezclar este slice con seguimiento por pedido de `009`

## Regla Critica Del Slice

`012` agrega una capa determinista, auditable y acotada de score y
automatizacion simple sobre `customer_relationship_case`, mejorando la
operacion comercial y el uso de `/crm` sin convertir todavia el brownfield
en una suite completa de CRM automation.
