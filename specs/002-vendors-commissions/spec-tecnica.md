# Spec Tecnica - Vendors Commissions

Fecha: 2026-05-26.

## Objetivo Tecnico

Formalizar y endurecer las fronteras tecnicas ya vivas del canal seller-first
sin abrir un rediseno del runtime. El slice debe preservar la separacion entre
`vendors`, `orders`, `commissions`, `payments` y `worker`, agregando solo las
guardas minimas necesarias para que la correccion de atribucion sea segura y
trazable.

## Baseline Real Del Repo

### Vendors y onboarding

- `apps/api/src/modules/vendors/vendors.service.ts`
  - expone `submitApplication()`, `screenApplication()`, `approveApplication()`
  - crea alta manual con `createManualVendor()`
  - permite actualizar vendedor con `updateVendor()`
  - ya impide rotar el codigo maestro si el vendedor tiene pedidos, ventas o comisiones historicas
- la aprobacion exige `resolvedCollaborationType` y puede recibir `preferredCode`

### Acceso comercial

- `apps/api/src/modules/auth/auth.service.ts`
  - gestiona `createCommercialAccess()`, `updateCommercialAccess()`, `setCommercialAccessStatus()`, `resetCommercialAccessPassword()`
  - exige `vendorCode` para accesos `seller`
- `apps/api/src/modules/auth/auth.controller.ts`
  - expone `admin/commercial-accesses`

### Orders y atribucion

- `apps/api/src/modules/orders/orders.controller.ts`
  - expone `POST /admin/orders/:orderNumber/vendor`
- `apps/api/src/modules/orders/orders.service.ts`
  - persiste `vendorCode` en el pedido
  - resuelve vendedor activo con `resolveVendorTrace()`
  - corrige vendedor con `assignOrderVendor()`
  - entrega lectura por vendedor con `listOrdersByVendorCode()`
- `apps/admin/components/orders-workspace.tsx`
  - hoy permite cambiar o vaciar el vendedor desde `Pedidos > Operacion`

### Commissions y payouts

- `apps/api/src/modules/commissions/commissions.service.ts`
  - deriva comisiones desde pedidos con `syncFromOrders()` y `syncOrderCommission()`
  - lista comisiones y payouts por vendedor
  - prepara liquidaciones con `queueCreatePayout()` y `createPayout()`
  - liquida con `queueSettlePayout()` y `settlePayout()`
  - reconcilia payout items y snapshots de vendedor
- `apps/admin/components/commissions-workspace.tsx`
  - refleja reglas, comisiones y liquidaciones

### Payments

- `apps/api/src/modules/payments/payments.service.ts`
  - solo registra pagos manuales y resuelve solicitudes manuales
  - despues dispara `commissionsService.syncFromOrders(...)`
- no expone APIs de correccion de vendedor ni ownership de payouts del seller channel

### Seller panel

- `apps/api/src/modules/core/seller-panel.controller.ts`
  - expone `GET /seller/panel/overview`
- `apps/api/src/modules/core/core.service.ts`
  - arma `getSellerPanelOverview()`
  - consume `listOrdersByVendorCode()`, `listCommissionsByVendorCode()` y `listPayoutsByVendorCode()`
- `apps/web/components/seller-panel-workspace.tsx`
  - muestra metricas, comisiones y payouts

### Async y worker

- `apps/api/src/persistence/bullmq.service.ts`
  - encola payouts y settlement
- `apps/worker/src/main.ts`
  - ejecuta procesos asincronos

## Frontera Tecnica Objetivo

### 1. `vendors` sigue siendo el master del vendedor

- dueno de postulacion, aprobacion, perfil, codigo maestro y estado operativo
- `preferredCode` y `vendorCode` siguen siendo responsabilidad de `vendors`
- el alta o suspension de acceso comercial sigue siendo precondicion externa para `/panel-vendedor`

### 2. `auth` sigue siendo la puerta de acceso comercial

- `/cuenta` y `admin/commercial-accesses` permanecen como frontera de credenciales
- el acceso vendedor exige `vendorCode` asociado
- el slice no introduce auto-registro comercial ni login alterno

### 3. `orders` sigue siendo la verdad del `vendorCode` efectivo

- la atribucion efectiva vive en el pedido
- la correccion post-pedido solo entra por `POST /admin/orders/:orderNumber/vendor`
- la UI canonica de la accion sigue siendo `Pedidos > Operacion`
- la correccion debe dejar actor, motivo, before/after y estado de lock evaluado

### 4. `commissions` sigue siendo modulo derivado

- consume el pedido atribuido y la regla aplicable
- decide estado de comision, elegibilidad, payout y settlement
- recompone la consecuencia financiera despues de una correccion valida
- no recibe endpoint canonico para reescribir la atribucion primaria

### 5. `payments` permanece fuera de la atribucion

- manual review y registro manual siguen en `payments`
- `payments` puede disparar syncs derivados, pero no corrige `vendorCode`
- no debe aparecer una ruta alternativa de regularizacion comercial en este modulo

### 6. `worker` permanece solo asincrono

- prepara y liquida payouts
- ejecuta reintentos o colas operativas
- no decide atribucion, lock ni reglas de comision

## Ajustes Minimos Recomendados

Este slice no abre un modulo nuevo. Solo recomienda endurecer contratos
existentes.

### Shared contracts

Rutas candidatas:

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/models.ts`
- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/domain/order-lifecycle.ts`

Ajustes recomendados:

- extender `AdminOrderVendorAssignmentInput` con `reason`
- exponer en el resumen/detalle del pedido un indicador de lock de atribucion y su motivo
- conservar los estados ya vigentes de comision y payout como vocabulario fuente

### API y UI admin

Rutas candidatas:

- `apps/api/src/modules/orders/orders.controller.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/admin/components/orders-workspace.tsx`

Ajustes recomendados:

- mantener `POST /admin/orders/:orderNumber/vendor` como endpoint canonico
- bloquear desde API y UI la correccion si el pedido ya cruzo lock financiero
- retirar la semantica de edicion libre cuando ya hubo comision materializada

### Recomposicion de comisiones

Rutas candidatas:

- `apps/api/src/modules/commissions/commissions.service.ts`
- `apps/api/src/modules/orders/orders.service.ts`

Ajustes recomendados:

- disparar recomposicion explicita tras una correccion valida antes del lock
- asegurar que la recomposicion afecte comision, payout draft y snapshots derivados
- evitar que una remocion o cambio de vendedor deje residuos historicos inconsistentes

## Reglas Tecnicas Del Slice

1. `orders` es el dueno del `vendorCode` efectivo del pedido.
2. `vendors` es el dueno del codigo maestro y del estado del vendedor.
3. la correccion post-pedido solo es valida hacia vendedores activos y resolubles.
4. no se permite `A -> none` cuando ya existe comision materializada.
5. el lock financiero se considera cruzado si la comision esta en `payable`, `scheduled_for_payout` o `paid`.
6. tambien hay lock si existe `payoutId` no cancelado o job de payout pendiente/en ejecucion.
7. `commissions` recompone consecuencia financiera; no corrige atribucion primaria.
8. `payments` no debe ofrecer ni ejecutar rutas de cambio de vendedor.
9. `worker` solo ejecuta colas asincronas de payout o settlement.
10. `/panel-vendedor` consume verdad derivada desde `orders` y `commissions`.

## Seguridad Y Observabilidad

Eventos y auditorias ya visibles o exigibles para este slice:

- `vendors.application.submitted`
- `vendors.application.approved`
- `commercial_access.created`
- `commercial_access.linked`
- `orders.vendor.updated`
- `commissions.sync_from_orders`
- `commissions.payout.created`
- `commissions.payout.settled`

Guardas adicionales recomendadas:

- auditar motivo de correccion de vendedor en pedido
- registrar evento explicito cuando una correccion queda bloqueada por lock financiero
- registrar recomposicion de comision disparada por correccion valida

## Estrategia De Implementacion

### Release 1. Guardas de atribucion y lock

- endurecer contrato de correccion en `orders`
- evaluar lock financiero antes de persistir cambio
- bloquear `A -> none` cuando ya hay comision materializada

### Release 2. Recomposicion financiera controlada

- hacer que la correccion valida dispare recomposicion determinista en `commissions`
- recalcular snapshots y relaciones de payout solo dentro de la ventana segura
- preservar seller panel y reportes como lectura derivada consistente

### Release 3. QA de fronteras y superficies

- reforzar UI de `Pedidos > Operacion`
- verificar que `payments` siga fuera del ownership
- verificar que seller panel y `/comisiones` reflejen la misma verdad derivada

## Estrategia De Pruebas

### API

Rutas candidatas:

- `apps/api/test/erp-sales-flow.test.ts`
- `apps/api/test/commercial-accesses.test.ts`

Cobertura esperada:

- postulacion aprobada con `preferredCode` valido
- acceso comercial seller exige `vendorCode`
- correccion `A -> B` permitida antes del lock
- correccion bloqueada en `payable`, `scheduled_for_payout` y `paid`
- bloqueo de `A -> none` con comision materializada
- `payments` no corrige atribucion ni expone otra puerta de cambio

### Admin y seller panel

- validar que `Pedidos > Operacion` siga siendo la unica superficie de correccion
- validar que `/comisiones` muestre consecuencia financiera y no la accion primaria de atribucion
- validar que `/panel-vendedor` refleje el vendedor correcto despues de una recomposicion valida

## Riesgos Tecnicos Abiertos

- `assignOrderVendor()` hoy permite vaciar vendedor y no evalua lock financiero ni motivo obligatorio
- `syncOrderCommission()` retorna temprano cuando el pedido queda sin `vendorCode`, lo que puede dejar comisiones historicas sin recomponer
- la correccion del pedido y la recomposicion de comisiones no estan acopladas de forma atomica en el runtime actual
- la suite existente cubre pagos y accesos, pero no defiende con suficiente fuerza la frontera de correccion de vendedor
