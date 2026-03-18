# Entidades

## Objetivo

Listar las entidades principales del modelo de datos, su propósito y relaciones críticas para una implementación inicial consistente.

## Convenciones recomendadas

- `id` UUID como primary key.
- `status` en entidades con ciclo de vida.
- `created_at`, `updated_at` en todas las tablas.
- `created_by` y `updated_by` cuando la mutación proviene de admin.
- índices por claves de búsqueda operativa y foreign keys más consultadas.

## Core

| Entidad | Propósito | Campos clave sugeridos | Relaciones y notas |
| --- | --- | --- | --- |
| `users` | identidad autenticable | `email`, `phone`, `password_hash`, `status`, `last_login_at` | base para admins, customers y vendors |
| `roles` | agrupación de permisos | `code`, `name`, `is_system` | N:N con `permissions` |
| `permissions` | permisos atómicos | `code`, `name`, `module` | asignados vía roles |
| `admins` | perfil interno | `user_id`, `display_name`, `job_title`, `is_active` | 1:1 con `users` |
| `customers` | perfil de cliente | `user_id`, `first_name`, `last_name`, `document_number`, `marketing_opt_in` | 1:1 con `users`; 1:N con direcciones |
| `customer_addresses` | direcciones guardadas | `customer_id`, `label`, `recipient_name`, `line1`, `city`, `region`, `postal_code`, `country_code`, `is_default` | snapshot futuro a `order_addresses` |

## CMS

| Entidad | Propósito | Campos clave sugeridos | Relaciones y notas |
| --- | --- | --- | --- |
| `site_settings` | configuración global del sitio | `key`, `value_json`, `scope` | branding, contacto, textos globales |
| `pages` | páginas administrables | `slug`, `title`, `status`, `template`, `published_at` | 1:N con `page_blocks`, 1:1 opcional con `seo_meta` |
| `page_blocks` | bloques de contenido | `page_id`, `type`, `sort_order`, `content_json`, `is_active` | admite hero, grids, FAQs, CTA |
| `faqs` | preguntas frecuentes | `question`, `answer`, `category`, `sort_order`, `is_published` | puede mostrarse en varias páginas |
| `banners` | banners promocionales | `title`, `image_url`, `cta_label`, `cta_url`, `placement`, `start_at`, `end_at` | usado en home y campañas |
| `testimonials` | prueba social | `author_name`, `headline`, `content`, `rating`, `is_published` | uso editorial |
| `seo_meta` | metadatos SEO | `entity_type`, `entity_id`, `meta_title`, `meta_description`, `canonical_url`, `og_image_url` | polimórfica lógica |
| `navigation_items` | navegación del sitio | `menu_name`, `label`, `url`, `sort_order`, `parent_id`, `is_active` | soporta árbol simple |

## Catálogo

| Entidad | Propósito | Campos clave sugeridos | Relaciones y notas |
| --- | --- | --- | --- |
| `categories` | agrupación comercial | `name`, `slug`, `description`, `is_active`, `sort_order` | 1:N con `products` |
| `products` | producto base | `category_id`, `name`, `slug`, `short_description`, `long_description`, `status`, `is_featured` | puede representar líneas como `Clásico Verde` |
| `product_variants` | unidad vendible | `product_id`, `sku`, `name`, `price`, `compare_at_price`, `stock_on_hand`, `status` | nivel de venta y stock lógico |
| `product_images` | imágenes públicas | `product_id`, `variant_id`, `url`, `alt_text`, `sort_order`, `is_primary` | soporta imagen general o por variante |
| `inventory_movements` | trazabilidad de stock | `variant_id`, `type`, `quantity`, `reference_type`, `reference_id`, `reason` | opcionalmente se activa desde MVP según operación real |

## Comercial

| Entidad | Propósito | Campos clave sugeridos | Relaciones y notas |
| --- | --- | --- | --- |
| `promotions` | ofertas automáticas | `name`, `code`, `type`, `value`, `scope`, `start_at`, `end_at`, `status` | reglas de compatibilidad con vendedor y loyalty |
| `coupons` | cupones controlados | `promotion_id`, `code`, `usage_limit`, `usage_count`, `status`, `expires_at` | pueden mapear a promoción única |
| `carts` | carrito activo | `customer_id`, `session_id`, `status`, `currency_code`, `vendor_code_snapshot`, `coupon_code_snapshot` | origen de pre-checkout |
| `cart_items` | líneas del carrito | `cart_id`, `product_variant_id`, `quantity`, `unit_price_snapshot`, `discount_snapshot` | recalculables antes del pedido |
| `orders` | venta transaccional | `customer_id`, `number`, `status`, `currency_code`, `subtotal`, `discount_total`, `grand_total`, `vendor_code_snapshot` | agregado central |
| `order_items` | líneas finales del pedido | `order_id`, `product_variant_id`, `sku_snapshot`, `name_snapshot`, `quantity`, `unit_price`, `discount_total`, `line_total` | snapshot inmutable |
| `order_addresses` | direcciones del pedido | `order_id`, `type`, `recipient_name`, `line1`, `city`, `region`, `postal_code`, `country_code` | shipping/billing |
| `order_status_history` | historial de estados | `order_id`, `from_status`, `to_status`, `reason`, `changed_by_user_id`, `changed_at` | obligatorio para trazabilidad |

## Pagos

| Entidad | Propósito | Campos clave sugeridos | Relaciones y notas |
| --- | --- | --- | --- |
| `payments` | estado consolidado del cobro | `order_id`, `method`, `status`, `amount`, `currency_code`, `provider`, `provider_reference` | uno o más pagos por pedido según política |
| `payment_transactions` | interacción granular | `payment_id`, `provider_event`, `provider_transaction_id`, `request_payload`, `response_payload`, `status`, `occurred_at` | esencial para Openpay |
| `manual_payment_requests` | solicitud de validación manual | `payment_id`, `status`, `submitted_by_customer_id`, `reviewed_by_admin_id`, `review_notes`, `reviewed_at` | puente entre cliente y operación |
| `payment_evidences` | comprobantes subidos | `manual_payment_request_id`, `file_path`, `file_name`, `mime_type`, `size_bytes`, `status` | activo privado |

## Vendedores

| Entidad | Propósito | Campos clave sugeridos | Relaciones y notas |
| --- | --- | --- | --- |
| `vendor_applications` | postulaciones | `email`, `phone`, `full_name`, `source`, `status`, `notes_json` | previo a crear vendedor |
| `vendors` | actor comercial aprobado | `user_id`, `code_prefix`, `status`, `approved_at`, `approved_by_admin_id` | puede existir con o sin login inmediato |
| `vendor_profiles` | datos extendidos | `vendor_id`, `display_name`, `bio`, `region`, `social_handles_json`, `metadata_json` | perfil público o semiprivado |
| `vendor_codes` | códigos atribuibles | `vendor_id`, `code`, `status`, `start_at`, `end_at`, `campaign_tag` | único por vigencia efectiva |
| `vendor_bank_accounts` | datos para payout | `vendor_id`, `bank_name`, `account_holder`, `account_number_masked`, `routing_metadata_json`, `status` | cuidado con datos sensibles |
| `vendor_status_history` | historial del vendedor | `vendor_id`, `from_status`, `to_status`, `reason`, `changed_by_admin_id`, `changed_at` | onboarding, suspensión, reactivación |

## Comisiones

| Entidad | Propósito | Campos clave sugeridos | Relaciones y notas |
| --- | --- | --- | --- |
| `commission_rules` | reglas de cálculo | `name`, `scope`, `rate_type`, `rate_value`, `start_at`, `end_at`, `priority`, `status` | puede aplicar por vendedor, producto, categoría o campaña |
| `commission_attributions` | vínculo pedido-vendedor | `order_id`, `vendor_id`, `vendor_code_id`, `source`, `status`, `attributed_at` | una atribución efectiva por pedido |
| `commissions` | obligación económica | `commission_attribution_id`, `commission_rule_id`, `status`, `base_amount`, `commission_amount`, `currency_code`, `approved_at` | entidad monetizable |
| `commission_payouts` | cabecera de liquidación | `vendor_id`, `period_start`, `period_end`, `status`, `gross_amount`, `net_amount`, `paid_at` | agrupa payout items |
| `payout_items` | detalle de liquidación | `commission_payout_id`, `commission_id`, `amount`, `notes` | evita doble pago |

## Mayoristas

| Entidad | Propósito | Campos clave sugeridos | Relaciones y notas |
| --- | --- | --- | --- |
| `wholesale_leads` | oportunidad comercial B2B | `company_name`, `contact_name`, `email`, `phone`, `city`, `status`, `assigned_to_admin_id` | entrada del funnel |
| `wholesale_quotes` | cabecera de cotización | `wholesale_lead_id`, `status`, `currency_code`, `subtotal`, `discount_total`, `grand_total`, `expires_at` | 1:N con items |
| `wholesale_quote_items` | detalle de cotización | `wholesale_quote_id`, `product_variant_id`, `quantity`, `unit_price`, `line_total` | snapshot comercial |
| `wholesale_tiers` | condiciones por volumen | `name`, `min_quantity`, `discount_type`, `discount_value`, `status` | referencia operativa, no necesariamente automática |

## Fidelización

| Entidad | Propósito | Campos clave sugeridos | Relaciones y notas |
| --- | --- | --- | --- |
| `loyalty_rules` | reglas de earning/redemption | `name`, `type`, `value`, `start_at`, `end_at`, `status`, `conditions_json` | base de cálculo |
| `loyalty_accounts` | cuenta de puntos | `customer_id`, `available_points`, `pending_points`, `redeemed_points`, `status` | una por cliente |
| `loyalty_movements` | ledger de puntos | `loyalty_account_id`, `type`, `points`, `status`, `reference_type`, `reference_id`, `expires_at` | fuente de verdad |
| `redemptions` | canjes | `customer_id`, `loyalty_rule_id`, `status`, `points_used`, `benefit_snapshot_json`, `applied_order_id` | relación con pedidos opcional |

## Marketing

| Entidad | Propósito | Campos clave sugeridos | Relaciones y notas |
| --- | --- | --- | --- |
| `segments` | segmentación básica | `name`, `definition_json`, `status`, `last_computed_at` | audiencia táctica |
| `campaigns` | campaña comercial | `segment_id`, `template_id`, `channel`, `status`, `schedule_at`, `goal` | entidad de planeación |
| `campaign_runs` | ejecución de campaña | `campaign_id`, `status`, `started_at`, `finished_at`, `metrics_json` | una campaña puede tener varias corridas |
| `campaign_recipients` | audiencia materializada | `campaign_run_id`, `customer_id`, `vendor_id`, `status`, `delivery_reference`, `sent_at` | persistencia de envío |
| `templates` | plantillas reutilizables | `name`, `channel`, `subject`, `body`, `variables_json`, `status` | usado por campañas y notificaciones |
| `marketing_events` | eventos para growth | `customer_id`, `vendor_id`, `event_name`, `event_payload`, `occurred_at`, `source` | insumo para CRM básico |

## Notificaciones y auditoría

| Entidad | Propósito | Campos clave sugeridos | Relaciones y notas |
| --- | --- | --- | --- |
| `notifications` | intención de envío | `type`, `channel`, `recipient_type`, `recipient_id`, `template_id`, `status`, `payload_json` | transaccional o campaña |
| `notification_logs` | resultado por intento | `notification_id`, `provider`, `status`, `request_payload`, `response_payload`, `occurred_at` | reintentos y trazabilidad |
| `audit_logs` | registro técnico/auditable | `actor_user_id`, `module`, `action`, `entity_type`, `entity_id`, `payload_json`, `occurred_at` | no editable |
| `admin_actions` | acciones operativas legibles | `admin_user_id`, `action_type`, `target_type`, `target_id`, `summary`, `metadata_json`, `occurred_at` | enfoque negocio-operación |

## Índices recomendados mínimos

- `users.email` único
- `roles.code` único
- `permissions.code` único
- `products.slug` único
- `product_variants.sku` único
- `coupons.code` único
- `orders.number` único
- `payments.provider_reference` indexado
- `vendor_codes.code` único lógico
- `commission_payouts(vendor_id, period_start, period_end)`
- `campaign_recipients(campaign_run_id, customer_id)`

## Observaciones de implementación

- Para N:N entre `users`, `roles` y `permissions`, la implementación puede usar tablas pivote adicionales aunque no se enumeren aquí.
- `seo_meta` y `notifications` pueden requerir modelado polimórfico lógico; Prisma puede resolverlo con convenciones de `entity_type`/`entity_id`.
