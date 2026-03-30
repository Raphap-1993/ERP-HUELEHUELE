# Aterrizaje Quirúrgico de Requerimientos 2026-03

## Objetivo

Traducir los requerimientos operativos y comerciales homologados en marzo de 2026 a cambios aditivos sobre Huelegood, evitando regresiones sobre los frentes ya productivos.

## Decisiones cerradas

- `distribuidor` permanece dentro del funnel de `wholesale`.
- `TikTok` e `Instagram` entran por curaduría manual desde CMS, no por integración API externa.
- la comisión `10%` para afiliados se agrega como regla aditiva, no reemplaza reglas históricas.
- la home premium pasa a runtime CMS en hero, testimonios y FAQ con fallback explícito.
- `products` e `inventory` son los únicos dominios que abren cambio relacional en Prisma dentro de esta ola.

## Regla de no-ruptura

- módulos snapshot-backed como `cms`, `vendors`, `commissions`, `wholesale` y `orders` conservan su patrón de persistencia actual.
- la web pública cae a fallback cuando CMS o catálogo no respondan.
- el storefront nunca lista ni permite comprar productos `internal`.
- inventario sigue consumiendo las mismas asignaciones reales de variantes y bundles.

## Cambio por frente

### Operación manual

- `POST /admin/orders/:orderNumber/status` expone transiciones operativas con nota y auditoría.
- `POST /admin/payments/:orderNumber/register-manual` registra pago manual completo sobre pedido existente y sincroniza comisiones.
- el admin ya expone ambas acciones desde `orders-workspace`.

### Canal comercial

- `POST /admin/vendors` permite alta manual de seller o affiliate.
- `vendors` y `vendor_codes` ahora exponen `collaborationType`.
- el admin puede crear afiliados manuales y disparar una regla automática del `10%`.
- `commission_rules` ya matchea por `appliesToCollaborationType`.

### CMS y home runtime

- `CmsTestimonial` soporta `text`, `audio` y `social`.
- el admin CMS ya puede crear testimonios con `audioUrl`, `socialUrl`, `socialPlatform`, `coverImageUrl` y `position`.
- la home premium ahora lee hero, testimonios y FAQ desde CMS con fallback seguro.

### Catálogo, inventario y reporting

- `Product` incorpora `salesChannel` y `reportingGroup`.
- `ProductVariant` incorpora `lowStockThreshold`.
- el storefront bloquea productos internos en catálogo, PDP y checkout.
- `GET /admin/inventory/report` entrega ventas confirmadas, stock disponible y alerta de umbral.
- `products-workspace` ya muestra canal, grupo y el reporte operativo.

### Wholesale

- `wholesale_leads` acepta `interestType` y `estimatedVolume`.
- la landing mayorista reutiliza el mismo formulario para ruta `wholesale` y `distributor`.

## Riesgos controlados

- esta ola no migra snapshots a Prisma.
- la regla automática del `10%` sólo se dispara en alta manual de afiliado con flag explícito.
- el reporte de inventario usa la misma reserva/confirmación del ledger actual; no hay un segundo conteo paralelo.

## Verificación mínima obligatoria

- typecheck completo del monorepo.
- prueba manual de pedido impago → pago manual registrado → transición operativa.
- prueba manual de alta de afiliado con regla automática.
- prueba manual de producto `internal` fuera del storefront.
- prueba manual de testimonial `audio/social` visible en la home premium.
