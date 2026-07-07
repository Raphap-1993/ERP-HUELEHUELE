# Public UX Green Cut Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the new Huele Huele green home style to the complete public storefront without changing commerce, checkout, auth or portal business logic.

**Architecture:** Introduce a reusable public UI kit for the green system, then migrate the public routes in layers: commerce browsing first, commercial/account portals second, checkout frame last. Keep data and business decisions inside existing runtime helpers.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS in `apps/web/app/globals.css`, existing `@huelegood/shared`, existing storefront runtime helpers.

---

## File Structure

- Create: `apps/web/components/huele-public-ui.tsx`
- Create: `apps/web/components/huele-commerce-action.tsx`
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/components/huele-home-experience.tsx`
- Modify: `apps/web/components/catalog-browser.tsx`
- Modify: `apps/web/components/storefront-game-product-card.tsx`
- Modify: `apps/web/app/producto/[slug]/page.tsx`
- Modify: `apps/web/components/product-variant-selector.tsx`
- Modify: `apps/web/components/wholesale-workspace.tsx`
- Modify: `apps/web/components/account-workspace.tsx`
- Modify: `apps/web/components/seller-panel-workspace.tsx`
- Modify: `apps/web/features/storefront-v2-premium/layouts/vendor-application-page.tsx`
- Modify: `apps/web/components/checkout-workspace.tsx`
- Modify: `docs/ux/public-storefront-surface-spec.md`
- Modify: `docs/ux/storefront-component-state-spec.md`

## Tasks

### Task 1: Shared Green Public UI

- [x] Add a focused test or static contract where useful for commerce CTA behavior before production changes.
- [x] Create `huele-public-ui.tsx` with shell, panel, button, badge, field shell, status card and mascot primitives.
- [x] Create `huele-commerce-action.tsx` to centralize `direct`, `select_variant`, `sold_out` and catalog fallback CTA rendering.
- [x] Move reusable `hh` styling from home-only CSS into a shared `[data-huele-public]` scope while keeping home selectors compatible.
- [x] Run web helper tests and typecheck.

### Task 2: Catalog Green Cut

- [x] Migrate `CatalogBrowser` from `StorefrontGameTemporal*` to `HuelePublicPage`, `HuelePanel`, `HueleBadge` and green segmented filters.
- [x] Migrate `StorefrontGameProductCard` to the green product card language and reuse `HueleCommerceAction`.
- [x] Preserve loading, error, empty and filtered-empty states.
- [x] Verify no catalog logic changes: runtime catalog still wins; static fallback only follows flag.

### Task 3: Product Detail Green Cut

- [x] Migrate `/producto/[slug]` to a green PDP layout with media, purchase panel, attributes, variants and bundle sections.
- [x] Preserve server-side `fetchProductBySlug`, `notFound()`, `dynamic = "force-dynamic"`, stock badge, variant selector and image fallback behavior.
- [x] Align `ProductVariantSelector` visually without changing variant selection or `AddToCartLink` behavior.
- [x] Verify product detail for `clasico-verde`, `premium-negro`, and `combo-duo-perfecto` if available.

### Task 4: Commercial and Account Surfaces

- [x] Migrate `WholesaleWorkspace` visual frame for both public lead mode and authenticated wholesale portal.
- [x] Migrate `AccountWorkspace` visual frame for loading, login, redirect, denied and account-ready modes.
- [x] Migrate `SellerPanelWorkspace` visual frame while keeping operational density.
- [x] Migrate `VendorApplicationPage` into the green public direction and remove older separate premium/editorial styling.
- [x] Update docs to state `/mayoristas` is the canonical single route for public B2B capture and authenticated wholesale portal.

### Task 5: Checkout Transactional Green Cut

- [x] Replace the top-level `StorefrontGameTemporalSurfaceShell` frame in `CheckoutWorkspace` with a calmer green transactional frame.
- [x] Keep quote, document lookup, ubigeo, payment, evidence upload, cart and localStorage behavior unchanged.
- [x] Use lorito only for empty cart or final confirmation state.
- [x] Check mobile layout carefully because checkout is client-only and large.

### Task 6: Chrome, Preview Routes and Cleanup

- [x] Remove canonical route reliance on `data-game-prototype` to hide global chrome.
- [x] Keep `/storefront-v2-game/*` as non-indexable historical preview, not as public canonical UX.
- [x] Ensure global header/footer and route-level public frame do not duplicate navigation.
- [x] Remove unused imports from migrated routes.

### Task 7: Verification

- [x] Run web helper tests:

```bash
node --import tsx --test apps/web/lib/storefront-purchase.test.ts apps/web/lib/storefront-runtime.test.ts apps/web/lib/huele-home-content.test.ts apps/web/lib/portal-access.test.ts apps/web/features/storefront-v2/lib/media.test.ts
```

- [x] Run web typecheck:

```bash
npm run typecheck -w @huelegood/web
```

- [x] Run web build:

```bash
npm run build -w @huelegood/web
```

- [x] Run browser smoke on:

```text
/
/catalogo
/producto/clasico-verde
/checkout
/mayoristas
/cuenta
/panel-vendedor
/trabaja-con-nosotros
```

- [x] Check desktop/mobile overflow, console errors, hydration errors and reduced-motion behavior.
