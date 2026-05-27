# Traceability - CMS Content Blocks Marketing Surfaces

Fecha: 2026-05-26.

## Objetivo

Trazar las reglas canonicas del slice CMS editorial contra sus fuentes
brownfield, los artefactos canonicos abiertos en Fases 1-3 y el baseline
tecnico real del monorepo.

## Matriz

| ID | Regla canonica | Fuentes brownfield | Artefactos nuevos | Baseline tecnico actual | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- |
| TR-01 | `marketing` es el owner operativo principal del CMS y `admin`/`super_admin` actuan como soporte y override | `docs/product/roles-and-permissions.md`, `docs/product/requirements-impact-plan-2026-03.md` | `docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md`, `docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md`, `spec-funcional.md`, `spec-tecnica.md` | `packages/shared/src/domain/admin-access.ts`, `apps/admin/app/cms/page.tsx`, `apps/api/src/modules/cms/admin-cms.controller.ts` | revisar `adminAccessRoles.cms` y acceso protegido a `/admin/cms` |
| TR-02 | `siteSetting`, `heroCopy` y `webNavigation` son singleton globales del snapshot CMS | `docs/storefront-v2-premium-landing.md`, `docs/data/entities.md` | `docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md`, `docs/fase-2-ux-ui/02.04-cms-content-blocks-marketing-surfaces-ux-ui.md`, `product-design.md`, `spec-funcional.md` | `packages/shared/src/types/api.ts`, `apps/api/src/modules/cms/cms.service.ts::getSiteSettings`, `apps/api/src/modules/cms/cms.service.ts::getHeroCopy`, `apps/api/src/modules/cms/cms.service.ts::getNavigation` | smoke de getters y snapshot admin/publico |
| TR-03 | la media publica del slice sigue embebida en `siteSetting` y no en un objeto top-level `cms.media` | `docs/storefront-v2-premium-landing.md`, `docs/data/entities.md` | `docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md`, `docs/fase-2-ux-ui/02.04-cms-content-blocks-marketing-surfaces-ux-ui.md`, `docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md`, `spec-tecnica.md` | `packages/shared/src/domain/models.ts`, `apps/api/src/modules/cms/admin-cms.controller.ts`, `apps/api/src/modules/cms/cms.service.ts`, `apps/api/src/modules/media/media.service.ts` | roundtrip de upload y lectura de `headerLogoUrl`, `heroProductImageUrl`, `loadingImageUrl` y `faviconUrl` |
| TR-04 | `banners`, `faqs` y `testimonials` son colecciones top-level con `active/inactive` y lectura publica solo de activos | `docs/storefront-v2-premium-landing.md`, `docs/product/roadmap.md` | `docs/fase-1-analisis-requerimientos/reglas/cms-y-superficies-editoriales.md`, `docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md`, `docs/fase-2-ux-ui/02.04-cms-content-blocks-marketing-surfaces-ux-ui.md`, `spec-funcional.md` | `apps/api/src/modules/cms/cms.service.ts::listBanners`, `apps/api/src/modules/cms/cms.service.ts::listFaqs`, `apps/api/src/modules/cms/cms.service.ts::listTestimonials`, `apps/web/features/storefront-v2/lib/content.ts`, `apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx` | prueba de consumo publico solo de assets `active` |
| TR-05 | las `pages` del slice solo corresponden a `home`, `catalogo`, `mayoristas`, `trabaja-con-nosotros`, `cuenta` y `checkout` | `docs/product/requirements-impact-plan-2026-03.md`, `docs/storefront-v2-premium-landing.md` | `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-14-publicacion-de-paginas-y-bloques-cms.md`, `docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md`, `docs/fase-3-arquitectura/adr/ADR-005-cms-known-routes-fallback-boundary.md`, `spec-funcional.md` | `apps/api/src/modules/cms/cms.service.ts::seedPages`, `apps/api/src/modules/cms/cms.service.ts::upsertPage`, `apps/api/src/modules/cms/admin-cms.controller.ts` | smoke de CRUD sobre slugs conocidos y bloqueo de `archived` en lectura publica |
| TR-06 | cada route ID solo admite bloques tipados compatibles y `promo-banner`/`faq` consumen colecciones compartidas; `testimonials` sigue top-level | `docs/storefront-v2-premium-landing.md`, `docs/data/entities.md` | `docs/fase-1-analisis-requerimientos/reglas/cms-y-superficies-editoriales.md`, `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-14-publicacion-de-paginas-y-bloques-cms.md`, `docs/fase-2-ux-ui/02.04-cms-content-blocks-marketing-surfaces-ux-ui.md`, `spdd-frontend.md`, `spec-tecnica.md` | `apps/api/src/modules/cms/cms.service.ts::seedPages`, `apps/api/src/modules/cms/cms.service.ts::updatePageBlocks`, `apps/admin/components/cms-workspace.tsx`, `apps/web/features/storefront-v2/lib/content.ts` | revisar contrato ruta-bloque y consumo de slots editorialmente acotados |
| TR-07 | `seoMeta` por ruta conocida incluye `canonicalPath` y `robots`, con `noindex,nofollow` permitido en `cuenta` y `checkout` | `docs/storefront-v2-premium-landing.md`, `docs/product/roadmap.md` | `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-14-publicacion-de-paginas-y-bloques-cms.md`, `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-15-consumo-publico-con-seo-y-fallback-seguro.md`, `docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md`, `spec-funcional.md`, `spec-tecnica.md` | `packages/shared/src/domain/models.ts::CmsSeoMeta`, `apps/admin/components/cms-workspace.tsx`, `apps/api/src/modules/cms/cms.service.ts::normalizeSeoMeta`, `apps/api/src/modules/cms/cms.service.ts::buildSnapshot` | prueba de roundtrip SEO por route ID y `robots` en `cuenta`/`checkout` |
| TR-08 | el storefront consume snapshot valido o aplica fallback seguro sin romper la pagina ni inventar rutas nuevas | `docs/storefront-v2-premium-landing.md` | `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-15-consumo-publico-con-seo-y-fallback-seguro.md`, `docs/fase-2-ux-ui/02.04-cms-content-blocks-marketing-surfaces-ux-ui.md`, `docs/fase-3-arquitectura/adr/ADR-005-cms-known-routes-fallback-boundary.md`, `spdd-frontend.md`, `spec-tecnica.md` | `apps/api/src/modules/cms/cms.controller.ts::getSnapshot`, `apps/web/features/storefront-v2/lib/content.ts::loadStorefrontV2Content`, `apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx::StorefrontV2PremiumExperience` | simular falla de `fetchCmsSnapshot()` y verificar defaults seguros |
| TR-09 | el slice no abre campaigns, CRM ampliado ni page builder libre | `docs/product/roadmap.md`, `docs/product/requirements-impact-plan-2026-03.md` | `docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md`, `docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md`, `docs/fase-3-arquitectura/adr/ADR-005-cms-known-routes-fallback-boundary.md`, `spec-funcional.md` | `apps/api/src/modules/cms/admin-cms.controller.ts`, `apps/api/src/modules/cms/cms.service.ts`, `packages/shared/src/types/api.ts` | revisar ausencia de slugs arbitrarios, campaigns y entidades CRM en contratos CMS |
| TR-10 | `catalogo`, `mayoristas`, `trabaja-con-nosotros`, `cuenta` y `checkout` solo ceden copy/SEO al CMS; no su logica de negocio | `docs/product/roles-and-permissions.md`, `docs/product/requirements-impact-plan-2026-03.md` | `docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md`, `docs/fase-3-arquitectura/adr/ADR-005-cms-known-routes-fallback-boundary.md`, `spec-tecnica.md` | `apps/api/src/modules/cms/cms.service.ts::seedPages`, `apps/web/features/storefront-v2/lib/content.ts`, `apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx` | contraste entre copy/SEO CMS y ownership funcional de cada superficie |

## Dependencias Fuera De Este Ownership

- campaigns, segments, templates y CRM ampliado requieren slices posteriores
- un page builder real o slugs arbitrarios requieren una ADR y corte propio
- separar la media CMS como agregado top-level requiere otra decision
  arquitectonica
- published-only como filtro tecnico estricto para lectura publica de `pages`
  exige hardening adicional si producto lo aprueba

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- conectado con las fuentes editoriales reales del brownfield
- alineado con Fases 1, 2 y 3 ya abiertas
- listo para evolucionar a implementacion futura sin abrir otro CMS ni mezclar
  este dominio con campaigns, CRM ampliado o un builder libre
