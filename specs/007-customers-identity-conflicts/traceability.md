# Traceability - Customers Identity Conflicts

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Customers Identity Conflicts](../../docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md),
  [Reglas de customers e identity conflicts](../../docs/fase-1-analisis-requerimientos/reglas/customers-e-identity-conflicts.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.06-customers-identity-conflicts-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.09-customers-identity-conflicts.md),
  [ADR-007 Customers Orders Identity Boundary](../../docs/fase-3-arquitectura/adr/ADR-007-customers-orders-identity-boundary.md)

## Objetivo

Trazar las reglas canonicas del slice customers contra sus fuentes
brownfield, los artefactos abiertos en Fases 1-3, el paquete SDD del slice y
el baseline tecnico real del monorepo.

## Matriz

| ID | Regla canonica | Fuentes brownfield | Artefactos canonicos del slice | Baseline tecnico actual | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- |
| TR-01 | `ventas` es el owner operativo principal del slice, con `marketing` como acceso operativo y `admin/super_admin` como override | [roles-and-permissions.md](../../docs/product/roles-and-permissions.md), [requirements-impact-plan-2026-03.md](../../docs/product/requirements-impact-plan-2026-03.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md), [Fase 2](../../docs/fase-2-ux-ui/02.06-customers-identity-conflicts-ux-ui.md), [spec-funcional.md](spec-funcional.md) | [page.tsx](../../apps/admin/app/crm/page.tsx), [admin-access.ts](../../packages/shared/src/domain/admin-access.ts) | revisar acceso protegido a `/crm` y consistencia del ownership en docs |
| TR-02 | `customers` es el agregado principal y `/crm` es la superficie visible del slice | [modules.md](../../docs/architecture/modules.md), [roadmap.md](../../docs/product/roadmap.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md), [Fase 3](../../docs/fase-3-arquitectura/03.09-customers-identity-conflicts.md), [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md) | [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx), [customers.controller.ts](../../apps/api/src/modules/customers/customers.controller.ts) | smoke del workbench `/crm` y contraste UI/API |
| TR-03 | la prioridad de identidad es `documento`, luego `email/telefono`, luego `nombre + direccion` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md), [Reglas](../../docs/fase-1-analisis-requerimientos/reglas/customers-e-identity-conflicts.md) | [spec-funcional.md](spec-funcional.md), [spec-tareas.md](spec-tareas.md) :: `T3`, [ADR-007](../../docs/fase-3-arquitectura/adr/ADR-007-customers-orders-identity-boundary.md) | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) | revisar reglas de resolucion y casos con senales fuertes y debiles |
| TR-04 | los conflictos usan `open`, `resolved`, `ignored` y `merged`, y la resolucion admite `assign_existing`, `merge` e `ignore` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md), [UC-20](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-20-resolucion-de-conflictos-de-identidad.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) | [types/api.ts](../../packages/shared/src/types/api.ts), [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) :: `resolveCustomerConflict()` | probar las tres acciones permitidas y los estados finales del conflicto |
| TR-05 | el merge deja un destino activo, una fuente fusionada y bloquea documentos canonicos distintos | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md), [UC-21](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-21-fusion-operativa-de-clientes.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T4` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) :: `mergeCustomersInternal()` | probar merge valido y rechazo por documentos canonicos distintos |
| TR-06 | clientes sinteticos o regularizados desde pedidos forman parte valida del runtime | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md), [ADR-007](../../docs/fase-3-arquitectura/adr/ADR-007-customers-orders-identity-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T6` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) :: `resolveCustomerFromOrderSnapshot()`, `buildSyntheticCustomerEmail()` | revisar regularizacion desde pedidos y persistencia de cliente sintetico |
| TR-07 | el detalle del cliente incluye pedidos recientes solo como contexto operativo | [Fase 2](../../docs/fase-2-ux-ui/02.06-customers-identity-conflicts-ux-ui.md), [Product Design](product-design.md), [SPDD Frontend](spdd-frontend.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md) | [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) | revisar que el detalle muestre pedidos recientes sin exponer `crmStage` |
| TR-08 | `orders` conserva `customerId`, `customerConflictId`, `crmStage` y `commercialTrace` sin ceder ownership del perfil vivo | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md), [Fase 3](../../docs/fase-3-arquitectura/03.09-customers-identity-conflicts.md), [ADR-007](../../docs/fase-3-arquitectura/adr/ADR-007-customers-orders-identity-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [traceability.md](traceability.md) | [types/api.ts](../../packages/shared/src/types/api.ts), [orders.service.ts](../../apps/api/src/modules/orders/orders.service.ts) :: `applyCustomerResolution()`, `reassignMergedCustomer()` | contrastar contratos de `orders` con docs de ownership |
| TR-09 | `deleteCustomer()` existe como capacidad excepcional y mantiene bloqueos duros | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md), [Reglas](../../docs/fase-1-analisis-requerimientos/reglas/customers-e-identity-conflicts.md) | [spec-funcional.md](spec-funcional.md), [spec-tareas.md](spec-tareas.md) :: `T7`, [Fase 2](../../docs/fase-2-ux-ui/02.06-customers-identity-conflicts-ux-ui.md) | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) :: `deleteCustomer()` | probar bloqueos por merge, rol compartido y pedidos operativos |
| TR-10 | el slice no abre CRM ampliado, pipeline comercial ni seguimiento comercial del pedido | [roadmap.md](../../docs/product/roadmap.md), [requirements-impact-plan-2026-03.md](../../docs/product/requirements-impact-plan-2026-03.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md), [Fase 2](../../docs/fase-2-ux-ui/02.06-customers-identity-conflicts-ux-ui.md), [ADR-007](../../docs/fase-3-arquitectura/adr/ADR-007-customers-orders-identity-boundary.md) | [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx), [types/api.ts](../../packages/shared/src/types/api.ts) | revisar ausencia de `crmStage`, timeline comercial y workflows comerciales en UI y docs |

## Dependencias Fuera De Este Ownership

- `crmStage` y seguimiento comercial de pedidos requieren su propio slice
- campaigns requieren el ownership ya documentado en `006`
- wholesale requiere el ownership ya documentado en `003`
- loyalty requiere el ownership ya documentado en `004`
- un CRM ampliado exigiria un bounded context nuevo y ADR propia

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- conectado con las fuentes reales del brownfield de customers
- alineado con Fases 1, 2 y 3 ya aprobadas
- conectado con su propio paquete SDD de [spec-funcional.md](spec-funcional.md),
  [spec-tecnica.md](spec-tecnica.md) y [spec-tareas.md](spec-tareas.md)
- listo para evolucionar sin inventar CRM ampliado ni mezclar identidad viva
  con historia comercial del pedido
