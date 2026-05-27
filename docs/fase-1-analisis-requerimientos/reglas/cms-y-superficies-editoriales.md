# Reglas De CMS Y Superficies Editoriales

- `marketing` es el dueno operativo principal del CMS
- `admin` y `super_admin` conservan soporte y override operativo
- `site settings`, `hero copy` y `navigation` son singleton globales
- `banners`, `faqs` y `testimonials` usan `active/inactive`
- `banners`, `faqs` y `testimonials` son colecciones top-level compartidas del
  snapshot CMS
- `pages` usan `draft/published/archived`
- los `page blocks` usan `active/inactive` como bandera de render dentro de la
  pagina
- solo existen rutas conocidas en este slice: `home`, `catalogo`,
  `mayoristas`, `trabaja-con-nosotros`, `cuenta` y `checkout`
- los bloques permitidos dependen de la ruta conocida
- `home` admite `hero`, `promo-banner`, `featured-products`, `benefits` y
  `faq`
- `catalogo` admite `hero` y `product-grid`
- `mayoristas` admite `hero`, `wholesale-plans` y `lead-form`
- `trabaja-con-nosotros` admite `hero` y `vendor-application-form`
- `cuenta` admite `auth` y `loyalty`
- `checkout` admite `checkout-summary` y `payment-methods`
- `promo-banner` en `home` consume `banners` `active`
- `faq` en `home` consume `faqs` `active`
- el render de testimonios consume `testimonials` `active` desde la coleccion
  top-level en las superficies aprobadas; este slice no define un bloque
  canonico `testimonial` dentro de `pages.blocks`
- `seoMeta` por ruta incluye `title`, `description`, `keywords`,
  `canonicalPath` y `robots`
- `cuenta` y `checkout` pueden operar con `noindex,nofollow`
- el storefront solo expone assets `active` y paginas publicables
- el storefront debe aplicar fallback seguro si falla el snapshot CMS o llega
  incompleto
- el CMS editorial no gobierna campaigns, segments ni CRM ampliado
