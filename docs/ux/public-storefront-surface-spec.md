# Spec De Superficies Publicas

[README principal](../../README.md) | [Indice docs](../README.md) | [Sistema visual](./design-system.md) | [Componentes y estados](./storefront-component-state-spec.md)

## Objetivo

Dejar una spec canonica para las superficies publicas de `ERP-HUELEHUELE` que permita rediseñar UX sin perder contratos, reglas de negocio ni ownership de datos.

## Decision Canonica De Este Corte

- `Huele Verde Vivo` se adopta como baseline visual canonico para el frente UX publico.
- el home verde con lorito define color, tipografia, atmosfera, paneles y motion para las rutas publicas canonicas.
- el `PublicHeader` canonico usa el mismo patron sticky tipo pill del home sobre fondo verde; ninguna ruta publica canonica debe mostrar una franja blanca antes del contenido.
- `storefront-v2-game` queda como referencia historica/prototipo; no es runtime publico canonico.
- los contratos de datos y las reglas de negocio siguen viniendo del runtime real documentado en:
  - `docs/architecture/product-branding-runtime-source-of-truth.md`
  - `docs/api/api-v1-outline.md`

## Separacion Obligatoria

Para no perder documentacion cuando cambie el look:

1. `Contrato de datos`
   - endpoints, payloads, ownership y estados
2. `Contrato de superficie`
   - objetivo, bloques, CTA, empty/loading/error, restricciones de negocio
3. `Baseline visual canonico`
   - framing, ritmo, densidad, tratamiento de paneles, iconografia y atmosfera

La capa `3` puede mutar despues. En esta ola, esa capa es `Huele Verde Vivo`. Las capas `1` y `2` no deben reescribirse por un cambio de estilo.

## Guardrails Globales

- el producto vendible sale de `catalog` y `products`, no de mock data
- el branding runtime sale de `cms` y `site-settings`
- el checkout sigue siendo un flujo transaccional real de Huele Huele; no se convierte en juego a nivel de negocio
- el copy productivo no debe depender de lenguaje arcade si eso rompe claridad comercial o SEO
- `Huele Verde Vivo` sirve para:
  - composicion
  - panelizacion
  - jerarquia visual
  - ritmo
  - personalidad
- `storefront-v2-game` solo puede consultarse como historial de exploracion y no debe fijar:
  - nombres finales de modulos
  - labels legales o de pago
  - contratos API
  - estados de negocio

## Mapa De Referencia Visual Canonica

| Ruta publica canonica | Baseline visual |
| --- | --- |
| `/` | home verde con lorito |
| `/catalogo` | `HuelePublicPage` + cards verdes de producto |
| `/producto/[slug]` | PDP verde con selector real de variantes |
| `/checkout` | frame verde transaccional y calmado |
| `/mayoristas` | frame verde comercial con modo publico y portal autenticado |
| `/panel-vendedor` | frame verde operacional, denso y legible |
| `/cuenta` | gateway verde de sesion y cuenta |
| `/trabaja-con-nosotros` | formulario verde de postulacion comercial |

## Dependencias De Datos Por Superficie

| Ruta | Dependencias principales |
| --- | --- |
| `/` | `GET /store/cms`, `GET /store/site-settings`, `GET /store/catalog` |
| `/catalogo` | `GET /store/catalog` |
| `/producto/[slug]` | `GET /store/products/:slug` |
| `/checkout` | `POST /store/checkout/quote`, `POST /store/checkout/document-lookup`, ubigeo publico, `GET /store/site-settings`, `POST /store/checkout/manual`, `POST /store/checkout/openpay`, `POST /store/checkout/evidence` |
| `/mayoristas` | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `GET /store/wholesale-tiers`, `POST /store/wholesale-leads` |
| `/cuenta` | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `GET /store/me/loyalty` |
| `/panel-vendedor` | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `GET /seller/panel/overview` |
| `/trabaja-con-nosotros` | `POST /store/vendor-applications` |

## Superficies Canonicas

### `/`

Objetivo:

- presentar la marca
- priorizar seleccion curada y salida rapida a compra
- soportar storytelling corto sin convertirse en landing infinita

Bloques minimos:

- shell publico con branding runtime
- hero principal
- rail o grid corto de productos curados
- bloque de valor o beneficios
- prueba social o testimonios
- FAQ o banner de cierre

CTA principal:

- `Ver catálogo` o `Comprar ahora`

Estados:

- `loading`: shell visible y placeholders de hero/productos
- `empty`: si no hay productos curados, degradar a mensaje de seleccion temporal y salida a `/catalogo`
- `error`: si falla CMS pero hay catalogo, mantener shell y rail de productos; si falla todo, dejar fallback minimo de marca y soporte

Restricciones:

- no hardcodear el catalogo vendible en produccion
- `featuredProductSlugs[]` ordena curacion, no sustituye disponibilidad real
- el hero usa el sistema `Huele Verde Vivo`, pero el contenido sigue siendo comercial real

### `/catalogo`

Objetivo:

- permitir exploracion rapida del surtido disponible
- resolver compra directa en productos simples y salida a PDP en productos con variantes

Bloques minimos:

- encabezado de seccion
- filtros por categoria
- grid de productos
- CTA por card

CTA principal:

- `Comprar` cuando no requiere seleccion de variante
- `Ver detalle` o salida al selector cuando requiere variante

Estados:

- `loading`: card placeholders o bloque de carga
- `empty`: mensaje claro + reset de filtros
- `error`: mensaje de catalogo no disponible + CTA para reintentar

Restricciones:

- la card debe reflejar `stockStatus`, `stockLabel` e `isPurchasable`
- si `variantCount > 1`, no asumir compra directa sin eleccion
- el baseline visual puede empujar personalidad, pero no debe ocultar precio, stock o CTA
- en catalogo, el card canonico es un tile ecommerce vertical: imagen amplia arriba, nombre y precio con lectura inmediata, CTA al cierre
- la imagen puede crecer para seguir el estilo editorial del home, siempre que el producto, precio, stock y CTA sigan visibles sin overflow en desktop, tablet y mobile
- usar maximo un badge principal visible sobre la imagen y hasta dos atributos secundarios; el resto de detalle vive en PDP
- desktop puede usar 3 columnas cuando el ancho lo permite; tablet 2 columnas; mobile 1 columna con CTA full-width

### `/producto/[slug]`

Objetivo:

- resolver la decision final de compra de un producto
- concentrar media, precio, variantes, atributos y CTA en una sola lectura

Bloques minimos:

- breadcrumb o retorno a catalogo
- media principal y galeria
- bloque de nombre, tagline, precio y beneficios
- selector de variantes si aplica
- atributos de detalle
- bloque de bundle components si aplica

CTA principal:

- `Comprar ahora` o equivalente de suma al carrito

Estados:

- `loading`: skeleton de media y panel de compra
- `not_found`: 404 real
- `out_of_stock`: CTA deshabilitado y etiqueta de no disponible
- `variant_missing`: forzar seleccion valida antes de compra

Restricciones:

- la UI debe respetar `variantId` como unidad canonica de seleccion cuando existe mas de una variante
- `detailAttributes[]` es una lista editorial visible y no debe esconder datos clave de compra
- el framing de PDP debe seguir leyendo como ecommerce real aunque use atmosfera verde, mascota y motion suave
- si hay multiples variantes, la compra se concentra en el selector; no duplicar CTA de compra en el hero
- cada variante debe tener referencia visual: primero foto administrada por `images[].variantId`; si no existe, usar icono/swatch de aroma sin inventar stock ni precio
- el copy del selector debe ser comercial y corto; no mostrar lenguaje interno como `variantId`, `CTA`, configuracion o ruta operativa al cliente final

### `/checkout`

Objetivo:

- convertir carrito en pedido sin ambiguedad
- mantener una sola ruta transaccional clara para documento, entrega y pago

Bloques minimos:

- wizard de 3 pasos
- resumen lateral o persistente del pedido
- bloque de identidad documental
- bloque de entrega y ubicacion
- bloque de pago y confirmacion

CTA principal:

- paso 1: avanzar con pedido valido
- paso 2: continuar a pago
- paso 3: confirmar y pagar

Estados:

- `empty_cart`: mensaje de carrito vacio + salida a catalogo
- `loading_quote`: skeleton del resumen y line items
- `document_lookup_loading`: feedback visible
- `document_lookup_error`: fallback manual sin bloquear toda la compra
- `payment_pending_review`: estado final claro para pago manual
- `quote_error`: reintento sin perder contexto del usuario

Restricciones:

- el quote manda en totales, descuentos y flete
- el flujo documental usa `document-lookup` y ubigeo; no duplicar reglas de backend en frontend
- `province_shalom_pickup` deja el flete fuera del total online
- el baseline visual verde puede usar paneles, profundidad y microinteraccion, pero la semantica del pago, documento y entrega debe mantenerse seria y legible

### `/mayoristas`

Objetivo:

- operar como ruta unica para compra al por mayor o distribucion
- capturar leads cuando no hay sesion comercial
- exponer portal autenticado real cuando la sesion trae `portal.wholesale.read`

Bloques minimos:

- modo publico:
  - hero o posicionamiento comercial
  - beneficios del canal
  - cards de tiers
  - formulario de lead
- modo autenticado:
  - identidad comercial y roles
  - estado del portal
  - tiers runtime
  - acciones operativas minimas hacia catalogo, cuenta y logout

CTA principal:

- modo publico: `Solicitar catálogo` o `Enviar solicitud`
- modo autenticado: `Ir al catálogo`

Estados:

- `session_checking`: resolver si la ruta debe renderizar landing o portal autenticado
- `loading_tiers`: placeholders de tiers
- `fallback_tiers`: usar `wholesalePlans` de shared solo como fallback tecnico
- `submit_success`: mensaje de envio + siguiente paso
- `submit_error`: error visible sin limpiar formulario
- `authenticated_ready`: portal cerrado con identidad comercial activa

Restricciones:

- separar claramente mayoreo de compra retail
- `interestType=distributor` puede alterar copy y CTA, no el ownership del flujo
- no crear un `/panel-mayorista` paralelo mientras la arquitectura oficial use `/mayoristas` como ruta unica
- el portal autenticado no debe inventar pedidos, cotizaciones ni tracking si esos modulos todavia no existen en runtime real

### `/cuenta`

Objetivo:

- resolver autenticacion publica y lectura basica de cuenta
- actuar como gateway de portal autenticado, no como dashboard retail generico
- priorizar salida comercial cuando la sesion trae permisos de seller o mayorista

Bloques minimos:

- login gate para sesion no autenticada
- resumen de cuenta base autenticada
- estado de loyalty si existe
- acciones de sesion y acceso comercial
- redirect shell mientras se resuelve el portal destino

CTA principal:

- `Iniciar sesión`
- `Ir a panel vendedor` o `Ir a portal mayorista` cuando los permisos efectivos lo exigen

Estados:

- `checking_session`: verificacion de sesion
- `logged_out`: formulario de acceso
- `redirecting`: cuenta detecta permiso comercial y deriva la sesion a la superficie correcta
- `loyalty_loading`: placeholder de fidelizacion
- `loyalty_unavailable`: degradar sin romper la cuenta
- `access_denied`: la sesion no tiene `portal.account.read`

Restricciones:

- vendedor y mayorista no deben quedarse atrapados en una cuenta de cliente generica
- seller debe redirigir directo a `/panel-vendedor`
- mayorista o distribuidor debe redirigir directo a `/mayoristas`
- esta superficie no debe simular pedidos, tracking, favoritos ni direcciones si esos modulos no existen de verdad
- esta superficie hereda `Huele Verde Vivo` sin simular un dashboard retail que no existe

### `/panel-vendedor`

Objetivo:

- concentrar lectura operativa para seller: ventas, pedidos, comisiones y liquidaciones

Bloques minimos:

- login gate si no hay sesion valida
- encabezado de seller
- metric cards
- tabla o lista de pedidos recientes
- tabla o lista de comisiones
- tabla o lista de payouts

CTA principal:

- navegacion operativa dentro del panel, no compra

Estados:

- `unauthorized`: mensaje claro de acceso invalido
- `loading`: metricas y tablas en espera
- `empty`: sin pedidos o comisiones todavia
- `error`: fallo de overview con reintento

Restricciones:

- requiere `vendorCode` resoluble
- el panel usa el lenguaje verde publico, pero su IA sigue siendo operacional y no narrativa

### `/trabaja-con-nosotros`

Objetivo:

- capturar postulaciones comerciales para afiliados, creadores de contenido, vendedores presenciales u otras colaboraciones
- explicar las modalidades sin convertirlas en una landing separada del sistema visual publico

Bloques minimos:

- hero de postulacion
- modalidades de colaboracion
- beneficios o condiciones base
- formulario de postulacion

CTA principal:

- `Enviar postulacion`

Estados:

- `submit_success`: confirmacion clara y siguiente paso
- `submit_error`: error visible sin limpiar formulario
- `validation_error`: campos marcados sin bloquear el resto de la lectura

Restricciones:

- el formulario no debe duplicar reglas de validacion del backend como verdad final
- el look debe heredar `Huele Verde Vivo` y no la capa premium/editorial anterior
- no mezclar postulacion comercial con checkout, cuenta o portal vendedor

## Fuera De Alcance De Esta Ola

- `/storefront-v2`
- `/storefront-v2-premium`
- las rutas internas del experimento `storefront-v2-game` como URLs canonicas de produccion

## Criterio De Exito

La spec esta bien aterrizada si:

- permite rediseñar el look sin reabrir contratos
- deja claro que `Huele Verde Vivo` es baseline visual canonico y que `storefront-v2-game` queda como prototipo historico
- separa objetivos de superficie de estilo visual
- un frontend/UX puede trabajar el nuevo lenguaje sin volver a preguntar de donde sale cada dato
