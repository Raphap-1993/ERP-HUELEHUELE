# Spec Tareas - Checkout Payments

Fecha: 2026-05-26.

## Objetivo

Convertir la arquitectura canonica del slice en un backlog tecnico ejecutable sobre el monorepo real.

## Reglas De Ejecucion

- no romper `manual payment` visible en `/checkout`;
- no mover ownership manual fuera de `payments`;
- no mover ownership online operativo fuera de `Pedidos > Operacion`;
- no habilitar auto confirm online fuera de `captured/paid`;
- no introducir mas de un provider online activo.

## Backlog Canonico

### T1. Contratos compartidos y flags del slice

**Resultado esperado**

El repo tiene vocabulario compartido para provider online activo, estado normalizado y flags de runtime.

**Rutas candidatas**

- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/models.ts`
- `docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md`

**Checklist**

- [ ] agregar tipos `OnlinePaymentProvider` y `PaymentGatewayNormalizedStatus`
- [ ] extender `CheckoutActionSummary` para reflejar provider online activo
- [ ] documentar flags `PAYMENT_ONLINE_PROVIDER_ACTIVE` y `PAYMENT_ONLINE_AUTO_CONFIRM_ENABLED`

### T2. Modulo `payment-gateway` en API

**Resultado esperado**

La API puede resolver el provider online activo y crear sesiones de cobro sin quemar Openpay dentro de `commerce` u `orders`.

**Rutas candidatas**

- `apps/api/src/modules/payment-gateway/payment-gateway.module.ts`
- `apps/api/src/modules/payment-gateway/payment-gateway.service.ts`
- `apps/api/src/modules/payment-gateway/payment-gateway.controller.ts`
- `apps/api/src/modules/payment-gateway/providers/openpay/openpay.provider.ts`
- `apps/api/src/modules/payment-gateway/providers/openpay/openpay.mapper.ts`

**Checklist**

- [ ] crear servicio de resolucion del provider activo
- [ ] crear adaptador inicial `openpay`
- [ ] centralizar firma, session creation y normalizacion de estados externos
- [ ] dejar alias legacy a Openpay como capa transitoria, no como frontera final

### T3. Refactor de `commerce` para checkout online canonico

**Resultado esperado**

`commerce` sigue siendo la puerta publica del checkout, pero delega la logica online al gateway.

**Rutas candidatas**

- `apps/api/src/modules/commerce/commerce.controller.ts`
- `apps/api/src/modules/commerce/commerce.service.ts`
- `apps/web/lib/api.ts`
- `apps/web/components/checkout-workspace.tsx`

**Checklist**

- [ ] introducir `POST /store/checkout/online`
- [ ] mantener `POST /store/checkout/openpay` como compatibilidad temporal
- [ ] migrar el frontend a `createOnlineCheckout()`
- [ ] conservar `manual` visible y funcional

### T4. Separacion de ownership en `orders`

**Resultado esperado**

`orders` conserva ownership del pedido, pero diferencia confirmacion online manual vs. confirmacion online por provider.

**Rutas candidatas**

- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/orders/orders.controller.ts`
- `packages/shared/src/domain/order-lifecycle.ts`

**Checklist**

- [ ] extraer `confirmOnlinePaymentFromBackoffice()`
- [ ] agregar `confirmOnlinePaymentFromProvider()`
- [ ] mantener `registerAdminManualPayment()` solo para `paymentMethod=manual`
- [ ] reforzar `commercialTrace` para distinguir ruta operativa y ruta provider

### T5. Persistencia de attempts y eventos del gateway

**Resultado esperado**

El provider online deja rastro persistente idempotente fuera del mapa en memoria.

**Rutas candidatas**

- `prisma/schema.prisma`
- `apps/api/src/modules/payment-gateway/*`
- `apps/api/src/modules/orders/orders.service.ts`

**Checklist**

- [ ] crear `payment_gateway_attempts`
- [ ] crear `payment_gateway_events`
- [ ] definir indices unicos para deduplicar provider events
- [ ] vincular `orderNumber`, `providerReference` y `clientRequestId`

### T6. Ownership UI y copy operativo

**Resultado esperado**

La UI deja sin ambiguedad donde se resuelve cada ruta.

**Rutas candidatas**

- `apps/admin/components/payments-workspace.tsx`
- `apps/admin/components/orders-workspace.tsx`
- `apps/web/components/checkout-workspace.tsx`

**Checklist**

- [ ] `Pagos` comunica que atiende comprobantes manuales
- [ ] `Pedidos > Operacion` mantiene conciliacion online y registro manual directo
- [ ] el checkout diferencia ruta manual y ruta online activa sin exponer multiples providers

### T7. Webhook futuro seguro

**Resultado esperado**

El provider online puede enviar eventos firmados y deduplicados, pero solo confirma en `captured/paid`.

**Rutas candidatas**

- `apps/api/src/modules/payment-gateway/payment-gateway.controller.ts`
- `apps/api/src/modules/payment-gateway/payment-gateway.service.ts`
- `apps/api/src/common/security.ts`
- `apps/api/src/modules/orders/orders.service.ts`

**Checklist**

- [ ] validar firma o secreto de webhook
- [ ] persistir evento antes de procesar
- [ ] ignorar duplicados
- [ ] confirmar pedido solo con `captured/paid` y flag habilitado

### T8. Worker, observabilidad y replay controlado

**Resultado esperado**

Los retries y notificaciones quedan trazables sin convertir al worker en duenio del pedido.

**Rutas candidatas**

- `apps/worker/src/main.ts`
- `apps/api/src/persistence/bullmq.service.ts`
- `packages/shared/src/domain/queue-jobs.ts`

**Checklist**

- [ ] agregar job opcional de replay o reconciliacion diferida del gateway si el equipo lo prioriza
- [ ] registrar eventos operativos nuevos del gateway
- [ ] mantener manual review como cola separada

### T9. Test suite del slice

**Resultado esperado**

La feature queda defendida por pruebas de regresion y ownership.

**Rutas candidatas**

- `apps/api/test/erp-sales-flow.test.ts`
- tests nuevos del gateway si se crean archivos separados

**Checklist**

- [ ] probar idempotencia por `clientRequestId`
- [ ] probar que `authorized` no confirma
- [ ] probar que `captured/paid` si confirma con flag habilitado
- [ ] probar duplicado de `providerEventId`
- [ ] probar bloqueo de registro manual directo sobre pedidos online

## Orden Recomendado

1. `T1`
2. `T2`
3. `T3`
4. `T4`
5. `T5`
6. `T6`
7. `T9`
8. `T7`
9. `T8`

## Definition Of Done Del Slice

- existe una sola frontera online activa y documentada;
- `manual payment` sigue visible y operable;
- `Pagos` no confirma online;
- `Pedidos > Operacion` sigue siendo la vista canonica del pedido;
- la confirmacion automatica futura solo ocurre en `captured/paid`;
- la idempotencia del provider ya no depende solo de memoria de proceso.
