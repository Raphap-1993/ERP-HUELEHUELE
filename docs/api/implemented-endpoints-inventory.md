# Inventario de Endpoints Implementados

## Objetivo

Registrar el inventario real de endpoints actualmente implementados en `apps/api`, contado desde los controladores NestJS del monorepo.

Este documento refleja implementación vigente, no el contorno aspiracional de [`api-v1-outline.md`](./api-v1-outline.md).

Fecha de corte usada para este inventario:

- `2026-04-03`

Fuente verificada:

- controladores en `apps/api/src/modules/**/**controller.ts`
- rutas decoradas con `@Get`, `@Post`, `@Put`, `@Patch` y `@Delete`

## Resumen

- total implementado: `129` endpoints HTTP
- familia `admin`: `100`
- familia `store`: `19`
- familia `auth`: `4`
- familia `seller`: `1`
- familia `health`: `5`

## Notas importantes

- `auth` hoy vive bajo `/auth`, no bajo `/store/auth`.
- el panel del vendedor hoy expone `/seller/panel/overview`, no `/vendor/...`.
- no aparece un controlador dedicado para `/webhooks` en la implementación actual.
- varias rutas administrativas reales están consolidadas distinto al outline, por ejemplo CMS bajo `/admin/cms`.

## Endpoints

### Auth

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `POST /auth/logout`

### Health

- `GET /health/liveness`
- `GET /health/live`
- `GET /health/readiness`
- `GET /health/ready`
- `GET /health/operational`

### Seller

- `GET /seller/panel/overview`

### Store

#### CMS y catálogo público

- `GET /store/cms`
- `GET /store/site-settings`
- `GET /store/navigation`
- `GET /store/pages/:slug`
- `GET /store/faqs`
- `GET /store/banners`
- `GET /store/testimonials`
- `GET /store/catalog`
- `GET /store/products`
- `GET /store/categories`
- `GET /store/products/:slug`

#### Checkout

- `POST /store/checkout/quote`
- `POST /store/checkout/openpay`
- `POST /store/checkout/manual`
- `POST /store/checkout/evidence`

#### Loyalty

- `GET /store/me/loyalty`

#### Formularios comerciales

- `POST /store/vendor-applications`
- `POST /store/wholesale-leads`
- `GET /store/wholesale-tiers`

### Admin

#### Audit

- `GET /admin/audit`
- `GET /admin/audit/logs`
- `GET /admin/audit/actions`

#### Campaigns

- `GET /admin/campaigns`
- `POST /admin/campaigns`
- `GET /admin/campaigns/events`
- `GET /admin/campaigns/segments`
- `GET /admin/campaigns/templates`

#### CMS

- `GET /admin/cms`
- `GET /admin/cms/site-settings`
- `PATCH /admin/cms/site-settings`
- `POST /admin/cms/site-settings/logo`
- `POST /admin/cms/site-settings/admin-sidebar-logo`
- `POST /admin/cms/site-settings/hero-image`
- `POST /admin/cms/site-settings/loading-image`
- `POST /admin/cms/site-settings/favicon`
- `GET /admin/cms/hero-copy`
- `PATCH /admin/cms/hero-copy`
- `GET /admin/cms/navigation`
- `PATCH /admin/cms/navigation`
- `GET /admin/cms/pages`
- `GET /admin/cms/pages/:slug`
- `PATCH /admin/cms/pages/:slug`
- `PATCH /admin/cms/pages/:slug/blocks`
- `GET /admin/cms/banners`
- `POST /admin/cms/banners`
- `PATCH /admin/cms/banners/:id`
- `GET /admin/cms/faqs`
- `POST /admin/cms/faqs`
- `PATCH /admin/cms/faqs/:id`
- `GET /admin/cms/testimonials`
- `POST /admin/cms/testimonials`
- `PATCH /admin/cms/testimonials/:id`

#### Commissions

- `GET /admin/commissions`
- `GET /admin/commissions/rules`
- `POST /admin/commissions/rules`
- `PATCH /admin/commissions/rules/:id`
- `GET /admin/commissions/payouts`
- `POST /admin/commissions/payouts`
- `POST /admin/commissions/payouts/:id/settle`

#### Coupons

- `GET /admin/coupons`
- `GET /admin/coupons/:code`
- `POST /admin/coupons`
- `PATCH /admin/coupons/:code`
- `DELETE /admin/coupons/:code`

#### Customers

- `GET /admin/customers`
- `GET /admin/customers/:id`
- `POST /admin/customers`
- `PATCH /admin/customers/:id`
- `DELETE /admin/customers/:id`

#### Dashboard

- `GET /admin/dashboard/overview`

#### Inventory

- `GET /admin/inventory/report`

#### Loyalty

- `GET /admin/loyalty/accounts`
- `GET /admin/loyalty/movements`
- `POST /admin/loyalty/movements`
- `GET /admin/loyalty/redemptions`
- `POST /admin/loyalty/redemptions`
- `POST /admin/loyalty/redemptions/:id/status`
- `GET /admin/loyalty/rules`

#### Media

- `GET /admin/media/assets`

#### Notifications

- `GET /admin/notifications`
- `POST /admin/notifications`
- `GET /admin/notifications/logs`

#### Observability

- `GET /admin/observability`

#### Orders

- `GET /admin/orders`
- `POST /admin/orders`
- `GET /admin/orders/:orderNumber`
- `POST /admin/orders/:orderNumber/status`
- `POST /admin/orders/:orderNumber/manual-payment`
- `POST /admin/orders/:orderNumber/confirm-online-payment`
- `POST /admin/orders/:orderNumber/resend-approval-email`
- `DELETE /admin/orders/:orderNumber`

#### Payments

- `GET /admin/payments`
- `GET /admin/payments/manual-requests`
- `POST /admin/payments/:orderNumber/register-manual`
- `POST /admin/payments/manual-requests/:id/approve`
- `POST /admin/payments/manual-requests/:id/reject`

#### Products

- `GET /admin/products`
- `GET /admin/products/categories`
- `GET /admin/products/:id`
- `POST /admin/products`
- `PATCH /admin/products/:id`
- `POST /admin/products/:id/images`
- `DELETE /admin/products/:id/images/:imageId`

#### Reports

- `GET /admin/reports`
- `GET /admin/reports/export`

#### Security

- `GET /admin/security`

#### Vendor applications y vendors

- `GET /admin/vendor-applications`
- `POST /admin/vendor-applications/:id/screen`
- `POST /admin/vendor-applications/:id/approve`
- `POST /admin/vendor-applications/:id/reject`
- `GET /admin/vendors`
- `POST /admin/vendors`
- `PATCH /admin/vendors/:id`
- `DELETE /admin/vendors/:id`
- `GET /admin/vendors/codes`

#### Wholesale

- `GET /admin/wholesale-leads`
- `POST /admin/wholesale-leads/:id/status`
- `GET /admin/wholesale-quotes`
- `POST /admin/wholesale-quotes`
- `GET /admin/wholesale-tiers`

## Cómo se contó

Se usó el código real de controladores bajo `apps/api/src/modules` y se sumaron únicamente métodos decorados como rutas HTTP.

Esto evita mezclar:

- rutas documentadas pero no implementadas
- rutas históricas ya removidas
- inferencias desde services o tests
