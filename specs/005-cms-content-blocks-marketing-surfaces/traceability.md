# Traceability - CMS Content Blocks Marketing Surfaces

Fecha: 2026-05-26.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - CMS Content Blocks Marketing Surfaces](../../docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md),
  [Reglas de CMS y superficies editoriales](../../docs/fase-1-analisis-requerimientos/reglas/cms-y-superficies-editoriales.md),
  [UC-14 Publicacion de paginas y bloques CMS](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-14-publicacion-de-paginas-y-bloques-cms.md),
  [UC-15 Consumo publico con SEO y fallback seguro](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-15-consumo-publico-con-seo-y-fallback-seguro.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.04-cms-content-blocks-marketing-surfaces-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md),
  [ADR-005 Known Routes Fallback Boundary](../../docs/fase-3-arquitectura/adr/ADR-005-cms-known-routes-fallback-boundary.md)

## Objetivo

Trazar las reglas canonicas del slice CMS editorial contra sus fuentes
brownfield, los artefactos canonicos abiertos en Fases 1-3, el paquete SDD del
slice y el baseline tecnico real del monorepo.

## Matriz

| ID | Regla canonica | Fuentes brownfield | Artefactos canonicos del slice | Baseline tecnico actual | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- |
| TR-01 | `marketing` es el owner operativo principal del CMS y `admin`/`super_admin` actuan como soporte y override | [roles-and-permissions.md](../../docs/product/roles-and-permissions.md), [requirements-impact-plan-2026-03.md](../../docs/product/requirements-impact-plan-2026-03.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md), [Fase 3](../../docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md), [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md) | [admin-access.ts](../../packages/shared/src/domain/admin-access.ts), [apps/admin/app/cms/page.tsx](../../apps/admin/app/cms/page.tsx), [admin-cms.controller.ts](../../apps/api/src/modules/cms/admin-cms.controller.ts) | revisar `adminAccessRoles.cms` y acceso protegido a `/admin/cms` |
| TR-02 | `siteSetting`, `heroCopy` y `webNavigation` son singleton globales del snapshot CMS | [storefront-v2-premium-landing.md](../../docs/storefront-v2-premium-landing.md), [entities.md](../../docs/data/entities.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md), [Fase 2](../../docs/fase-2-ux-ui/02.04-cms-content-blocks-marketing-surfaces-ux-ui.md), [product-design.md](product-design.md), [spec-funcional.md](spec-funcional.md) | [types/api.ts](../../packages/shared/src/types/api.ts) :: `CmsSnapshotResponse`, [cms.service.ts](../../apps/api/src/modules/cms/cms.service.ts) :: `getSiteSettings()`, `getHeroCopy()`, `getNavigation()` | smoke de getters y snapshot admin/publico |
| TR-03 | la persistencia del snapshot `cms` usa el lenguaje heredado `moduleSnapshot` / `module_snapshots` | [GLOSSARY.md](../../GLOSSARY.md), [entities.md](../../docs/data/entities.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) | [module-state.service.ts](../../apps/api/src/persistence/module-state.service.ts) :: `ModuleStateService.load/save()` via Prisma `moduleSnapshot`, [cms.service.ts](../../apps/api/src/modules/cms/cms.service.ts) :: `persistState()` | revisar que el vocabulario del slice use `moduleSnapshot` / `module_snapshots` |
| TR-04 | la media publica del slice sigue embebida en `siteSetting` y no en un objeto top-level `cms.media` | [storefront-v2-premium-landing.md](../../docs/storefront-v2-premium-landing.md), [entities.md](../../docs/data/entities.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md), [Fase 2](../../docs/fase-2-ux-ui/02.04-cms-content-blocks-marketing-surfaces-ux-ui.md), [Fase 3](../../docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md), [spec-tecnica.md](spec-tecnica.md) | [models.ts](../../packages/shared/src/domain/models.ts), [admin-cms.controller.ts](../../apps/api/src/modules/cms/admin-cms.controller.ts), [cms.service.ts](../../apps/api/src/modules/cms/cms.service.ts), [media.service.ts](../../apps/api/src/modules/media/media.service.ts) | roundtrip de upload y lectura de `headerLogoUrl`, `heroProductImageUrl`, `loadingImageUrl` y `faviconUrl` |
| TR-05 | `home`, `catalogo`, `mayoristas`, `trabaja-con-nosotros`, `cuenta` y `checkout` son `page.slug` o route IDs CMS para superficies conocidas, no paths literales | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md), [Fase 3](../../docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md), [ADR-005](../../docs/fase-3-arquitectura/adr/ADR-005-cms-known-routes-fallback-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) | [cms.service.ts](../../apps/api/src/modules/cms/cms.service.ts) :: `seedPages()`, `upsertPage()`, [admin-cms.controller.ts](../../apps/api/src/modules/cms/admin-cms.controller.ts) | contrastar route IDs CMS con paths resueltos `/`, `/catalogo`, `/mayoristas`, `/trabaja-con-nosotros`, `/cuenta`, `/checkout` |
| TR-06 | la lectura publica brownfield de `pages` excluye hoy solo `archived`; una `draft` puede seguir apareciendo y `published-only` queda como hardening futuro | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md), [Fase 3](../../docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md), [UC-15](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-15-consumo-publico-con-seo-y-fallback-seguro.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) | [cms.service.ts](../../apps/api/src/modules/cms/cms.service.ts) :: `listPages(publicView)`, `getPage(slug, publicView)`, `getSnapshot()` | probar que `archived` no sale en public read y documentar que `draft` sigue visible `as-is` |
| TR-07 | cada route ID solo admite bloques tipados compatibles y `promo-banner`/`faq` consumen colecciones compartidas; `testimonials` sigue top-level | [Reglas de CMS y superficies editoriales](../../docs/fase-1-analisis-requerimientos/reglas/cms-y-superficies-editoriales.md), [UC-14](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-14-publicacion-de-paginas-y-bloques-cms.md), [Fase 2](../../docs/fase-2-ux-ui/02.04-cms-content-blocks-marketing-surfaces-ux-ui.md) | [spdd-frontend.md](spdd-frontend.md), [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md) | [cms.service.ts](../../apps/api/src/modules/cms/cms.service.ts) :: `seedPages()`, `updatePageBlocks()`, [cms-workspace.tsx](../../apps/admin/components/cms-workspace.tsx), [storefront-v2/lib/content.ts](../../apps/web/features/storefront-v2/lib/content.ts) | revisar contrato ruta-bloque y consumo de slots editorialmente acotados |
| TR-08 | `seoMeta` por route ID conocido incluye `canonicalPath` y `robots`, con `noindex,nofollow` permitido en `cuenta` y `checkout` | [UC-14](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-14-publicacion-de-paginas-y-bloques-cms.md), [UC-15](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-15-consumo-publico-con-seo-y-fallback-seguro.md), [Fase 3](../../docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) | [models.ts](../../packages/shared/src/domain/models.ts) :: `CmsSeoMeta`, [cms-workspace.tsx](../../apps/admin/components/cms-workspace.tsx), [cms.service.ts](../../apps/api/src/modules/cms/cms.service.ts) :: `normalizeSeoMeta()`, `buildSnapshot()` | prueba de roundtrip SEO por route ID y `robots` en `cuenta`/`checkout` |
| TR-09 | el storefront consume snapshot valido o aplica fallback seguro sin romper la pagina ni inventar rutas nuevas | [storefront-v2-premium-landing.md](../../docs/storefront-v2-premium-landing.md), [ADR-005](../../docs/fase-3-arquitectura/adr/ADR-005-cms-known-routes-fallback-boundary.md) | [Fase 2](../../docs/fase-2-ux-ui/02.04-cms-content-blocks-marketing-surfaces-ux-ui.md), [spdd-frontend.md](spdd-frontend.md), [spec-tecnica.md](spec-tecnica.md) | [cms.controller.ts](../../apps/api/src/modules/cms/cms.controller.ts) :: `getSnapshot()`, [storefront-v2/lib/content.ts](../../apps/web/features/storefront-v2/lib/content.ts) :: `loadStorefrontV2Content()`, [storefront-v2-premium-page.tsx](../../apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx) :: `StorefrontV2PremiumExperience` | simular falla de `fetchCmsSnapshot()` y verificar defaults seguros |
| TR-10 | el slice no abre campaigns, CRM ampliado ni page builder libre, y `catalogo`, `mayoristas`, `trabaja-con-nosotros`, `cuenta`, `checkout` solo ceden copy/SEO al CMS | [roadmap.md](../../docs/product/roadmap.md), [requirements-impact-plan-2026-03.md](../../docs/product/requirements-impact-plan-2026-03.md), [roles-and-permissions.md](../../docs/product/roles-and-permissions.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md), [Fase 3](../../docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md), [ADR-005](../../docs/fase-3-arquitectura/adr/ADR-005-cms-known-routes-fallback-boundary.md), [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md) | [admin-cms.controller.ts](../../apps/api/src/modules/cms/admin-cms.controller.ts), [cms.service.ts](../../apps/api/src/modules/cms/cms.service.ts), [types/api.ts](../../packages/shared/src/types/api.ts) | revisar ausencia de slugs arbitrarios, campaigns y entidades CRM en contratos CMS |

## Dependencias Fuera De Este Ownership

- campaigns, segments, templates y CRM ampliado requieren slices posteriores
- un page builder real o slugs arbitrarios requieren una ADR y corte propio
- separar la media CMS como agregado top-level requiere otra decision
  arquitectonica
- `published-only` como filtro tecnico estricto para lectura publica de
  `pages` exige hardening adicional si producto lo aprueba

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- conectado con las fuentes editoriales reales del brownfield
- alineado con Fases 1, 2 y 3 ya abiertas
- conectado con su propio paquete SDD de [spec-funcional.md](spec-funcional.md),
  [spec-tecnica.md](spec-tecnica.md) y [spec-tareas.md](spec-tareas.md)
- listo para evolucionar a implementacion futura sin abrir otro CMS ni mezclar
  este dominio con campaigns, CRM ampliado o un builder libre
