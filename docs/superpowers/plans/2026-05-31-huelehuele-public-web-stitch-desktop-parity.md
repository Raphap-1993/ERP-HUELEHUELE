# Huele Huele Public Web Stitch Desktop Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar `/`, `/catalogo` y `/checkout` con paridad visual desktop contra los screens canónicos de Stitch, manteniendo datos reales y el flujo real del checkout.

**Architecture:** La implementación usa `Stitch` como verdad visual y el repo como verdad funcional. Se crea una capa presentacional `public-stitch` para el chrome y los bloques visuales compartidos, se reconstruye la home sobre el loader actual, y se rehacen `catalogo` y `checkout` preservando la lógica viva en `CatalogBrowser` y `CheckoutWorkspace`.

**Tech Stack:** `Next.js 15`, React 19, TypeScript, Tailwind CSS, `@huelegood/shared`, `@huelegood/ui`, `next/image`, verificación por `npm run typecheck -w @huelegood/web`, `npm run build -w @huelegood/web` y smoke real local con navegador.

---

## File Structure

### Create

- `apps/web/features/public-stitch/components/public-stitch-shell.tsx`
- `apps/web/features/public-stitch/components/public-stitch-stage.tsx`
- `apps/web/features/public-stitch/components/public-stitch-product-card.tsx`
- `apps/web/features/public-stitch/index.ts`
- `apps/web/features/public-stitch-home/layouts/stitch-home-desktop-page.tsx`

### Modify

- `apps/web/app/layout.tsx`
- `apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx`
- `apps/web/app/catalogo/page.tsx`
- `apps/web/components/catalog-browser.tsx`
- `apps/web/app/checkout/page.tsx`
- `apps/web/components/checkout-workspace.tsx`

### Reuse As-Is

- `apps/web/app/page.tsx`
- `apps/web/lib/api.ts`
- `apps/web/lib/session.ts`
- `apps/web/features/storefront-v2-premium/lib/media.ts`
- `apps/web/features/public-foundation/components/public-route-shell.tsx`
- `apps/web/features/public-foundation/components/public-route-intro.tsx`
- `apps/web/features/public-foundation/components/public-trust-strip.tsx`

### Responsibilities

- `public-stitch/` encapsula el chrome visual común y las superficies compartidas que deben parecerse a Stitch en desktop.
- `stitch-home-desktop-page.tsx` recompone la home usando datos reales ya cargados por `StorefrontV2PremiumExperience`.
- `catalog-browser.tsx` sigue siendo owner del fetch y filtrado real, pero pasa a renderizar una composición 1:1 desktop basada en Stitch.
- `checkout-workspace.tsx` sigue siendo owner del carrito, pasos, quote y envío, pero gana una variante presentacional `stitchDesktop`.
- `app/layout.tsx` ajusta el header/footer público para que el funnel completo comparta el mismo chrome visual de la referencia Stitch.

## Task 1: Crear el chrome `public-stitch` y alinear el layout global

**Files:**
- Create: `apps/web/features/public-stitch/components/public-stitch-shell.tsx`
- Create: `apps/web/features/public-stitch/components/public-stitch-stage.tsx`
- Create: `apps/web/features/public-stitch/components/public-stitch-product-card.tsx`
- Create: `apps/web/features/public-stitch/index.ts`
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Crear el shell visual base de Stitch**

Crear `apps/web/features/public-stitch/components/public-stitch-shell.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@huelegood/ui";

export function PublicStitchShell({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1376px] px-4 pb-20 pt-8 md:px-6 md:pb-24 md:pt-10", className)}>
      {children}
    </div>
  );
}

export function PublicStitchBand({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[30px] border border-black/6 bg-[linear-gradient(180deg,rgba(252,250,245,0.98)_0%,rgba(245,242,232,0.94)_100%)] shadow-[0_24px_60px_rgba(26,58,46,0.06)]",
        className
      )}
    >
      {children}
    </section>
  );
}
```

- [ ] **Step 2: Crear el stage reusable para hero, catalogo y checkout**

Crear `apps/web/features/public-stitch/components/public-stitch-stage.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@huelegood/ui";
import { PublicStitchBand } from "./public-stitch-shell";

export function PublicStitchStage({
  eyebrow,
  title,
  description,
  actions,
  aside,
  className
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <PublicStitchBand className={cn("grid gap-6 overflow-hidden px-6 py-7 md:px-8 md:py-8 xl:grid-cols-[1.04fr_0.96fr] xl:items-stretch", className)}>
      <div className="flex flex-col justify-between gap-6">
        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f9252]">{eyebrow}</p>
          <h1 className="font-serif text-[2.8rem] leading-[0.94] tracking-[-0.05em] text-[#183225] md:text-[4.1rem]">
            {title}
          </h1>
          <p className="max-w-2xl text-[1rem] leading-7 text-black/56 md:text-[1.05rem]">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {aside ? <div className="min-h-[320px]">{aside}</div> : <div aria-hidden="true" />}
    </PublicStitchBand>
  );
}
```

- [ ] **Step 3: Crear una card visual reusable para catálogo y merchandising**

Crear `apps/web/features/public-stitch/components/public-stitch-product-card.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@huelegood/ui";

export function PublicStitchProductCard({
  media,
  body,
  className
}: {
  media: ReactNode;
  body: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("overflow-hidden rounded-[28px] border border-[rgba(24,50,37,0.08)] bg-white shadow-[0_18px_44px_rgba(26,58,46,0.05)]", className)}>
      <div className="grid h-full grid-rows-[minmax(240px,320px)_1fr]">
        <div className="relative overflow-hidden">{media}</div>
        <div className="p-6">{body}</div>
      </div>
    </article>
  );
}
```

Crear `apps/web/features/public-stitch/index.ts`:

```ts
export { PublicStitchShell, PublicStitchBand } from "./components/public-stitch-shell";
export { PublicStitchStage } from "./components/public-stitch-stage";
export { PublicStitchProductCard } from "./components/public-stitch-product-card";
```

- [ ] **Step 4: Ajustar el header y footer global al chrome Stitch**

En `apps/web/app/layout.tsx`, mantener la lógica de navegación y branding, pero cambiar solo el contenedor visual del header/footer:

```tsx
<header className="sticky top-0 z-40 shrink-0 px-4 pt-4 md:px-6">
  <div className="mx-auto max-w-[1376px]">
    <div className="flex items-center justify-between gap-4 rounded-[28px] border border-black/6 bg-[rgba(255,252,246,0.9)] px-5 py-4 shadow-[0_18px_42px_rgba(26,58,46,0.08)] backdrop-blur-xl">
```

Y para el footer:

```tsx
<footer className="bg-[linear-gradient(180deg,#eef3e7_0%,#e7efdf_100%)] px-4 py-14 text-[#163126] md:px-6">
  <div className="mx-auto max-w-[1376px]">
```

No cambies:

- `resolveRuntimeSettings()`
- `generateMetadata()`
- `links`, `navigationGroups` ni `MobileNav`

- [ ] **Step 5: Verificar y commit del chrome**

Run:

```bash
npm run typecheck -w @huelegood/web
npm run build -w @huelegood/web
```

Expected: exit `0`; header/footer compilan con el nuevo shell.

Commit:

```bash
git add apps/web/features/public-stitch apps/web/app/layout.tsx
git commit -m "feat(web): add stitch desktop public chrome"
```

## Task 2: Reconstruir la home desktop contra `Home A`

**Files:**
- Create: `apps/web/features/public-stitch-home/layouts/stitch-home-desktop-page.tsx`
- Modify: `apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx`
- Reuse: `apps/web/app/page.tsx`

- [ ] **Step 1: Crear la nueva composición visual de home**

Crear `apps/web/features/public-stitch-home/layouts/stitch-home-desktop-page.tsx`:

```tsx
import Image from "next/image";
import { Button } from "@huelegood/ui";
import { type CatalogProduct, type CmsTestimonial, type FaqItem } from "@huelegood/shared";
import { PublicStitchBand, PublicStitchShell, PublicStitchStage } from "../../public-stitch";

type StitchHomeDesktopPageProps = {
  heroTitle: string;
  heroDescription: string;
  heroProductImageUrl?: string;
  products: CatalogProduct[];
  currencyCode: string;
  testimonials?: CmsTestimonial[];
  faqs?: FaqItem[];
};

export function StitchHomeDesktopPage({
  heroTitle,
  heroDescription,
  heroProductImageUrl,
  products,
  currencyCode,
  testimonials,
  faqs
}: StitchHomeDesktopPageProps) {
  return (
    <PublicStitchShell className="space-y-8 md:space-y-10">
      <PublicStitchStage
        eyebrow="Huele Huele oficial"
        title={heroTitle}
        description={heroDescription}
        actions={
          <>
            <Button href="/catalogo">Comprar ahora</Button>
            <Button href="/catalogo" variant="secondary">Ver catálogo</Button>
          </>
        }
        aside={
          <div className="relative h-full min-h-[360px] rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(220,236,208,0.95),rgba(151,180,122,0.95))]">
            {heroProductImageUrl ? (
              <Image fill src={heroProductImageUrl} alt="Huele Huele" className="object-contain p-8" />
            ) : null}
          </div>
        }
      />
      <PublicStitchBand className="grid gap-4 p-6 md:grid-cols-4 md:p-8">
        <div className="rounded-[22px] bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/42">Productos</p>
          <p className="mt-2 font-serif text-[2rem] text-[#183225]">{products.length}</p>
        </div>
        <div className="rounded-[22px] bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/42">Moneda</p>
          <p className="mt-2 font-serif text-[2rem] text-[#183225]">{currencyCode}</p>
        </div>
        <div className="rounded-[22px] bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/42">Testimonios</p>
          <p className="mt-2 font-serif text-[2rem] text-[#183225]">{testimonials?.length ?? 0}</p>
        </div>
        <div className="rounded-[22px] bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/42">Preguntas</p>
          <p className="mt-2 font-serif text-[2rem] text-[#183225]">{faqs?.length ?? 0}</p>
        </div>
      </PublicStitchBand>
    </PublicStitchShell>
  );
}
```

- [ ] **Step 2: Redirigir la home actual al nuevo layout sin perder el fetch real**

En `apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx`, conserva los `Promise.all` y reemplaza el `return` por:

```tsx
return (
  <StitchHomeDesktopPage
    heroTitle={hero.title}
    heroDescription={hero.subtitle}
    heroProductImageUrl={heroProductImageUrl}
    products={products}
    currencyCode={currencyCode}
    testimonials={testimonials.length > 0 ? testimonials : undefined}
    faqs={faqs.length > 0 ? faqs : undefined}
  />
);
```

Y cambia imports:

```tsx
import { StitchHomeDesktopPage } from "../../public-stitch-home/layouts/stitch-home-desktop-page";
```

Elimina imports viejos de secciones que ya no se rendericen:

```tsx
import { HeroSection } from "../sections/HeroSection";
import { BenefitsSection } from "../sections/BenefitsSection";
```

- [ ] **Step 3: Completar los bloques visibles de `Home A`**

Dentro de `stitch-home-desktop-page.tsx`, reemplaza el segundo `PublicStitchBand` por bloques reales de desktop:

```tsx
<PublicStitchBand className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
  <div className="space-y-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b6738]">Respira mejor</p>
    <h2 className="font-serif text-[2.4rem] leading-[0.98] tracking-[-0.05em] text-[#183225]">
      La experiencia pública debe sentirse como el prototipo, no como una landing genérica.
    </h2>
  </div>
  <div className="grid gap-3 md:grid-cols-2">
    {products.slice(0, 2).map((product) => (
      <div key={product.slug} className="rounded-[22px] border border-black/6 bg-white p-5">
        <p className="text-sm font-semibold text-[#183225]">{product.name}</p>
      </div>
    ))}
  </div>
</PublicStitchBand>
```

La implementación real puede enriquecer estos bloques, pero no debe volver a las secciones `BenefitsSection`, `ComparisonSection`, `PricingSection` ni `TestimonialsSection` como páginas separadas; el layout de la home queda dominado por la composición Stitch.

- [ ] **Step 4: Verificar y commit de home**

Run:

```bash
npm run typecheck -w @huelegood/web
npm run build -w @huelegood/web
```

Smoke manual esperado:

- `/` carga sin errores
- hero responde a datos reales
- CTA principal va a `/catalogo`

Commit:

```bash
git add apps/web/features/public-stitch-home apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx
git commit -m "feat(web): align home with stitch desktop reference"
```

## Task 3: Reconstruir `/catalogo` contra `Catalogo A`

**Files:**
- Modify: `apps/web/app/catalogo/page.tsx`
- Modify: `apps/web/components/catalog-browser.tsx`
- Reuse: `apps/web/features/public-stitch/components/public-stitch-product-card.tsx`

- [ ] **Step 1: Cambiar la ruta a un framing Stitch desktop**

En `apps/web/app/catalogo/page.tsx`, reemplaza la composición actual por:

```tsx
import { CatalogBrowser } from "../../components/catalog-browser";
import { Button } from "@huelegood/ui";
import { PublicStitchShell, PublicStitchStage } from "../../features/public-stitch";

export default function CatalogPage() {
  return (
    <PublicStitchShell className="space-y-8 md:space-y-10">
      <PublicStitchStage
        eyebrow="Catálogo oficial"
        title="Explora el inventario vivo con la misma presencia visual del prototipo."
        description="La vista sigue leyendo datos reales del sistema, pero la jerarquía desktop cambia para respetar el framing de Stitch."
        actions={
          <>
            <Button href="#catalog-products">Ver productos</Button>
            <Button href="/checkout" variant="secondary">Ir al checkout</Button>
          </>
        }
      />
      <CatalogBrowser />
    </PublicStitchShell>
  );
}
```

- [ ] **Step 2: Rehacer `CatalogBrowser` para que la data real caiga sobre el layout Stitch**

Mantén:

- `fetchCatalogSummary()`
- `activeFilter`
- `loadError`
- `AddToCartLink`

Pero cambia el `return` de `apps/web/components/catalog-browser.tsx` para que empiece así:

```tsx
return (
  <div id="catalog-products" className="grid gap-6 scroll-mt-24">
    <div className="grid gap-4 md:grid-cols-[0.28fr_0.72fr]">
      <div className="rounded-[26px] border border-black/6 bg-[rgba(252,250,245,0.94)] p-5 shadow-[0_18px_40px_rgba(26,58,46,0.05)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b6738]">Filtros</p>
        <div className="mt-4 flex flex-col gap-2.5">
          {filters.map((filter) => (
            <button key={filter.id} type="button" onClick={() => setActiveFilter(filter.id)}>
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
```

Y renderiza cada producto con `PublicStitchProductCard`:

```tsx
<PublicStitchProductCard
  key={product.slug}
  media={<Image fill src={image.src} alt={image.alt} className="object-cover" />}
  body={
    <div className="flex h-full flex-col justify-between gap-5">
      <div className="space-y-3">
        <h3 className="font-serif text-[1.45rem] leading-tight text-[#183225]">{product.name}</h3>
        <p className="text-sm leading-6 text-black/58">{description}</p>
      </div>
      <div className="space-y-3">
        <div className="text-xl font-semibold text-[#183225]">{price}</div>
        <AddToCartLink productSlug={product.slug} className="inline-flex h-12 items-center justify-center rounded-full bg-[#183225] px-5 text-sm font-semibold text-white">
          Comprar
        </AddToCartLink>
      </div>
    </div>
  }
/>
```

No elimines:

- manejo de `loadError`
- `visibleProducts`
- soporte para `variantCount > 1`
- badges de stock

- [ ] **Step 3: Mantener estados reales pero con estética Stitch**

Reemplaza los empty/error panels por contenedores visuales Stitch:

```tsx
<div className="rounded-[24px] border border-black/6 bg-white px-6 py-10 text-center shadow-[0_16px_36px_rgba(26,58,46,0.04)]">
  <p className="font-serif text-[1.8rem] text-[#183225]">No pudimos cargar el catálogo.</p>
</div>
```

Haz lo mismo para:

- `Cargando catálogo...`
- `No encontramos productos para ese filtro`

- [ ] **Step 4: Verificar y commit de catálogo**

Run:

```bash
npm run typecheck -w @huelegood/web
npm run build -w @huelegood/web
```

Smoke manual esperado:

- `/catalogo` carga productos reales
- filtrar sigue funcionando
- `Comprar` sigue handoff a `/checkout`

Commit:

```bash
git add apps/web/app/catalogo/page.tsx apps/web/components/catalog-browser.tsx
git commit -m "feat(web): align catalog with stitch desktop reference"
```

## Task 4: Reconstruir `/checkout` contra `Checkout A`

**Files:**
- Modify: `apps/web/app/checkout/page.tsx`
- Modify: `apps/web/components/checkout-workspace.tsx`

- [ ] **Step 1: Cambiar la ruta a un stage Stitch y una presentation dedicada**

En `apps/web/app/checkout/page.tsx`, reemplaza la composición actual por:

```tsx
"use client";

import dynamic from "next/dynamic";
import { Button } from "@huelegood/ui";
import { PublicStitchShell, PublicStitchStage } from "../../features/public-stitch";

const CheckoutWorkspace = dynamic(
  () => import("../../components/checkout-workspace").then((module) => module.CheckoutWorkspace),
  { ssr: false, loading: () => <div className="py-16 text-center text-sm text-black/55">Cargando checkout...</div> }
);

export default function CheckoutPage() {
  return (
    <PublicStitchShell className="space-y-8 md:space-y-10">
      <PublicStitchStage
        eyebrow="Checkout oficial"
        title="Confirma tu pedido dentro del mismo lenguaje visual del prototipo."
        description="La estructura cambia para parecerse al screen canonico, pero el flujo real de documento, entrega, quote y pago manual permanece intacto."
        actions={<Button href="/catalogo" variant="secondary">Volver al catálogo</Button>}
      />
      <CheckoutWorkspace presentation="stitchDesktop" />
    </PublicStitchShell>
  );
}
```

- [ ] **Step 2: Extender `CheckoutWorkspace` con una nueva variante presentacional**

En `apps/web/components/checkout-workspace.tsx`, amplía el type:

```tsx
type CheckoutWorkspacePresentation = "fullscreen" | "public" | "stitchDesktop";
```

Y agrega flags derivados:

```tsx
const isFullscreen = presentation === "fullscreen";
const isStitchDesktop = presentation === "stitchDesktop";
```

No cambies:

- carga de sesión
- carga de productos
- cálculo de quote
- pasos, validaciones y envío

- [ ] **Step 3: Reordenar solo la presentación del checkout para calzar con Stitch**

En el `return` principal de `CheckoutWorkspace`, cuando `isStitchDesktop` sea `true`, envuelve el contenido así:

```tsx
<div className="grid gap-6 xl:grid-cols-[0.68fr_0.32fr]">
  <div className="rounded-[28px] border border-black/6 bg-[rgba(252,250,245,0.94)] p-5 shadow-[0_18px_40px_rgba(26,58,46,0.05)] md:p-6">
    {/* panel de pasos, identidad, entrega y pago */}
  </div>
  <aside className="rounded-[28px] border border-black/6 bg-white p-5 shadow-[0_18px_40px_rgba(26,58,46,0.05)] md:p-6">
    {/* summary, subtotal, shipping, total, CTA manual */}
  </aside>
</div>
```

Mueve al `aside` Stitch:

- resumen de productos
- subtotal, envío y total
- progreso de envío gratis si existe
- ayuda / soporte del cierre

Mantén en la columna principal:

- navegación de pasos
- documento
- entrega
- pago manual
- estados de resultado

- [ ] **Step 4: Preservar los otros contratos visuales del checkout**

Deja el contrato viejo intacto:

```tsx
data-checkout-fullscreen={isFullscreen ? "true" : undefined}
```

Y conserva la rama existente de fullscreen sin reordenarla. La nueva composición debe activarse solo dentro de:

```tsx
if (isStitchDesktop) {
  return <>{/* nueva composición visual */}</>;
}
```

Antes de la rama fullscreen actual.

- [ ] **Step 5: Verificar y commit de checkout**

Run:

```bash
npm run typecheck -w @huelegood/web
npm run build -w @huelegood/web
```

Smoke manual esperado:

- `/checkout` sin carrito muestra empty state limpio
- `/catalogo -> comprar -> /checkout` conserva carrito real
- documento, entrega, quote y pago manual siguen visibles

Commit:

```bash
git add apps/web/app/checkout/page.tsx apps/web/components/checkout-workspace.tsx
git commit -m "feat(web): align checkout with stitch desktop reference"
```

## Task 5: Verificación visual y smoke final

**Files:**
- Modify: none
- Verify: `apps/web/app/page.tsx`, `apps/web/app/catalogo/page.tsx`, `apps/web/app/checkout/page.tsx`

- [ ] **Step 1: Ejecutar typecheck final**

Run:

```bash
npm run typecheck -w @huelegood/web
```

Expected: exit `0`.

- [ ] **Step 2: Ejecutar build final**

Run:

```bash
npm run build -w @huelegood/web
```

Expected: exit `0`; `/`, `/catalogo` y `/checkout` salen en el build.

- [ ] **Step 3: Smoke real de home**

Verificar en navegador:

- `/` responde `200`
- el hero principal se parece a `Home A`
- CTA visible lleva a `/catalogo`

- [ ] **Step 4: Smoke real de catálogo**

Verificar en navegador:

- `/catalogo` responde `200`
- la grilla muestra productos reales
- filtros siguen funcionando
- click en `Comprar` lleva a `/checkout`

- [ ] **Step 5: Smoke real de checkout**

Verificar en navegador:

- `/checkout` directo sin carrito no rompe
- `/catalogo -> comprar -> /checkout` muestra resumen y pasos
- el diseño desktop se parece a `Checkout A`

- [ ] **Step 6: Commit final de cierre**

```bash
git status --short
git add apps/web
git commit -m "feat(web): ship stitch desktop parity for public routes"
```
