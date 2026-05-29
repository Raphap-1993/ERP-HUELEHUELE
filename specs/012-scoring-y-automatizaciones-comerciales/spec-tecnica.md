# Spec Tecnica - Scoring Y Automatizaciones Comerciales

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Scoring Y Automatizaciones Comerciales](../../docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md),
  [Reglas de scoring y automatizaciones comerciales](../../docs/fase-1-analisis-requerimientos/reglas/scoring-y-automatizaciones-comerciales.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md),
  [ADR-012 Customers Scoring Automation Boundary](../../docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md)

## Objetivo Tecnico

Formalizar la frontera tecnica del scoring determinista y de las
automatizaciones simples como extension aditiva de `010` y `011`, manteniendo
`customer_relationship_case` dentro de `customers` y `/crm`, reutilizando la
frontera de campaigns de `006` y dejando explicito que el slice no abre
journeys, rule builder libre, IA opaca ni mutaciones automaticas del pipeline.

## Baseline Real Del Repo

### Contratos compartidos y acceso

- `packages/shared/src/types/api.ts`
  - hoy expone contratos de clientes, conflictos y superficies administrativas
  - todavia no expresa una proyeccion canonica de score, razon visible,
    eventos simples o reglas cerradas sobre `customer_relationship_case`
- `packages/shared/src/domain/admin-access.ts`
  - sigue fijando `adminAccessRoles.crm`
  - es el ancla natural para mantener el mismo acceso que `010` y `011`

### API y modulos backend

- `apps/api/src/modules/customers/customers.controller.ts`
  - hoy publica el detalle administrativo del cliente y conflictos
  - no existe todavia un contrato API explicito para `scoreTier`,
    sugerencias o side effects simples
- `apps/api/src/modules/customers/customers.service.ts`
  - hoy gobierna clientes, identidad y caso comercial base
  - todavia no formaliza score derivado ni idempotencia por regla
- `apps/api/src/modules/marketing/marketing.service.ts`
  - hoy gobierna campañas y catalogos operativos de marketing
  - es la base natural para el catalogo cerrado de reglas y reutilizacion de
    campaigns
- `apps/api/src/modules/notifications/notifications.service.ts`
  - hoy conserva frontera de cola y entrega
  - sigue siendo la salida real para side effects asincronos
- `apps/worker/src/main.ts`
  - hoy procesa side effects y dispatch desacoplado
  - es el destino natural de acciones asincronas del slice

### Workbench admin y cliente HTTP

- `apps/admin/app/crm/page.tsx`
  - hoy mantiene `/crm` como entrada visible del modulo
  - no existe ruta nueva para abrir `012`
- `apps/admin/components/crm-workspace.tsx`
  - hoy concentra listado, metricas, detalle y operacion del caso comercial
  - es el hueco natural para extender el mismo workbench con `scoreTier`,
    razon visible, sugerencias y traza de side effects
- `apps/admin/lib/api.ts`
  - hoy transporta lectura y escritura del modulo `crm`
  - todavia no ofrece metodos canonicos para score o automatizaciones simples

## Frontera Tecnica Objetivo

### 1. `customers` sigue siendo el master del caso

- `customers` conserva el ownership de `customer_relationship_case`
- `012` agrega campos y reglas derivadas sobre el mismo caso
- el slice no desplaza ownership a `marketing`, `orders` o `notifications`

### 2. `011` sigue gobernando pipeline y `012` solo reacciona

- `011` sigue gobernando `pipelineStage`, `priority`, `commercialChannel`,
  `status`, `won` y `lost`
- `012` solo lee esas dimensiones como triggers o filtros
- `012` no puede mutar automaticamente `pipelineStage` ni `status`

### 3. `006` sigue gobernando campaigns y dispatch

- `012` solo puede encolar campaigns ya existentes
- `012` no hace authoring de campañas
- `notifications/worker` siguen siendo la frontera de dispatch real

### 4. `/crm` sigue siendo la unica superficie principal del slice

- el detalle del cliente sigue siendo la superficie principal
- la bandeja comercial sigue dentro del mismo modulo `/crm`
- el slice no abre una consola nueva de automation

## Ajustes Minimos Recomendados

Este slice debe cerrarse con cambios minimos y aditivos sobre el runtime
existente.

### Contratos shared

Rutas candidatas:

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/admin-access.ts`

Ajustes recomendados:

- ampliar la proyeccion compartida de `customer_relationship_case` con
  `scoreTier` y razon visible
- introducir unions canonicas para triggers, eventos derivados y acciones
- introducir shape compartida para reglas simples con `active/inactive`,
  `order`, `cooldown`, filtros y accion
- mantener `adminAccessRoles.crm` sin abrir un set de acceso nuevo

### API y modulo `customers`

Rutas candidatas:

- `apps/api/src/modules/customers/customers.controller.ts`
- `apps/api/src/modules/customers/customers.service.ts`

Ajustes recomendados:

- exponer lectura del score visible y de la razon corta dentro del mismo caso
- exponer trazabilidad de reglas evaluadas, sugerencias y side effects
- recalcular score inline al procesar triggers del slice
- derivar `score_changed` y `followup_candidate_detected`
- persistir deduplicacion por
  `ruleId + customerRelationshipCaseId + actionType`
- aplicar `cooldown` por regla sin bloquear recalculo legitimo del score
- no abrir un modulo `commercial_opportunity`

### API y modulo `marketing`

Rutas candidatas:

- `apps/api/src/modules/marketing/marketing.service.ts`

Ajustes recomendados:

- formalizar el catalogo cerrado de reglas simples
- sostener `active/inactive`, `order`, `cooldown`, trigger, filtros y accion
- sostener acciones permitidas del slice
- reutilizar campaigns existentes sin abrir authoring nuevo desde `/crm`

### Notifications y worker

Rutas candidatas:

- `apps/api/src/modules/notifications/notifications.service.ts`
- `apps/worker/src/main.ts`

Ajustes recomendados:

- recibir side effects asincronos ya deduplicados
- procesar `enqueue_existing_campaign` sin romper la frontera de `006`
- dejar trazabilidad de ejecucion, omision o bloqueo
- no recalcular score ni decidir ownership del caso

### Admin y cliente HTTP

Rutas candidatas:

- `apps/admin/app/crm/page.tsx`
- `apps/admin/components/crm-workspace.tsx`
- `apps/admin/lib/api.ts`

Ajustes recomendados:

- extender el detalle del cliente con `scoreTier` y razon visible
- mostrar sugerencia de prioridad como sugerencia y no como mutacion aplicada
- mostrar tareas automaticas y effects simples dentro del mismo caso
- mostrar evidencia de campaigns encoladas como efecto derivado
- mostrar bloqueos por deduplicacion o `cooldown` en la misma traza operativa
- no abrir una ruta nueva para reglas o automation

## Reglas Tecnicas Del Slice

1. `customer_relationship_case` sigue siendo unico por cliente canonico.
2. `012` solo agrega score y automatizacion simple al mismo caso.
3. el score es read-only, determinista y auditable.
4. `scoreTier` visible usa solo `cold`, `warm` y `hot`.
5. el puntaje interno no se expone en la UI principal.
6. la razon visible del score no debe exponer formulas ni debug tecnico.
7. los triggers fuente y eventos derivados del slice son finitos y cerrados.
8. el catalogo de reglas es cerrado, activable y ordenable.
9. las reglas solo ejecutan acciones del catalogo permitido.
10. `suggest_priority` no puede escribir `priority` automaticamente.
11. `create_followup_task` opera sobre el caso transversal del cliente.
12. `enqueue_existing_campaign` reutiliza la frontera ya aprobada en `006`.
13. la deduplicacion base usa
    `ruleId + customerRelationshipCaseId + actionType`.
14. cada regla define su propio `cooldown`.
15. el bloqueo de side effects no impide recalcular score cuando toca.
16. `pipelineStage`, `status`, `commercialOwner` y `assignee` no se mutan
    automaticamente desde `012`.
17. `/crm` sigue siendo la unica superficie principal del slice.

## Riesgos Tecnicos Y Mitigaciones

| Riesgo | Mitigacion canonica |
| --- | --- |
| abrir un builder libre de reglas demasiado pronto | mantener catalogo cerrado y predefinido |
| mezclar score visible con puntaje interno o debug tecnico | exponer solo tier y razon corta |
| duplicar tareas o campaigns por reintentos | aplicar deduplicacion base y `cooldown` |
| romper la frontera de `011` con mutaciones automaticas de pipeline | prohibir cambios automaticos de `pipelineStage` y `status` |
| romper la frontera de `006` con authoring desde `/crm` | reutilizar solo campaigns existentes y dispatch via `notifications/worker` |
| sacar el slice de `/crm` | extender `crm-workspace.tsx` y la misma entrada `/crm` |

## Definition Of Done Tecnica Del Slice

- el repo expresa `012` como extension controlada de `010` y `011`
- `customer_relationship_case` queda identificado como unico agregado del
  score y de la traza de automatizaciones simples
- `scoreTier`, razon visible, triggers, eventos, reglas y acciones quedan
  fijados como lenguaje tecnico canonico
- `notifications/worker` quedan acotados a side effects asincronos y dispatch
- `/crm` queda defendido como unica superficie principal del slice
- el slice deja explicito que journeys, builder libre, IA opaca y
  opportunities quedan fuera de este corte
