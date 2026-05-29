# Spec Funcional - Scoring Y Automatizaciones Comerciales

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Scoring Y Automatizaciones Comerciales](../../docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md),
  [Reglas de scoring y automatizaciones comerciales](../../docs/fase-1-analisis-requerimientos/reglas/scoring-y-automatizaciones-comerciales.md),
  [UC-34 Calculo y explicacion del score comercial](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-34-calculo-y-explicacion-del-score-comercial.md),
  [UC-35 Ejecucion de reglas y acciones simples](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-35-ejecucion-de-reglas-y-acciones-simples.md),
  [UC-36 Idempotencia y cooldown de automatizaciones](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-36-idempotencia-y-cooldown-de-automatizaciones.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md),
  [ADR-012 Customers Scoring Automation Boundary](../../docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md)

## Objetivo

Definir el slice canonico vigente de scoring determinista y automatizaciones
comerciales simples como paquete SDD sobre `customer_relationship_case`,
extendiendo el workbench de `010` y `011` con `scoreTier`, razon visible,
eventos, catalogo cerrado de reglas y side effects seguros sin abrir
`commercial_opportunity`, journeys, IA opaca ni mutaciones automaticas de
`pipelineStage` o `status`.

## Alcance

Incluye:

- extension controlada de `010-crm-transversal-por-cliente`
- consumo del pipeline manual fijado en `011`
- `customer_relationship_case`
- `scoreTier`
- razon visible corta del score
- triggers fuente canonicos
- eventos derivados `score_changed` y `followup_candidate_detected`
- catalogo cerrado de reglas con `active/inactive`, `order`, `cooldown`,
  filtros y accion
- acciones `recalculate_score`, `suggest_priority`, `create_followup_task` y
  `enqueue_existing_campaign`
- deduplicacion por `ruleId + customerRelationshipCaseId + actionType`
- trazabilidad de sugerencias, side effects y bloqueos
- consumo principal dentro de `/crm`

No incluye:

- `commercial_opportunity`
- forecast
- probabilidad
- journeys multi-step
- builder libre de reglas
- override manual del score
- puntaje interno visible en UI
- cambio automatico de `pipelineStage`
- cambio automatico de `status`
- cambio automatico de `commercialOwner` o `assignee`
- authoring de campaigns desde `/crm`

## Actores

- `marketing`
- `ventas`
- `admin`
- `super_admin`
- `customers`
- `notifications`
- `worker`

## Reglas Funcionales Canonicas

### RF-01. `012` extiende `010` y `011` sobre el mismo caso

- `012` no crea un agregado comercial nuevo
- `customer_relationship_case` sigue siendo el agregado principal
- `pipelineStage`, `priority`, `commercialChannel`, `status`, `nextStep` y
  `followUpAt` se preservan como baseline del caso
- el slice sigue operando un solo caso por cliente canonico

### RF-02. Ownership del slice y superficie principal

- `marketing` es owner operativo del catalogo de reglas
- `ventas` consume score, sugerencias y side effects dentro de `/crm`
- `admin` y `super_admin` conservan override
- `customers` sigue siendo el dominio ancla del caso
- `/crm` sigue siendo la superficie visible principal del slice

### RF-03. Score determinista, auditable y read-only

- el score se calcula por reglas explicitas y reproducibles
- el score no admite override manual
- el score se recalcula por eventos fuente o derivados del slice
- el score no reemplaza `priority`
- el score no reemplaza `pipelineStage`, `status` ni `followUpAt`

### RF-04. Tier visible y explicacion corta del score

- la UI visible usa `cold`
- la UI visible usa `warm`
- la UI visible usa `hot`
- el puntaje interno existe solo como mecanismo tecnico de calculo
- el puntaje interno no se expone en `/crm`
- cada tier visible debe ir acompanado de una razon corta del score

### RF-05. Triggers fuente y eventos derivados canonicos

- el slice usa `pipeline_stage_changed`
- el slice usa `followup_due`
- el slice usa `followup_overdue`
- el slice usa `order_confirmed`
- el slice usa `payment_confirmed`
- el slice usa `case_reopened`
- el slice deriva `score_changed` cuando cambia el resultado efectivo del score
- el slice deriva `followup_candidate_detected` cuando el caso requiere accion
  comercial adicional

### RF-06. Catalogo cerrado de reglas simples

- cada regla pertenece a un catalogo predefinido
- cada regla usa `active` o `inactive`
- cada regla expone `order` de evaluacion determinista
- cada regla expone `cooldown`
- cada regla declara trigger, filtros simples y una accion
- el slice no abre builder libre de reglas

### RF-07. Filtros simples de elegibilidad

- las reglas pueden filtrar por `commercialChannel`
- las reglas pueden filtrar por `pipelineStage`
- las reglas pueden filtrar por `scoreTier`
- las reglas pueden filtrar por `status`
- los filtros se evalúan sobre el mismo caso y no abren subpipelines nuevos

### RF-08. Catalogo cerrado de acciones permitidas

- `recalculate_score`
- `suggest_priority`
- `create_followup_task`
- `enqueue_existing_campaign`

Reglas:

- `followup_candidate_detected` es evento derivado y no accion
- `suggest_priority` no cambia `priority` automaticamente
- `create_followup_task` opera sobre el mismo caso transversal
- `enqueue_existing_campaign` solo reutiliza campaigns existentes del slice
  `006`

### RF-09. Idempotencia y cooldown por regla

- la deduplicacion base usa
  `ruleId + customerRelationshipCaseId + actionType`
- el mismo side effect no debe repetirse para la misma regla y el mismo caso
- cada regla puede definir su propia ventana `cooldown`
- la deduplicacion y el `cooldown` dejan traza del bloqueo
- bloquear un side effect no impide recalcular score cuando corresponde

### RF-10. Guardrails de automatizacion simple

- las automatizaciones no cambian `pipelineStage`
- las automatizaciones no cambian `status`
- las automatizaciones no alteran `commercialOwner` ni `assignee`
- el slice no abre un ciclo comercial nuevo fuera del caso existente
- el slice no rompe la frontera de `notifications/worker` ya aprobada en `006`

### RF-11. Consumo visible del score y de sus efectos

- `/crm` muestra `scoreTier` y razon visible del score
- `/crm` puede mostrar sugerencia de prioridad como sugerencia, no como cambio
  aplicado
- `/crm` puede mostrar tareas automaticas dentro del mismo caso
- `/crm` puede mostrar evidencia de campaigns encoladas como efecto derivado
- `/crm` puede mostrar bloqueo por deduplicacion o `cooldown` como traza
  operativa

## Escenarios Principales

### Escenario A. Recalculo y lectura del score

1. Un trigger fuente o derivado impacta el `customer_relationship_case`.
2. El sistema recalcula el score de forma determinista y auditable.
3. El puntaje interno se colapsa a `cold`, `warm` o `hot`.
4. Si cambia el resultado efectivo, el slice deriva `score_changed`.
5. `/crm` muestra el tier visible y una razon corta.

### Escenario B. Evaluacion de reglas y acciones simples

1. Una regla activa recibe un trigger valido.
2. El sistema la evalua segun su `order`.
3. La regla revisa filtros simples de elegibilidad sobre el mismo caso.
4. Si aplica, ejecuta solo una accion del catalogo cerrado.
5. El efecto o la sugerencia quedan trazados sobre el mismo caso.

### Escenario C. Idempotencia y cooldown

1. Una regla intenta ejecutar un side effect.
2. El sistema deduplica por
   `ruleId + customerRelationshipCaseId + actionType`.
3. Si la ventana `cooldown` sigue activa, el side effect no se repite.
4. El bloqueo queda trazado.
5. El score puede recalcularse aunque el side effect quede omitido.

## Resultado Esperado

El slice queda listo para implementacion futura como una capa sobria y
auditada de priorizacion comercial y side effects simples sobre el mismo
cliente canonico, sin romper `010`, `011` ni `006`.
