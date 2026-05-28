# Traceability - CRM Stage Order Follow-Up

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - CRM Stage Order Follow-Up](../../docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md),
  [Reglas de crm stage y order follow-up](../../docs/fase-1-analisis-requerimientos/reglas/crm-stage-y-order-follow-up.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.07-crm-stage-order-follow-up-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.10-crm-stage-order-follow-up.md),
  [ADR-008 Orders CRM Follow-Up Boundary](../../docs/fase-3-arquitectura/adr/ADR-008-orders-crm-follow-up-boundary.md)

## Objetivo

Trazar las reglas canonicas del seguimiento derivado del pedido contra sus
fuentes brownfield, los artefactos abiertos en Fases 1-3, el paquete SDD del
slice y el baseline tecnico real del monorepo.

## Matriz

| ID | Regla canonica | Fuentes brownfield | Artefactos canonicos del slice | Baseline tecnico actual | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- |
| TR-01 | `orders` es el agregado principal del slice | [modules.md](../../docs/architecture/modules.md), [roadmap.md](../../docs/product/roadmap.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md), [Fase 3](../../docs/fase-3-arquitectura/03.10-crm-stage-order-follow-up.md), [spec-funcional.md](spec-funcional.md) | [orders.service.ts](../../apps/api/src/modules/orders/orders.service.ts), [page.tsx](../../apps/admin/app/pedidos/page.tsx) | revisar que ownership y superficie visible sigan conectados al pedido |
| TR-02 | `ventas` es owner operativo principal y `operador_pagos` solo empuja transiciones de cobro | [roles-and-permissions.md](../../docs/product/roles-and-permissions.md), [requirements-impact-plan-2026-03.md](../../docs/product/requirements-impact-plan-2026-03.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md), [spec-funcional.md](spec-funcional.md), [ADR-008](../../docs/fase-3-arquitectura/adr/ADR-008-orders-crm-follow-up-boundary.md) | [admin-access.ts](../../packages/shared/src/domain/admin-access.ts), [orders-workspace.tsx](../../apps/admin/components/orders-workspace.tsx) | revisar acceso protegido y narrativa operativa de la vista |
| TR-03 | `crmStage` es derivado y usa `ready_for_followup`, `followup` y `closed` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md), [UC-22](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-22-derivacion-de-etapa-crm-del-pedido.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2`, `T5` | [enums.ts](../../packages/shared/src/domain/enums.ts), [orders.service.ts](../../apps/api/src/modules/orders/orders.service.ts) :: `resolveInitialCrmStage()`, `resolveOperationalCrmStage()` | probar derivacion inicial, operativa y cierre |
| TR-04 | `commercialTrace` es puente comercial y usa `pending`, `confirmed` y `rejected` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md), [UC-23](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-23-confirmacion-comercial-y-traza-operativa-del-pedido.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T3` | [types/api.ts](../../packages/shared/src/types/api.ts), [orders.service.ts](../../apps/api/src/modules/orders/orders.service.ts) :: `resolveCommercialTrace()` | revisar la traza en escenarios pendientes, confirmados y rechazados |
| TR-05 | las rutas canonicas son `manual_direct`, `manual_request`, `openpay_backoffice` y `openpay_provider` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md), [Reglas](../../docs/fase-1-analisis-requerimientos/reglas/crm-stage-y-order-follow-up.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [traceability.md](traceability.md) | [types/api.ts](../../packages/shared/src/types/api.ts), [orders.service.ts](../../apps/api/src/modules/orders/orders.service.ts), [erp-sales-flow.test.ts](../../apps/api/test/erp-sales-flow.test.ts) | cubrir las cuatro rutas y cerrar la brecha de prueba explicita para `openpay_provider` |
| TR-06 | `Pedidos > Operacion` es la superficie visible principal con `Etapa CRM`, `Seguimiento`, `OperationGuideCard` y `CommercialTraceCard` | [Fase 2](../../docs/fase-2-ux-ui/02.07-crm-stage-order-follow-up-ux-ui.md), [Product Design](product-design.md), [SPDD Frontend](spdd-frontend.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md) | [orders-workspace.tsx](../../apps/admin/components/orders-workspace.tsx) | smoke del tab operacion y de la lectura combinada de etapa y traza |
| TR-07 | el cierre negativo limpia `crmStage` y conserva la evidencia comercial del rechazo | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md), [UC-24](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-24-cierre-derivado-del-seguimiento-del-pedido.md) | [spec-funcional.md](spec-funcional.md), [spec-tareas.md](spec-tareas.md) :: `T5` | [orders.service.ts](../../apps/api/src/modules/orders/orders.service.ts) :: rechazo manual y cierres invalidos | probar rechazo manual y falla de pago sin dejar etapa activa |
| TR-08 | notifications solo entra como side effect secundario | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md), [ADR-008](../../docs/fase-3-arquitectura/adr/ADR-008-orders-crm-follow-up-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T6` | [orders.service.ts](../../apps/api/src/modules/orders/orders.service.ts), [notifications.service.ts](../../apps/api/src/modules/notifications/notifications.service.ts) | revisar que el side effect exista sin cambiar ownership del slice |
| TR-09 | el slice no abre CRM manual, customers, fulfillment ni dispatch | [roadmap.md](../../docs/product/roadmap.md), [requirements-impact-plan-2026-03.md](../../docs/product/requirements-impact-plan-2026-03.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md), [Fase 2](../../docs/fase-2-ux-ui/02.07-crm-stage-order-follow-up-ux-ui.md), [ADR-008](../../docs/fase-3-arquitectura/adr/ADR-008-orders-crm-follow-up-boundary.md) | [orders-workspace.tsx](../../apps/admin/components/orders-workspace.tsx), [orders.service.ts](../../apps/api/src/modules/orders/orders.service.ts) | revisar ausencia de notas/tareas CRM y de ownership de fulfillment o dispatch |

## Dependencias Fuera De Este Ownership

- maestro de clientes y conflictos de identidad viven en `007`
- campaigns y automation viven en `006`
- loyalty vive en `004`
- fulfillment y despacho requieren slices propios
- un CRM manual o timeline comercial exigiria un bounded context nuevo

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- conectado con las fuentes reales del brownfield de `orders`
- alineado con Fases 1, 2 y 3 ya aprobadas
- conectado con su propio paquete SDD de [spec-funcional.md](spec-funcional.md),
  [spec-tecnica.md](spec-tecnica.md) y [spec-tareas.md](spec-tareas.md)
- listo para evolucionar sin inventar CRM manual ni mezclar el seguimiento
  derivado con otros dominios operativos
