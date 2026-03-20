# Módulos del Sistema

## Criterio de modularidad

Huelegood separa capacidades por dominio funcional. Cada módulo tiene una responsabilidad primaria, reglas propias y puntos de integración definidos con otros módulos.

## Mapa de módulos

| Módulo | Responsabilidad | Entidades núcleo | Integra con |
| --- | --- | --- | --- |
| Auth | identidad, login, sesiones, recuperación, guards | `users`, `roles`, `permissions`, `admins`, `customers` | todos |
| CMS interno | contenido administrable del sitio | `site_settings`, `pages`, `page_blocks`, `faqs`, `banners`, `testimonials`, `seo_meta`, `navigation_items` | catálogo, marketing |
| Catálogo | productos, variantes, imágenes, categorías | `categories`, `products`, `product_variants`, `product_images`, `inventory_movements` | promociones, carrito, pedidos |
| Media | gestión de activos públicos y privados | `media_assets`, `media_usages`, `upload_jobs` | CMS, catálogo, pagos, mayoristas |
| Promociones | ofertas y cupones | `promotions`, `coupons` | catálogo, carrito, pedidos, marketing |
| Carrito | sesión de compra y preparación de checkout | `carts`, `cart_items` | catálogo, promociones, vendedores |
| Pedidos | orden comercial y su ciclo de vida | `orders`, `order_items`, `order_addresses`, `order_status_history` | pagos, comisiones, fidelización, notificaciones |
| Pagos | pagos online y manuales | `payments`, `payment_transactions`, `manual_payment_requests`, `payment_evidences` | pedidos, auditoría, notificaciones |
| Clientes | cuentas y direcciones | `customers`, `customer_addresses` | auth, pedidos, marketing, fidelización |
| Vendedores | onboarding, perfiles, códigos y estado | `vendor_applications`, `vendors`, `vendor_profiles`, `vendor_codes`, `vendor_bank_accounts`, `vendor_status_history` | comisiones, pedidos, marketing |
| Comisiones | reglas, atribución y pago a vendedores | `commission_rules`, `commission_attributions`, `commissions`, `commission_payouts`, `payout_items` | vendedores, pedidos, pagos |
| Mayoristas | leads, cotizaciones y tiers | `wholesale_leads`, `wholesale_quotes`, `wholesale_quote_items`, `wholesale_tiers` | CMS, marketing, notificaciones |
| Fidelización | puntos y canjes | `loyalty_rules`, `loyalty_accounts`, `loyalty_movements`, `redemptions` | clientes, pedidos, promociones |
| Marketing | segmentos, campañas, plantillas y eventos | `segments`, `campaigns`, `campaign_runs`, `campaign_recipients`, `templates`, `marketing_events` | clientes, CMS, promociones, notificaciones |
| Notificaciones | entrega y trazabilidad de comunicaciones | `notifications`, `notification_logs` | pedidos, pagos, vendedores, marketing |
| Auditoría | trazabilidad interna y acciones administrativas | `audit_logs`, `admin_actions` | todos |

## Reglas de interacción entre módulos

### Auth

- centraliza autenticación y contexto de usuario
- expone autorización por permisos, no por checks ad hoc en controladores

### CMS interno

- debe poder editar la web sin redeploy para cambios de contenido no estructural
- no administra reglas comerciales sensibles
- si referencia logo, hero o banners, debe hacerlo contra activos persistidos y no contra rutas hardcodeadas en código

### Catálogo

- controla disponibilidad comercial y consistencia de variantes
- no ejecuta cobros ni descuentos finales por sí solo
- debe ser fuente real de productos para storefront, checkout y secciones comerciales, no una copia estática en `shared`

### Media

- centraliza logo, hero, banners, imágenes de producto y otros activos públicos del storefront
- separa activos públicos de activos privados como evidencias operativas
- para media pública del storefront, el destino vigente es `Cloudflare R2`
- el delivery público debe resolverse con bucket público o dominio custom sobre R2
- no debe obligar a escribir URLs manuales en el backoffice cuando el flujo esperado es upload y selección

### Promociones

- define compatibilidad, vigencia, audiencia y restricción de uso
- resuelve validaciones antes de crear pago

### Carrito

- mantiene snapshot preliminar de precios, descuentos y código de vendedor
- nunca es fuente definitiva de una venta; el pedido sí lo es

### Pedidos

- es el agregado transaccional central
- conserva snapshot de productos, direcciones, precios, descuentos y atribuciones

### Pagos

- administra intentos, conciliación y evidencias
- actualiza pedidos vía reglas explícitas de transición

### Vendedores y Comisiones

- `vendors` modela la relación comercial con personas que promueven la venta
- `commissions` monetiza la atribución una vez que la venta califica
- un vendedor no modifica catálogo, stock ni pricing base

### Mayoristas

- en MVP se trata como funnel comercial con lead, calificación y cotización
- un portal B2B autoservicio completo queda fuera de alcance inicial

### Fidelización

- asigna puntos después de que el pedido alcanza el estado elegible
- las reversas deben ejecutarse ante cancelaciones, devoluciones o fraude confirmado

### Marketing

- opera sobre segmentos, eventos y plantillas internas
- no sustituye un CRM enterprise; cubre necesidades tácticas iniciales

### Auditoría

- toda acción sensible en admin debe generar registro
- los logs de auditoría no deben depender de la capa visual

## Dependencias permitidas

- Pedidos depende de Catálogo, Promociones, Clientes y Vendedores para construir una orden válida.
- Pagos depende de Pedidos para conocer monto y estado elegible.
- Comisiones depende de Pedidos, Pagos y Vendedores para atribución y payout.
- Fidelización depende de Pedidos para cálculo base.
- Notificaciones depende de eventos emitidos por otros módulos.
- CMS y Catálogo dependen de Media cuando necesitan resolver activos públicos persistidos.

## Dependencias no deseadas

- Admin consultando tablas directamente sin API.
- CMS modificando reglas de negocio transaccional.
- Worker escribiendo estados arbitrarios sin validar reglas del módulo dueño.
- Vendedores gestionando entidades administrativas fuera de su dominio.
- layout público leyendo branding estático desde código cuando el backoffice declara branding administrable.

## Corte operacional recomendado

Para efectos de implementación y ownership técnico, los módulos pueden agruparse en tres capas:

- Comercial: catálogo, promociones, carrito, pedidos, pagos
- Growth: vendedores, comisiones, mayoristas, fidelización, marketing
- Plataforma: auth, CMS, media, notificaciones, auditoría
