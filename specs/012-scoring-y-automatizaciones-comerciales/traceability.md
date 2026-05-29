# Traceability - Scoring Y Automatizaciones Comerciales

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md)

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

Trazar el slice `012-scoring-y-automatizaciones-comerciales` desde Fase 1,
Fase 2 y Fase 3 hasta su paquete SDD y el runtime esperado, fijando que score y
automatizaciones simples viven sobre `customer_relationship_case`, preservan
`010`, `011` y `006`, y operan dentro de `/crm`.

## Matriz

| ID | Regla canonica | Fase 1 | Fase 2 | Fase 3 | Paquete SDD | Runtime esperado | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TR-01 | `012` extiende `010` y `011` sobre el mismo `customer_relationship_case` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md), [UC-34](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-34-calculo-y-explicacion-del-score-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md), [ADR-012](../../docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T1`, `T2` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [types/api.ts](../../packages/shared/src/types/api.ts) deben expresar score y traza como extension aditiva del mismo caso | revisar que no aparezca una entidad paralela |
| TR-02 | el score visible es determinista, auditable y read-only | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md), [UC-34](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-34-calculo-y-explicacion-del-score-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2`, `T8` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) y [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben recalcular y mostrar el score sin override manual | probar recalculo por evento y ausencia de override |
| TR-03 | la UI solo expone `cold`, `warm`, `hot` y una razon corta | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md), [UC-34](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-34-calculo-y-explicacion-del-score-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T1`, `T6`, `T8` | [types/api.ts](../../packages/shared/src/types/api.ts) y [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben sostener solo tier visible y razon corta | revisar que no aparezca puntaje interno en UI principal |
| TR-04 | los triggers fuente y eventos derivados del slice son finitos y cerrados | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md), [UC-35](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-35-ejecucion-de-reglas-y-acciones-simples.md) | [Fase 2](../../docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md) | [Fase 3](../../docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md), [ADR-012](../../docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T1`, `T2`, `T3`, `T8` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts), [types/api.ts](../../packages/shared/src/types/api.ts) deben fijar triggers y derivados canonicos | probar alta de eventos y ausencia de event engine libre |
| TR-05 | el catalogo de reglas es cerrado y usa `active/inactive`, `order`, `cooldown`, filtros y accion | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md), [UC-35](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-35-ejecucion-de-reglas-y-acciones-simples.md) | [Fase 2](../../docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md) | [Fase 3](../../docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md), [ADR-012](../../docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T3`, `T4` | [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts) y [types/api.ts](../../packages/shared/src/types/api.ts) deben expresar el catalogo cerrado | revisar que no exista builder libre ni reglas arbitrarias |
| TR-06 | la deduplicacion base usa `ruleId + customerRelationshipCaseId + actionType` y cada regla puede tener `cooldown` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md), [UC-36](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-36-idempotencia-y-cooldown-de-automatizaciones.md) | [Fase 2](../../docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T4`, `T8` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [worker/main.ts](../../apps/worker/src/main.ts) y la traza visible en [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben mostrar ejecucion o bloqueo idempotente | probar omision controlada y no duplicacion de tareas/campaigns |
| TR-07 | `suggest_priority` no muta `priority` automaticamente y `012` no mueve `pipelineStage` ni `status` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md), [UC-35](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-35-ejecucion-de-reglas-y-acciones-simples.md) | [Fase 2](../../docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md), [ADR-012](../../docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2`, `T6`, `T7`, `T8` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) y [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben mostrar sugerencia sin mutacion automatica | probar ausencia de cambios automaticos en pipeline o estado |
| TR-08 | `create_followup_task` vive sobre el caso y `enqueue_existing_campaign` reutiliza `006` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md), [UC-35](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-35-ejecucion-de-reglas-y-acciones-simples.md) | [Fase 2](../../docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T5`, `T6`, `T8` | [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts), [notifications.service.ts](../../apps/api/src/modules/notifications/notifications.service.ts), [worker/main.ts](../../apps/worker/src/main.ts) y [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben sostener la frontera correcta | probar tarea sobre caso y campaign encolada sin authoring nuevo |
| TR-09 | `/crm` sigue siendo la superficie principal del slice y no se abre consola nueva | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md) | [Fase 2](../../docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T6`, `T7` | [page.tsx](../../apps/admin/app/crm/page.tsx), [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx), [api.ts](../../apps/admin/lib/api.ts) deben sostener el mismo entrypoint | smoke de `/crm` sin rutas ni dashboards nuevos |
| TR-10 | `012` no abre opportunities, journeys, IA opaca ni builder libre | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.11-scoring-y-automatizaciones-comerciales.md) | [Fase 2](../../docs/fase-2-ux-ui/02.11-scoring-y-automatizaciones-comerciales-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.14-scoring-y-automatizaciones-comerciales.md), [ADR-012](../../docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T7`, `T8` | el runtime esperado se limita a [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts), [notifications.service.ts](../../apps/api/src/modules/notifications/notifications.service.ts), [worker/main.ts](../../apps/worker/src/main.ts) y [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) sin abrir nuevos modulos | revisar ausencia de opportunity, builder libre o automation suite |

## Dependencias Fuera De Este Ownership

- `006-campaigns-marketing-automation` sigue gobernando campaigns, segments,
  templates y dispatch real
- `010-crm-transversal-por-cliente` sigue gobernando la base del
  `customer_relationship_case`
- `011-pipeline-comercial-amplio` sigue gobernando pipeline, prioridad, canal y
  cierre manual del caso
- futuros slices deberan abrir opportunities, journeys o IA solo con corte y
  ADR propios

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- alineado con Fase 1, Fase 2 y Fase 3 ya aprobadas
- conectado con `product-design.md` y `spdd-frontend.md`
- amarrado a un runtime esperado que extiende `customers`, `marketing`,
  `notifications` y `/crm`
- listo para implementarse sin romper la frontera con `010`, `011` y `006`
- cerrado contra aperturas informales de opportunities, journeys o builder
  libre
