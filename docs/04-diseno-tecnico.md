# Diseno Tecnico

## Arquitectura actual

### Estado real

- `web` y `admin` consumen `api`
- `products` y parte de `auth` usan Prisma
- `orders`, `vendors`, `inventory`, `payments` y `commissions` usan snapshots JSON persistidos en `module_snapshots`
- el pedido es el agregado transaccional operativo
- `InventoryService` centraliza reserva, confirmacion y reversa

### Gap principal

El schema Prisma modela un dominio mas rico que el runtime actual. La solucion de este corte no migra todo el dominio, pero si homologa trazabilidad y reporteria alrededor del `order`.

## Arquitectura objetivo para este requerimiento

### Principios

- no crear una entidad paralela de venta si el `order` ya existe
- reforzar el `order` como fuente operativa de venta confirmada
- centralizar stock en `InventoryService`
- registrar vendedor y canal de forma reutilizable
- hacer que reportes lean una misma definicion de venta valida

## Diagrama logico textual

```text
web/admin
  -> api/orders
  -> api/payments
  -> api/vendors
  -> api/reports

api/orders
  -> resuelve vendedor y canal
  -> persiste trazabilidad del pedido
  -> delega impacto de stock a inventory
  -> notifica a comisiones, loyalty y reportes

api/inventory
  -> reserva / confirma / libera stock segun estado del pedido
  -> produce lectura consistente para inventario y reportes

api/reports
  -> consume pedidos homologados
  -> agrupa por vendedor, producto, fecha y canal
```

## Entidades impactadas

### Runtime principal

- `AdminOrderDetail` y `AdminOrderSummary`
- `VendorsService`
- `InventoryService`
- `CoreService`
- `ReportsController`

### Persistencia y schema disponible

- `vendor_applications`
- `vendors`
- `vendor_codes`
- `orders`
- `order_items`
- `inventory_movements`
- `module_snapshots`

## Endpoints impactados

### Existentes a extender

- `POST /store/vendor-applications`
- `POST /admin/vendors`
- `POST /admin/vendor-applications/:id/approve`
- `POST /store/checkout/openpay`
- `POST /store/checkout/manual`
- `POST /admin/orders`
- `POST /admin/orders/:orderNumber/status`
- `POST /admin/orders/:orderNumber/manual-payment`
- `GET /admin/reports`

### Nuevos o ajustados recomendados

- endpoint administrativo para confirmar pago online o conciliacion de pedido web cuando el flujo Openpay no tenga webhook productivo
- endpoints de reportes con detalle por vendedor, producto y ventas

## Servicios impactados

- `VendorsService`
- `OrdersService`
- `PaymentsService`
- `InventoryService`
- `CommerceService`
- `CoreService`
- `AuthService` si se quiere mantener alta de seller con codigo operativo

## Regla transaccional de inventario

### Politica homologada

- `draft`: no mueve stock
- `pending_payment` o `payment_under_review`: reserva stock
- `paid`, `confirmed`, `preparing`, `shipped`, `delivered`, `completed`: confirma consumo
- `cancelled`, `expired`, `refunded`: libera o revierte

### Justificacion

- evita sobreventa desde el momento en que el cliente o el operador registra el pedido
- separa compromiso temporal de venta confirmada
- permite liberar stock si el pago no prospera

## Estrategia de idempotencia para pedidos web

- se mantiene `clientRequestId` en checkout
- una misma clave no puede crear pedidos distintos
- la consolidacion de stock se controla por `orderNumber`
- la confirmacion de pago online debe ser idempotente por referencia del proveedor y `orderNumber`

## Estrategia de auditoria

Cada accion sensible debe registrar:

- actor
- modulo
- accion
- referencia de pedido o vendedor
- payload resumido

Fuentes existentes a reutilizar:

- `AuditService`
- `order.statusHistory`
- `observability`

## Estrategia de trazabilidad comercial

El pedido debe exponer y persistir en su snapshot operativo:

- `vendorId`
- `vendorCode`
- `vendorName`
- `salesChannel`
- `createdAt`
- `confirmedAt` o equivalente

## Estrategia de reportes

### Fuente canonica

Los reportes deben basarse en pedidos que cumplan simultaneamente:

- estado comercial valido
- fecha de confirmacion comercial conocida
- items consistentes

### Estados validos para reportes

- `paid`
- `confirmed`
- `preparing`
- `shipped`
- `delivered`
- `completed`

Excluidos:

- `draft`
- `pending_payment`
- `payment_under_review`
- `cancelled`
- `expired`
- `refunded`

### Agregaciones minimas

- por vendedor
- por producto
- por fecha
- por canal
- detalle de ventas

## Decisiones de implementacion

### Decision 1

No introducir una tabla nueva de `sales` en este corte.

Motivo:

- el `order` ya es el agregado central y crear otra entidad duplicaria logica y ambigüedad.

### Decision 2

Centralizar toda mutacion de stock en `InventoryService`.

Motivo:

- ya existe una base aprovechable y cumple la restriccion de no dispersar logica entre web y manual.

### Decision 3

Hacer que vendedor y reportes lean una misma definicion de venta valida.

Motivo:

- evita que panel, reportes, comisiones e inventario calculen con reglas distintas.

## Deuda tecnica declarada

- migracion total de snapshots a entidades Prisma del dominio comercial
- webhook Openpay productivo y trazabilidad de transacciones online de punta a punta
- pruebas automatizadas mas amplias del flujo completo
