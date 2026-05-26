# Spec Tecnica - Checkout Payments

Fecha: 2026-05-26.

## Objetivo Tecnico

Implementar una frontera canonica para pago online idempotente sin romper el flujo brownfield actual de checkout, manteniendo `payments` enfocado en comprobantes manuales y `orders` como dueno del estado comercial.

## Baseline Real Del Repo

### Storefront

- `apps/web/components/checkout-workspace.tsx`
  - arma el request de checkout;
  - hoy decide entre `createOpenpayCheckout()` y `createManualCheckout()`;
  - ya maneja `clientRequestId`.
- `apps/web/lib/api.ts`
  - expone `/store/checkout/openpay`, `/store/checkout/manual`, `/store/checkout/evidence`.

### API store y dominio

- `apps/api/src/modules/commerce/commerce.controller.ts`
  - publica `quote`, `document-lookup`, `manual`, `openpay`, `evidence`.
- `apps/api/src/modules/commerce/commerce.service.ts`
  - hoy crea el checkout Openpay hardcodeado y el checkout manual.
- `apps/api/src/modules/orders/orders.service.ts`
  - crea pedidos;
  - aplica idempotencia de checkout;
  - reserva stock;
  - registra pago manual directo;
  - confirma pago online desde backoffice;
  - infiere `commercialTrace`.
- `apps/api/src/modules/payments/payments.service.ts`
  - lista pagos;
  - lista solicitudes manuales;
  - aprueba/rechaza comprobantes manuales con cola opcional.

### Backoffice

- `apps/admin/components/payments-workspace.tsx`
  - ya comunica que Openpay pendiente se concilia desde `Pedidos > Operacion`.
- `apps/admin/components/orders-workspace.tsx`
  - ya expone `confirmOnlinePayment()` y `registerAdminManualPayment()`.

### Tests existentes

- `apps/api/test/erp-sales-flow.test.ts`
  - cubre idempotencia de checkout;
  - cubre checkout manual y online;
  - cubre reservas de stock.

## Arquitectura Tecnica Objetivo

### 1. Modulo `payment-gateway`

Se crea un modulo nuevo dentro de la API:

```text
apps/api/src/modules/payment-gateway/
  payment-gateway.module.ts
  payment-gateway.service.ts
  payment-gateway.controller.ts
  payment-gateway.types.ts
  providers/
    openpay/
      openpay.provider.ts
      openpay.mapper.ts
```

Responsabilidades:

- resolver `PAYMENT_ONLINE_PROVIDER_ACTIVE`;
- crear una sesion/attempt online;
- validar firma de webhook;
- normalizar payloads externos;
- persistir intentos y eventos para idempotencia;
- emitir comandos internos a `orders`.

### 2. Refactor minimo de `commerce`

`commerce` debe seguir siendo la puerta publica del checkout, pero deja de conocer Openpay a nivel de negocio:

- mantiene `quote`, `document-lookup`, `manual`, `evidence`;
- introduce `createOnlineCheckout()` como camino preferido;
- puede mantener `createOpenpayCheckout()` solo como alias legacy mientras el frontend migra.

### 3. `orders` como dueno de la verdad comercial

`orders.service.ts` debe separar tres entry points:

- `createCheckoutOrder()` para crear el pedido y reservar stock;
- `confirmOnlinePaymentFromBackoffice()` para la conciliacion humana desde `Pedidos > Operacion`;
- `confirmOnlinePaymentFromProvider()` para eventos ya normalizados y autorizados por el gateway.

`orders` nunca debe parsear payloads crudos del proveedor.

### 4. `payments` solo manual

`payments.service.ts` permanece con:

- solicitudes manuales;
- aprobacion/rechazo de comprobantes;
- cola BullMQ de revision manual.

No toma webhooks ni confirma pagos online.

## Contratos A Introducir O Ajustar

### Shared contracts

Rutas principales a tocar:

- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/models.ts`

Tipos recomendados:

- `OnlinePaymentProvider = "openpay"`
- `PaymentGatewayNormalizedStatus = "pending" | "authorized" | "captured" | "paid" | "failed" | "expired"`
- `CheckoutActionSummary.onlineProvider?: OnlinePaymentProvider`
- `CheckoutQuoteSummary.availablePaymentRoutes?: Array<"manual" | "online">`

### HTTP contracts

Compatibilidad brownfield recomendada:

- nuevo canonico: `POST /api/v1/store/checkout/online`
- legado temporal: `POST /api/v1/store/checkout/openpay`
- vigente: `POST /api/v1/store/checkout/manual`
- futuro webhook: `POST /api/v1/payments/gateway/webhooks/openpay`

## Persistencia Recomendada

Para cerrar la brecha actual de idempotencia externa se recomiendan dos tablas Prisma:

### `payment_gateway_attempts`

- `id`
- `orderNumber`
- `provider`
- `providerReference`
- `clientRequestId`
- `requestHash`
- `checkoutUrl`
- `normalizedStatus`
- `payloadJson`
- `createdAt`
- `updatedAt`

Indices:

- unico por `provider + providerReference`
- unico por `clientRequestId` si la estrategia final lo requiere

### `payment_gateway_events`

- `id`
- `provider`
- `providerEventId`
- `providerReference`
- `orderNumber`
- `externalStatus`
- `normalizedStatus`
- `payloadJson`
- `receivedAt`
- `processedAt`

Indices:

- unico por `provider + providerEventId`
- indice por `provider + providerReference`

## Reglas Tecnicas Del Slice

1. `manual` sigue siendo ruta publica disponible; en el estado homologado actual es la unica ruta visible porque `PAYMENT_ONLINE_PROVIDER_ACTIVE=none`.
2. Solo un provider online activo puede resolverse por runtime.
3. `authorized` nunca ejecuta `applyCommercialConfirmation`.
4. `captured` o `paid` pueden ejecutar confirmacion automatica solo si `PAYMENT_ONLINE_AUTO_CONFIRM_ENABLED=true`.
5. El webhook persiste primero y confirma despues.
6. La API valida firma antes de normalizar o confirmar.
7. `payments-workspace.tsx` no gana ninguna accion nueva de confirmacion online.
8. `orders-workspace.tsx` sigue siendo la UI operativa de conciliacion online.

## Seguridad

- los secretos del provider viven solo en API/worker y `.env.production`;
- el webhook debe validar firma o secreto compartido;
- la ruta publica de evidencia manual no debe exponer archivos de forma abierta;
- los endpoints admin siguen protegidos por RBAC vigente.

## Observabilidad

Eventos minimos nuevos:

- `payment.gateway.session.created`
- `payment.gateway.event.received`
- `payment.gateway.event.ignored`
- `payment.gateway.event.confirmed`
- `payment.gateway.event.duplicate`

Y auditoria esperada:

- actor `Openpay` o `payment-gateway` para auto confirm;
- actor `admin` u operador para conciliacion manual.

## Estrategia De Implementacion

### Release 1

- modulo `payment-gateway` con provider activo unico;
- endpoint canonico `online`;
- persistencia de attempts;
- compatibilidad con alias `openpay`;
- ownership UI reforzado entre `Pagos` y `Pedidos > Operacion`.

### Release 2

- webhook firmado;
- persistencia de eventos;
- confirmacion automatica opt-in solo para `captured/paid`;
- pruebas de duplicado y replay.

## Estrategia De Pruebas

### API

- extender `apps/api/test/erp-sales-flow.test.ts` para:
  - online via endpoint canonico;
  - alias legacy;
  - idempotencia por `clientRequestId`;
  - bloqueo de confirmacion en `authorized`;
  - confirmacion en `captured/paid`;
  - duplicado de `providerEventId`.

### Admin

- validar que `payments-workspace.tsx` siga orientado a comprobantes manuales;
- validar que `orders-workspace.tsx` siga mostrando conciliacion online.

### Storefront

- validar que `manual` siga visible;
- validar que nunca aparezcan dos providers online;
- validar degradacion a `manual` cuando el provider activo sea `none`.

## Riesgos Tecnicos Abiertos

- la idempotencia actual del checkout esta en memoria dentro de `orders.service.ts`; si no se persiste, sigue siendo fragil ante reinicios;
- la evidencia manual hoy usa upload directo via `mediaService` y debe endurecerse si la URL queda publica;
- el alias `openpay` puede perpetuar coupling si no se marca como transitorio en tests y docs.
