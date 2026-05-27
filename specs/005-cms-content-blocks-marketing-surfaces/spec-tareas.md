# Spec Tareas - CMS Content Blocks Marketing Surfaces

Fecha: 2026-05-26.

## Objetivo

Convertir la arquitectura canonica del CMS editorial vigente en un backlog
tecnico ejecutable, cerrando singleton globales, media publica, rutas
conocidas, bloques tipados, SEO por ruta y fallback seguro sin abrir
campaigns, CRM ampliado ni page builder libre.

## Reglas De Ejecucion

- no abrir slugs ni rutas publicas arbitrarias desde admin
- no modelar un objeto top-level `cms.media` en este slice
- no convertir `/admin/cms` en visual builder
- no mezclar campaigns, segments, templates ni CRM ampliado con el CMS
- no romper el fallback seguro existente del storefront
- no transferir a CMS la logica de negocio de `catalogo`, mayoristas,
  `cuenta` ni `checkout`

## Backlog Canonico

### T1. Consolidar contratos compartidos del snapshot CMS

**Resultado esperado**

El repo expresa con claridad el agregado editorial unico del CMS, sus
singleton globales y los tipos compartidos de pagina, bloque, asset y SEO.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/models.ts`

**Checklist**

- [ ] mantener `CmsSnapshotResponse` como snapshot editorial unico
- [ ] fijar `siteSetting`, `heroCopy` y `webNavigation` como singleton
  globales
- [ ] reflejar en `SiteSetting` la media publica embebida del slice
- [ ] preparar unions o validaciones futuras para route IDs y bloques sin
  abrir page builder libre

### T2. Endurecer rutas conocidas y ciclo editorial de `pages`

**Resultado esperado**

Las paginas del CMS quedan amarradas al inventario canonico `home`,
`catalogo`, `mayoristas`, `trabaja-con-nosotros`, `cuenta` y `checkout`, con
estados editoriales consistentes.

**Rutas candidatas**

- `apps/api/src/modules/cms/admin-cms.controller.ts`
- `apps/api/src/modules/cms/cms.service.ts`

**Checklist**

- [ ] conservar `draft`, `published` y `archived` en `pages`
- [ ] impedir que el CMS se lea como creador de slugs arbitrarios
- [ ] mantener `archived` fuera de la lectura publica
- [ ] sostener la trazabilidad de pagina por `slug`

### T3. Cerrar bloques tipados por ruta conocida

**Resultado esperado**

Cada route ID solo admite el set de bloques tipados documentado, sin bloques
arbitrarios ni duplicacion de fuentes de verdad.

**Rutas candidatas**

- `apps/api/src/modules/cms/cms.service.ts`
- `apps/admin/components/cms-workspace.tsx`
- `packages/shared/src/domain/models.ts`

**Checklist**

- [ ] fijar whitelist de bloques por ruta conocida
- [ ] conservar `active/inactive` como bandera de render del bloque
- [ ] mantener `promo-banner` y `faq` como consumidores de colecciones
  compartidas
- [ ] mantener `testimonials` como coleccion top-level en las superficies
  aprobadas

### T4. Fijar SEO operativo por route ID

**Resultado esperado**

Cada pagina conocida conserva SEO operativo con `title`, `description`,
`keywords`, `canonicalPath` y `robots`, incluyendo `noindex,nofollow` cuando
corresponde.

**Rutas candidatas**

- `apps/api/src/modules/cms/cms.service.ts`
- `apps/admin/components/cms-workspace.tsx`
- `packages/shared/src/domain/models.ts`

**Checklist**

- [ ] sostener `seoMeta` por pagina conocida
- [ ] derivar el arreglo top-level `seoMeta` desde `page.seoMeta`
- [ ] mantener `canonicalPath` por ruta conocida
- [ ] permitir `noindex,nofollow` en `cuenta` y `checkout`

### T5. Consolidar singleton globales y media publica embebida

**Resultado esperado**

`siteSetting`, `heroCopy` y `webNavigation` siguen siendo la capa singleton del
CMS, y la media publica se administra como parte de `siteSetting`.

**Rutas candidatas**

- `apps/api/src/modules/cms/admin-cms.controller.ts`
- `apps/api/src/modules/cms/cms.service.ts`
- `apps/api/src/modules/media/media.service.ts`

**Checklist**

- [ ] mantener `updateSiteSettings()`, `updateHeroCopy()` y
  `updateNavigation()` como puertas canonicas
- [ ] sostener uploads de logo, hero, loading y favicon sobre `siteSetting`
- [ ] no crear un objeto top-level `cms.media`
- [ ] reflejar la media publicada en el snapshot CMS resultante

### T6. Blindar el read model publico y el fallback seguro

**Resultado esperado**

El storefront consume snapshot valido cuando existe y sobrevive con defaults
seguros cuando la lectura falla o llega incompleta.

**Rutas candidatas**

- `apps/api/src/modules/cms/cms.controller.ts`
- `apps/web/features/storefront-v2/lib/content.ts`
- `apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx`

**Checklist**

- [ ] sostener `getSnapshot()` como lectura publica snapshot-backed
- [ ] filtrar `banners`, `faqs` y `testimonials` a `active`
- [ ] mantener fallback a defaults curados si falla `fetchCmsSnapshot()`
- [ ] no inventar rutas ni trasladar fallas editoriales a caidas de pagina

### T7. Endurecer permisos y auditoria editorial

**Resultado esperado**

El slice deja ownership y trazabilidad claros para cambios de singleton,
paginas, bloques y colecciones editoriales.

**Rutas candidatas**

- `packages/shared/src/domain/admin-access.ts`
- `apps/admin/app/cms/page.tsx`
- `apps/api/src/modules/cms/cms.service.ts`

**Checklist**

- [ ] mantener `adminAccessRoles.cms` para `super_admin`, `admin` y
  `marketing`
- [ ] sostener auditoria via `recordAdminAction()`
- [ ] persistir snapshot del modulo via `module_state`
- [ ] preservar a `marketing` como owner cotidiano y a `admin` como soporte

### T8. Regression suite del slice

**Resultado esperado**

El comportamiento critico del CMS editorial queda defendido por pruebas de
contrato y smokes de ownership.

**Rutas candidatas**

- pruebas del modulo CMS
- pruebas del admin CMS
- smokes del storefront snapshot-backed

**Checklist**

- [ ] probar snapshot admin y snapshot publico
- [ ] probar SEO por ruta conocida
- [ ] probar filtro `active` y exclusiones de `archived`
- [ ] probar fallback seguro del storefront
- [ ] probar que el slice no derive a rutas arbitrarias ni a page builder

## Orden Recomendado

1. `T1`
2. `T2`
3. `T3`
4. `T4`
5. `T5`
6. `T6`
7. `T7`
8. `T8`

## Definition Of Done Del Slice

- el snapshot CMS queda nombrado como agregado editorial unico
- singleton globales y media publica quedan cerrados sin abrir `cms.media`
- `pages` y `blocks` quedan amarrados a rutas conocidas
- `seoMeta` por ruta conocida queda formalizado
- el storefront mantiene fallback seguro ante fallas del snapshot
- el slice no abre campaigns, CRM ampliado ni page builder libre
