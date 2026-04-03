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

Notas operativas:

- `POST /store/vendor-applications` exige `name`, `email`, `city`, `phone` y `applicationIntent`.
- `applicationIntent` admite `affiliate`, `seller`, `content_creator` y `other`.
- `message` se mantiene como texto libre para contexto comercial adicional.

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

### Media

- `GET /admin/media/assets`

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

### Clientes

- `GET /admin/customers`
- `GET /admin/customers/:id`
- `POST /admin/customers`
- `PATCH /admin/customers/:id`
- `DELETE /admin/customers/:id`

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
- `POST /admin/vendor-applications/:id/screen`
- `POST /admin/vendor-applications/:id/approve`
- `POST /admin/vendor-applications/:id/reject`
- `GET /admin/vendors`
- `POST /admin/vendors`
- `PATCH /admin/vendors/:id`
- `DELETE /admin/vendors/:id`
- `GET /admin/vendors/codes`
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
- `POST /admin/vendor-applications/:id/approve` debe recibir `resolvedCollaborationType` para confirmar el tipo final del vendedor antes de generar el código.
- `POST /admin/vendor-applications/:id/approve` puede recibir `preferredCode` para fijar un código comercial friendly; si no llega, la API genera uno automático.
- `POST /admin/vendors` exige `name`, `email`, `city` y `phone`; el `phone` debe llegar en formato internacional con código de país, por ejemplo `+51 998906481`.
- `POST /admin/vendors` puede recibir `preferredCode` para fijar un código comercial friendly; si no llega, la API genera uno automático.
- `GET /admin/media/assets` lista assets ya persistidos en `Cloudflare R2` para reutilizarlos desde backoffice sin volver a subirlos.
- `GET /admin/media/assets` acepta `kind` opcional (`product`, `hero`, `banner`, `logo`, `evidence`) y `limit`.
- `PATCH /admin/vendors/:id` permite editar datos base del perfil comercial (`name`, `email`, `city`, `phone`, `source`, `collaborationType`, `status`) y también `preferredCode` cuando el vendedor todavía no tiene pedidos, ventas ni comisiones históricas.
- Si `preferredCode` cambia en `PATCH /admin/vendors/:id`, la API sincroniza postulaciones ligadas y reglas de comisión que apuntaban al código anterior.
- `DELETE /admin/vendors/:id` solo se permite cuando el vendedor no tiene ventas, pedidos, comisiones ni postulaciones vinculadas.
- `GET /admin/vendors/codes` es una proyección de solo lectura de los códigos actuales de vendedores; no expone CRUD independiente de códigos todavía.
