# Traceability - CRM Transversal Por Cliente

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - CRM Transversal Por Cliente](../../docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md),
  [Reglas de crm transversal por cliente](../../docs/fase-1-analisis-requerimientos/reglas/crm-transversal-por-cliente.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.09-crm-transversal-por-cliente-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.12-crm-transversal-por-cliente.md),
  [ADR-010 Customers CRM Transversal Boundary](../../docs/fase-3-arquitectura/adr/ADR-010-customers-crm-transversal-boundary.md)

## Objetivo

Trazar las reglas canonicas del CRM transversal por cliente contra sus
fuentes brownfield, los artefactos abiertos en Fases 1-3, el paquete SDD
del slice y el baseline tecnico real del monorepo.

## Matriz

| ID | Regla canonica | Fuentes brownfield | Artefactos canonicos del slice | Baseline tecnico actual | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- |
| TR-01 | `customers` es el dominio ancla del slice | [modules.md](../../docs/architecture/modules.md), [roadmap.md](../../docs/product/roadmap.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md), [Fase 3](../../docs/fase-3-arquitectura/03.12-crm-transversal-por-cliente.md), [spec-funcional.md](spec-funcional.md) | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [page.tsx](../../apps/admin/app/crm/page.tsx) | revisar que ownership y superficie visible sigan anclados al cliente |
| TR-02 | `ventas` es owner operativo principal y `marketing` acceso secundario | [roles-and-permissions.md](../../docs/product/roles-and-permissions.md), [requirements-impact-plan-2026-03.md](../../docs/product/requirements-impact-plan-2026-03.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md), [spec-funcional.md](spec-funcional.md), [ADR-010](../../docs/fase-3-arquitectura/adr/ADR-010-customers-crm-transversal-boundary.md) | [admin-access.ts](../../packages/shared/src/domain/admin-access.ts), [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) | revisar acceso protegido y narrativa operativa de la vista |
| TR-03 | solo existe un `customer_relationship_case` por cliente canonico | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md), [UC-28](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-28-apertura-y-clasificacion-del-caso-transversal-del-cliente.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [types/api.ts](../../packages/shared/src/types/api.ts) | probar unicidad del caso por cliente canonico |
| TR-04 | `commercialOwner`, `assignee`, `classification`, `origin`, `nextStep` y `followUpAt` quedan formalizados | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md), [UC-29](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-29-timeline-y-workbench-transversal-del-cliente.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2`, `T5` | [types/api.ts](../../packages/shared/src/types/api.ts), [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) | probar obligatoriedad mientras el caso siga activo |
| TR-05 | el timeline transversal usa tipos canonicos e inmutables | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md), [UC-29](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-29-timeline-y-workbench-transversal-del-cliente.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T3` | [types/api.ts](../../packages/shared/src/types/api.ts), [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) | revisar append-only y tipos `note`, `call`, `whatsapp`, `email`, `status_change`, `order_reference`, `follow_up_reference` |
| TR-06 | las referencias a pedidos y a `009` son automaticas y read-only | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md), [UC-29](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-29-timeline-y-workbench-transversal-del-cliente.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T3` | [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx), [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [orders.service.ts](../../apps/api/src/modules/orders/orders.service.ts) | probar que no se duplican como timeline manual editable |
| TR-07 | las tareas del caso son opcionales, editables y usan `pending`/`done` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md), [UC-29](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-29-timeline-y-workbench-transversal-del-cliente.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T3` | [types/api.ts](../../packages/shared/src/types/api.ts), [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) | probar checklist editable sin volverlo task manager general |
| TR-08 | `/crm` es la superficie visible principal y la bandeja secundaria vive dentro del modulo | [Fase 2](../../docs/fase-2-ux-ui/02.09-crm-transversal-por-cliente-ux-ui.md), [Product Design](product-design.md), [SPDD Frontend](spdd-frontend.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md) | [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx), [page.tsx](../../apps/admin/app/crm/page.tsx) | smoke del resumen comercial y de la bandeja filtrada |
| TR-09 | el merge de `007` reancla el caso al cliente canonico destino | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md), [UC-30](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-30-merge-cierre-y-reapertura-del-caso-transversal-del-cliente.md) | [spec-funcional.md](spec-funcional.md), [spec-tareas.md](spec-tareas.md) :: `T5` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [ADR-007](../../docs/fase-3-arquitectura/adr/ADR-007-customers-orders-identity-boundary.md) | probar reanclaje del caso tras merge y ausencia de duplicidad |
| TR-10 | el slice no abre campaigns, scoring ni mensajeria real | [roadmap.md](../../docs/product/roadmap.md), [requirements-impact-plan-2026-03.md](../../docs/product/requirements-impact-plan-2026-03.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md), [Fase 2](../../docs/fase-2-ux-ui/02.09-crm-transversal-por-cliente-ux-ui.md), [ADR-010](../../docs/fase-3-arquitectura/adr/ADR-010-customers-crm-transversal-boundary.md) | [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx), [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) | revisar ausencia de pantalla separada, scoring o envios reales |

## Dependencias Fuera De Este Ownership

- maestro de clientes e identidad siguen en `007`
- seguimiento manual por pedido sigue en `009`
- seguimiento derivado y `commercialTrace` siguen en `008`
- campaigns y automation viven en `006`
- scoring o pipeline amplio exigirian slices nuevos

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- conectado con las fuentes reales del brownfield de `customers`
- alineado con Fases 1, 2 y 3 ya aprobadas
- conectado con su propio paquete SDD de [spec-funcional.md](spec-funcional.md),
  [spec-tecnica.md](spec-tecnica.md) y [spec-tareas.md](spec-tareas.md)
- listo para evolucionar sin contaminar `007`, sin absorber `009` y sin
  venderse como pipeline comercial amplio
