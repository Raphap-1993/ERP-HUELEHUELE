# Storefront Game Temporal Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover home, catalogo y PDP reales al lenguaje `game-temporal` sobre runtime productivo sin romper compra, variantes ni stock.

**Architecture:** Crear una capa visual compartida `game-temporal` para superficies publicas reales, centralizar la decision de CTA/compra en helpers ya cubiertos por tests y reinterpretar el prototipo `storefront-v2-game` como sistema visual, no como ruta canonica ni fuente de datos.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind, node:test con `tsx`

---

### Task 1: Cerrar brief y helper de compra

**Files:**
- Create: `docs/ux/storefront-game-temporal-brief.md`
- Modify: `apps/web/lib/storefront-purchase.ts`
- Test: `apps/web/lib/storefront-purchase.test.ts`

- [ ] Agregar tests para CTA primaria por modo `direct`, `select_variant` y `sold_out`
- [ ] Ejecutar el test y verificar rojo
- [ ] Implementar helper compartido de CTA primaria
- [ ] Ejecutar el test y verificar verde

### Task 2: Crear primitivas `game-temporal`

**Files:**
- Create: `apps/web/components/storefront-game-temporal.tsx`

- [ ] Crear frame, panel, title chip y badge reutilizables para rutas reales
- [ ] Reusar la dualidad tipografica del baseline game sin esconder header/footer globales

### Task 3: Migrar home real

**Files:**
- Create: `apps/web/components/storefront-game-home.tsx`
- Modify: `apps/web/app/page.tsx`

- [ ] Sustituir `storefront-v2-premium` por una experiencia runtime-backed `game-temporal`
- [ ] Mantener hero, featured products, social proof y CTA comercial sobre datos reales

### Task 4: Migrar catalogo real

**Files:**
- Create: `apps/web/components/storefront-game-product-card.tsx`
- Modify: `apps/web/components/catalog-browser.tsx`

- [ ] Rehacer el shell visual de catalogo con filtros, grid y CTA unificados
- [ ] Mantener fallback de media, stock y modo de compra real

### Task 5: Migrar PDP real

**Files:**
- Modify: `apps/web/app/producto/[slug]/page.tsx`

- [ ] Llevar el PDP real al lenguaje `game-temporal`
- [ ] Mantener galeria, precio, selector y bundle/detail sections sobre datos reales

### Task 6: Verificacion del corte

**Files:**
- Modify: `docs/README.md`

- [ ] Indexar el brief si agrega valor de navegacion documental
- [ ] Ejecutar test puntual del helper de compra
- [ ] Ejecutar `npm run typecheck -w @huelegood/web`
