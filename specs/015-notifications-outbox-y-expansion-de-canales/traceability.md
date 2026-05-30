# Traceability - Notifications Outbox Y Expansion De Canales

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Notifications Outbox Y Expansion De Canales](../../docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md),
  [Reglas de notifications outbox y expansion de canales](../../docs/fase-1-analisis-requerimientos/reglas/notifications-outbox-y-expansion-de-canales.md),
  [UC-43 Materializacion y encolado de notificaciones salientes](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-43-materializacion-y-encolado-de-notificaciones-salientes.md),
  [UC-44 Delivery worker y trazabilidad append-only](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-44-delivery-worker-y-trazabilidad-append-only.md),
  [UC-45 Idempotencia y capacidad graduada por canal](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-45-idempotencia-y-capacidad-graduada-por-canal.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md),
  [ADR-015 Notifications Outbox Channel Boundary](../../docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md)

## Objetivo

Trazar el slice `015-notifications-outbox-y-expansion-de-canales` desde Fase
1, Fase 2 y Fase 3 hasta su paquete SDD y runtime esperado, fijando que el
outbox sigue siendo outbound, individual por destinatario/canal y separado de
la evidencia tecnica append-only del dispatch.

## Matriz

| ID | Regla canonica | Fase 1 | Fase 2 | Fase 3 | Paquete SDD | Runtime esperado | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TR-01 | `notifications` es el outbox saliente unificado del brownfield | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md), [UC-43](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-43-materializacion-y-encolado-de-notificaciones-salientes.md) | [Fase 2](../../docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md), [ADR-015](../../docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T1`, `T2`, `T8` | [notifications.service.ts](../../apps/api/src/modules/notifications/notifications.service.ts) y [notificaciones/page.tsx](../../apps/admin/app/notificaciones/page.tsx) deben sostener el outbox como superficie y dominio unificados | revisar que no aparezca inbox ni consola paralela |
| TR-02 | una `Notification` es individual por `audience` y canal | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md), [UC-43](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-43-materializacion-y-encolado-de-notificaciones-salientes.md) | [Fase 2](../../docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md), [ADR-015](../../docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2` | [types/api.ts](../../packages/shared/src/types/api.ts) y [notifications.service.ts](../../apps/api/src/modules/notifications/notifications.service.ts) deben sostener la unidad individual | probar que un intento tecnico no cree otra unidad funcional |
| TR-03 | el snapshot funcional es inmutable | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md), [UC-43](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-43-materializacion-y-encolado-de-notificaciones-salientes.md) | [Fase 2](../../docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2`, `T5` | [notifications.service.ts](../../apps/api/src/modules/notifications/notifications.service.ts) y [notifications-workspace.tsx](../../apps/admin/components/notifications-workspace.tsx) deben impedir edicion posterior | revisar ausencia de affordances de edicion |
| TR-04 | `NotificationLog` es append-only y separado del snapshot | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md), [UC-44](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-44-delivery-worker-y-trazabilidad-append-only.md) | [Fase 2](../../docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md), [ADR-015](../../docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T3`, `T6` | [notifications.service.ts](../../apps/api/src/modules/notifications/notifications.service.ts) y [types/api.ts](../../packages/shared/src/types/api.ts) deben sostener log append-only | revisar que sent/failed creen eventos nuevos y no reescriban historia |
| TR-05 | `notifications` registra y encola; `worker` entrega | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md), [UC-44](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-44-delivery-worker-y-trazabilidad-append-only.md) | [Fase 2](../../docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md) | [Fase 3](../../docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md), [ADR-015](../../docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T3` | [notifications.service.ts](../../apps/api/src/modules/notifications/notifications.service.ts) y [worker main.ts](../../apps/worker/src/main.ts) deben sostener el boundary | probar que crear manual encola y el worker procesa por `notificationId` |
| TR-06 | `scheduledAt` es metadata visible y no scheduler real | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md), [UC-43](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-43-materializacion-y-encolado-de-notificaciones-salientes.md) | [Fase 2](../../docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md), [Product Design](product-design.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md), [ADR-015](../../docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T5` | [notifications-workspace.tsx](../../apps/admin/components/notifications-workspace.tsx) y [notifications.service.ts](../../apps/api/src/modules/notifications/notifications.service.ts) deben mostrarlo sin convertirlo en espera real | probar que la unidad entra igual al outbox |
| TR-07 | `email` es fuerte; otros canales son graduados | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md), [UC-45](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-45-idempotencia-y-capacidad-graduada-por-canal.md) | [Fase 2](../../docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md), [ADR-015](../../docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T4` | [worker main.ts](../../apps/worker/src/main.ts) y [notifications-workspace.tsx](../../apps/admin/components/notifications-workspace.tsx) deben sostener email real y otros canales visibles sin falsa paridad | revisar que solo email tenga provider real visible hoy |
| TR-08 | la idempotencia queda como guardrail canonico y hardening futuro | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md), [UC-45](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-45-idempotencia-y-capacidad-graduada-por-canal.md) | [Fase 2](../../docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md) | [Fase 3](../../docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md), [ADR-015](../../docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2`, `T7` | [notifications.service.ts](../../apps/api/src/modules/notifications/notifications.service.ts) debe endurecer equivalencia por origen + `audience` + canal cuando se implemente | revisar ausencia de sobreafirmacion de hard gate actual |
| TR-09 | el canon visible prevalece sobre Prisma legacy cuando divergen | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md) | [Fase 2](../../docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md), [ADR-015](../../docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md) | [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T7` | [prisma/schema.prisma](../../prisma/schema.prisma), [notifications.service.ts](../../apps/api/src/modules/notifications/notifications.service.ts) y [types/api.ts](../../packages/shared/src/types/api.ts) deben leerse con boundary brownfield explicito | revisar que nuevas decisiones no se basen solo en schema legacy |
| TR-10 | el slice sigue siendo outbound y no abre inbox ni inbound | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md), [reglas](../../docs/fase-1-analisis-requerimientos/reglas/notifications-outbox-y-expansion-de-canales.md) | [Fase 2](../../docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md), [ADR-015](../../docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T5`, `T8` | el runtime esperado debe mantenerse en `/notificaciones`, `notifications` y `worker` sin replies, threads ni inbound | revisar ausencia de inbox, reply o webhook inbound en docs y contratos |

## Dependencias Fuera De Este Ownership

- `006-campaigns-marketing-automation` sigue gobernando authoring y corrida de
  campaigns aguas arriba
- `012-scoring-y-automatizaciones-comerciales` sigue gobernando score y reglas
  simples
- `014-automatizacion-comercial-amplia` sigue gobernando journeys y pasos
  manuales comerciales
- `orders` y `loyalty` siguen gobernando sus eventos de negocio de origen

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- alineado con Fase 1, Fase 2 y Fase 3 ya aprobadas
- conectado con `product-design.md` y `spdd-frontend.md`
- amarrado a un runtime esperado que extiende `notifications`, `worker` y
  `/notificaciones`
- listo para evolucionar sin romper la frontera outbound del outbox
- cerrado contra aperturas informales de inbox, inbound o soporte manual no
  soportado
