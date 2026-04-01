# API v1 Outline

## Objetivo

Definir el contorno de la API inicial de Huelegood para soportar storefront, admin, panel de vendedor, webhooks y procesos de operación.

## Principios de contrato

- Base URL sugerida de producción: `https://api.huelegood.com/api/v1`
- Formato: JSON
- Versionado por path
- Autorización resuelta en API, no en frontend
- Respuestas paginadas para listados administrativos
- Idempotencia recomendada en creación de pedidos y acciones sensibles

## Dominios de exposición

| Dominio de endpoints | Uso |
| --- | --- |
| `/store` | storefront público y cliente autenticado |
| `/admin` | backoffice interno |
| `/vendor` | panel y operaciones del vendedor |
| `/webhooks` | integraciones externas, especialmente Openpay |

## Convenciones de respuesta

### Éxito

```json
{
  "data": {},
  "meta": {}
}
```

### Error

```json
{
  "error": {
    "code": "ORDER_NOT_PAYABLE",
    "message": "El pedido no puede procesar este pago.",
    "details": {}
  }
}
```

## Autenticación y autorización

- clientes, vendedores y admins usan identidades sobre `users`
- los guards deben distinguir contexto `customer`, `vendor` y `admin`
- admin y vendor requieren validación de rol y permisos
- webhooks usan firma o secreto, no sesión

## Endpoints store

### CMS y navegación

- `GET /store/site-settings`
- `GET /store/navigation`
- `GET /store/pages/:slug`
- `GET /store/faqs`
- `GET /store/banners`

### Catálogo

- `GET /store/categories`
- `GET /store/products`
- `GET /store/products/:slug`
- `GET /store/products/:slug/recommendations` opcional

### Carrito y promoción

- `GET /store/cart`
- `POST /store/cart/items`
- `PATCH /store/cart/items/:itemId`
- `DELETE /store/cart/items/:itemId`
- `POST /store/cart/apply-coupon`
- `POST /store/cart/apply-vendor-code`
- `DELETE /store/cart/vendor-code`

### Checkout y pedidos

- `POST /store/checkout/quote`
- `POST /store/checkout/openpay`
- `POST /store/checkout/manual`
- `POST /store/checkout/evidence`
- `GET /store/orders/:orderNumber`
- `POST /store/orders/:orderNumber/cancel` según política

Notas operativas:

- el quote acepta metadata de shipping para diferenciar entrega estándar vs `province_shalom_pickup`
- `province_shalom_pickup` exige tipo y número de documento compatible con `SUNAT`, carrier `Shalom`, sucursal de recojo y deja el flete fuera del total online

### Pagos

- `POST /store/orders/:orderNumber/payments/openpay`
- `POST /store/orders/:orderNumber/payments/manual`
- `POST /store/orders/:orderNumber/payments/manual/evidences`
- `GET /store/orders/:orderNumber/payments`

### Cuenta cliente

- `POST /store/auth/register`
- `POST /store/auth/login`
- `POST /store/auth/logout`
- `POST /store/auth/forgot-password`
- `POST /store/auth/reset-password`
- `GET /store/me`
- `PATCH /store/me`
- `GET /store/me/addresses`
- `POST /store/me/addresses`
- `PATCH /store/me/addresses/:id`
- `DELETE /store/me/addresses/:id`
- `GET /store/me/orders`
- `GET /store/me/loyalty`
- `POST /store/me/redemptions`

### Formularios comerciales

- `POST /store/vendor-applications`
- `POST /store/wholesale-leads`

## Endpoints admin

### Access y dashboard

- `POST /admin/auth/login`
- `POST /admin/auth/logout`
- `GET /admin/me`
- `GET /admin/dashboard/overview`

### CMS

- `GET /admin/site-settings`
- `PUT /admin/site-settings`
- `GET /admin/pages`
- `POST /admin/pages`
- `PATCH /admin/pages/:id`
- `POST /admin/pages/:id/publish`
- `GET /admin/faqs`
- `POST /admin/faqs`
- `GET /admin/banners`
- `POST /admin/banners`

### Catálogo y promociones

- `GET /admin/categories`
- `POST /admin/categories`
- `GET /admin/products`
- `POST /admin/products`
- `PATCH /admin/products/:id`
- `POST /admin/products/:id/images`
- `GET /admin/promotions`
- `POST /admin/promotions`
- `PATCH /admin/promotions/:id`
- `GET /admin/coupons`
- `POST /admin/coupons`

### Pedidos y pagos

- `GET /admin/orders`
- `GET /admin/orders/:id`
- `POST /admin/orders/:id/status`
- `GET /admin/payments`
- `GET /admin/payments/manual-requests`
- `POST /admin/payments/manual-requests/:id/approve`
- `POST /admin/payments/manual-requests/:id/reject`

### Vendedores y comisiones

- `GET /admin/vendor-applications`
- `POST /admin/vendor-applications/:id/approve`
- `POST /admin/vendor-applications/:id/reject`
- `GET /admin/vendors`
- `PATCH /admin/vendors/:id`
- `POST /admin/vendors/:id/codes`
- `GET /admin/commission-rules`
- `POST /admin/commission-rules`
- `GET /admin/commissions`
- `POST /admin/commission-payouts`
- `POST /admin/commission-payouts/:id/mark-paid`

### Mayoristas

- `GET /admin/wholesale-leads`
- `PATCH /admin/wholesale-leads/:id`
- `GET /admin/wholesale-quotes`
- `POST /admin/wholesale-quotes`
- `PATCH /admin/wholesale-quotes/:id`

### Loyalty

- `GET /admin/loyalty/rules`
- `POST /admin/loyalty/rules`
- `GET /admin/loyalty/accounts`
- `GET /admin/loyalty/movements`
- `POST /admin/loyalty/movements/:id/reverse`

### Marketing y notificaciones

- `GET /admin/segments`
- `POST /admin/segments`
- `GET /admin/templates`
- `POST /admin/templates`
- `GET /admin/campaigns`
- `POST /admin/campaigns`
- `POST /admin/campaigns/:id/schedule`
- `POST /admin/campaigns/:id/run`
- `GET /admin/notifications`

### Auditoría

- `GET /admin/audit-logs`
- `GET /admin/admin-actions`

## Endpoints vendor

- `POST /vendor/auth/login`
- `POST /vendor/auth/logout`
- `GET /vendor/me`
- `GET /vendor/me/codes`
- `GET /vendor/me/orders`
- `GET /vendor/me/commissions`
- `GET /vendor/me/payouts`
- `GET /vendor/me/profile`
- `PATCH /vendor/me/profile`

## Endpoints webhooks

- `POST /webhooks/openpay`

## Consideraciones de implementación

- `orders`, `payments`, `commissions` y `loyalty` requieren políticas de idempotencia.
- Los endpoints administrativos deben registrar `admin_actions` y `audit_logs` cuando corresponda.
- Los listados admin deben aceptar `page`, `page_size`, `sort`, `filters`.
- La API v1 debe exponer estados de negocio como enums estables compartidos con frontend.
