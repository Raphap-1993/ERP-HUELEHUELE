# Modelo de Dominio

## Objetivo

Definir cómo se organiza el dominio de Huelegood, cuáles son sus agregados principales y cómo se relacionan entre sí.

## Convenciones transversales

- IDs recomendados: `UUID`.
- Timestamps: `created_at`, `updated_at` y, cuando aplique, `deleted_at` o `archived_at`.
- Montos monetarios: tipo decimal preciso y `currency_code` ISO 4217.
- Historiales y auditoría persistidos en tablas dedicadas, no solo en logs.
- Las tablas operativas deben incluir campos de estado explícitos.

## Bounded contexts

| Contexto | Descripción |
| --- | --- |
| Identity & Access | usuarios, roles, permisos y perfiles internos/externos |
| CMS | contenido administrable y navegación pública |
| Commerce | catálogo, promociones, carrito, pedidos y pagos |
| Seller Channel | vendedores, códigos y comisiones |
| B2B / Wholesale | leads, tiers y cotizaciones |
| Loyalty | reglas y saldos de puntos |
| Marketing | segmentos, campañas, plantillas y eventos |
| Platform Ops | notificaciones, auditoría y acciones administrativas |

## Agregados principales

### Usuario

`users` es la identidad raíz. Según el caso, un usuario puede estar vinculado a:

- `admins`
- `customers`
- `vendors`

Una `vendor_application` puede existir antes de convertirse en `user`/`vendor`.

### Catálogo

`products` y `product_variants` modelan la oferta comercial. Las variantes son el nivel operativo de stock, precio y venta.

Campos aditivos vigentes:

- `products.sales_channel`: `public | internal`
- `products.reporting_group`: agrupación comercial y analítica
- `product_variants.low_stock_threshold`: umbral operativo por SKU

### Pedido

`orders` es el agregado transaccional central. Debe encapsular:

- snapshot de cliente
- snapshot de dirección
- snapshot de líneas
- totales comerciales
- atribución de vendedor
- referencias a pagos

### Pago

`payments` representa el estado de pago consolidado. `payment_transactions` conserva interacciones finas con Openpay u otros intentos. `manual_payment_requests` y `payment_evidences` modelan el camino manual.

### Vendedor y comisión

`vendors` define el actor comercial. `vendor_codes` materializa la atribución en checkout. `commission_attributions` y `commissions` registran el derecho económico derivado.

Campos aditivos vigentes:

- `vendors.collaboration_type`: `seller | affiliate`
- `commission_rules.applies_to_collaboration_type`

### CMS

`CmsTestimonial` se extendió a `kind: text | audio | social` con `audioUrl`, `socialUrl`, `socialPlatform`, `coverImageUrl` y `position`.

### Loyalty

`loyalty_accounts` conserva saldo. `loyalty_movements` es la fuente de verdad de puntos. `redemptions` captura el uso.

### Marketing

`segments`, `campaigns` y `campaign_runs` organizan la ejecución. `campaign_recipients` y `notification_logs` son la trazabilidad.

## Relaciones clave

### Identidad y acceso

- `users` 1:N `roles` mediante una tabla pivote implícita o equivalente en implementación
- `roles` N:N `permissions`
- `users` 1:1 `admins` o `customers` o `vendors`, según perfil

### Comercio

- `categories` 1:N `products`
- `products` 1:N `product_variants`
- `products` 1:N `product_images`
- `carts` 1:N `cart_items`
- `orders` 1:N `order_items`
- `orders` 1:N `order_addresses`
- `orders` 1:N `payments`
- `orders` 1:N `order_status_history`

### Pago

- `payments` 1:N `payment_transactions`
- `payments` 1:N `manual_payment_requests`
- `manual_payment_requests` 1:N `payment_evidences`

### Seller channel

- `vendors` 1:1 `vendor_profiles`
- `vendors` 1:N `vendor_codes`
- `vendors` 1:N `vendor_bank_accounts`
- `vendors` 1:N `vendor_status_history`
- `orders` 1:N `commission_attributions`
- `commission_rules` 1:N `commissions`
- `commission_payouts` 1:N `payout_items`

### Wholesale

- `wholesale_leads` 1:N `wholesale_quotes`
- `wholesale_quotes` 1:N `wholesale_quote_items`

### Loyalty

- `customers` 1:1 `loyalty_accounts`
- `loyalty_accounts` 1:N `loyalty_movements`
- `customers` 1:N `redemptions`

### Marketing y notificaciones

- `segments` 1:N `campaigns`
- `campaigns` 1:N `campaign_runs`
- `campaign_runs` 1:N `campaign_recipients`
- `notifications` 1:N `notification_logs`

## Reglas de consistencia del dominio

- Un pedido no puede depender del carrito para reconstruir sus montos históricos.
- Una comisión no puede pasar a `paid` sin haber sido `payable`.
- Un cliente no puede canjear puntos no disponibles.
- Una campaña no debe despachar sin audiencia materializada.
- Un pago manual aprobado debe dejar huella de quién lo aprobó.
- Un producto `internal` no puede aparecer en catálogo, PDP ni checkout público.
- El reporte de inventario debe usar la misma fuente de reservas y confirmaciones del ledger operativo.

## Eventos internos recomendados

- `order.created`
- `order.paid`
- `payment.manual.approved`
- `vendor.onboarded`
- `commission.payable`
- `loyalty.points.available`
- `campaign.run.started`

Estos eventos no sustituyen la base de datos como verdad; son mecanismos internos de orquestación asíncrona.

## Observación de modelado

Huelegood no es multi-tenant. Ninguna tabla requiere `tenant_id` en esta etapa. Si en el futuro existiera una línea white-label o multi-marca, el rediseño debe pasar por una nueva ADR.
