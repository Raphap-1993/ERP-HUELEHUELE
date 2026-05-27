# Spec Funcional - CMS Content Blocks Marketing Surfaces

Fecha: 2026-05-26.

## Objetivo

Definir el slice canonico del CMS editorial vigente de Huele Huele como paquete
SDD, fijando singleton globales, media publica corta, rutas conocidas, bloques
tipados, SEO por ruta y fallback seguro sin convertir el brownfield en un
campaign manager, CRM ampliado ni page builder libre.

## Alcance

Incluye:

- `site settings`, `hero copy` y `navigation` como singleton globales
- media publica del CMS embebida en `siteSetting`
- `banners`, `faqs` y `testimonials` como colecciones editoriales cortas
- `pages` conocidas con `draft/published/archived`
- `blocks` tipados por route ID conocido
- `seoMeta` por ruta con `title`, `description`, `keywords`,
  `canonicalPath` y `robots`
- consumo publico snapshot-backed con fallback seguro
- ownership operativo principal en `marketing`

No incluye:

- campaigns, segments ni templates
- CRM ampliado ni `marketing_events`
- page builder libre
- slugs o rutas publicas arbitrarias creadas desde admin
- bloques genericos sin contrato editorial conocido
- workflow editorial multinivel obligatorio
- art direction premium del storefront como alcance funcional del CMS

## Actores

- `marketing`
- `cms`
- `media`
- `web/storefront`
- `admin`
- `super_admin`

## Reglas Funcionales Canonicas

### RF-01. Ownership editorial directo

- `marketing` es el dueno operativo principal del slice
- `admin` y `super_admin` conservan soporte y override
- este corte no exige aprobacion editorial multinivel antes de publicar

### RF-02. Singleton globales del sitio

- `site settings` = `siteSetting`
- `hero copy` = `heroCopy`
- `navigation` = `webNavigation`
- esos tres nombres de negocio y runtime describen los mismos singleton
  globales del snapshot CMS

### RF-03. Media publica embebida en `siteSetting`

- la media publica del slice viaja hoy dentro de `siteSetting`
- los campos vigentes son `headerLogoUrl`, `adminSidebarLogoUrl`,
  `heroProductImageUrl`, `loadingImageUrl` y `faviconUrl`
- `media` resuelve upload y reemplazo tecnico; no se abre un objeto top-level
  `cms.media`

### RF-04. Assets editoriales cortos como colecciones top-level

- `banners`, `faqs` y `testimonials` viven como colecciones compartidas del
  snapshot CMS
- esas colecciones usan `active/inactive`
- la lectura publica solo debe exponer items `active`

### RF-05. Paginas conocidas y ciclo editorial

- las unicas rutas conocidas del slice son `home`, `catalogo`, `mayoristas`,
  `trabaja-con-nosotros`, `cuenta` y `checkout`
- las `pages` usan `draft`, `published` y `archived`
- `archived` no debe exponerse en lectura publica
- el slice no habilita creacion de slugs arbitrarios desde `/admin/cms`

### RF-06. Bloques tipados por route ID conocido

- cada route ID admite solo bloques compatibles con su contrato editorial
- el contrato actual es:
  - `home`: `hero`, `promo-banner`, `featured-products`, `benefits`, `faq`
  - `catalogo`: `hero`, `product-grid`
  - `mayoristas`: `hero`, `wholesale-plans`, `lead-form`
  - `trabaja-con-nosotros`: `hero`, `vendor-application-form`
  - `cuenta`: `auth`, `loyalty`
  - `checkout`: `checkout-summary`, `payment-methods`
- `promo-banner` y `faq` en `home` consumen colecciones top-level activas
- `testimonials` se consumen hoy desde la coleccion top-level y no desde un
  bloque canonico de `pages.blocks`

### RF-07. SEO operativo por ruta conocida

- cada pagina conocida puede definir `title`, `description`, `keywords`,
  `canonicalPath` y `robots`
- `cuenta` y `checkout` pueden operar con `noindex,nofollow`
- el SEO pertenece a la pagina conocida; no a campaigns ni a un subsistema
  SEO separado

### RF-08. Publicacion editorial directa

- `marketing` publica contenido y SEO sin depender de deploy
- la publicacion directa no implica libertad para crear nuevas superficies
  publicas ni nuevas familias visuales
- los bloques de pagina usan `active/inactive` como bandera de render y no
  reemplazan el estado editorial de la `page`

### RF-09. Consumo publico con fallback seguro

- `web/storefront` intenta leer el snapshot CMS antes de renderizar
- si el snapshot es valido, consume singleton globales, colecciones activas,
  SEO por ruta y paginas conocidas
- si el snapshot falla o llega incompleto, la superficie publica usa defaults
  seguros ya curados
- el fallback no debe inventar rutas nuevas ni exponer contenido archivado

### RF-10. Frontera con dominios posteriores

- `checkout`, `cuenta`, mayoristas y postulaciones solo ceden copy y SEO al
  CMS; su logica de negocio sigue fuera del slice
- campaigns, CRM ampliado y page builder libre quedan fuera de este corte

## Escenarios Principales

### Escenario A. Configuracion global y media publica

1. `marketing` edita `site settings`, `hero copy` o `navigation`.
2. `marketing` reemplaza logo, hero image, loading image o favicon.
3. `cms` persiste el snapshot editorial actualizado.
4. `web/storefront` consume la configuracion valida mas reciente.

### Escenario B. Publicacion de pagina conocida con bloques y SEO

1. `marketing` opera una ruta conocida desde `/admin/cms`.
2. Define titulo, descripcion, estado editorial y `seoMeta`.
3. Asigna o reordena bloques tipados compatibles con esa ruta.
4. `cms` persiste la pagina, los bloques y el SEO por route ID.

### Escenario C. Consumo publico de home snapshot-backed

1. `web/storefront` intenta cargar el snapshot CMS.
2. Si la carga es valida, consume `heroCopy`, `banners`, `faqs`,
   `testimonials` y media publica de `siteSetting`.
3. Si el snapshot falla o llega incompleto, la home degrada a defaults
   seguros.
4. La ruta sigue renderizando sin romper la operacion.

### Escenario D. SEO protegido en rutas transaccionales

1. `marketing` ajusta metadata de `cuenta` o `checkout`.
2. La ruta conserva `canonicalPath` y `robots` segun su uso real.
3. El storefront publica copy y SEO, pero no cede la logica transaccional del
   dominio al CMS.

## Criterios De Aceptacion

| ID | Criterio |
| --- | --- |
| CA-01 | `marketing` es el owner operativo principal del CMS |
| CA-02 | `siteSetting`, `heroCopy` y `webNavigation` quedan fijados como singleton globales |
| CA-03 | la media publica del slice sigue embebida en `siteSetting` |
| CA-04 | `banners`, `faqs` y `testimonials` usan `active/inactive` |
| CA-05 | las paginas del slice solo usan las rutas conocidas `home`, `catalogo`, `mayoristas`, `trabaja-con-nosotros`, `cuenta` y `checkout` |
| CA-06 | cada ruta conocida solo admite el set de bloques tipados documentado |
| CA-07 | `seoMeta` por ruta soporta `canonicalPath` y `robots` |
| CA-08 | `cuenta` y `checkout` pueden operar con `noindex,nofollow` |
| CA-09 | el storefront sigue renderizando con fallback seguro si el snapshot CMS falla |
| CA-10 | el slice no abre campaigns, CRM ampliado ni page builder libre |

## Casos Negativos Relevantes

- intento de crear un slug fuera del set conocido: fuera de alcance
- bloque incompatible con la ruta: debe tratarse como violacion del contrato
- snapshot incompleto o con error: la ruta publica degrada a defaults seguros
- asset `inactive` en snapshot: no debe exponerse en superficies publicas
- pagina `archived`: no debe publicarse en lectura externa
- intento de usar el CMS como motor de campaigns o CRM: fuera de alcance

## Dependencias De Negocio

- el negocio ya opera contenido publico real desde `/admin/cms`
- `marketing` conserva ownership operativo principal sobre contenido y SEO
- la web publica necesita continuidad aunque falle la lectura del snapshot CMS
- el producto mantiene una frontera clara entre contenido editorial, media
  tecnica y dominios transaccionales
