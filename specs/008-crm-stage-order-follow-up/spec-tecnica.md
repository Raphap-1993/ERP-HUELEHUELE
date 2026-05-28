# Spec Tecnica - CRM Stage Order Follow-Up

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

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

## Objetivo Tecnico

Formalizar y endurecer las fronteras tecnicas del slice brownfield del
seguimiento derivado del pedido sin convertirlo en CRM manual. El slice debe
preservar la separacion entre `orders`, `payments`, `Pedidos > Operacion` y
`notifications`, dejando explicito que `orders` es owner de `crmStage` y
`commercialTrace`, que las rutas de confirmacion comercial nacen desde el
pedido y que los side effects tecnicos permanecen secundarios.

## Baseline Real Del Repo

### Contratos compartidos y enums

- `packages/shared/src/types/api.ts`
  - define `OrderCommercialTraceRoute` con `manual_direct`,
    `manual_request`, `openpay_backoffice` y `openpay_provider`
  - define `OrderCommercialTraceStatus` con `pending`, `confirmed` y
    `rejected`
  - expone `OrderCommercialTraceSummary`, `AdminOrderSummary` y
    `AdminOrderDetail` con `crmStage` y `commercialTrace`
- `packages/shared/src/domain/enums.ts`
  - define `CrmStage` con `ReadyForFollowUp`, `FollowUp` y `Closed`
- `packages/shared/src/domain/admin-access.ts`
  - fija `adminAccessRoles.orders` para la superficie `/pedidos`

### API y modulo `orders`

- `apps/api/src/modules/orders/orders.service.ts`
  - `resolveInitialCrmStage()` fija la etapa inicial para ventas ya pagadas o
    confirmadas
  - `resolveOperationalCrmStage()` deriva `crmStage` segun `orderStatus` y
    `paymentStatus`
  - `resolvePendingCommercialRoute()` decide la ruta pendiente visible
  - `resolveConfirmedCommercialRoute()` diferencia `openpay_provider` de
    `openpay_backoffice`
  - `resolveCommercialTrace()` consolida la traza comercial del pedido
  - `syncCommercialTrace()` sincroniza la traza viva sobre el pedido
  - `recordManualPayment()` fija `manual_direct / confirmed`
  - `confirmOnlinePayment()` fija `openpay_backoffice / confirmed`
  - `approveManualRequest()` y `rejectManualRequest()` gobiernan
    `manual_request`

### Workbench admin y cliente HTTP

- `apps/admin/app/pedidos/page.tsx`
  - publica la superficie visible `/pedidos` con `AdminAuthGate`
  - usa `allowedRoles={adminAccessRoles.orders}`
- `apps/admin/components/orders-workspace.tsx`
  - expone `SummaryTile` de `Etapa CRM` y `Seguimiento`
  - expone `OperationGuideCard`
  - expone `CommercialTraceCard`
  - conecta acciones de confirmacion, aprobacion y rechazo con el detalle del
    pedido
- `apps/admin/lib/api.ts`
  - transporta el detalle del pedido con `crmStage` y `commercialTrace`

### Regression actual visible

- `apps/api/test/erp-sales-flow.test.ts`
  - cubre `manual_direct / confirmed`
  - cubre `openpay_backoffice / confirmed`
  - cubre `manual_request / pending`
  - cubre `manual_request / confirmed`
  - deja al menos una brecha documental util para endurecer escenarios de
    `openpay_provider`, rechazo y cierre `closed`

## Frontera Tecnica Objetivo

### 1. `orders` sigue siendo el master del seguimiento derivado

- concentra `crmStage`, `commercialTrace`, `confirmedAt` e historia de estado
- decide cuando una venta queda lista para seguimiento, en seguimiento o
  cerrada
- no delega esa decision a `notifications` ni a una UI manual

### 2. `Pedidos > Operacion` sigue siendo la superficie visible del slice

- muestra la lectura operativa del pedido ya derivada por el backend
- no crea un segundo write model de CRM
- no se convierte en dashboard global ni en timeline comercial amplio

### 3. `payments` y `notifications` siguen siendo fronteras acotadas

- `payments` dispara confirmacion o rechazo comercial
- `notifications` solo registra side effects tecnicos
- ninguno de los dos absorbe ownership del seguimiento posterior

## Boundary De Etapa, Traza Y Superficie

El boundary tecnico del slice queda dividido en tres capas complementarias.

### Etapa CRM derivada

- vive en `orders`
- la calculan `resolveInitialCrmStage()` y `resolveOperationalCrmStage()`
- resume el punto operativo/comercial del pedido

### Traza comercial

- vive en `orders`
- la calculan `resolvePendingCommercialRoute()`,
  `resolveConfirmedCommercialRoute()` y `resolveCommercialTrace()`
- conserva ruta, estado, actor, referencia, nota y evidencia cuando aplica

### Superficie visible

- vive en `orders-workspace.tsx`
- lee `crmStage` y `commercialTrace` como contratos ya resueltos
- no reinterpreta ownership ni inventa una maquina de estados nueva

## Ajustes Minimos Recomendados

Este slice no abre un modulo nuevo. Solo cierra contratos y fronteras vivas
del brownfield.

### Shared contracts

Rutas candidatas:

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/domain/admin-access.ts`

Ajustes recomendados:

- sostener `OrderCommercialTraceRoute` y `OrderCommercialTraceStatus`
- mantener `CrmStage` como enum canonico del slice
- preservar `AdminOrderSummary` y `AdminOrderDetail` con `crmStage` y
  `commercialTrace`
- mantener `adminAccessRoles.orders` alineado con `ventas` y overrides

### API y modulo `orders`

Rutas candidatas:

- `apps/api/src/modules/orders/orders.service.ts`

Ajustes recomendados:

- sostener `resolveInitialCrmStage()` y `resolveOperationalCrmStage()`
- sostener `resolveCommercialTrace()` y `syncCommercialTrace()`
- mantener las rutas `manual_direct`, `manual_request`,
  `openpay_backoffice` y `openpay_provider`
- sostener el cierre negativo que limpia `crmStage` y conserva la traza
  rechazada
- no introducir workflow manual editable de `crmStage`

### Admin y cliente HTTP

Rutas candidatas:

- `apps/admin/app/pedidos/page.tsx`
- `apps/admin/components/orders-workspace.tsx`
- `apps/admin/lib/api.ts`

Ajustes recomendados:

- sostener `SummaryTile` de `Etapa CRM` y `Seguimiento`
- sostener `OperationGuideCard`
- sostener `CommercialTraceCard`
- no prometer timeline CRM, tasks o dashboard global desde la UI

## Reglas Tecnicas Del Slice

1. `orders` sigue siendo el agregado principal del slice.
2. `crmStage` sigue siendo derivado y no editable manualmente.
3. `crmStage` sigue limitado a `ready_for_followup`, `followup` y `closed`.
4. `commercialTrace` sigue siendo el puente comercial de confirmacion.
5. `commercialTrace` sigue soportando `pending`, `confirmed` y `rejected`.
6. `manual_direct`, `manual_request`, `openpay_backoffice` y
   `openpay_provider` siguen siendo las rutas canonicas del runtime.
7. `Pedidos > Operacion` sigue siendo la superficie visible principal.
8. `notifications` sigue siendo side effect tecnico secundario.
9. El cierre negativo limpia `crmStage` y conserva la evidencia en la traza.
10. El slice no introduce CRM manual, customers, fulfillment ni dispatch.

## Riesgos Tecnicos Y Mitigaciones

| Riesgo | Mitigacion canonica |
| --- | --- |
| convertir `crmStage` en workflow editable | mantener derivacion solo en `orders.service.ts` |
| usar `commercialTrace` como timeline CRM | sostenerlo como resumen de ruta e hito |
| perder evidencia de rechazo al limpiar etapa | conservar `commercialTrace.rejected` en el pedido |
| negar la ruta `openpay_provider` aunque el runtime la derive | documentar y probar la ruta explicitamente |
| sobrecargar la UI con ownership de fulfillment o dispatch | fijar la frontera visible del slice en `Operacion` |

## Definition Of Done Tecnica Del Slice

- el repo expresa con claridad que `orders` gobierna `crmStage` y
  `commercialTrace`
- `Pedidos > Operacion` queda defendido como superficie principal del slice
- las rutas y estados canonicos del puente comercial quedan explicitados
- el cierre negativo queda documentado con el mismo nivel de precision que el
  cierre positivo
- la frontera con `payments` y `notifications` queda documentada sin inflar
  el dominio
