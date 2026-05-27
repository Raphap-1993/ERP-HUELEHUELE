# Spec Tecnica - CMS Content Blocks Marketing Surfaces

Fecha: 2026-05-26.

## Objetivo Tecnico

Formalizar y endurecer las fronteras tecnicas del CMS editorial vigente sin
reescribir el agregado brownfield. El slice debe preservar la separacion entre
`marketing`, `cms`, `media`, `web/storefront`, `admin` y `super_admin`,
dejando explicito que el CMS gobierna copy, SEO y contratos editoriales de
rutas conocidas, pero no la logica de negocio de `catalogo`, mayoristas,
`cuenta` ni `checkout`.

## Baseline Real Del Repo

### Contratos compartidos y agregado CMS

- `packages/shared/src/domain/models.ts`
  - define `CmsSeoMeta`, `CmsPageBlock`, `CmsPage`, `CmsBanner`, `CmsFaq` y
    `CmsTestimonial`
  - mantiene en `SiteSetting` campos publicos como `featuredProductSlugs`,
    `headerLogoUrl`, `adminSidebarLogoUrl`, `heroProductImageUrl`,
    `loadingImageUrl` y `faviconUrl`
- `packages/shared/src/types/api.ts`
  - expone `CmsSnapshotResponse` con `siteSetting`, `heroCopy`,
    `webNavigation`, `banners`, `faqs`, `pages`, `testimonials` y `seoMeta`
  - expone envelopes del snapshot y acciones CMS

### Admin y mutacion editorial

- `apps/admin/app/cms/page.tsx`
  - publica `/admin/cms` detras de `adminAccessRoles.cms`
- `apps/admin/components/cms-workspace.tsx`
  - consume el snapshot admin
  - opera editor de pagina por `slug`, estado, bloques y `seoMeta`
  - resume paginas, banners, FAQs, testimonios y navegacion
- `apps/api/src/modules/cms/admin-cms.controller.ts`
  - expone `GET/PATCH /admin/cms/site-settings`
  - expone uploads de logo, admin sidebar logo, hero image, loading image y
    favicon
  - expone `GET/PATCH /admin/cms/hero-copy` y
    `GET/PATCH /admin/cms/navigation`
  - expone `GET/PATCH /admin/cms/pages/:slug` y
    `PATCH /admin/cms/pages/:slug/blocks`
  - expone CRUD corto para `banners`, `faqs` y `testimonials`

### Dominio `cms`, snapshot y auditoria

- `apps/api/src/modules/cms/cms.service.ts`
  - `getSnapshot()` devuelve snapshot publico con `publicView = true`
  - `getAdminSnapshot()` devuelve snapshot completo para backoffice
  - `updateSiteSettings()`, `updateHeroCopy()` y `updateNavigation()` mutan
    singleton globales
  - `uploadSiteLogo()`, `uploadAdminSidebarLogo()`,
    `uploadHeroProductImage()`, `uploadLoadingImage()` y `uploadFavicon()`
    actualizan media publica dentro de `siteSetting`
  - `upsertPage()` y `updatePageBlocks()` gobiernan `pages` y `blocks`
  - `buildSnapshot()` deriva el arreglo top-level `seoMeta` desde
    `page.seoMeta`
  - `persistState()` guarda `CmsSnapshotResponse` en `module_state`
  - `recordAdminAction()` audita mutaciones editoriales
- `apps/api/src/modules/media/media.service.ts`
  - resuelve upload, reemplazo y URLs publicas usadas por el CMS

### Read model publico y fallback

- `apps/api/src/modules/cms/cms.controller.ts`
  - expone `/store/cms`, `/store/site-settings`, `/store/navigation`,
    `/store/pages/:slug`, `/store/banners`, `/store/faqs` y
    `/store/testimonials`
- `apps/web/features/storefront-v2/lib/content.ts`
  - `loadStorefrontV2Content()` intenta `fetchCmsSnapshot()`
  - cae a defaults curados (`heroCopy`, `promoBanners`, `faqItems`,
    `cmsTestimonials`, `featuredProducts`) cuando la carga falla
  - filtra `banners`, `faqs` y `testimonials` a `active`
- `apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx`
  - consume `heroCopy`, `siteSetting.heroProductImageUrl`,
    `faqs active` y `testimonials active`
  - mezcla contenido CMS con layout premium curado en codigo

## Frontera Tecnica Objetivo

### 1. `marketing` sigue siendo la puerta operativa del contenido

- opera contenido y SEO desde `/admin/cms`
- no gobierna campaigns, segments ni CRM ampliado desde este slice
- no recibe libertad para crear rutas o layouts arbitrarios

### 2. `cms` sigue siendo el master del agregado editorial

- dueno de `siteSetting`, `heroCopy`, `webNavigation`, `pages`, `blocks`,
  `banners`, `faqs`, `testimonials` y `seoMeta`
- conserva el snapshot canonico del dominio
- no asume logica transaccional de pagos, identidad, loyalty ni mayoristas

### 3. `media` sigue siendo una capacidad tecnica de soporte

- resuelve upload, transformacion y reemplazo de assets
- no decide copy, SEO ni estados editoriales
- la media del slice sigue embebida en `siteSetting`; no en `cms.media`

### 4. `web/storefront` sigue siendo consumidor read-only con fallback seguro

- consume snapshot valido cuando existe
- filtra activos y evita romper la ruta si la lectura falla
- no muta contenido ni sustituye contratos editoriales por composicion libre

### 5. Las rutas conocidas siguen protegiendo las fronteras funcionales

- `home` resuelve `/`
- `catalogo`, `mayoristas`, `trabaja-con-nosotros`, `cuenta` y `checkout`
  siguen siendo superficies conocidas del producto
- el CMS solo gobierna copy, SEO y ubicaciones tipadas; no transfiere dominio

## Ajustes Minimos Recomendados

Este slice no abre un modulo nuevo. Solo cierra contratos vivos del
brownfield.

### Shared contracts

Rutas candidatas:

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/models.ts`

Ajustes recomendados:

- conservar `CmsSnapshotResponse` como agregado editorial unico
- mantener `siteSetting`, `heroCopy` y `webNavigation` como singleton
  explicitamente nombrados
- reflejar que la media publica vigente pertenece a `SiteSetting`
- endurecer, cuando haga falta, unions de route IDs y bloques tipados sin
  abrir un builder libre

### API y modulo `cms`

Rutas candidatas:

- `apps/api/src/modules/cms/admin-cms.controller.ts`
- `apps/api/src/modules/cms/cms.controller.ts`
- `apps/api/src/modules/cms/cms.service.ts`

Ajustes recomendados:

- conservar `getSnapshot()` como read model publico y `getAdminSnapshot()`
  como lectura completa de backoffice
- endurecer la validacion de slugs conocidos y bloques permitidos por ruta
- mantener `seoMeta` derivado desde `page.seoMeta`
- preservar uploads de media como actualizacion de `siteSetting`

### Admin y storefront

Rutas candidatas:

- `apps/admin/components/cms-workspace.tsx`
- `apps/web/features/storefront-v2/lib/content.ts`
- `apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx`

Ajustes recomendados:

- mantener `/admin/cms` como workbench editorial, no como visual builder
- conservar el filtrado de assets `active` en lectura publica
- sostener fallback seguro en web sin inventar rutas nuevas
- seguir tratando el storefront premium como composicion curada en codigo

## Reglas Tecnicas Del Slice

1. `CmsSnapshotResponse` sigue siendo el agregado editorial unico del slice.
2. `siteSetting`, `heroCopy` y `webNavigation` siguen siendo singleton
   globales del snapshot.
3. La media publica vigente sigue viajando dentro de `siteSetting`.
4. `pages` solo deben corresponder a route IDs conocidos del CMS.
5. `banners`, `faqs` y `testimonials` se filtran a `active` en lectura
   publica.
6. `getPage()` y `listPages(publicView)` no deben publicar `archived`.
7. `seoMeta` se deriva de cada `page.seoMeta` y conserva `canonicalPath` y
   `robots`.
8. `checkout` y `cuenta` pueden recibir copy y SEO desde CMS, pero no ceden
   su logica de negocio.
9. El fallback seguro termina en `web/storefront`; el API no debe inventar
   rutas ni contenido falso.
10. Cada mutacion editorial relevante debe persistirse en `module_state` y
    auditarse via `recordAdminAction()`.

## Seguridad Y Observabilidad

Guardrails ya visibles o exigibles para este slice:

- `adminAccessRoles.cms` limita `/admin/cms` a `super_admin`, `admin` y
  `marketing`
- `@RequireRoles(...adminAccessRoles.cms)` protege `AdminCmsController`
- `recordAdminAction()` ya deja trazas para:
  - `cms.site_settings.updated`
  - `cms.site_settings.logo_updated`
  - `cms.site_settings.admin_sidebar_logo_updated`
  - `cms.site_settings.hero_image_updated`
  - `cms.site_settings.loading_image_updated`
  - `cms.site_settings.favicon_updated`
  - `cms.hero_copy.updated`
  - `cms.navigation.updated`
  - `cms.page.updated`
  - `cms.page.blocks.updated`
  - `cms.banner.created` y `cms.banner.updated`
  - `cms.faq.created` y `cms.faq.updated`
  - `cms.testimonial.created` y `cms.testimonial.updated`
- `persistState()` guarda el snapshot `cms` completo en `module_state`
- los uploads del admin ya exponen limites de archivo acotados por endpoint

## Estrategia De Implementacion

### Release 1. Contratos compartidos y ownership editorial

- consolidar el vocabulario comun del snapshot CMS
- fijar singleton globales y media publica embebida en `siteSetting`
- cerrar permisos y ownership del workbench `/admin/cms`

### Release 2. Rutas conocidas, bloques tipados y SEO

- endurecer slugs conocidos y contrato de bloques por ruta
- sostener `draft/published/archived` en `pages`
- formalizar `canonicalPath` y `robots` por route ID

### Release 3. Read model publico y fallback seguro

- blindar consumo publico snapshot-backed
- sostener defaults seguros cuando falle `fetchCmsSnapshot()`
- preservar la frontera entre copy CMS y logica de negocio de otras rutas

## Estrategia De Pruebas

### API y admin

Rutas candidatas:

- `apps/api/src/modules/cms/cms.service.ts`
- pruebas del modulo CMS y del admin controller

Cobertura esperada:

- snapshot admin con `draft`, `published`, `archived` y assets activos/inactivos
- snapshot publico sin `archived` y con colecciones filtradas a `active`
- roundtrip de `seoMeta` con `canonicalPath` y `robots`
- uploads que actualizan URLs publicas dentro de `siteSetting`
- bloqueo de rutas o bloques fuera del contrato canonico cuando esa validacion
  se endurezca

### Storefront

- validar fallback de `loadStorefrontV2Content()` ante falla de snapshot
- validar filtrado `active` en `banners`, `faqs` y `testimonials`
- validar consumo de `heroCopy` y `heroProductImageUrl` en la experiencia
  premium
- validar que `cuenta` y `checkout` sigan tratando el CMS como proveedor de
  copy/SEO y no de logica transaccional

## Riesgos Tecnicos Abiertos

- `normalizeBlocks()` valida forma minima, pero hoy no endurece por si solo el
  whitelist de tipos por ruta
- la lectura publica de `pages` bloquea `archived`; si producto exige
  published-only como guardrail tecnico estricto, eso requiere hardening
  adicional
- la experiencia premium sigue mezclando contenido CMS con layout y secciones
  curadas en codigo
- la media publica permanece acoplada a `siteSetting` por decision brownfield,
  no por ausencia de necesidad futura
