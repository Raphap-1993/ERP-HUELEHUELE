# Huele Huele Automatizacion Comercial Amplia Design

Fecha: 2026-05-29.

## Objetivo

Definir el slice brownfield `014-automatizacion-comercial-amplia` como la
capa minima de journeys comerciales multi-step sobre
`customer_relationship_case`, con capacidad de operar sobre la oportunidad
activa ligada cuando exista, formalizando templates cerrados, waits,
condiciones, pasos manuales y side effects seguros sin abrir inbox,
mensajeria bidireccional real, chaining entre journeys, forecast ni un
workflow engine libre.

## Contexto

La homologacion actual ya fijo:

- `010-crm-transversal-por-cliente` para el workbench transversal del
  cliente;
- `011-pipeline-comercial-amplio` para el pipeline manual amplio del caso;
- `012-scoring-y-automatizaciones-comerciales` para score y reglas simples;
- `013-commercial-opportunities` para el deal puntual con valor esperado.

El gap que queda ya no es el caso comercial general, ni el pipeline, ni el
score, ni el deal puntual. El gap es la orquestacion comercial multi-step:
secuencias con `wait`, condicion, tareas, hitos, campañas ya existentes y
pasos manuales humanos, todo dentro del mismo `/crm`, sin convertir el
brownfield en una suite libre de automation.

## Decision De Perimetro

El slice `014` cubre:

- journeys comerciales multi-step sobre `customer_relationship_case`
- binding opcional a la oportunidad activa del caso
- catalogo cerrado de `journey templates`
- auto-start por trigger canonico
- alta manual excepcional
- una instancia activa por `template + case`
- multiples journeys activos por caso si son de templates distintos
- snapshot del template al instanciar
- estados de instancia `active`, `paused`, `completed`, `cancelled`
- pasos `wait`
- condiciones simples
- pasos manuales bloqueantes
- `journeyAssignee`
- `reentryCooldown` por template
- traza obligatoria de transiciones y pasos
- bandeja secundaria de journeys dentro de `/crm`
- ejecucion mixta `inline + worker/BullMQ`

No cubre:

- builder libre de journeys
- chaining entre journeys
- inbox comercial
- mensajeria bidireccional real
- mutacion automatica de `pipelineStage`
- mutacion automatica de `status`
- mutacion automatica de `opportunityStage`
- cierre automatico `won/lost`
- apertura automatica de `commercial_opportunity`
- workflow engine generico fuera de `/crm`

## Agregado Principal

El agregado principal del slice sigue siendo `customer_relationship_case`.

Reglas:

- `014` no crea un agregado comercial nuevo
- el journey vive anclado al caso comercial del cliente
- algunos pasos pueden operar sobre la oportunidad activa del caso
- la oportunidad no reemplaza el ancla del engine
- el journey no cambia silenciosamente de caso ni de deal

## Ownership

- `marketing` es owner principal del catalogo de templates
- `ventas` es consumidor operativo principal de efectos y pasos manuales
- `admin` y `super_admin` actuan como override
- cada instancia tiene `journeyAssignee`
- `journeyAssignee` se hereda por defecto del `assignee` del caso
- `journeyAssignee` puede reasignarse si el flujo lo requiere

## Superficies

### Superficie principal

- detalle del cliente dentro de `/crm`

El journey no abre una consola nueva. Vive como una capa operativa sobre el
mismo workbench comercial ya canonizado.

### Superficie secundaria

- bandeja de journeys dentro de `/crm`

La bandeja muestra por defecto:

- `active`
- `paused`

Y permite filtrar:

- `completed`
- `cancelled`

## Templates Cerrados

El slice fija un catalogo minimo de templates:

- `followup_recovery`
- `reactivation_nurture`
- `opportunity_progression`
- `post_loss_recovery`

Reglas:

- cada template declara su elegibilidad explicita
- cada template puede definir `reentryCooldown`
- cada template define desde que estados terminales puede reentrar
- la instancia toma snapshot del template al arrancar
- editar el template no reescribe journeys ya corriendo

## Elegibilidad Del Template

Las condiciones del journey se limitan a senales canonizadas:

- `status`
- `pipelineStage`
- `scoreTier`
- `priority`
- `followUpAt`
- presencia o estado de oportunidad activa
- `opportunityStage`
- `commercialChannel`
- `opportunityType`

Reglas:

- no se abre scripting libre
- no se abren expresiones arbitrarias
- la elegibilidad sigue siendo finita, auditable y operable

## Instanciacion

La instancia puede nacer por:

- auto-start por trigger canonico explicito
- alta manual excepcional por `ventas` o `marketing`

Reglas:

- una sola instancia activa por `template + customer_relationship_case`
- un mismo caso puede tener varias instancias activas si son de templates
  distintos
- una instancia historica puede reentrar despues de `completed` o
  `cancelled` si el template lo permite
- la reentrada respeta `reentryCooldown` por template

## Estado Propio De La Instancia

La instancia usa:

- `active`
- `paused`
- `completed`
- `cancelled`

Reglas:

- puede pausarse y reanudarse manualmente
- puede cerrarse automaticamente por exito
- puede cancelarse automaticamente por incompatibilidad fuerte
- si el caso padre queda `dormant`, el journey pasa a `paused`
- si el caso padre queda `resolved`, la instancia termina como `completed` o
  `cancelled` segun objetivo y ultimo paso

## Binding Con La Oportunidad

Si el journey queda ligado a una oportunidad activa:

- el binding se mantiene estable al deal original
- la instancia no hace rebind silencioso a otra oportunidad futura
- si la oportunidad desaparece o deja de aplicar, se evalua
  incompatibilidad fuerte o blanda

## Incompatibilidad

Semantica general:

- incompatibilidad fuerte => cancelacion automatica
- incompatibilidad blanda => pausa o desvio

Reglas:

- no todo cambio contextual debe cancelar una instancia
- un deal inexistente cuando era requisito del template es incompatibilidad
  fuerte
- un cambio operacional menor puede derivar en pausa o branch

## Catalogo De Tipos De Paso

El slice fija estos tipos:

- `wait`
- `condition`
- `create_followup_task`
- `manual_review`
- `suggest_priority`
- `enqueue_existing_campaign`
- `mark_journey_milestone`

Reglas:

- no hay scripting libre
- no hay pasos para disparar otro journey
- no hay pasos para mover automaticamente estados comerciales

## Semantica De Pasos

### `wait`

- permite espera temporal real
- su continuidad vive en `worker/BullMQ`

### `condition`

- permite ramificacion simple
- solo un camino queda activo por instancia
- no abre paralelismo interno

### `manual_review`

- crea un paso humano pendiente
- bloquea la continuacion del journey
- al resolverse, reanuda automaticamente si no queda otra condicion

### Acciones seguras

- `create_followup_task`
- `suggest_priority`
- `enqueue_existing_campaign`
- `mark_journey_milestone`

Reglas:

- no mutan `pipelineStage`
- no mutan `status`
- no mutan `opportunityStage`
- no cierran `won/lost`
- no crean `commercial_opportunity` automaticamente

## Frontera Con `013-commercial-opportunities`

El journey puede:

- leer oportunidad activa
- operar pasos sobre esa oportunidad
- sugerir apertura de oportunidad
- crear paso manual para que `ventas` la abra o confirme

El journey no puede:

- crear una oportunidad automaticamente
- rebindearse silenciosamente a otra oportunidad
- usar la oportunidad como agregado raiz del engine

## Ejecucion Tecnica

Modelo mixto:

- arranque y pasos inmediatos: `inline`
- `wait`, timers y reanudaciones diferidas: `worker/BullMQ`

Reglas:

- la instancia se crea y ejecuta inline hasta donde el flujo lo permita
- `worker` procesa continuaciones diferidas
- `enqueue_existing_campaign` reutiliza la frontera de `006`
- el engine no delega ownership comercial al worker

## Trazabilidad

Toda transicion y todo paso deja traza obligatoria en el timeline del caso:

- inicio del journey
- pausa
- reanudacion
- paso automatico ejecutado
- paso manual creado
- paso manual resuelto
- branch por condicion
- cancelacion
- completion

Reglas:

- la traza vive dentro del mismo `/crm`
- no hace falta una consola paralela para entender la ejecucion
- la instancia debe ser auditable desde el workbench comercial del cliente

## Guardrails

- el journey no reemplaza el caso comercial del cliente
- el journey no reemplaza la oportunidad puntual
- el journey no abre inbox ni mensajeria bidireccional
- el journey no encadena otros journeys
- el journey no abre workflow engine libre
- el journey no rompe las fronteras de `011`, `012` y `013`

## Resultado Esperado

El slice `014-automatizacion-comercial-amplia` deja modelada una capa real
de automation multi-step sobre el mismo workbench comercial del cliente, con
templates cerrados, waits, pasos humanos y side effects seguros, preservando
el ownership de `marketing`, el consumo operativo de `ventas` y la coherencia
de los slices previos sin convertir todavia el brownfield en una suite
generalista de workflows.
