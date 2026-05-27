# Product Design - CMS Content Blocks Marketing Surfaces

Fecha: 2026-05-26.

## Experiencia objetivo

- `marketing` controla contenido publico real desde `/admin/cms`
- las rutas conocidas reciben cambios editoriales y SEO sin depender de deploy
- la web publica mantiene continuidad aunque el snapshot CMS falle

## Mapa de vocabulario y snapshot

- `site settings` = `siteSetting`
- `hero copy` = `heroCopy`
- `navigation` = `webNavigation`
- en este slice esos terminos de negocio y runtime nombran los mismos
  singleton globales del snapshot CMS

## Decisiones

- `site settings`/`siteSetting`, `hero copy`/`heroCopy` y
  `navigation`/`webNavigation` se tratan como singleton globales del dominio
  CMS
- no existe hoy un objeto top-level `media` dentro del snapshot; la media
  publica vigente viaja en `siteSetting`
- los asset URLs publicos del slice son `headerLogoUrl`,
  `adminSidebarLogoUrl`, `heroProductImageUrl`, `loadingImageUrl` y
  `faviconUrl`
- las paginas del slice viven solo en `home`, `catalogo`, `mayoristas`,
  `trabaja-con-nosotros`, `cuenta` y `checkout`
- los bloques siguen un contrato tipado por ruta conocida y no abren un page
  builder libre
- `banners`, `faqs` y `testimonials` se operan como colecciones compartidas
  con `active/inactive`
- `promo-banner` y `faq` en `home` consumen colecciones top-level; los
  `testimonials` tambien se consumen hoy desde snapshot top-level y no desde un
  bloque canonico de pagina
- `seoMeta` por ruta es parte del trabajo editorial y puede usar
  `noindex,nofollow` en `cuenta` y `checkout`
- el storefront consume snapshot valido o aplica fallback seguro a defaults
  editoriales

## Tension principal

La experiencia debe darle autonomia operativa a `marketing` sobre contenido
publico real sin vender una promesa falsa de control total del layout.
`/admin/cms` hoy trabaja con editor de pagina por `slug`, SEO por ruta,
colecciones activables y bloques JSON; eso exige una lectura de workbench
editorial serio, no de constructor visual libre.

Al mismo tiempo, la web publica ya mezcla contenido CMS con composicion curada
en codigo. La documentacion de producto tiene que reconocer esa frontera para
no arrastrar este slice hacia campaigns, CRM ampliado o rediseño premium del
storefront. Esa frontera tambien incluye la media publica: hoy se administra
como parte de `siteSetting`, no como subsistema editorial separado dentro del
snapshot.

## Resultado esperado

El slice puede evolucionar a arquitectura y SDD con una lectura comun entre
operacion editorial en `/admin/cms`, rutas publicas conocidas y fallback seguro
del storefront.
