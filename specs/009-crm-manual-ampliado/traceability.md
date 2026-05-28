# Traceability - CRM Manual Ampliado

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - CRM Manual Ampliado](../../docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md),
  [Reglas de crm manual ampliado](../../docs/fase-1-analisis-requerimientos/reglas/crm-manual-ampliado.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.08-crm-manual-ampliado-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.11-crm-manual-ampliado.md),
  [ADR-009 Orders Manual Follow-Up Boundary](../../docs/fase-3-arquitectura/adr/ADR-009-orders-manual-follow-up-boundary.md)

## Objetivo

Trazar las reglas canonicas del CRM manual ampliado contra sus fuentes
brownfield, los artefactos abiertos en Fases 1-3, el paquete SDD del slice
y el baseline tecnico real del monorepo.

## Matriz

| ID | Regla canonica | Fuentes brownfield | Artefactos canonicos del slice | Baseline tecnico actual | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- |
| TR-01 | `orders` es el agregado principal del slice | [modules.md](../../docs/architecture/modules.md), [roadmap.md](../../docs/product/roadmap.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md), [Fase 3](../../docs/fase-3-arquitectura/03.11-crm-manual-ampliado.md), [spec-funcional.md](spec-funcional.md) | [orders.service.ts](../../apps/api/src/modules/orders/orders.service.ts), [page.tsx](../../apps/admin/app/pedidos/page.tsx) | revisar que ownership y superficie visible sigan anclados al pedido |
| TR-02 | `ventas` es owner operativo principal y `marketing` acceso secundario | [roles-and-permissions.md](../../docs/product/roles-and-permissions.md), [requirements-impact-plan-2026-03.md](../../docs/product/requirements-impact-plan-2026-03.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md), [spec-funcional.md](spec-funcional.md), [ADR-009](../../docs/fase-3-arquitectura/adr/ADR-009-orders-manual-follow-up-boundary.md) | [admin-access.ts](../../packages/shared/src/domain/admin-access.ts), [orders-workspace.tsx](../../apps/admin/components/orders-workspace.tsx) | revisar acceso protegido y narrativa operativa de la vista |
| TR-03 | solo existe un `order_follow_up_case` por pedido y solo sobre pedidos elegibles | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md), [UC-25](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-25-apertura-y-asignacion-del-caso-manual-de-pedido.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2` | [orders.service.ts](../../apps/api/src/modules/orders/orders.service.ts), [enums.ts](../../packages/shared/src/domain/enums.ts) | probar unicidad del caso y elegibilidad por `crmStage` |
| TR-04 | `assignee`, `nextStep` y `followUpAt` quedan formalizados y disciplinan el caso abierto | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md), [UC-26](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-26-timeline-manual-y-proximo-paso-del-pedido.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2`, `T5` | [types/api.ts](../../packages/shared/src/types/api.ts), [orders-workspace.tsx](../../apps/admin/components/orders-workspace.tsx) | probar obligatoriedad mientras el caso siga abierto |
| TR-05 | el timeline manual usa tipos canonicos e inmutables | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md), [UC-26](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-26-timeline-manual-y-proximo-paso-del-pedido.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T3` | [types/api.ts](../../packages/shared/src/types/api.ts), [orders.service.ts](../../apps/api/src/modules/orders/orders.service.ts) | revisar append-only y tipos `note`, `call`, `whatsapp`, `email`, `status_change` |
| TR-06 | las tareas del caso son opcionales, editables y usan `pending`/`done` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md), [UC-26](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-26-timeline-manual-y-proximo-paso-del-pedido.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T3` | [types/api.ts](../../packages/shared/src/types/api.ts), [orders-workspace.tsx](../../apps/admin/components/orders-workspace.tsx) | probar checklist editable sin volverlo task manager general |
| TR-07 | `Pedidos > Operacion` es la superficie visible principal y la bandeja secundaria vive dentro de `Pedidos` | [Fase 2](../../docs/fase-2-ux-ui/02.08-crm-manual-ampliado-ux-ui.md), [Product Design](product-design.md), [SPDD Frontend](spdd-frontend.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md) | [orders-workspace.tsx](../../apps/admin/components/orders-workspace.tsx), [page.tsx](../../apps/admin/app/pedidos/page.tsx) | smoke del workbench manual y de la bandeja filtrada |
| TR-08 | el cierre y la cancelacion automaticos dependen del lifecycle del pedido | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md), [UC-27](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-27-cierre-y-reapertura-del-caso-manual.md) | [spec-funcional.md](spec-funcional.md), [spec-tareas.md](spec-tareas.md) :: `T5` | [orders.service.ts](../../apps/api/src/modules/orders/orders.service.ts), [enums.ts](../../packages/shared/src/domain/enums.ts) | probar auto-resolved, auto-cancelled y reapertura controlada |
| TR-09 | el slice no abre CRM por cliente ni mensajeria real | [roadmap.md](../../docs/product/roadmap.md), [requirements-impact-plan-2026-03.md](../../docs/product/requirements-impact-plan-2026-03.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md), [Fase 2](../../docs/fase-2-ux-ui/02.08-crm-manual-ampliado-ux-ui.md), [ADR-009](../../docs/fase-3-arquitectura/adr/ADR-009-orders-manual-follow-up-boundary.md) | [orders-workspace.tsx](../../apps/admin/components/orders-workspace.tsx), [orders.service.ts](../../apps/api/src/modules/orders/orders.service.ts) | revisar ausencia de pantalla separada, timeline por cliente o envios reales |

## Dependencias Fuera De Este Ownership

- maestro de clientes e identidad viven en `007`
- seguimiento derivado y `commercialTrace` viven en `008`
- campaigns y automation viven en `006`
- fulfillment y despacho requieren slices propios
- mensajeria CRM real exigiria un bounded context nuevo

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- conectado con las fuentes reales del brownfield de `orders`
- alineado con Fases 1, 2 y 3 ya aprobadas
- conectado con su propio paquete SDD de [spec-funcional.md](spec-funcional.md),
  [spec-tecnica.md](spec-tecnica.md) y [spec-tareas.md](spec-tareas.md)
- listo para evolucionar sin inventar CRM por cliente ni mezclar el
  seguimiento manual del pedido con otros dominios comerciales
