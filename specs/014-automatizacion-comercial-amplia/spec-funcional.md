# Spec Funcional - Automatizacion Comercial Amplia

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Automatizacion Comercial Amplia](../../docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md),
  [Reglas de automatizacion comercial amplia](../../docs/fase-1-analisis-requerimientos/reglas/automatizacion-comercial-amplia.md),
  [UC-40 Instanciacion y ejecucion del journey comercial](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-40-instanciacion-y-ejecucion-del-journey-comercial.md),
  [UC-41 Pasos manuales esperas y reanudacion del journey](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-41-pasos-manuales-esperas-y-reanudacion-del-journey.md),
  [UC-42 Reentrada cancelacion y trazabilidad del journey](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-42-reentrada-cancelacion-y-trazabilidad-del-journey.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md),
  [ADR-014 Customers Commercial Journey Boundary](../../docs/fase-3-arquitectura/adr/ADR-014-customers-commercial-journey-boundary.md)

## Objetivo

Definir el slice canonico vigente de journeys comerciales multi-step como
paquete SDD sobre `customer_relationship_case`, formalizando templates
cerrados, instancias con estado propio, waits, pasos manuales, binding
estable a oportunidad activa y side effects seguros sin romper `010`, `011`,
`012` ni `013`.

## Alcance

Incluye:

- extension controlada de `010-crm-transversal-por-cliente`
- convivencia con `011-pipeline-comercial-amplio`
- convivencia con `012-scoring-y-automatizaciones-comerciales`
- convivencia con `013-commercial-opportunities`
- `journey_template`
- `journey_instance`
- auto-start por trigger canonico
- lanzamiento manual excepcional
- una instancia no terminal por `template + case`
- multiples templates activos sobre el mismo caso
- snapshot del template
- lifecycle `active`, `paused`, `completed`, `cancelled`
- `journeyAssignee`
- `wait`
- `condition`
- `manual_review`
- `create_followup_task`
- `suggest_priority`
- `enqueue_existing_campaign`
- `mark_journey_milestone`
- reentrada por template
- traza obligatoria en `/crm`

No incluye:

- builder libre de journeys
- chaining entre journeys
- inbox comercial
- mensajeria bidireccional real
- mutacion automatica de `pipelineStage`
- mutacion automatica de `status`
- mutacion automatica de `opportunityStage`
- creacion automatica de `commercial_opportunity`

## Actores

- `marketing`
- `ventas`
- `admin`
- `super_admin`
- `customers`
- `worker`

## Reglas Funcionales Canonicas

### RF-01. `014` extiende el caso comercial del cliente

- el journey vive sobre `customer_relationship_case`
- el caso del cliente sigue siendo el agregado comercial principal
- la oportunidad activa solo se liga como contexto cuando el template la
  exige
- el slice sigue operando dentro de `/crm`

### RF-02. Catalogo cerrado de templates

- los templates canonicos del corte son `followup_recovery`,
  `reactivation_nurture`, `opportunity_progression` y `post_loss_recovery`
- cada template declara su elegibilidad y politica de reentrada
- el template se gobierna desde `marketing`
- editar un template no reescribe instancias ya creadas

### RF-03. Instanciacion controlada

- la instancia puede abrirse por trigger canonico o lanzamiento manual
  excepcional
- solo puede existir una instancia no terminal por `template + case`
- una instancia `paused` sigue ocupando esa unicidad
- un caso puede tener journeys activos de templates distintos

### RF-04. Lifecycle propio de la instancia

- la instancia usa `active`
- la instancia usa `paused`
- la instancia usa `completed`
- la instancia usa `cancelled`
- `manual_review` y `wait` no cambian el ancla del caso ni del deal

### RF-05. Tipos de paso cerrados

- `wait`
- `condition`
- `create_followup_task`
- `manual_review`
- `suggest_priority`
- `enqueue_existing_campaign`
- `mark_journey_milestone`

### RF-06. Pasos manuales y reanudacion

- `manual_review` bloquea la continuacion del journey
- `ventas` es resolvedor operativo principal
- `marketing` puede resolver de forma secundaria cuando el template o el
  flujo lo requieran
- al resolverse el paso manual, la instancia reanuda automaticamente si no
  queda otra condicion pendiente

### RF-07. Waits y continuaciones diferidas

- los pasos inmediatos corren `inline`
- `wait`, timers y reanudaciones diferidas corren en `worker/BullMQ`
- el worker no adquiere ownership del dominio comercial

### RF-08. Binding estable con oportunidad activa

- cuando el template requiere oportunidad activa, el binding se mantiene al
  deal original
- la instancia no puede rebindearse silenciosamente a otra oportunidad
- si el deal deja de aplicar, se evalua incompatibilidad fuerte o blanda

### RF-09. Incompatibilidad y reentrada

- incompatibilidad fuerte cancela
- incompatibilidad blanda pausa o desvia
- el mismo template puede reentrar sobre el mismo caso despues de
  `completed` o `cancelled`
- la reentrada respeta `reentryCooldown` por template

### RF-10. Acciones automaticas seguras

- el journey puede crear tarea
- el journey puede sugerir prioridad
- el journey puede encolar campaña existente
- el journey puede marcar hitos
- el journey no puede mutar automaticamente `pipelineStage`, `status` ni
  `opportunityStage`
- el journey no puede crear oportunidades automaticamente

### RF-11. Trazabilidad obligatoria

- inicio, pausa, reanudacion, branch, paso automatico, paso manual creado o
  resuelto, cancelacion y completion quedan trazados
- la traza vive dentro del mismo `/crm`
- el journey no necesita consola separada para ser auditado

## Escenarios Principales

### Escenario A. Instanciacion del journey

1. Existe un `customer_relationship_case` elegible.
2. Ocurre un trigger canonico o `marketing`/`ventas` lanza el journey de
   forma excepcional.
3. El sistema valida unicidad no terminal por `template + case`.
4. Se crea la instancia con snapshot del template.
5. El journey ejecuta sus pasos inmediatos y programa waits si hace falta.

### Escenario B. Paso manual y reanudacion

1. Una instancia activa alcanza un `manual_review`.
2. El paso bloquea la continuacion.
3. `ventas` lo resuelve en `/crm`; `marketing` puede resolver de forma
   secundaria si aplica.
4. La instancia reanuda automaticamente cuando corresponde.

### Escenario C. Cancelacion, completion o reentrada

1. Una instancia puede completar por exito o cancelarse por incompatibilidad
   fuerte.
2. Si la incompatibilidad es blanda, puede pausarse.
3. Tras `completed` o `cancelled`, el template puede reentrar segun politica
   y `reentryCooldown`.

## Resultado Esperado

El slice queda listo para implementacion futura como una capa seria de
automation comercial multi-step sobre el cliente canonico, diferenciando
caso, deal y journey sin abrir todavia una plataforma generalista de
workflow comercial.
