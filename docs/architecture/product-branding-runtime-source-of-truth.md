# Fuente Unica Producto Y Branding Runtime

[README principal](../../README.md) | [Indice docs](../README.md) | [Mapa de modulos](./modules.md)

## Objetivo

Cerrar `F2-URG-01` dejando explicito que modulo es duenio de cada dato que alimenta `home`, `catalogo`, `PDP`, `checkout` y el shell publico de Huele Huele.

## Decision

La fuente unica de runtime se separa en tres capas:

1. `products` para hechos de producto y venta
2. `cms` para branding y contenido editorial publico
3. `media` para binarios publicos, con referencias guardadas por el modulo dueno

`packages/shared/src/mock-data.ts` queda como semilla y fallback de desarrollo, no como fuente operativa de produccion para catalogo, precio, stock o disponibilidad.

## Ownership Por Tipo De Dato

| Dato | Modulo dueno | Persistencia | Superficies consumidoras | No debe vivir en |
| --- | --- | --- | --- | --- |
| nombre, slug, descripcion, `badge`, `tone`, `benefits`, status, salesChannel, reportingGroup, `detailAttributesJson` | `products` | `products` en Prisma | admin, `catalog`, `commerce`, PDP | CMS |
| SKU, precio, compareAtPrice, stock, lowStockThreshold, warehouse default | `products` | `product_variants` y balances | admin, catalogo publico, checkout, pedidos | CMS, `shared/mock-data` |
| imagenes de producto y orden principal de galeria | `products` | `product_images` con upload por `media` | catalogo, PDP, checkout | CMS |
| composicion de bundle | `products` | `product_bundle_components` | catalogo, checkout, inventario | CMS |
| categorias comerciales | `products` | `categories` | admin, catalogo | CMS |
| logo publico, favicon, loading image, hero image del shell | `cms` | `module_snapshots` / estado CMS | `web/app/layout.tsx`, home | `products` |
| brandName, tagline, `featuredProductSlugs[]`, soporte, WhatsApp, shippingFlatRate, billetera | `cms` | `siteSetting` | layout publico, home, checkout | `products`, `shared/mock-data` como runtime productivo |
| hero copy, navegacion web, banners, FAQs, testimonios, paginas CMS | `cms` | snapshot CMS | home y rutas publicas | `products` |
| binarios publicos | `media` | R2 o storage local | web, admin, API | `shared/mock-data` |
| lectura publica de productos | `catalog` | derivada de `products` | `web` | CMS, `shared/mock-data` |
| tiers mayoristas | `wholesale` | modulo mayorista | home premium, mayoristas | `shared/mock-data` como fuente productiva |

## Reglas Runtime

- `home`, `catalogo`, `PDP` y `checkout` deben leer producto vendible desde `catalog` o `products`, no desde `featuredProducts`.
- la curacion del home vive en `cms.siteSetting.featuredProductSlugs[]`; si esa lista esta vacia, el fallback permitido es `products.isFeatured`.
- `cms` no duplica `price`, `sku`, stock, warehouse, bundle composition ni status de venta.
- `products` no guarda copy de hero, FAQs, testimonios, logo, favicon ni navegacion publica.
- el merch visible del producto (`badge`, `tone`, `benefits`) pertenece a `products`; no se hardcodea por slug en el runtime publico.
- `media` solo entrega y versiona binarios; la referencia logica vive en `product_images`, `siteSetting` o el artefacto CMS correspondiente.
- `detailAttributesJson` pertenece a `products` porque alimenta la ficha publica del producto, pero es editorial de PDP y no reemplaza una futura taxonomia estructurada de variantes.
- `detailAttributesJson` no define opciones vendibles. Si un atributo afecta seleccion de compra, precio, stock, fulfillment o descuento de inventario, debe vivir en `product_variants`.
- `Aromas` o `Presentacion` en la ficha publica son copy informativo. El contrato comprable real es `variantId`.
- un aroma vendible siempre debe existir como variante `active` con `sku`, `flavorCode`, `flavorLabel`, `presentationCode`, `presentationLabel`, precio y balances propios por almacen.
- el saldo operativo canonico de venta es `WarehouseInventoryBalance(variantId, warehouseId)`, no un stock agregado por producto generico.

## Excepciones Permitidas

- En desarrollo local o si el runtime publico no esta disponible, `shared/mock-data` puede seguir sirviendo como semilla o fallback tecnico.
- En produccion no se debe sintetizar catalogo vendible, precio o stock desde `shared/mock-data`.
- El shell publico puede conservar fallback minimo de marca para no romper render estructural si `siteSetting` no responde, pero eso no convierte a `shared/mock-data` en fuente de verdad.

## Contrato Minimo De Implementacion

Para considerar cerrado `F2-URG-01`:

- `apps/web` consume catalogo vendible desde `/store/catalog` o `/store/products/:slug`
- `apps/web` consume branding y contenido desde `/store/cms` o `/store/site-settings`
- el premium landing no declara productos ni tiers mayoristas como contenido estatico fuente
- `shared/mock-data` se trata como bootstrap/fallback, no como runtime canonico
- la documentacion vigente refleja esta separacion

## Rutas Canonicas Relacionadas

- [apps/api/src/modules/products/products.service.ts](/Users/rapha/Projects/ERP-HUELEHUELE/apps/api/src/modules/products/products.service.ts:1002)
- [apps/api/src/modules/catalog/catalog.service.ts](/Users/rapha/Projects/ERP-HUELEHUELE/apps/api/src/modules/catalog/catalog.service.ts:11)
- [apps/api/src/modules/cms/cms.service.ts](/Users/rapha/Projects/ERP-HUELEHUELE/apps/api/src/modules/cms/cms.service.ts:1077)
- [apps/web/features/storefront-v2/lib/content.ts](/Users/rapha/Projects/ERP-HUELEHUELE/apps/web/features/storefront-v2/lib/content.ts:124)
- [apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx](/Users/rapha/Projects/ERP-HUELEHUELE/apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx:13)
