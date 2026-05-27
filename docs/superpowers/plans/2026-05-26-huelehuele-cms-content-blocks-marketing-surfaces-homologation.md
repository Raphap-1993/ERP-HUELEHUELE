# Huele Huele CMS Content Blocks Marketing Surfaces Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir el slice canonico `005-cms-content-blocks-marketing-surfaces` en `ERP-HUELEHUELE` como homologacion brownfield `as-is`, dejando Fases 1-4 y specs listos para el CMS editorial real del producto sin mezclarlo con campaigns, CRM ampliado ni un page builder libre.

**Architecture:** La homologacion aterriza sobre el CMS ya vivo en runtime: `site settings`, `hero copy`, `navigation`, media publica, `banners`, `faqs`, `testimonials`, `pages`, `blocks` y `seoMeta` por ruta conocida. La capa canonica debe fijar ownership de `marketing`, singleton globales, bloques tipados por ruta, publicacion directa, y fallback seguro en storefront cuando falle el snapshot CMS.

**Tech Stack:** Markdown, git worktree, monorepo `Next.js` + `NestJS` + `Prisma`, runtime CMS real en `apps/admin`, `apps/api` y `apps/web`, verificacion documental con `git diff --check`, `rg`, `find` y chequeo local de consistencia.

---

## File Structure

### Existing files to modify

- `docs/fase-1-analisis-requerimientos/README.md`
- `docs/fase-2-ux-ui/README.md`
- `docs/fase-3-arquitectura/README.md`
- `docs/fase-4-sdd/README.md`
- `docs/transversal/90.00-mapa-homologacion-brownfield.md`
- `AI_CONTEXT.md`
- `TRACEABILITY_MATRIX.md`
- `PROJECT_MAP.md`

### New Phase 1 files

- `docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-13-configuracion-global-y-media-publica.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-14-publicacion-de-paginas-y-bloques-cms.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-15-consumo-publico-con-seo-y-fallback-seguro.md`
- `docs/fase-1-analisis-requerimientos/reglas/cms-y-superficies-editoriales.md`

### New Phase 2 files

- `docs/fase-2-ux-ui/02.04-cms-content-blocks-marketing-surfaces-ux-ui.md`
- `specs/005-cms-content-blocks-marketing-surfaces/product-design.md`
- `specs/005-cms-content-blocks-marketing-surfaces/spdd-frontend.md`

### New Phase 3 files

- `docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md`
- `docs/fase-3-arquitectura/adr/ADR-005-cms-known-routes-fallback-boundary.md`

### New Phase 4 files

- `specs/005-cms-content-blocks-marketing-surfaces/spec-funcional.md`
- `specs/005-cms-content-blocks-marketing-surfaces/spec-tecnica.md`
- `specs/005-cms-content-blocks-marketing-surfaces/spec-tareas.md`
- `specs/005-cms-content-blocks-marketing-surfaces/traceability.md`

### Responsibilities

- Fase 1 fija alcance funcional, actores, rutas conocidas, bloques tipados y reglas de publicacion/fallback.
- Fase 2 fija el contrato UX de `/admin/cms` y de las superficies publicas consumidas por CMS sin abrir rediseño visual.
- Fase 3 fija ownership entre `marketing`, `cms`, `media` y `web/storefront`, ademas de la frontera de fallback seguro.
- Fase 4 convierte el slice en paquete SDD trazable para ejecucion futura.
- La capa transversal actualiza el mapa brownfield y el estado metodologico para reflejar que `REQ-HH-005` ya tiene `loyalty + cms` backfilled en estado actual.

### Task 1: Abrir Fase 1 del slice `005-cms-content-blocks-marketing-surfaces`

**Files:**
- Modify: `docs/fase-1-analisis-requerimientos/README.md`
- Create: `docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-13-configuracion-global-y-media-publica.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-14-publicacion-de-paginas-y-bloques-cms.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-15-consumo-publico-con-seo-y-fallback-seguro.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/cms-y-superficies-editoriales.md`

- [ ] **Step 1: Releer fuentes CMS y contratos del runtime**

Run:

```bash
sed -n '1,260p' apps/admin/components/cms-workspace.tsx
sed -n '260,560p' apps/admin/components/cms-workspace.tsx
sed -n '260,520p' apps/api/src/modules/cms/cms.service.ts
sed -n '1260,1515p' apps/api/src/modules/cms/cms.service.ts
sed -n '1600,1760p' packages/shared/src/types/api.ts
sed -n '1,240p' apps/web/features/storefront-v2/lib/content.ts
sed -n '1,220p' apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx
```

Expected: evidencia clara de `site settings`, `hero copy`, `navigation`, `banners`, `faqs`, `testimonials`, `pages`, `blocks`, `seoMeta`, rutas conocidas y fallback.

- [ ] **Step 2: Actualizar el indice de Fase 1 para incluir el nuevo slice**

Añadir en `docs/fase-1-analisis-requerimientos/README.md`:

```md
## Slice 005 - CMS Content Blocks Marketing Surfaces
- [01.04-cms-content-blocks-marketing-surfaces.md](01.04-cms-content-blocks-marketing-surfaces.md)
- [casos-de-uso/UC-13-configuracion-global-y-media-publica.md](casos-de-uso/UC-13-configuracion-global-y-media-publica.md)
- [casos-de-uso/UC-14-publicacion-de-paginas-y-bloques-cms.md](casos-de-uso/UC-14-publicacion-de-paginas-y-bloques-cms.md)
- [casos-de-uso/UC-15-consumo-publico-con-seo-y-fallback-seguro.md](casos-de-uso/UC-15-consumo-publico-con-seo-y-fallback-seguro.md)
- [reglas/cms-y-superficies-editoriales.md](reglas/cms-y-superficies-editoriales.md)
```

- [ ] **Step 3: Crear el documento rector de Fase 1**

Crear `docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md` con esta estructura base:

```md
# Fase 1 - CMS Content Blocks Marketing Surfaces

## Objetivo
Homologar el CMS editorial vigente de Huele Huele sin convertirlo en page builder libre ni mezclarlo con campaigns.

## Dentro de alcance
- `site settings`
- `hero copy`
- `navigation`
- media publica
- `banners`, `faqs`, `testimonials`
- `pages` conocidas
- `blocks` tipados por ruta
- `seoMeta` por ruta
- fallback seguro a defaults

## Fuera de alcance
- campaigns
- segments
- templates
- CRM ampliado
- page builder libre
- bloques genericos arbitrarios
- art direction premium del storefront

## Rutas conocidas
- `home`
- `catalogo`
- `mayoristas`
- `trabaja-con-nosotros`
- `cuenta`
- `checkout`

## Regla critica
- el CMS administra contenido real y SEO operativo
- si el snapshot falla, storefront aplica fallback seguro
```

- [ ] **Step 4: Crear los tres casos de uso canonicos**

Crear `UC-13-configuracion-global-y-media-publica.md`:

```md
# UC-13 Configuracion Global Y Media Publica

## Actores
- marketing
- cms
- media

## Flujo principal
1. marketing edita `site settings`, `hero copy` o `navigation`
2. marketing actualiza logo, favicon, hero image u otros assets publicos
3. cms persiste snapshot global
4. storefront consume configuracion actualizada
```

Crear `UC-14-publicacion-de-paginas-y-bloques-cms.md`:

```md
# UC-14 Publicacion De Paginas Y Bloques CMS

## Actores
- marketing
- cms

## Flujo principal
1. marketing edita una ruta conocida
2. asigna o reordena bloques tipados compatibles
3. la pagina queda `draft`, `published` o `archived`
4. el CMS persiste la estructura editorial y el SEO por ruta
```

Crear `UC-15-consumo-publico-con-seo-y-fallback-seguro.md`:

```md
# UC-15 Consumo Publico Con SEO Y Fallback Seguro

## Actores
- web/storefront
- cms

## Flujo principal
1. storefront intenta cargar snapshot CMS
2. aplica `title`, `description`, `keywords`, `canonicalPath` y `robots`
3. si el snapshot es incompleto o falla, usa defaults seguros
4. la ruta publica sigue renderizando sin romper operacion
```

- [ ] **Step 5: Crear la hoja de reglas funcionales**

Crear `docs/fase-1-analisis-requerimientos/reglas/cms-y-superficies-editoriales.md`:

```md
# Reglas De CMS Y Superficies Editoriales

- `marketing` es dueno operativo principal del CMS
- `site settings`, `hero copy` y `navigation` son singleton globales
- `banners`, `faqs` y `testimonials` usan `active/inactive`
- `pages` usan `draft/published/archived`
- solo existen rutas conocidas en este slice
- los bloques permitidos dependen de la ruta conocida
- `checkout` y `cuenta` pueden ser CMS-known routes con `noindex,nofollow`
- el CMS no gobierna campaigns ni CRM ampliado
- el storefront debe aplicar fallback seguro si falla el snapshot
```

- [ ] **Step 6: Verificar Fase 1 abierta**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort
rg -n "cms|hero|banner|faq|testimonial|seo|fallback|marketing" docs/fase-1-analisis-requerimientos
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `005`.

- [ ] **Step 7: Commit de Fase 1**

```bash
git add docs/fase-1-analisis-requerimientos
git commit -m "docs: open cms content blocks phase 1 slice"
```

### Task 2: Abrir Fase 2 y los artefactos UX del slice

**Files:**
- Modify: `docs/fase-2-ux-ui/README.md`
- Create: `docs/fase-2-ux-ui/02.04-cms-content-blocks-marketing-surfaces-ux-ui.md`
- Create: `specs/005-cms-content-blocks-marketing-surfaces/product-design.md`
- Create: `specs/005-cms-content-blocks-marketing-surfaces/spdd-frontend.md`

- [ ] **Step 1: Releer superficies reales del runtime CMS**

Run:

```bash
sed -n '1,260p' apps/admin/components/cms-workspace.tsx
sed -n '560,980p' apps/admin/components/cms-workspace.tsx
sed -n '1,240p' apps/web/features/storefront-v2/lib/content.ts
sed -n '1,220p' apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx
```

Expected: contrato visible de `/admin/cms` y consumo editorial en home, FAQ, testimonials, banners y rutas publicas.

- [ ] **Step 2: Actualizar el indice de Fase 2**

Añadir en `docs/fase-2-ux-ui/README.md`:

```md
## Slice 005 - CMS Content Blocks Marketing Surfaces
- [02.04-cms-content-blocks-marketing-surfaces-ux-ui.md](02.04-cms-content-blocks-marketing-surfaces-ux-ui.md)
- [../../specs/005-cms-content-blocks-marketing-surfaces/product-design.md](../../specs/005-cms-content-blocks-marketing-surfaces/product-design.md)
- [../../specs/005-cms-content-blocks-marketing-surfaces/spdd-frontend.md](../../specs/005-cms-content-blocks-marketing-surfaces/spdd-frontend.md)
```

- [ ] **Step 3: Crear el documento UX de Fase 2**

Crear `docs/fase-2-ux-ui/02.04-cms-content-blocks-marketing-surfaces-ux-ui.md`:

```md
# Fase 2 - UX/UI CMS Content Blocks Marketing Surfaces

## Objetivo
Formalizar la UX del CMS editorial vigente sin convertirlo en page builder libre ni redisenar el storefront.

## Superficies
- `/admin/cms`
- home y rutas publicas conocidas consumidas por CMS

## Contrato UX del slice
- `marketing` publica contenido real sobre rutas conocidas
- el CMS administra SEO y bloques compatibles por ruta
- el storefront renderiza snapshot o fallback seguro
```

- [ ] **Step 4: Crear `product-design.md` del slice**

Crear `specs/005-cms-content-blocks-marketing-surfaces/product-design.md`:

```md
# Product Design - CMS Content Blocks Marketing Surfaces

## Intencion
Que marketing controle contenido publico real sin depender de deploy ni romper la web.

## Principios
- rutas conocidas
- bloques tipados acotados
- publicacion simple
- SEO por ruta
- fallback seguro
```

- [ ] **Step 5: Crear `spdd-frontend.md` del slice**

Crear `specs/005-cms-content-blocks-marketing-surfaces/spdd-frontend.md`:

```md
# SPDD Frontend - CMS Content Blocks Marketing Surfaces

## Superficies visibles
- `/`
- `/catalogo`
- `/mayoristas`
- `/trabaja-con-nosotros`
- `/cuenta`
- `/checkout`

## Contratos visibles
- hero y navegacion globales
- banners activos
- FAQs y testimonials activos
- SEO por ruta
- fallback a defaults cuando falte snapshot valido
```

- [ ] **Step 6: Verificar Fase 2 abierta**

Run:

```bash
find docs/fase-2-ux-ui -maxdepth 1 -type f | sort
find specs/005-cms-content-blocks-marketing-surfaces -maxdepth 1 -type f | sort
rg -n "cms|hero|navigation|banner|faq|testimonial|seo|fallback" docs/fase-2-ux-ui specs/005-cms-content-blocks-marketing-surfaces
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `005`.

- [ ] **Step 7: Commit de Fase 2**

```bash
git add docs/fase-2-ux-ui specs/005-cms-content-blocks-marketing-surfaces
git commit -m "docs: add cms content blocks ux slice"
```

### Task 3: Abrir Fase 3 y el ADR del slice CMS

**Files:**
- Modify: `docs/fase-3-arquitectura/README.md`
- Create: `docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-005-cms-known-routes-fallback-boundary.md`

- [ ] **Step 1: Releer ownership tecnico y seeds del CMS**

Run:

```bash
sed -n '260,520p' apps/api/src/modules/cms/cms.service.ts
sed -n '1110,1515p' apps/api/src/modules/cms/cms.service.ts
sed -n '1,220p' apps/api/src/modules/cms/cms.controller.ts
sed -n '1,220p' apps/api/src/modules/media/media.service.ts
```

Expected: ownership entre `cms`, `media`, `web` y rutas conocidas seeded en runtime.

- [ ] **Step 2: Actualizar el indice de Fase 3**

Añadir en `docs/fase-3-arquitectura/README.md`:

```md
## Slice 005 - CMS Content Blocks Marketing Surfaces
- [03.07-cms-content-blocks-marketing-surfaces.md](03.07-cms-content-blocks-marketing-surfaces.md)
- [adr/ADR-005-cms-known-routes-fallback-boundary.md](adr/ADR-005-cms-known-routes-fallback-boundary.md)
```

- [ ] **Step 3: Crear el documento de arquitectura del slice**

Crear `docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md`:

```md
# 03.07 Arquitectura Canonica Brownfield CMS Content Blocks Marketing Surfaces

## Objetivo
Fijar ownership, estados, rutas conocidas y fallback seguro del CMS editorial.

## Fronteras
- `marketing`
- `cms`
- `media`
- `web/storefront`
- `admin/super_admin`

## Invariantes
1. `site settings`, `hero copy` y `navigation` son singleton globales.
2. `pages` solo existen para rutas conocidas.
3. los bloques permitidos dependen de la ruta conocida.
4. `banners`, `faqs` y `testimonials` usan `active/inactive`.
5. el storefront aplica fallback seguro si falla el snapshot.
```

- [ ] **Step 4: Crear el ADR del slice**

Crear `docs/fase-3-arquitectura/adr/ADR-005-cms-known-routes-fallback-boundary.md`:

```md
# ADR-005 CMS Known Routes Fallback Boundary

## Decision
El CMS brownfield de Huele Huele se canoniza como dominio editorial sobre rutas conocidas con bloques tipados por ruta y fallback seguro a contenido estatico/default.

## Consecuencias
- no hay page builder libre
- SEO por ruta queda dentro del slice
- `checkout` y `cuenta` pueden vivir como CMS-known routes con `noindex,nofollow`
- el snapshot CMS no puede tumbar la web publica
```

- [ ] **Step 5: Verificar Fase 3 abierta**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 2 -type f | sort
rg -n "cms|routes|fallback|hero|navigation|seo|marketing" docs/fase-3-arquitectura
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `005`.

- [ ] **Step 6: Commit de Fase 3**

```bash
git add docs/fase-3-arquitectura
git commit -m "docs: add cms content blocks architecture slice"
```

### Task 4: Crear la carpeta `specs/005-cms-content-blocks-marketing-surfaces`

**Files:**
- Modify: `docs/fase-4-sdd/README.md`
- Create: `specs/005-cms-content-blocks-marketing-surfaces/spec-funcional.md`
- Create: `specs/005-cms-content-blocks-marketing-surfaces/spec-tecnica.md`
- Create: `specs/005-cms-content-blocks-marketing-surfaces/spec-tareas.md`
- Create: `specs/005-cms-content-blocks-marketing-surfaces/traceability.md`

- [ ] **Step 1: Actualizar el indice SDD**

Añadir en `docs/fase-4-sdd/README.md`:

```md
## Slice 005 - CMS Content Blocks Marketing Surfaces
- [../../specs/005-cms-content-blocks-marketing-surfaces/spec-funcional.md](../../specs/005-cms-content-blocks-marketing-surfaces/spec-funcional.md)
- [../../specs/005-cms-content-blocks-marketing-surfaces/spec-tecnica.md](../../specs/005-cms-content-blocks-marketing-surfaces/spec-tecnica.md)
- [../../specs/005-cms-content-blocks-marketing-surfaces/spec-tareas.md](../../specs/005-cms-content-blocks-marketing-surfaces/spec-tareas.md)
- [../../specs/005-cms-content-blocks-marketing-surfaces/traceability.md](../../specs/005-cms-content-blocks-marketing-surfaces/traceability.md)
```

- [ ] **Step 2: Crear el `spec-funcional.md`**

Crear `specs/005-cms-content-blocks-marketing-surfaces/spec-funcional.md`:

```md
# Spec Funcional - CMS Content Blocks Marketing Surfaces

## Alcance
- singletons globales
- media publica
- banners/faqs/testimonials
- pages conocidas
- blocks tipados por ruta
- SEO por ruta
- fallback seguro

## Reglas canonicas
- `marketing` es dueno operativo
- no hay rutas arbitrarias
- no hay page builder libre
- `pages` usan `draft/published/archived`
- assets cortos usan `active/inactive`
- storefront no se rompe si el snapshot falla
```

- [ ] **Step 3: Crear el `spec-tecnica.md`**

Crear `specs/005-cms-content-blocks-marketing-surfaces/spec-tecnica.md`:

```md
# Spec Tecnica - CMS Content Blocks Marketing Surfaces

## Baseline real
- `apps/admin/components/cms-workspace.tsx`
- `apps/api/src/modules/cms/cms.service.ts`
- `apps/api/src/modules/cms/cms.controller.ts`
- `apps/web/features/storefront-v2/lib/content.ts`
- `apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx`

## Fronteras
- `marketing`
- `cms`
- `media`
- `web/storefront`

## Riesgos
- snapshot invalido
- mezcla con campaigns
- bloques fuera de su ruta
```

- [ ] **Step 4: Crear el `spec-tareas.md`**

Crear `specs/005-cms-content-blocks-marketing-surfaces/spec-tareas.md`:

```md
# Spec Tareas - CMS Content Blocks Marketing Surfaces

- T1: alinear contratos compartidos del snapshot CMS
- T2: fijar rutas conocidas y blocks permitidos
- T3: fijar SEO operativo por ruta
- T4: fijar singleton globales y media publica
- T5: fijar fallback seguro en storefront
- T6: endurecer trazabilidad y auditoria editorial
```

- [ ] **Step 5: Crear la `traceability.md`**

Crear `specs/005-cms-content-blocks-marketing-surfaces/traceability.md`:

```md
# Traceability - CMS Content Blocks Marketing Surfaces

- TR-01 rutas conocidas -> `apps/api/src/modules/cms/cms.service.ts`
- TR-02 singleton globales -> `apps/admin/components/cms-workspace.tsx`
- TR-03 SEO por ruta -> `packages/shared/src/types/api.ts`
- TR-04 fallback seguro -> `apps/web/features/storefront-v2/lib/content.ts`
- TR-05 consumo premium -> `apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx`
```

- [ ] **Step 6: Verificar Fase 4 abierta**

Run:

```bash
find specs/005-cms-content-blocks-marketing-surfaces -maxdepth 1 -type f | sort
rg -n "cms|hero|navigation|banner|faq|testimonial|seo|fallback|known routes" specs/005-cms-content-blocks-marketing-surfaces
```

Expected: aparecen los cuatro archivos canonicos y el `rg` devuelve hits del slice `005`.

- [ ] **Step 7: Commit de Fase 4**

```bash
git add docs/fase-4-sdd specs/005-cms-content-blocks-marketing-surfaces
git commit -m "docs: add cms content blocks canonical specs"
```

### Task 5: Sincronizar la capa transversal y los entrypoints del repo

**Files:**
- Modify: `AI_CONTEXT.md`
- Modify: `TRACEABILITY_MATRIX.md`
- Modify: `docs/transversal/90.00-mapa-homologacion-brownfield.md`
- Modify: `PROJECT_MAP.md`

- [ ] **Step 1: Actualizar `AI_CONTEXT.md`**

Ajustar:

```md
- Fase activa: capa canonica intermedia extendida y sincronizada hasta el slice `005-cms-content-blocks-marketing-surfaces`
| Fase 1 - Analisis y requerimientos | Backfilled para slices `001`, `002`, `003`, `004` y `005` | ...
| Fase 2 - UX/UI | Backfilled para slices `001`, `002`, `003`, `004` y `005` | ...
| Fase 3 - Arquitectura | Backfilled para slices `001`, `002`, `003`, `004` y `005` | ...
| Fase 4 - SDD | Instanciada para features `001`, `002`, `003`, `004` y `005` | ...
```

- [ ] **Step 2: Actualizar `TRACEABILITY_MATRIX.md`**

Ajustar:

```md
| Fase 1 - Analisis y requerimientos | Backfilled para slices `001`, `002`, `003`, `004` y `005` | ...
| Fase 2 - UX/UI | Backfilled para slices `001`, `002`, `003`, `004` y `005` | ...
| Fase 3 - Arquitectura | Backfilled para slices `001`, `002`, `003`, `004` y `005` | ...
| Fase 4 - SDD | Instanciada para `001-checkout-payments`, `002-vendors-commissions`, `003-wholesale-leads-quotes`, `004-loyalty-points-redemptions` y `005-cms-content-blocks-marketing-surfaces` | ...
| `REQ-HH-005` | ... | ... | Fases 1-4 canonicas de `004-loyalty-points-redemptions` y `005-cms-content-blocks-marketing-surfaces` + fases futuras de campaigns/CRM | Parcial: loyalty y CMS backfilled para estado actual |
```

- [ ] **Step 3: Actualizar el mapa brownfield**

Añadir en `docs/transversal/90.00-mapa-homologacion-brownfield.md` filas como:

```md
| `docs/storefront-v2-premium-landing.md` | `docs/fase-1-analisis-requerimientos/01.04-cms-content-blocks-marketing-surfaces.md`, `docs/fase-2-ux-ui/02.04-cms-content-blocks-marketing-surfaces-ux-ui.md`, `specs/005-cms-content-blocks-marketing-surfaces/` | Parcial | La direccion visual sigue fuera del slice, pero las superficies publicas y piezas editoriales ya quedan mapeadas al canon CMS. |
| `docs/data/entities.md` | `docs/fase-3-arquitectura/03.07-cms-content-blocks-marketing-surfaces.md`, `specs/005-cms-content-blocks-marketing-surfaces/` | Migrado | Las entidades de `pages`, `page_blocks` y `banners` ya tienen aterrizaje canonico. |
```

Y en resultado del corte:

```md
- `specs/005-cms-content-blocks-marketing-surfaces/` fija el quinto slice brownfield homologado para CMS editorial y superficies publicas conocidas.
```

- [ ] **Step 4: Actualizar `PROJECT_MAP.md`**

Ajustar:

```md
| `specs/` | Features canonicas por slice brownfield homologado (`001` a `005` en este corte). |
| Slices canonicos brownfield ya homologados | `docs/fase-1-analisis-requerimientos/`, `docs/fase-2-ux-ui/`, `docs/fase-3-arquitectura/`, `docs/fase-4-sdd/`, `specs/` |
```

- [ ] **Step 5: Verificar la capa transversal**

Run:

```bash
rg -n "005-cms-content-blocks-marketing-surfaces|REQ-HH-005|cms|content blocks|marketing surfaces" AI_CONTEXT.md TRACEABILITY_MATRIX.md PROJECT_MAP.md docs/transversal/90.00-mapa-homologacion-brownfield.md
git diff --check
git status --short --branch
```

Expected: hits del nuevo slice, `git diff --check` limpio y solo cambios esperados antes del commit.

- [ ] **Step 6: Commit de sincronizacion transversal**

```bash
git add AI_CONTEXT.md TRACEABILITY_MATRIX.md PROJECT_MAP.md docs/transversal/90.00-mapa-homologacion-brownfield.md
git commit -m "docs: align canonical layer for cms content blocks"
```

## Self-Review Checklist

- Cobertura del spec:
  - dominio CMS editorial real: Task 1 y Task 3
  - rutas conocidas: Task 1, Task 3 y Task 4
  - singleton globales y media publica: Task 1, Task 3 y Task 4
  - SEO operativo por ruta: Task 1, Task 2 y Task 4
  - fallback seguro: Task 1, Task 2, Task 3 y Task 4
  - `marketing` como owner principal: Task 1, Task 2 y Task 3
- No hay placeholders `TODO/TBD`.
- Los nombres de archivos, slices y rutas son consistentes con el spec `005`.
