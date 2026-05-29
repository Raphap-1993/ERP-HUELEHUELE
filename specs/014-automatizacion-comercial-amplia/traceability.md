# Traceability - Automatizacion Comercial Amplia

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md)

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

Trazar el slice `014-automatizacion-comercial-amplia` desde Fase 1, Fase 2
y Fase 3 hasta su paquete SDD y runtime esperado, fijando que el journey vive
anclado al caso comercial del cliente, puede ligarse a una oportunidad activa
estable y se consume dentro del mismo `/crm`.

## Matriz

| ID | Regla canonica | Fase 1 | Fase 2 | Fase 3 | Paquete SDD | Runtime esperado | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TR-01 | `014` extiende `customer_relationship_case` y no lo reemplaza | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md), [UC-40](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-40-instanciacion-y-ejecucion-del-journey-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md), [ADR-014](../../docs/fase-3-arquitectura/adr/ADR-014-customers-commercial-journey-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T1`, `T2` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) y [types/api.ts](../../packages/shared/src/types/api.ts) deben expresar journey como capa del caso y no como agregado raiz | revisar que no aparezca ruta o modulo separado para el engine |
| TR-02 | una sola instancia no terminal por `template + case` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md), [UC-40](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-40-instanciacion-y-ejecucion-del-journey-comercial.md), [UC-42](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-42-reentrada-cancelacion-y-trazabilidad-del-journey.md) | [Fase 2](../../docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md), [ADR-014](../../docs/fase-3-arquitectura/adr/ADR-014-customers-commercial-journey-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2`, `T3` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) debe sostener unicidad sobre `active` y `paused` | probar que no se creen duplicados `active + paused` del mismo template |
| TR-03 | los templates son cerrados y se snapshottean al instanciar | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md) | [Fase 2](../../docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T1`, `T2` | [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts) y [types/api.ts](../../packages/shared/src/types/api.ts) deben sostener catalogo cerrado y snapshot | revisar ausencia de builder libre y de referencia viva mutable |
| TR-04 | `manual_review` bloquea y se resuelve dentro de `/crm` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md), [UC-41](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-41-pasos-manuales-esperas-y-reanudacion-del-journey.md) | [Fase 2](../../docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md), [ADR-014](../../docs/fase-3-arquitectura/adr/ADR-014-customers-commercial-journey-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T5`, `T8` | [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx), [api.ts](../../apps/admin/lib/api.ts) y [customers.controller.ts](../../apps/api/src/modules/customers/customers.controller.ts) deben sostener pending/resolution del paso | probar bloqueo y reanudacion automatica al resolver |
| TR-05 | waits y timers viven en `worker/BullMQ` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md), [UC-41](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-41-pasos-manuales-esperas-y-reanudacion-del-journey.md) | [Fase 2](../../docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md) | [Fase 3](../../docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md), [ADR-014](../../docs/fase-3-arquitectura/adr/ADR-014-customers-commercial-journey-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T4` | [worker main.ts](../../apps/worker/src/main.ts) debe sostener continuaciones diferidas sin absorber ownership | probar wait programado y reanudacion en paso correcto |
| TR-06 | el binding a oportunidad activa es estable al deal original | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md), [UC-42](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-42-reentrada-cancelacion-y-trazabilidad-del-journey.md) | [Fase 2](../../docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md), [ADR-014](../../docs/fase-3-arquitectura/adr/ADR-014-customers-commercial-journey-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T7` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) debe sostener binding estable y manejo de incompatibilidad | probar que no haya rebind silencioso a otra oportunidad |
| TR-07 | las acciones automaticas son seguras y no mutan estados comerciales | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md) | [Fase 2](../../docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md), [ADR-014](../../docs/fase-3-arquitectura/adr/ADR-014-customers-commercial-journey-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T6` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts) y [notifications.service.ts](../../apps/api/src/modules/notifications/notifications.service.ts) deben limitarse a side effects seguros | revisar ausencia de mutaciones automaticas de `pipelineStage`, `status` y `opportunityStage` |
| TR-08 | incompatibilidad fuerte cancela, blanda pausa o desvia | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md), [UC-42](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-42-reentrada-cancelacion-y-trazabilidad-del-journey.md) | [Fase 2](../../docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md) | [Fase 3](../../docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md), [ADR-014](../../docs/fase-3-arquitectura/adr/ADR-014-customers-commercial-journey-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T7`, `T9` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) y [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben expresar pause/cancel semantics y su razon | probar pause por incompatibilidad blanda y cancelacion por fuerte |
| TR-09 | la traza del journey vive en el mismo `/crm` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md), [UC-42](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-42-reentrada-cancelacion-y-trazabilidad-del-journey.md) | [Fase 2](../../docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T8`, `T9` | [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) y [types/api.ts](../../packages/shared/src/types/api.ts) deben sostener milestones y trace entries en el mismo workbench | revisar que no se abra consola paralela de auditoria |
| TR-10 | el slice no abre builder libre, chaining, inbox ni mensajeria bidireccional | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.13-automatizacion-comercial-amplia.md), [reglas](../../docs/fase-1-analisis-requerimientos/reglas/automatizacion-comercial-amplia.md) | [Fase 2](../../docs/fase-2-ux-ui/02.13-automatizacion-comercial-amplia-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.16-automatizacion-comercial-amplia.md), [ADR-014](../../docs/fase-3-arquitectura/adr/ADR-014-customers-commercial-journey-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T1`, `T6`, `T8` | el runtime esperado debe mantenerse dentro de `/crm`, `customers`, `marketing`, `notifications` y `worker` sin abrir nuevas superficies mayores | revisar ausencia de builder, chaining o inbox en docs y contratos |

## Dependencias Fuera De Este Ownership

- `006-campaigns-marketing-automation` sigue gobernando campañas existentes y
  dispatch real
- `010-crm-transversal-por-cliente` sigue gobernando el caso general del
  cliente
- `011-pipeline-comercial-amplio` sigue gobernando pipeline y prioridad
- `012-scoring-y-automatizaciones-comerciales` sigue gobernando score y
  reglas simples
- `013-commercial-opportunities` sigue gobernando el deal puntual

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- alineado con Fase 1, Fase 2 y Fase 3 ya aprobadas
- conectado con `product-design.md` y `spdd-frontend.md`
- amarrado a un runtime esperado que extiende `customers`, `/crm` y
  `worker/BullMQ`
- listo para implementarse sin romper la frontera con `010`, `011`, `012` y
  `013`
- cerrado contra aperturas informales de builder libre, chaining, inbox o
  mutaciones automaticas del estado comercial
