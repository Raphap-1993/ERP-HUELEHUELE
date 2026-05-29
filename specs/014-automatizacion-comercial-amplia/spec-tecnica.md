# Spec Tecnica - Automatizacion Comercial Amplia

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Automatizacion Comercial Amplia](../../docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md),
  [Reglas de automatizacion comercial amplia](../../docs/fase-1-analisis-requerimientos/reglas/automatizacion-comercial-amplia.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md),
  [ADR-014 Customers Commercial Journey Boundary](../../docs/fase-3-arquitectura/adr/ADR-014-customers-commercial-journey-boundary.md)

## Objetivo Tecnico

Formalizar la frontera tecnica de un engine de journeys comerciales cerrados
como extension aditiva de `010`, `011`, `012` y `013`, manteniendo
`customer_relationship_case` dentro de `customers`, reutilizando
`worker/BullMQ` para continuaciones diferidas y dejando explicito que el
slice no abre workflow libre, inbox ni chaining entre journeys.

## Baseline Real Del Repo

### Contratos compartidos y acceso

- `packages/shared/src/types/api.ts`
  - hoy expone contratos de clientes, workbench CRM y deal puntual
  - todavia no expresa una proyeccion canonica de `journey_template`,
    `journey_instance`, `journeyAssignee`, pasos ni milestones
- `packages/shared/src/domain/admin-access.ts`
  - sigue fijando `adminAccessRoles.crm`
  - es el ancla natural para mantener la misma frontera de acceso

### API y modulos backend

- `apps/api/src/modules/customers/customers.controller.ts`
  - hoy publica el detalle administrativo del cliente y su contexto comercial
  - no existe todavia un contrato API explicito para journeys y manual
    reviews
- `apps/api/src/modules/customers/customers.service.ts`
  - hoy gobierna clientes, caso transversal y contexto comercial base
  - es el ancla natural para el binding del journey y la traza sobre el caso
- `apps/api/src/modules/marketing/marketing.service.ts`
  - hoy gobierna campañas y catalogos operativos de marketing
  - es la base natural para gobernar el catalogo cerrado de templates
- `apps/api/src/modules/notifications/notifications.service.ts`
  - hoy conserva frontera de cola y entrega
  - sigue siendo salida real para campañas ya existentes
- `apps/worker/src/main.ts`
  - hoy procesa side effects y dispatch desacoplado
  - es el destino natural de waits y timers del journey

### Workbench admin y cliente HTTP

- `apps/admin/app/crm/page.tsx`
  - hoy mantiene `/crm` como entrada visible del modulo
  - no existe ruta nueva para `014`
- `apps/admin/components/crm-workspace.tsx`
  - hoy concentra listado, metricas, detalle y operacion del caso comercial
  - es el hueco natural para extender el mismo workbench con resumen de
    journeys, pasos manuales y milestone trail
- `apps/admin/lib/api.ts`
  - hoy transporta lectura y escritura del modulo `crm`
  - todavia no ofrece metodos canonicos para journeys o manual reviews

## Frontera Tecnica Objetivo

### 1. `customers` sigue siendo el master del caso

- `customers` conserva el ownership de `customer_relationship_case`
- `014` agrega templates e instancias como capa subordinada al mismo caso
- el slice no desplaza ownership a `worker`, `marketing` o
  `commercial_opportunity`

### 2. `013` sigue gobernando el deal y `014` solo se liga

- `013` sigue gobernando `commercial_opportunity`
- `014` solo puede ligarse a la oportunidad activa cuando el template lo
  exige
- el binding es estable y no cambia silenciosamente a otro deal

### 3. `012` sigue gobernando automatizacion simple y `014` sube de nivel

- `012` sigue gobernando score y reglas simples del caso
- `014` agrega secuencias multi-step cerradas
- `014` no puede mutar automaticamente `pipelineStage`, `status` ni
  `opportunityStage`

### 4. `/crm` sigue siendo la unica superficie principal del slice

- el detalle del cliente sigue siendo la superficie principal
- la bandeja de journeys sigue dentro del mismo modulo `/crm`
- el slice no abre una consola nueva de automation

## Ajustes Minimos Recomendados

### Contratos shared

Rutas candidatas:

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/admin-access.ts`

Ajustes recomendados:

- introducir unions canonicas para `journey_template` y `journey_state`
- introducir shape compartida para `journey_instance`
- introducir shape cerrada para tipos de paso y milestones
- mantener `adminAccessRoles.crm` sin abrir set de acceso nuevo

### API y modulo `customers`

Rutas candidatas:

- `apps/api/src/modules/customers/customers.controller.ts`
- `apps/api/src/modules/customers/customers.service.ts`

Ajustes recomendados:

- exponer lectura de journeys del caso dentro del mismo detalle de cliente
- exponer resolucion de pasos `manual_review`
- sostener unicidad no terminal por `template + case`
- sostener binding estable con oportunidad activa
- sostener trazabilidad de milestones y transiciones

### API y modulo `marketing`

Rutas candidatas:

- `apps/api/src/modules/marketing/marketing.service.ts`

Ajustes recomendados:

- formalizar el catalogo cerrado de templates
- sostener elegibilidad por contexto comercial
- sostener `reentryCooldown` y politica de reentrada
- no convertir el catalogo en builder libre

### Worker y notifications

Rutas candidatas:

- `apps/api/src/modules/notifications/notifications.service.ts`
- `apps/worker/src/main.ts`

Ajustes recomendados:

- programar waits y continuaciones diferidas
- procesar `enqueue_existing_campaign` sin romper la frontera de `006`
- registrar ejecucion, completion o cancelacion tecnica
- no decidir ownership del caso ni del deal

### Admin y cliente HTTP

Rutas candidatas:

- `apps/admin/app/crm/page.tsx`
- `apps/admin/components/crm-workspace.tsx`
- `apps/admin/lib/api.ts`

Ajustes recomendados:

- extender el detalle del cliente con resumen de journey y pasos manuales
- mostrar `journeyAssignee`, template, estado y milestones
- resolver `manual_review` dentro del mismo `/crm`
- mostrar bandeja secundaria de journeys del caso
- no abrir ruta nueva ni consola separada

## Reglas Tecnicas Del Slice

1. `customer_relationship_case` sigue siendo unico por cliente canonico.
2. `journey_instance` vive sobre el caso y no sobre la oportunidad como raiz.
3. solo existe una instancia no terminal por `template + case`.
4. `paused` no libera la unicidad del mismo template.
5. un caso puede tener journeys activos si son templates distintos.
6. el snapshot del template se congela al instanciar.
7. `manual_review` bloquea hasta resolverse.
8. la resolucion valida del paso manual reanuda la instancia si no queda
   otra condicion pendiente.
9. `wait` y timers viven en `worker/BullMQ`.
10. el binding con oportunidad activa es estable al mismo deal original.
11. el engine no puede disparar otro journey.
12. el engine no puede crear `commercial_opportunity`.
13. el engine no puede mutar `pipelineStage`, `status` ni
    `opportunityStage`.
14. las acciones automaticas siguen limitadas a side effects seguros.
15. la traza del journey vive dentro del mismo `/crm`.

## Riesgos Tecnicos Y Mitigaciones

| Riesgo | Mitigacion canonica |
| --- | --- |
| duplicar journeys del mismo template sobre el mismo caso | unicidad no terminal por `template + case` |
| perder control humano en `manual_review` | bloqueo fuerte y reanudacion solo al resolver |
| rebind silencioso a otro deal | binding estable a la oportunidad original |
| convertir worker en owner del dominio | limitar worker a waits, timers y side effects |
| abrir workflow libre demasiado pronto | catalogo cerrado de templates y tipos de paso |
| mezclar caso, deal y journey en una sola state machine | mantener fronteras y ownership separados |

## Definition Of Done Tecnica Del Slice

- el repo expresa `014` como extension controlada de `010`, `011`, `012` y
  `013`
- `journey_template` y `journey_instance` quedan fijados como lenguaje
  tecnico canonico
- `manual_review`, waits, milestones y reentrada quedan definidos de forma
  cerrada
- `worker/BullMQ` queda acotado a timers y continuaciones diferidas
- `/crm` queda defendido como unica superficie principal del slice
- el slice deja explicito que builder libre, chaining, inbox y mutaciones
  automaticas del estado comercial quedan fuera
