# Auditoria Inicial ERP Huele Huele

## Resumen ejecutivo

Esta auditoria confirma que el monorepo ya tiene una base funcional amplia para catalogo, checkout, pedidos, pagos manuales, vendedores, comisiones y backoffice, pero no resuelve de forma homogénea la trazabilidad comercial del ERP.

Hallazgos principales:

- El stack real es `Next.js + NestJS + Prisma + PostgreSQL + Redis + BullMQ`.
- `products` y parte de auth usan tablas Prisma reales.
- `orders`, `vendors`, `payments`, `commissions`, `inventory`, `marketing`, `loyalty` y otros modulos stateful todavia operan sobre `module_snapshots` via `ModuleStateService`.
- El sistema si registra `vendorCode` en pedidos, pero no guarda de forma consistente `vendor_id`, `vendor_name`, `sales_channel` ni una fecha de confirmacion comercial reutilizable para reportes.
- La politica de inventario existe en un punto central (`InventoryService`), pero la trazabilidad fuerte del movimiento todavia no vive en un ledger relacional del dominio.
- El backoffice ya tiene vistas para vendedores, pedidos, pagos, comisiones, productos e inventario.
- Los reportes actuales son generales por periodo; no existen reportes nativos por vendedor ni por producto.

## Stack detectado

### Aplicaciones

- `apps/web`: `Next.js 15`, `React 19`, `Tailwind`.
- `apps/admin`: `Next.js 15`, `React 19`, `Tailwind`.
- `apps/api`: `NestJS 10`.
- `apps/worker`: proceso `BullMQ`.

### Datos y persistencia

- `PostgreSQL` con `Prisma ORM`.
- `Redis` para colas y coordinacion liviana.
- `module_snapshots` como persistencia JSON para varios modulos stateful.

### Operacion

- `PM2`
- `Hestia + Nginx`
- scripts de deploy, backup y smoke checks en `scripts/`

## Modulos detectados

### Backend API

Modulos implementados en `apps/api/src/modules`:

- `auth`
- `catalog`
- `products`
- `commerce`
- `orders`
- `payments`
- `inventory`
- `vendors`
- `commissions`
- `loyalty`
- `marketing`
- `notifications`
- `wholesale`
- `cms`
- `media`
- `audit`
- `security`
- `observability`
- `health`
- `core`
- `customers`
- `coupons`

### Frontend admin

Workspaces relevantes en `apps/admin/components`:

- `orders-workspace`
- `payments-workspace`
- `vendors-workspace`
- `commissions-workspace`
- `products-workspace`
- `reports-workspace`
- `dashboard-workspace`

### Frontend web

Superficies relevantes en `apps/web`:

- `/checkout`
- `/trabaja-con-nosotros`
- `/panel-vendedor`
- `/catalogo`
- `/cuenta`

## Estructura backend actual

### Fuente relacional real

Modelos Prisma relevantes ya definidos:

- `users`, `roles`, `user_roles`
- `products`, `product_variants`, `product_images`
- `inventory_movements`
- `orders`, `order_items`, `order_addresses`, `order_status_history`
- `payments`, `payment_transactions`, `manual_payment_requests`, `payment_evidences`
- `vendor_applications`, `vendors`, `vendor_profiles`, `vendor_codes`, `vendor_status_history`
- `commission_attributions`, `commissions`, `commission_payouts`, `payout_items`
- `audit_logs`, `admin_actions`
- `module_snapshots`

### Fuente operativa real del runtime

Hallazgo critico:

- `ProductsService` usa Prisma como fuente real.
- `AuthService` usa Prisma cuando `DATABASE_URL` esta configurado.
- `OrdersService`, `VendorsService`, `InventoryService` y `CommissionsService` cargan y persisten snapshots JSON via `ModuleStateService`.

Implicacion:

- El schema Prisma documenta un dominio mas maduro que el realmente ejecutado.
- La trazabilidad comercial del ERP esta fragmentada entre tablas relacionales y snapshots.

## Estructura frontend actual

### Admin

- `vendors-workspace` permite alta manual, aprobacion/rechazo de postulaciones y listado de codigos.
- `orders-workspace` permite crear pedidos manuales, revisar detalle, cambiar estado, registrar pago manual y eliminar pedidos.
- `products-workspace` ya muestra un reporte de inventario resumido.
- `reports-workspace` ya expone metricas generales por periodo, tablas por vendedor y producto, y detalle de ventas confirmadas.

### Web

- `checkout-workspace` crea checkout `manual` u `openpay`.
- `vendor-application-form` envia postulaciones comerciales.
- `seller-panel-workspace` consume pedidos/comisiones atribuidos por codigo.

## ORM, acceso a datos y esquema de base

- ORM principal: `Prisma`.
- Acceso a datos relacional: `PrismaService`.
- Persistencia snapshot: `ModuleStateService`.
- No existe carpeta de migraciones Prisma versionadas; el repositorio usa `prisma db push` segun `package.json`.

## Rutas y endpoints detectados

### Store

- `POST /store/vendor-applications`
- `POST /store/checkout/quote`
- `POST /store/checkout/openpay`
- `POST /store/checkout/manual`
- `POST /store/checkout/evidence`
- catalogo y CMS publico

### Admin

- `GET/POST /admin/vendors`
- `GET /admin/vendors/codes`
- `GET/POST /admin/vendor-applications/...`
- `GET/POST /admin/orders`
- `POST /admin/orders/:orderNumber/status`
- `POST /admin/orders/:orderNumber/manual-payment`
- `GET /admin/payments`
- `GET/POST /admin/payments/manual-requests/...`
- `GET /admin/reports`
- `GET /admin/inventory/report`

## Controladores, servicios y repositorios

### Controladores relevantes

- `VendorApplicationsController`, `AdminVendorApplicationsController`, `AdminVendorsController`
- `OrdersController`
- `PaymentsController`
- `CommerceController`
- `InventoryController`
- `ReportsController`

### Servicios relevantes

- `VendorsService`
- `OrdersService`
- `PaymentsService`
- `InventoryService`
- `CommerceService`
- `CommissionsService`
- `CoreService`
- `ProductsService`

### Repositorios

No hay capa de repositorio explicita. El patron dominante es servicio NestJS + acceso directo a `PrismaService` o a `ModuleStateService`.

## Jobs, eventos y colas

Detectados en codigo y documentacion:

- revision manual de pagos
- creacion y conciliacion de payouts de comisiones
- notificaciones
- observabilidad de colas

Limitacion actual:

- hay colas y worker operativo, pero el flujo de confirmacion online `Openpay webhook` no esta implementado como modulo/controlador dedicado.

## Pruebas existentes

- Existe la suite [`apps/api/test/erp-sales-flow.test.ts`](../apps/api/test/erp-sales-flow.test.ts), ejecutable con `npm run test:erp-sales`.
- La suite cubre vendedores, trazabilidad comercial, inventario, idempotencia, reportes y reversa de stock.
- No existe todavia cobertura browser end-to-end para `web` o `admin`; la validacion UI sigue dependiendo de build, typecheck y chequeo manual.

## Documentacion existente

La base documental es amplia y util, con foco en:

- producto y alcance
- arquitectura
- flujos de negocio
- modelo de datos
- outline de API
- UX
- infraestructura

## Mapa de dominio actual

### Entidades o conceptos detectados

- `users`: si existe en Prisma.
- `sellers / vendors`: si existe en Prisma y en snapshot runtime.
- `sales / ventas`: no existe tabla `sales`; la venta real se modela hoy como `order` en estados pagados o confirmados.
- `sale_details / detalle_venta`: no existe tabla separada; el equivalente actual es `order_items`.
- `orders / pedidos`: si existe en Prisma y en snapshot runtime.
- `order_items`: si existe en Prisma y en snapshot runtime.
- `products`: si existe.
- `inventory`: existe como servicio y reporte; el snapshot operativo vive fuera de tablas dedicadas salvo `inventory_movements`.
- `stock_movements / movimientos_inventario`: existe tabla Prisma, pero no es la fuente operativa usada hoy por `InventoryService`.
- `customers`: si existe.
- `payments`: si existe en Prisma y en snapshot runtime.

## Flujo actual de ventas

### Web checkout

Fuente: `CommerceService` + `OrdersService`

1. La web cotiza con `ProductsService`.
2. `CommerceService` crea pedido `openpay` o `manual`.
3. `OrdersService.createCheckoutOrder` persiste el pedido en snapshot.
4. Cuando corresponde, el pedido ya guarda `vendorId`, `vendorCode`, `vendorName`, `salesChannel` y luego `confirmedAt`.
5. Para `manual`, el pedido nace en `payment_under_review`.
6. Para `openpay`, el pedido nace en `pending_payment`.
7. No existe webhook online dedicado para confirmar pago `openpay`, pero si existe conciliacion administrativa controlada con `confirmOnlinePayment`.

### Venta o pedido manual desde admin

1. `OrdersController.createBackofficeOrder` crea pedido manual.
2. Puede nacer `pending_payment` o `confirmed` segun `initialStatus`.
3. Si luego se registra pago manual, `registerAdminManualPayment` mueve el pedido a `paid`.

## Flujo actual de stock

Fuente: `InventoryService`

Politica detectada en codigo:

- `pending_payment` y `payment_under_review` => reserva stock.
- `paid`, `confirmed`, `preparing`, `shipped`, `delivered`, `completed` => confirma consumo.
- `cancelled`, `refunded`, `expired` => libera o revierte.

Fortalezas:

- la logica de stock si esta centralizada en `InventoryService`.
- hay chequeo de disponibilidad antes de reservar.
- hay idempotencia operacional por `orderNumber`.

Brechas:

- la fuente operativa del ledger esta en snapshot JSON, no en una tabla relacional auditable.
- el lenguaje de UI y docs no distingue con suficiente claridad `stock base`, `reservado`, `confirmado` y `vendido`.
- `Openpay` no tiene confirmacion online implementada, por lo que el flujo web queda incompleto para ventas efectivamente pagadas.

## Brechas encontradas

### 1. Registro de vendedor

- Existe UI/API para postulacion y alta manual.
- Existe modelo Prisma para vendedores.
- El runtime de `VendorsService` opera sobre snapshot, no sobre lectura/escritura relacional consolidada.
- El alta ya deja codigo operativo utilizable y una relacion reutilizable para atribucion comercial, pero no una relacion relacional consolidada entre `vendor`, `vendor_code`, `user` y reporting historico.

### 2. Quien vendio y cuando vendio

- El pedido ya guarda `vendorId`, `vendorCode`, `vendorName`, `salesChannel` y `confirmedAt` en el snapshot operativo.
- `confirmedAt` ya alimenta reportes y detalle administrativo.
- La brecha vigente no es de ausencia del dato, sino de persistencia relacional consolidada y homologacion completa entre snapshot, Prisma y reporting historico.

### 3. Reportes por vendedor

- Ya existe lectura administrativa en `GET /admin/reports` y visibilidad en `reports-workspace`.
- El reporte agrega ventas confirmadas por vendedor, canal, monto total y ultima venta.
- La brecha vigente es que la vista sigue entrando por un reporte general de periodo; faltan filtros y endpoints mas dedicados para drill-down por vendedor, canal y estado.

### 4. Reportes por producto

- Ya existe agregacion de ventas por producto dentro de `GET /admin/reports`.
- `reports-workspace` muestra unidades vendidas, ingresos y ultima fecha de venta por producto.
- La brecha vigente es la misma del punto anterior: faltan filtros dedicados y una capa de reporting mas especializada si se quiere explotacion analitica mas profunda.

### 5. Cuándo se vendieron los productos

- El runtime ya usa `confirmedAt` como fecha operativa normalizada de venta confirmada.
- La fecha ya se usa para reportes y exportacion CSV.
- La brecha vigente es asegurar que toda confirmacion online futura siga poblando el mismo campo de forma canonica.

### 6. Descuento de stock

Diagnostico actual:

- La politica existe y esta centralizada.
- El comportamiento depende del estado del pedido.
- El flujo manual si impacta inventario cuando se crea o confirma.
- El flujo web reserva inventario al crear pedido, pero el flujo `openpay` no tiene confirmacion online implementada.
- El reporte de productos sigue mostrando `stockOnHand` como stock base, mientras que el disponible real se calcula aparte.

Conclusión:

- el problema no es ausencia total de logica de stock;
- el problema es falta de homologacion entre evento de negocio, lenguaje funcional, reporte y trazabilidad persistida.

### 7. Doble logica o logica dispersa

- La decision de stock esta razonablemente centralizada en `InventoryService`.
- La decision de comisiones y atribucion depende de `OrdersService` + `CommissionsService`.
- La trazabilidad comercial y la persistencia de venta siguen dispersas entre snapshots, status history y campos sueltos.

## Riesgos tecnicos

- divergencia entre schema Prisma y runtime real del negocio
- reportes basados en inferencias y no en campos operativos homologados
- ausencia de webhook online para confirmar ventas web
- datos comerciales criticos viviendo fuera de tablas relacionales dedicadas
- falta de cobertura browser end-to-end para validar UX operativa sobre `web` y `admin`
- riesgo de regresion por cambios sobre un worktree ya modificado por el usuario

## Deuda tecnica relevante

- migracion incompleta desde snapshots a entidades relacionales del dominio
- falta de migraciones Prisma versionadas
- falta de cobertura automatizada de interfaz y recorridos operativos end-to-end
- falta de endpoint o webhook canónico para confirmacion online de pedidos web
- falta de una capa mas dedicada de filtros y drill-down para reportes por vendedor, producto y fecha

## Conclusiones

1. El proyecto ya tiene base suficiente para resolver el requerimiento sin inventar otra arquitectura.
2. La solucion debe ser incremental: reforzar trazabilidad y reportes sobre el pedido como agregado central, no crear una entidad paralela de venta sin necesidad.
3. La politica de stock correcta debe seguir centralizada en `InventoryService`, homologando lenguaje y fuente de lectura.
4. El registro de vendedor debe dejar persistencia util para operacion y reporteria, no solo snapshot.
5. La confirmacion de venta web queda incompleta mientras no exista webhook o confirmacion controlada de pago online.
