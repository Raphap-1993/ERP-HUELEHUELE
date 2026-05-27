# Huele Huele CMS Content Blocks Marketing Surfaces Brownfield Design

Fecha: 2026-05-26.

## Objetivo

Definir el diseno del siguiente slice brownfield a homologar en
`ERP-HUELEHUELE`: `005-cms-content-blocks-marketing-surfaces`.

El slice debe consolidar en la capa canonica intermedia el CMS editorial
vigente de Huele Huele, cubriendo configuracion global del sitio, media
publica, paginas conocidas, bloques tipados, banners, FAQs, testimoniales y
SEO operativo por ruta, sin convertir el dominio en un page builder libre, sin
mezclarlo con `marketing campaigns` y sin rehacer la direccion visual premium
del storefront.

## Contexto

La branch `codex/homologacion-capa-canonica` ya dejo homologados:

- `001-checkout-payments` como base transaccional;
- `002-vendors-commissions` como canal seller-first;
- `003-wholesale-leads-quotes` como funnel B2B asistido;
- `004-loyalty-points-redemptions` como programa de puntos y canjes.

Dentro de `REQ-HH-005` quedaba todavia mezclado un bloque demasiado amplio:

- CMS;
- marketing campaigns;
- loyalty;
- CRM basico.

`Loyalty` ya quedo cubierto por el slice `004`. El siguiente bounded context
natural es el CMS real que ya existe en runtime:

- `/admin/cms`;
- `site settings`;
- `hero copy`;
- `navigation`;
- `banners`;
- `faqs`;
- `testimonials`;
- `pages` y `page blocks`;
- `seoMeta` por ruta conocida;
- media publica para logo, favicon, hero y otros assets visuales.

El objetivo no es inventar un constructor nuevo de paginas, sino formalizar el
dominio editorial operativo que ya gobierna superficies publicas del producto.

## Fuentes brownfield

- `docs/product/scope.md`
- `docs/product/roadmap.md`
- `docs/product/roles-and-permissions.md`
- `docs/data/entities.md`
- `docs/storefront-v2-premium-landing.md`

Fuentes de contraste tecnico y de superficie real del repo:

- `apps/admin/components/cms-workspace.tsx`
- `apps/admin/lib/api.ts`
- `apps/api/src/modules/cms/cms.service.ts`
- `apps/api/src/modules/cms/cms.controller.ts`
- `apps/web/features/storefront-v2/lib/content.ts`
- `apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx`
- `packages/shared/src/types/api.ts`
- `packages/shared/src/mock-data.ts`

## Alcance del slice

### Dentro de alcance

- `site settings` globales del sitio;
- `hero copy` global;
- `navigation` global;
- media publica asociada al CMS:
  - `headerLogoUrl`
  - `adminSidebarLogoUrl`
  - `heroProductImageUrl`
  - `loadingImageUrl`
  - `faviconUrl`
- `banners`, `faqs` y `testimonials`;
- `pages` conocidas con ciclo editorial;
- `page blocks` tipados y restringidos por ruta conocida;
- `seoMeta` por ruta conocida:
  - `title`
  - `description`
  - `keywords`
  - `canonicalPath`
  - `robots`
- superficies publicas conocidas:
  - `home`
  - `catalogo`
  - `mayoristas`
  - `trabaja-con-nosotros`
  - `cuenta`
  - `checkout`
- fallback seguro a contenido estatico/default cuando el snapshot CMS falle o
  sea incompleto.

### Fuera de alcance

- `marketing campaigns`;
- `segments`;
- `templates`;
- `marketing events` y CRM ampliado;
- page builder libre para rutas arbitrarias;
- bloques completamente genericos sin contrato de tipo;
- variantes visuales complejas por pagina;
- gobernar la direccion visual premium del storefront;
- approval workflow editorial multinivel;
- A/B testing y experimentacion de contenido.

## Estrategia recomendada

La homologacion debe hacerse `as-is`, usando el comportamiento real del runtime
como verdad operativa y dejando explicitas las fronteras del dominio.

Eso implica:

- tratar el CMS como dominio editorial operativo;
- mantener `site settings`, `hero copy` y `navigation` como singleton globales;
- usar `active/inactive` para assets editoriales cortos;
- usar `draft/published/archived` para `pages`;
- restringir los `page blocks` por ruta conocida;
- permitir publicacion directa por `marketing`;
- preservar fallback seguro en storefront;
- no mezclar este slice con campaigns ni con layout premium.

No conviene abrir primero un page builder libre, un workflow editorial
aprobatorio ni un sistema de variantes visuales. Este slice primero necesita
fijar lenguaje canonico sobre contenido administrable real.

## Approaches evaluados

### 1. CMS editorial acotado por rutas conocidas

Incluye configuracion global, media publica, paginas conocidas, bloques
tipados, SEO por ruta y fallback seguro.

Ventajas:

- calza con el runtime real;
- cierra el dominio CMS sin mezclarlo con campaigns;
- deja ownership y estados editoriales claros.

Costo:

- no resuelve aun marketing campaigns ni CRM;
- no abre libertad total de composicion.

### 2. CMS corporativo minimo

Incluye solo `home`, `mayoristas` y `trabaja-con-nosotros`, dejando fuera
`catalogo`, `checkout` y `cuenta`.

Ventaja:

- corte mas corto.

Costo:

- contradice el brownfield actual, porque esas rutas ya estan modeladas en CMS.

### 3. CMS flexible tipo page system

Abre mas libertad de bloques y composicion para casi cualquier ruta.

Ventaja:

- deja mas espacio de evolucion futura.

Costo:

- ya no seria homologacion `as-is`;
- se acerca a rediseño funcional.

### Opcion elegida

Se elige la opcion `1`: CMS editorial acotado por rutas conocidas.

## Ownership canonico

### `marketing`

Dueno de:

- contenido publico administrable;
- publicacion directa de paginas conocidas;
- administracion de `banners`, `faqs` y `testimonials`;
- copy y configuracion editorial del sitio;
- SEO operativo por ruta.

No decide:

- logica comercial del checkout;
- reglas de negocio de mayoristas, vendedores o loyalty;
- arquitectura visual base del storefront.

### `cms`

Dueno de:

- estructura editorial;
- snapshot canonico;
- estados de `pages`;
- inventario de `blocks` permitidos;
- consistencia entre rutas conocidas y contenido administrable.

No decide:

- pricing;
- pedidos;
- pagos;
- campañas.

### `media`

Dueno de:

- upload y reemplazo tecnico de assets publicos del CMS;
- integridad de URLs publicas.

No decide:

- copy;
- estados editoriales;
- que contenido se publica.

### `web/storefront`

Dueno de:

- renderizar el snapshot CMS en superficies publicas;
- aplicar fallback seguro si falta contenido valido;
- respetar `robots`, `canonicalPath` y contenido activo/publicado.

No decide:

- publicacion editorial;
- estructura primaria del snapshot.

### `admin` y `super_admin`

Dueno de:

- excepciones;
- auditoria;
- gobierno operativo cuando haga falta intervenir.

No deben ser:

- cuello de botella editorial obligatorio para cada cambio de marketing.

## Superficies canonicas

### Backoffice

- `/admin/cms`
- configuracion global del sitio
- media publica
- navegacion
- banners
- FAQs
- testimoniales
- paginas conocidas
- bloques
- SEO por ruta

### Publico

Rutas conocidas gobernadas por CMS:

- `/`
- `/catalogo`
- `/mayoristas`
- `/trabaja-con-nosotros`
- `/cuenta`
- `/checkout`

No existe en este slice:

- creacion arbitraria de nuevas rutas publicas desde admin;
- composicion libre de bloques para cualquier pagina.

## Modelo editorial canonico

### Singletons globales

- `site settings`
- `hero copy`
- `navigation`

Se administran como configuracion global del sitio y no por pagina.

### Assets cortos

- `banners`
- `faqs`
- `testimonials`

Usan estado:

- `active`
- `inactive`

No usan flujo editorial largo.

### Paginas

Las `pages` usan ciclo editorial:

- `draft`
- `published`
- `archived`

`marketing` puede publicar directamente en este corte.

## Biblioteca de bloques tipados

La biblioteca es acotada y la compatibilidad depende de la ruta conocida.

### `home`

Permite:

- `hero`
- `promo-banner`
- `featured-products`
- `benefits`
- `faq`

### `catalogo`

Permite:

- `hero`
- `product-grid`

### `mayoristas`

Permite:

- `hero`
- `wholesale-plans`
- `lead-form`

### `trabaja-con-nosotros`

Permite:

- `hero`
- `vendor-application-form`

### `cuenta`

Permite:

- `auth`
- `loyalty`

### `checkout`

Permite:

- `checkout-summary`
- `payment-methods`

## SEO operativo por ruta

Cada ruta conocida puede administrar:

- `title`
- `description`
- `keywords`
- `canonicalPath`
- `robots`

Politica base:

- rutas indexables como `home`, `catalogo`, `mayoristas`,
  `trabaja-con-nosotros`: `index,follow`;
- rutas operativas como `cuenta` y `checkout`: `noindex,nofollow`.

## Media publica ligada al CMS

Este slice incluye assets publicos usados por la marca y por las superficies
editoriales:

- logo del header publico;
- logo del sidebar admin;
- hero image principal;
- imagen de carga;
- favicon;
- recursos visuales asociados a banners y piezas publicas.

La media es soporte tecnico del contenido editorial, no dominio separado de
art direction.

## Regla critica: fallback seguro en storefront

La regla mas sensible del slice es que el CMS no puede romper la web publica ni
las superficies comerciales si el snapshot falla.

### Principio

- el storefront intenta consumir snapshot CMS;
- si el snapshot es invalido, falla o llega incompleto, se usa contenido
  estatico/default;
- la pagina publica debe seguir renderizando;
- el fallback protege home, catalogo y rutas corporativas sin inventar
  contenido inconsistente.

### Consecuencias

- el CMS mejora control editorial, pero no es hard dependency para renderizar;
- el runtime conserva defaults validos;
- los cambios editoriales no deben degradar operacion por error de snapshot.

## Fronteras explicitas

- este slice no gobierna `marketing campaigns`;
- este slice no decide composicion visual premium del storefront;
- este slice no redefine checkout ni cuenta como flujos de negocio;
- este slice no reemplaza slices `001`, `002`, `003` y `004`;
- este slice solo gobierna contenido administrable y metadatos editoriales del
  brownfield real.

## Artefactos canonicos esperados

Si este slice se aprueba, la homologacion debe abrir:

- Fase 1:
  - `01.04-cms-content-blocks-marketing-surfaces.md`
  - UCs de configuracion, publicacion y consumo editorial
  - reglas de CMS y SEO
- Fase 2:
  - `02.04-cms-content-blocks-marketing-surfaces-ux-ui.md`
  - `product-design.md`
  - `spdd-frontend.md`
- Fase 3:
  - `03.07-cms-content-blocks-marketing-surfaces.md`
  - ADR de `fallback seguro + rutas conocidas + singleton global`
- Fase 4:
  - `specs/005-cms-content-blocks-marketing-surfaces/`
  - `spec-funcional.md`
  - `spec-tecnica.md`
  - `spec-tareas.md`
  - `traceability.md`

## Resultado esperado del slice

El resultado esperado es una capa canonica que deje claro que el CMS brownfield
de Huele Huele:

- administra contenido publico real;
- esta anclado a rutas conocidas;
- usa estados editoriales coherentes;
- entrega SEO operativo por ruta;
- soporta media publica;
- y no rompe el storefront aunque falle el snapshot.
