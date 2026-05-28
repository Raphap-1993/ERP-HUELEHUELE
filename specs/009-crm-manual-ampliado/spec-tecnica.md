# Spec Tecnica - CRM Manual Ampliado

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

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

## Objetivo Tecnico

Formalizar y endurecer las fronteras tecnicas del slice brownfield del CRM
manual ampliado sobre pedidos. El slice debe preservar la separacion entre
seguimiento derivado y seguimiento manual, dejando explicito que `orders` es
owner de `order_follow_up_case`, que el workbench manual sigue embebido en
`Pedidos > Operacion` y que customers, campaigns, notifications, fulfillment
o dashboards no absorben ownership del dominio.

## Baseline Real Del Repo

### Contratos compartidos y enums

- `packages/shared/src/types/api.ts`
  - hoy ya expresa `AdminOrderSummary` y `AdminOrderDetail` con `crmStage` y
    `commercialTrace`
  - es la base natural para agregar el contrato compartido del caso manual
- `packages/shared/src/domain/enums.ts`
  - ya define `CrmStage`
  - puede albergar enums del caso manual si el slice llega a implementarse
- `packages/shared/src/domain/admin-access.ts`
  - fija `adminAccessRoles.orders` y `adminAccessRoles.crm`

### API y modulo `orders`

- `apps/api/src/modules/orders/orders.service.ts`
  - ya gobierna `crmStage` y `commercialTrace`
  - ya define la elegibilidad comercial del pedido
  - es la frontera natural para un `order_follow_up_case`

### Workbench admin y cliente HTTP

- `apps/admin/app/pedidos/page.tsx`
  - publica la superficie visible `/pedidos`
- `apps/admin/components/orders-workspace.tsx`
  - ya expone `SummaryTile`, `OperationGuideCard` y `CommercialTraceCard`
  - contiene el hueco natural para montar el bloque visible del caso manual
- `apps/admin/lib/api.ts`
  - transporta el detalle del pedido y seria la puerta natural del caso

## Frontera Tecnica Objetivo

### 1. `orders` sigue siendo el master del seguimiento del pedido

- concentra `crmStage`, `commercialTrace` y el futuro `order_follow_up_case`
- decide si el pedido es elegible para abrir o reabrir el caso
- no delega esa decision a `/crm` ni a un modulo de campaigns

### 2. `Pedidos > Operacion` sigue siendo la superficie visible del slice

- muestra el detalle del pedido ya resuelto por backend
- no crea un segundo write model comercial
- no se convierte en CRM separado ni en dashboard global

### 3. `customers`, campaigns y notifications siguen siendo fronteras acotadas

- `customers` no gobierna el caso manual
- campaigns no abre ni cierra casos
- notifications no envia ni gobierna actividades del timeline

## Boundary De Caso, Timeline Y Bandeja

El boundary tecnico del slice queda dividido en tres capas complementarias.

### Caso manual

- vive en `orders`
- pertenece a un pedido
- soporta `status`, `assignee`, `nextStep` y `followUpAt`
- responde al lifecycle del pedido

### Timeline manual

- vive dentro del caso
- soporta `note`, `call`, `whatsapp`, `email` y `status_change`
- registra evidencia opcional
- es append-only en terminos funcionales

### Bandeja secundaria

- se deriva del mismo dominio `orders`
- lista casos `open` y `waiting_customer` por defecto
- no necesita un modulo o bounded context separado

## Ajustes Minimos Recomendados

Este slice no exige abrir un servicio nuevo. Cierra contratos y fronteras
vivas del brownfield.

### Shared contracts

Rutas candidatas:

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/domain/admin-access.ts`

Ajustes recomendados:

- introducir contrato compartido de `order_follow_up_case`
- introducir enums de estado del caso, tipos de timeline y estado de tareas
- preservar `adminAccessRoles.orders`
- no mover el slice a `adminAccessRoles.crm` como owner primario

### API y modulo `orders`

Rutas candidatas:

- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/orders/orders.controller.ts`

Ajustes recomendados:

- sostener la elegibilidad via `crmStage`
- formalizar creacion del caso manual dentro de `orders`
- formalizar cierre automatico y reapertura
- sostener timeline append-only
- sostener tareas opcionales editables
- no abrir ownership en `customers`, campaigns o notifications

### Admin y cliente HTTP

Rutas candidatas:

- `apps/admin/app/pedidos/page.tsx`
- `apps/admin/components/orders-workspace.tsx`
- `apps/admin/lib/api.ts`

Ajustes recomendados:

- montar el bloque visible del caso manual dentro de `Operacion`
- montar bandeja filtrada dentro de `Pedidos`
- no abrir una app aparte de CRM manual
- no prometer mensajeria real desde la UI

## Reglas Tecnicas Del Slice

1. `orders` sigue siendo el agregado principal del slice.
2. solo existe un `order_follow_up_case` por pedido.
3. el caso solo se abre o reabre si el pedido sigue elegible por
   `crmStage`.
4. `nextStep` y `followUpAt` son obligatorios en estados abiertos.
5. las entradas del timeline son inmutables.
6. las tareas son opcionales y editables.
7. `Delivered` y `Completed` resuelven el caso automaticamente.
8. una caida comercial del pedido cancela el caso automaticamente.
9. `Pedidos > Operacion` sigue siendo la superficie principal.
10. el slice no introduce CRM por cliente, campaigns ni mensajeria real.

## Riesgos Tecnicos Y Mitigaciones

| Riesgo | Mitigacion canonica |
| --- | --- |
| mover el caso manual a `customers` | mantener el agregado en `orders` |
| permitir varios casos por pedido | sostener contrato de unicidad por pedido |
| degradar el caso a notas sueltas | exigir `nextStep` y `followUpAt` en estados abiertos |
| permitir historia mutable del seguimiento | mantener timeline append-only |
| abrir una UI paralela de CRM | fijar `Pedidos > Operacion` como superficie principal |
| mezclar este slice con campaigns o notifications | mantenerlos fuera del ownership principal |

## Definition Of Done Tecnica Del Slice

- el repo expresa con claridad que `orders` gobierna `order_follow_up_case`
- el contrato compartido del caso manual queda identificable
- `Pedidos > Operacion` queda defendido como superficie principal del slice
- timeline, tareas y disciplina minima del caso quedan explicitados
- el cierre y la reapertura quedan ligados al lifecycle del pedido
- el slice deja explicito que customers, campaigns y notifications no son
  owners funcionales del dominio
