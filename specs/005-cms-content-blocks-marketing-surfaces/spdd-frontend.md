# SPDD Frontend - CMS Content Blocks Marketing Surfaces

Fecha: 2026-05-26.

## Superficies cubiertas

- `/admin/cms`
- `/`
- `/catalogo`
- `/mayoristas`
- `/trabaja-con-nosotros`
- `/cuenta`
- `/checkout`

## Contratos visibles

- snapshot editorial unico con `siteSetting`, `heroCopy`, `webNavigation`,
  `banners`, `faqs`, `pages`, `testimonials` y `seoMeta`
- editor de pagina por `slug` conocido, estado editorial, SEO por ruta y
  bloques JSON
- `banners`, `faqs` y `testimonials` `active` como colecciones compartidas del
  snapshot
- `home` consume hero, media publica, producto destacado curado, FAQs y
  testimonios activos segun la superficie publica
- `cuenta` y `checkout` pueden exponer `robots` `noindex,nofollow`
- fallback a defaults editoriales cuando falte snapshot valido o llegue
  incompleto

## Bloques conocidos por ruta

- `home`: `hero`, `promo-banner`, `featured-products`, `benefits`, `faq`
- `catalogo`: `hero`, `product-grid`
- `mayoristas`: `hero`, `wholesale-plans`, `lead-form`
- `trabaja-con-nosotros`: `hero`, `vendor-application-form`
- `cuenta`: `auth`, `loyalty`
- `checkout`: `checkout-summary`, `payment-methods`
- `promo-banner` y `faq` funcionan como slots consumidores de colecciones
  compartidas
- `testimonials` siguen siendo coleccion top-level en las superficies aprobadas

## Reglas visibles

- `/admin/cms` es la superficie operativa principal y no un visual builder
- no se crean rutas publicas arbitrarias desde admin
- el render publico sigue atado a contratos por ruta conocida y a atomos CMS
  concretos, no a composicion libre de bloques
- `marketing` publica contenido y SEO sin deploy, pero no gobierna campaigns ni
  CRM ampliado desde este slice
- una falla del snapshot CMS no puede romper la home ni las rutas conocidas

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md`
- `docs/fase-1-analisis-requerimientos/reglas/cms-y-superficies-editoriales.md`

## Dependencias de Fase 3

- el ownership entre `marketing`, `cms`, `media`, `web/storefront`, `admin` y
  `super_admin`
- la ADR de rutas conocidas y fallback seguro del slice
