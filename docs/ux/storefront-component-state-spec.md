# Spec De Componentes Y Estados Del Storefront

[README principal](../../README.md) | [Indice docs](../README.md) | [Sistema visual](./design-system.md) | [Spec de superficies](./public-storefront-surface-spec.md)

## Objetivo

Definir el contrato operativo de los componentes UX del storefront publico para que el look pueda cambiar despues sin reabrir reglas de negocio, estados semanticos ni ownership de datos.

## Decision Canonica De Este Corte

- `Huele Verde Vivo` es el baseline visual canonico de las superficies publicas.
- el baseline verde toma ritmo, framing, panelizacion, lorito, tipografia redondeada y motion suave desde el home actual.
- `storefront-v2-game` queda como preview historico; no define copy, naming ni runtime publico.
- la semantica canonica del storefront vive en esta spec, en [public-storefront-surface-spec.md](./public-storefront-surface-spec.md) y en [api-v1-outline.md](../api/api-v1-outline.md).
- un rediseño futuro puede cambiar color, tipografia, textura, iconografia o densidad, pero no debe borrar precio, stock, variante, totales, accesos comerciales ni estados de error.

## Separacion Obligatoria

1. `Sistema visual`
   - color, tipografia, profundidad, textura, atmosfera
2. `Contrato de componente`
   - que muestra, que accion habilita y que estados soporta
3. `Contrato de datos`
   - de donde sale cada valor y quien lo gobierna

La capa `1` es mutable. Las capas `2` y `3` deben mantenerse estables entre iteraciones visuales.

## Vocabulario Comun De Estados

| Estado | Significado | Uso minimo |
| --- | --- | --- |
| `loading` | hay fetch o hidratacion pendiente | shell, hero, grids, checkout summary, cuenta |
| `empty` | el endpoint respondio bien pero no hay contenido util | catalogo, resumen, tablas, tiers |
| `error` | fallo de red o runtime sin dato util | hero fallback, catalogo, checkout, cuenta |
| `available` | el item se puede comprar | product card, PDP, selector de variantes |
| `low_stock` | el item se puede comprar pero con escasez | badges de stock, selector, checkout |
| `out_of_stock` | no se puede comprar | product card, PDP, selector, checkout |
| `select_variant` | el producto exige elegir `variantId` antes de comprar | product card, PDP |
| `variant_missing` | la variante guardada ya no existe o no matchea | checkout |
| `quote_loading` | el total se esta recalculando desde backend | checkout summary |
| `session_checking` | se valida token o sesion | `/cuenta`, `/mayoristas`, `/panel-vendedor` |
| `submit_success` | formulario o accion concluyo bien | mayoristas, checkout evidencia |
| `submit_error` | formulario o accion fallo y requiere reintento | mayoristas, checkout, login |

## Matriz Canonica

| Componente | Fuente de datos canonica | Superficies |
| --- | --- | --- |
| `PublicHeader` | `GET /store/site-settings`, `GET /store/cms.webNavigation` | `/`, `/catalogo`, `/producto/[slug]`, `/checkout`, `/cuenta`, `/mayoristas`, `/panel-vendedor` |
| `PublicFooter` | `GET /store/site-settings`, `GET /store/cms.webNavigation` | mismas superficies publicas, incluido `/checkout` cuando el layout no lo simplifica |
| `HeroSection` | `GET /store/cms.heroCopy`, `GET /store/site-settings` | `/` |
| `ProductCard` | `GET /store/catalog.products[]` | `/`, `/catalogo` |
| `ProductGrid` | `GET /store/catalog` | `/`, `/catalogo` |
| `StockBadge` | `stockStatus`, `stockLabel`, `availableStock`, `isPurchasable` | cards, PDP, selector, checkout |
| `PDPMediaGallery` | `GET /store/products/:slug.images[]` | `/producto/[slug]` |
| `ProductVariantSelector` | `GET /store/products/:slug.variants[]` | `/producto/[slug]` |
| `CheckoutSummary` | `POST /store/checkout/quote`, `GET /store/site-settings` | `/checkout` |
| `CommercialAccessShell` | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `GET /store/me/loyalty`, `GET /store/wholesale-tiers`, `GET /seller/panel/overview` | `/cuenta`, `/mayoristas`, `/panel-vendedor` |

## Componentes Canonicos

### `PublicHeader`

Objetivo:

- anclar marca, navegacion y CTA primario de compra
- mantener orientacion clara sin competir con el contenido
- compartir el patron sticky tipo pill del home en las rutas publicas canonicas

Contenido minimo:

- marca con `brandName` y `headerLogoUrl`
- navegacion publica
- CTA primario a `/catalogo`
- acceso mobile

Estados:

- `loading`: reservar la geometria del shell, con logo y nav placeholders
- `navigation_empty`: dejar marca + CTA + menu mobile
- `fallback_logo`: si no hay logo remoto, renderizar wordmark o marca de texto
- `error`: usar navegacion curada de fallback; no dejar header vacio

Guardrails:

- la fuente canonica de navegacion es `webNavigation`; un fallback estatico solo sirve como resiliencia temporal
- debe seguir siendo legible y comercial; no adoptar naming arcade como rotulo final
- no esconder el header en superficies canonicas salvo reglas explicitas de layout
- las rutas prototipo pueden ocultar shell global, pero las superficies canonicas deben hacerlo solo por una decision explicita de layout
- el fondo del chrome publico debe cubrir desde el primer pixel de viewport; no debe aparecer una franja blanca antes del header o del contenido

### `PublicFooter`

Objetivo:

- cerrar la navegacion publica y concentrar soporte, marca y enlaces secundarios

Contenido minimo:

- bloque de marca
- grupos de navegacion
- cierre legal o de copyright

Estados:

- `loading`: placeholders de 3 a 4 columnas
- `navigation_empty`: marca y cierre legal siguen visibles
- `error`: fallback a enlaces minimos de soporte y catalogo

Guardrails:

- no duplicar CTA primarios con el mismo peso del header
- el footer puede simplificarse en checkout fullscreen, pero no perder soporte o contacto cuando el flujo lo requiera

### `HeroSection`

Objetivo:

- abrir el storefront con una promesa de marca clara y una salida inmediata a compra

Inputs minimos:

- `eyebrow`
- `title`
- `description`
- `primaryCta`
- `secondaryCta`
- arte o imagen principal opcional

Estados:

- `loading`: copy placeholder + bloque hero reservado
- `content_fallback`: si falla CMS, usar copy comercial minimo y CTA a `/catalogo`
- `image_missing`: conservar tipografia y CTA sin romper jerarquia

Guardrails:

- el hero puede heredar panelizacion, profundidad y mascota del baseline verde
- el copy final no debe depender de chistes, quests, guilds ni lenguaje que degrade claridad comercial
- el CTA primario debe apuntar a compra o catalogo, no a una demo interna

### `ProductCard`

Objetivo:

- resolver escaneo rapido de producto y orientar la accion correcta sin forzar PDP innecesario

Inputs minimos:

- `name`, `slug`, `imageUrl`, `imageAlt`
- `price`, `compareAtPrice`, `currencyCode`
- `badge`, `tagline` o descripcion corta
- `benefits[]`
- `availableStock`, `stockStatus`, `stockLabel`, `isPurchasable`
- `defaultVariantId`, `variantCount`

Modos canonicos:

- `direct`: compra directa si hay una sola variante vendible
- `select_variant`: salida a PDP o selector si requiere `variantId`
- `sold_out`: CTA deshabilitado o reconvertido a informativo

Estados:

- `loading`: skeleton o placeholder de card
- `available`: precio y CTA visibles
- `low_stock`: badge semantico visible
- `out_of_stock`: CTA no vendible, sin inventar urgencia falsa
- `featured`: puede ampliar layout, pero no cambiar contrato

Guardrails:

- nunca ocultar precio, stock o modo de compra por una decision estetica
- si `variantCount > 1`, la UI no debe fingir compra directa
- el label final del CTA depende del modo, no del look
- la card puede mutar visualmente; la decision `direct/select_variant/sold_out` no
- en `catalogo`, la card debe leer como ecommerce moderno: imagen amplia arriba, badges minimos, nombre, precio dominante y CTA claro
- en `catalogo`, la foto puede tener mayor presencia visual que en una lista operacional, pero la card debe conservar lectura rapida, CTA visible y control responsive
- el precio no debe competir con copy descriptivo largo; el copy se limita a dos lineas en desktop y puede ocultarse en mobile

### `ProductGrid`

Objetivo:

- agrupar cards, filtros y lectura de surtido sin friccion

Contenido minimo:

- encabezado de seccion
- filtros o tabs de categoria cuando existan
- grid responsive de cards
- salida clara cuando no hay resultados

Estados:

- `loading`: placeholders de cards con estructura consistente
- `empty`: mensaje + reset de filtros
- `error`: reintento y salida a categoria general

Guardrails:

- el grid no recalcula logica comercial; compone `ProductCard`
- el empty por filtro es distinto al error de catalogo
- los filtros pueden cambiar de forma visual, pero deben seguir leyendo como control claro de exploracion
- la densidad visual recomendada es 3 columnas desktop, 2 tablet y 1 mobile para sostener imagenes grandes sin perder comparacion

### `StockBadge`

Objetivo:

- condensar disponibilidad en una sola pieza semantica y reutilizable

Inputs minimos:

- `stockStatus`
- `stockLabel`
- `availableStock`
- `isPurchasable`

Estados canonicos:

- `available`: tono positivo o ausencia deliberada de badge si no agrega valor
- `low_stock`: tono warning con copy corto
- `out_of_stock`: tono danger o disabled
- `unknown`: opcional; mejor omitir que inventar

Guardrails:

- si backend manda `stockLabel`, ese label gana
- el badge de variante seleccionada tiene prioridad sobre el badge general del producto
- no usar el badge como ornamento; sirve para decision de compra

### `PDPMediaGallery`

Objetivo:

- concentrar media util del producto sin convertir la lectura en un carrusel ornamental

Inputs minimos:

- `product.slug`
- `imageUrl` principal
- `images[]` con `url`, `altText`, `sortOrder`, `isPrimary`, `variantId`

Comportamiento canonico:

- ordenar media por `isPrimary`, luego `sortOrder`, luego `id`
- mostrar una imagen principal dominante
- mostrar miniaturas solo cuando existan multiples assets
- usar fallback de arte por `slug` si falta media remota

Estados:

- `loading`: bloque principal + miniaturas skeleton
- `single_asset`: solo hero media
- `multi_asset`: hero + tira de thumbs
- `asset_missing`: fallback visual sin romper PDP

Guardrails:

- esta ola no promete zoom complejo, video ni slider infinito
- el selector puede destacar media por variante usando `images[].variantId`; si no hay foto especifica, debe mostrar una referencia visual simple sin romper la compra
- no autoplay, no motion intrusivo, no slider infinito por defecto

### `ProductVariantSelector`

Objetivo:

- resolver eleccion de `variantId` con claridad de aroma, presentacion, precio, stock y CTA

Inputs minimos:

- `productSlug`
- `productName`
- `currencyCode`
- `defaultVariantId?`
- `images[]` opcional con `variantId`
- `variants[]`

Comportamiento canonico:

- filtrar a variantes `active`
- normalizar aroma y presentacion en cards de variante
- preseleccionar `defaultVariantId`; si no existe, usar la primera vendible; si no, la primera disponible en lista
- renderizar una referencia visual por variante: foto especifica si existe, icono/swatch si no
- renderizar un solo CTA principal en el resumen seleccionado
- el CTA agrega la variante elegida al checkout con `variantId`

Estados:

- `omitted`: si solo hay una variante util, el selector no necesita mostrarse
- `ready`: selector interactivo
- `option_disabled`: opcion visible pero no comprable
- `selected_low_stock`: stock pill warning y CTA aun habilitado
- `selected_out_of_stock`: CTA deshabilitado

Guardrails:

- el selector manda sobre aroma/presentacion; no usar selects ocultos ni variaciones invisibles
- `variantId` es la unidad canonica de compra
- el componente no inventa stock ni precio; refleja los campos de la variante activa
- cambiar de opcion actualiza resumen textual y CTA de inmediato
- no mostrar lenguaje interno como `variantId`, `CTA`, ruta, configuracion o ficha operativa al cliente final

### `CheckoutSummary`

Objetivo:

- servir de fuente lateral de confianza mientras el usuario completa documento, envio y pago

Inputs minimos:

- `items[]` del carrito
- `quote.items[]`
- `subtotal`, `shipping`, `grandTotal`, `currencyCode`
- `vendorCode?`, `couponCode?`
- `freeShippingThreshold`
- `shippingNote`
- `whatsapp`

Contenido minimo:

- preview de productos con nombre, cantidad y variante si aplica
- subtotal, envio y total
- nota de envio o progreso a envio gratis
- acceso a soporte

Estados:

- `empty_cart`: mensaje claro y salida a catalogo
- `quote_loading`: feedback de recalculo visible
- `variant_missing`: producto marcado como inconsistente
- `province_shalom_pickup`: reemplazar envio por nota de pago al recoger
- `overflow`: resumir items adicionales sin romper legibilidad

Guardrails:

- los totales siempre salen de `quote`; el frontend no debe hacer cuentas paralelas como verdad final
- el summary puede anticipar line totals, pero el valor final es `grandTotal`
- si el quote cambia por variante o envio, el summary debe reflejarlo sin ambiguedad
- este componente no debe esconder errores criticos de stock o variante

### `CommercialAccessShell`

Objetivo:

- resolver acceso comercial y lectura minima de cuenta sin mezclarlo con storytelling retail

Subcomponentes minimos:

- `SessionGate`
- `LoginForm`
- `LoyaltySnapshot`
- `SellerMetricCard`
- `StatusBadge`

Estados:

- `session_checking`: verificacion visible
- `logged_out`: login claro y directo
- `unauthorized`: acceso invalido sin exponer datos
- `empty`: tablas o metricas sin registros
- `error`: fallback con reintento

Guardrails:

- seller y mayorista no deben quedarse en una cuenta retail generica
- si existe redireccion operativa valida, priorizarla sobre vistas intermedias innecesarias
- el lenguaje visual verde puede trasladarse, pero la IA sigue siendo comercial y operacional

## Motion Canonico

Objetivo:

- usar motion para jerarquia, respuesta y continuidad, no para disfrazar vacios de informacion

Reglas:

- `hover` de pressables: desplazamiento maximo de `-2px`
- `active` de pressables: desplazamiento maximo de `+2px`
- `enter` de paneles o cards: fade + translateY maximo de `10px`
- duraciones objetivo:
  - `press`: `120ms`
  - `hover`: `180ms`
  - `enter`: `220ms`
- shimmer o loops solo en superficies decorativas no criticas
- no usar motion para revelar precio, stock, totales o validaciones esenciales

Guardrails:

- toda interaccion debe seguir siendo comprensible sin animacion
- el baseline verde puede empujar personalidad, pero no debe introducir scroll-jacking, parallax agresivo ni bucles sonoros/visuales persistentes

## `prefers-reduced-motion`

Reglas minimas:

- desactivar `scroll-behavior: smooth`
- desactivar `animation`, `transition` y `transform` no esenciales en componentes con motion decorativo
- no depender de shimmer ni entrada animada para comunicar estado
- mantener feedback por color, copy y layout aun cuando la animacion desaparezca

Resultado esperado:

- la UI sigue siendo clara, estable y navegable cuando el usuario pide menos movimiento

## Fuera De Alcance De Esta Ola

- documentar componentes internos de admin no expuestos en surfaces publicas
- cerrar una galeria multimedia avanzada con video o zoom
- convertir `storefront-v2-game` en canon de copy o naming

## Criterio De Exito

Esta spec queda bien cerrada si:

- un rediseño visual puede ejecutarse sin reabrir contratos publicos
- Neon, Aether y Pulse comparten el mismo vocabulario de componentes y estados
- el storefront conserva claridad comercial aunque cambie de lenguaje visual
- nadie necesita volver a preguntar de donde sale precio, stock, variante o total para diseñar el nuevo UX
