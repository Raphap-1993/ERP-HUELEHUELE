# API v1 Vigente

Base productiva: `https://api.huelegood.com/api/v1`.

La API se separa por superficie:

- `/store`: storefront publico.
- `/admin`: backoffice.
- `/seller`: panel vendedor autenticado.
- `/auth`: sesiones compartidas por web y admin.
- `/health`: salud operativa.

Las respuestas siguen el patron:

```json
{
  "data": {},
  "meta": {}
}
```

## Health

- `GET /health/liveness`
- `GET /health/readiness`
- `GET /health/operational`

## Store

### Auth Publico Y Comercial

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `POST /auth/logout`

Reglas:

- `POST /auth/register` solo puede crear cliente final.
- Vendedores y mayoristas reciben credenciales desde backoffice, no por auto-registro publico.

### Catalogo Y CMS

- `GET /store/site-settings`
- `GET /store/navigation`
- `GET /store/pages/:slug`
- `GET /store/faqs`
- `GET /store/banners`
- `GET /store/categories`
- `GET /store/products`
- `GET /store/products/:slug`

### Checkout

- `POST /store/checkout/quote`
- `POST /store/checkout/document-lookup`
- `GET /store/checkout/ubigeo/departments`
- `GET /store/checkout/ubigeo/provinces/:departmentCode`
- `GET /store/checkout/ubigeo/districts/:provinceCode`
- `POST /store/checkout/openpay`
- `POST /store/checkout/manual`
- `POST /store/checkout/evidence`

Reglas:

- toda compra exige documento valido.
- DNI consulta primero cliente canonico y luego ApiPeru si aplica.
- `province_shalom_pickup` exige carrier/sucursal y deja flete fuera del total online.
- checkout usa idempotencia para no duplicar pedido ni stock.

### Formularios Comerciales

- `POST /store/vendor-applications`
- `POST /store/wholesale-leads`

## Admin

### Auth Y Dashboard

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /admin/dashboard/overview`

### Productos, CMS Y Media

- `GET /admin/media/assets`
- `GET /admin/categories`
- `POST /admin/categories`
- `GET /admin/products`
- `GET /admin/products/:id`
- `POST /admin/products`
- `PATCH /admin/products/:id`
- `POST /admin/products/:id/images`
- `GET /admin/site-settings`
- `PUT /admin/site-settings`
- `GET /admin/pages`
- `POST /admin/pages`
- `PATCH /admin/pages/:id`

### Clientes

- `GET /admin/customers`
- `GET /admin/customers/conflicts`
- `GET /admin/customers/:id`
- `POST /admin/customers`
- `PATCH /admin/customers/:id`
- `POST /admin/customers/merge`
- `POST /admin/customers/conflicts/:id/resolve`
- `DELETE /admin/customers/:id`

### Pedidos

- `GET /admin/orders`
- `GET /admin/orders/vendor-options`
- `POST /admin/orders`
- `GET /admin/orders/:orderNumber`
- `POST /admin/orders/:orderNumber/status`
- `POST /admin/orders/:orderNumber/vendor`
- `POST /admin/orders/:orderNumber/manual-payment`
- `POST /admin/orders/:orderNumber/confirm-online-payment`
- `POST /admin/orders/:orderNumber/resend-approval-email`
- `DELETE /admin/orders/:orderNumber`

### Fulfillment Y Despacho

- `GET /admin/orders/:orderNumber/fulfillment`
- `POST /admin/orders/:orderNumber/fulfillment/suggest`
- `POST /admin/orders/:orderNumber/fulfillment`
- `GET /admin/orders/:orderNumber/dispatch-label`
- `POST /admin/orders/:orderNumber/dispatch-label/print`

Reglas:

- sugerencia no reserva ni muta por si sola.
- asignacion valida cobertura y stock.
- si cambia el origen, inventario recompone reservas.

### Inventario Y Almacenes

- `GET /admin/inventory/report`
- `POST /admin/inventory/stock-adjustments`
- `GET /admin/warehouses`
- `GET /admin/warehouses/:id`
- `POST /admin/warehouses`
- `PATCH /admin/warehouses/:id`
- `DELETE /admin/warehouses/:id`

Reglas:

- reporte lee por `variante + almacen`.
- ajustes manuales deben quedar auditables.
- no usar ajustes como sustituto de transferencias fisicas.

### Transferencias

- `GET /admin/transfers`
- `GET /admin/transfers/:id`
- `POST /admin/transfers`
- `POST /admin/transfers/:id/dispatch`
- `POST /admin/transfers/:id/receive`
- `POST /admin/transfers/:id/cancel`
- `POST /admin/transfers/:id/reconcile`
- `POST /admin/transfers/:id/package-snapshot`
- `POST /admin/transfers/:id/gre`
- `POST /admin/transfers/:id/sticker`

Reglas:

- `create` reserva stock en origen.
- `dispatch` descuenta origen.
- `receive` ingresa destino.
- recepcion parcial abre incidencia.
- `reconcile` cierra incidencia sin corregir balances manualmente.

### Pagos

- `GET /admin/payments`
- `GET /admin/payments/manual-requests`
- `POST /admin/payments/manual-requests/:id/approve`
- `POST /admin/payments/manual-requests/:id/reject`

### Reportes

- `GET /admin/reports`
- `GET /admin/reports/export`

Filtros:

- `from`
- `to`
- `salesChannel`
- `vendorCode`
- `productSlug`
- `sku`

Reglas:

- estados validos de venta viven en `packages/shared/src/domain/order-lifecycle.ts`.
- ventas, detalle y CSV usan el mismo scope server-side.

### Vendedores Y Comisiones

- `GET /admin/vendors`
- `POST /admin/vendors`
- `PATCH /admin/vendors/:id`
- `GET /admin/vendor-applications`
- `POST /admin/vendor-applications/:id/screen`
- `POST /admin/vendor-applications/:id/approve`
- `POST /admin/vendor-applications/:id/reject`
- `GET /admin/commercial-accesses`
- `POST /admin/commercial-accesses`
- `PATCH /admin/commercial-accesses/:id`
- `POST /admin/commercial-accesses/:id/status`
- `POST /admin/commercial-accesses/:id/reset-password`
- `GET /admin/commissions`
- `GET /admin/commission-payouts`
- `POST /admin/commission-payouts`

### Panel Vendedor

- `GET /seller/panel/overview`

Reglas:

- requiere sesion con rol `vendedor` o `seller_manager`.
- la cuenta debe tener `vendorCode` resoluble para mostrar ventas, comisiones y liquidaciones.

### Mayoristas, Marketing, Loyalty Y Notificaciones

- `GET /admin/wholesale-leads`
- `POST /admin/wholesale-leads/:id/status`
- `GET /admin/wholesale-quotes`
- `POST /admin/wholesale-quotes`
- `GET /admin/wholesale-tiers`
- `GET /admin/marketing`
- `POST /admin/marketing/campaigns`
- `GET /admin/loyalty`
- `GET /admin/notifications`

## Reglas De Contrato

- Admin requiere roles desde `adminAccessRoles`.
- Store no debe exponer endpoints administrativos.
- Todas las mutaciones sensibles deben registrar auditoria o trazabilidad equivalente.
- Endpoints nuevos deben actualizar este documento en el mismo PR/commit.
