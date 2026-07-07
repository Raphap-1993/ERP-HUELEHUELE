# Huele Huele Public Web Foundation Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Homologar la base visual publica de `apps/web` para que `/`, `/catalogo` y `/checkout` compartan el mismo lenguaje de shell, tipografia, spacing, superficies y CTAs sin tocar backend, contratos API ni la logica transaccional actual del checkout.

**Architecture:** La implementacion crea una `public foundation` pequena dentro de `apps/web/features/` y la usa para envolver `catalogo` y `checkout` con el mismo marco visual de la home publicada. La logica funcional sigue donde ya vive: `CatalogBrowser` mantiene filtros y compra, `CheckoutWorkspace` mantiene pasos y pago manual, y `app/layout.tsx` conserva header/footer globales; el cambio entra por composicion visual, no por reescritura del flujo.

**Tech Stack:** `Next.js 15`, React 19, Tailwind CSS, `@huelegood/ui`, TypeScript, verificacion con `npm run typecheck -w @huelegood/web`, `npm run build -w @huelegood/web` y smoke manual en navegador. No existe harness dedicado de tests frontend en `apps/web` hoy, asi que el gate real del plan es typecheck + build + smoke funcional.

---

## File Structure

### Create

- `apps/web/features/public-foundation/components/public-route-shell.tsx`
- `apps/web/features/public-foundation/components/public-route-intro.tsx`
- `apps/web/features/public-foundation/components/public-trust-strip.tsx`
- `apps/web/features/public-foundation/index.ts`

### Modify

- `apps/web/app/catalogo/page.tsx`
- `apps/web/app/checkout/page.tsx`
- `apps/web/components/catalog-browser.tsx`
- `apps/web/components/checkout-workspace.tsx`

### Reuse As-Is

- `apps/web/components/public-shell.tsx`
- `apps/web/app/layout.tsx`
- `apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx`
- `apps/web/lib/api.ts`
- `apps/web/lib/session.ts`

### Responsibilities

- `public-foundation/` encapsula el shell de pagina, intro de ruta y trust strip comun para rutas publicas secundarias.
- `catalogo/page.tsx` pasa a ser owner del marco editorial de la ruta; `CatalogBrowser` queda concentrado en filtros, carga, empty states y cards.
- `checkout/page.tsx` pasa a ser owner del marco editorial de la ruta; `CheckoutWorkspace` queda concentrado en el flujo de pasos y el pago manual.
- `CheckoutWorkspace` gana un modo `public` embebible para no forzar la variante fullscreen cuando la ruta ya esta dentro de un shell comun.

## Task 1: Crear la `public foundation` compartida

**Files:**
- Create: `apps/web/features/public-foundation/components/public-route-shell.tsx`
- Create: `apps/web/features/public-foundation/components/public-route-intro.tsx`
- Create: `apps/web/features/public-foundation/components/public-trust-strip.tsx`
- Create: `apps/web/features/public-foundation/index.ts`
- Reuse: `apps/web/components/public-shell.tsx`

- [ ] **Step 1: Crear el shell base de pagina publica**

Crear `apps/web/features/public-foundation/components/public-route-shell.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@huelegood/ui";

export function PublicRouteShell({
  children,
  className,
  narrow = false
}: {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div className="pb-16 pt-8 md:pb-24 md:pt-10">
      <div
        className={cn(
          "mx-auto grid gap-8 px-4 md:px-6",
          narrow ? "max-w-[1120px]" : "max-w-[1200px]",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear la introduccion reutilizable de rutas secundarias**

Crear `apps/web/features/public-foundation/components/public-route-intro.tsx`:

```tsx
import type { ReactNode } from "react";
import { Button } from "@huelegood/ui";

type PublicRouteAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
};

export function PublicRouteIntro({
  eyebrow,
  title,
  description,
  actions,
  aside
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: PublicRouteAction[];
  aside?: ReactNode;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)] xl:items-end">
      <div className="rounded-[2rem] border border-black/6 bg-[linear-gradient(180deg,rgba(250,248,243,0.98)_0%,rgba(245,242,232,0.93)_100%)] px-6 py-7 shadow-[0_18px_44px_rgba(26,58,46,0.04)] md:px-8 md:py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#61a740]">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-[2.4rem] leading-[0.96] tracking-[-0.05em] text-[#1a3a2e] md:text-[3.4rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-[1rem] leading-7 text-black/58 md:text-[1.04rem]">
          {description}
        </p>
        {actions?.length ? (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {actions.map((action, index) => (
              <Button
                key={`${action.href}-${index}`}
                href={action.href}
                variant={action.variant ?? (index === 0 ? "primary" : "secondary")}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      {aside ? aside : null}
    </section>
  );
}
```

- [ ] **Step 3: Crear el trust strip y el barrel de exports**

Crear `apps/web/features/public-foundation/components/public-trust-strip.tsx`:

```tsx
import { cn } from "@huelegood/ui";

type PublicTrustItem = {
  label: string;
  value: string;
};

export function PublicTrustStrip({
  items,
  className
}: {
  items: PublicTrustItem[];
  className?: string;
}) {
  return (
    <section className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[1.35rem] border border-black/6 bg-white/78 px-4 py-4 shadow-[0_8px_24px_rgba(26,58,46,0.03)]"
        >
          <p className="text-[10px] uppercase tracking-[0.22em] text-black/38">{item.label}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#1a3a2e]">{item.value}</p>
        </div>
      ))}
    </section>
  );
}
```

Crear `apps/web/features/public-foundation/index.ts`:

```ts
export * from "../../components/public-shell";
export * from "./components/public-route-shell";
export * from "./components/public-route-intro";
export * from "./components/public-trust-strip";
```

- [ ] **Step 4: Verificar que la foundation compila**

Run:

```bash
npm run typecheck -w @huelegood/web
```

Expected: exit `0` sin errores de imports o tipos nuevos en `public-foundation`.

- [ ] **Step 5: Commit de la foundation**

```bash
git add apps/web/features/public-foundation
git commit -m "feat(web): create public foundation route shell"
```

## Task 2: Homologar `/catalogo` al shell publico compartido

**Files:**
- Modify: `apps/web/app/catalogo/page.tsx`
- Modify: `apps/web/components/catalog-browser.tsx`
- Reuse: `apps/web/lib/api.ts`

- [ ] **Step 1: Mover el marco editorial de `/catalogo` al route file**

Reemplazar `apps/web/app/catalogo/page.tsx` por:

```tsx
import { CatalogBrowser } from "../../components/catalog-browser";
import { PublicRouteIntro, PublicRouteShell, PublicTrustStrip } from "../../features/public-foundation";

const catalogTrustItems = [
  { label: "Compra directa", value: "Tres referencias reales, sin catálogo inflado." },
  { label: "Entrega", value: "Envíos a todo el Perú con seguimiento manual." },
  { label: "Compra guiada", value: "Si eliges desde aquí, el checkout ya recibe tu selección." },
  { label: "Mayoristas", value: "Si compras por volumen, el siguiente paso es /mayoristas." }
];

export default function CatalogPage() {
  return (
    <PublicRouteShell narrow>
      <PublicRouteIntro
        eyebrow="Catálogo oficial"
        title="Elige tu Huele Huele sin salir del mismo funnel."
        description="Explora las tres referencias reales de la marca, compara formatos y entra al checkout con una experiencia consistente con la home oficial."
        actions={[
          { href: "/checkout", label: "Ir al checkout" },
          { href: "/mayoristas", label: "Comprar por volumen", variant: "secondary" }
        ]}
      />
      <PublicTrustStrip items={catalogTrustItems} />
      <CatalogBrowser />
    </PublicRouteShell>
  );
}
```

- [ ] **Step 2: Dejar `CatalogBrowser` enfocado en filtros, estados y cards**

En `apps/web/components/catalog-browser.tsx`:

1. Cambiar imports para usar `PublicPanel`:

```tsx
import { PublicPanel } from "../features/public-foundation";
```

2. Reemplazar el inicio del `return` por este bloque:

```tsx
return (
  <div className="grid gap-6">
    <PublicPanel className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8c6331]">
            Filtra el catálogo
          </p>
          <p className="mt-1 text-sm leading-6 text-[#5f6f66]">
            Mantén la compra simple: individuales o bundle, sin salir del lenguaje editorial de la web pública.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-full border-[1.5px] px-4 py-2 text-sm font-medium transition ${
                activeFilter === filter.id
                  ? "border-[#61a740] bg-[#eef6e8] text-[#1a3a2e]"
                  : "border-[rgba(97,167,64,0.22)] text-[#6b7280] hover:border-[#61a740] hover:bg-[#eef6e8] hover:text-[#1a3a2e]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </PublicPanel>

    {loading && !products.length ? (
      <PublicPanel className="text-center text-sm text-[#5f6f66]">
        Cargando catálogo...
      </PublicPanel>
    ) : null}

    {!loading && visibleProducts.length === 0 ? (
      <PublicPanel className="text-center">
        <p className="text-lg font-semibold text-[#163126]">No encontramos productos para ese filtro.</p>
        <p className="mt-2 text-sm leading-7 text-[#5f6f66]">
          Cambia la categoría o vuelve a “Todos” para seguir comprando.
        </p>
      </PublicPanel>
    ) : null}

    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
```

3. Eliminar el `section` exterior, el encabezado “Nuestros productos” y el cierre `</section>`/`</div>` asociado al shell viejo.

- [ ] **Step 3: Verificar `catalogo` con typecheck y build**

Run:

```bash
npm run typecheck -w @huelegood/web
npm run build -w @huelegood/web
```

Expected: exit `0`; `catalogo/page.tsx` compila con el nuevo shell y `CatalogBrowser` no rompe `next build`.

- [ ] **Step 4: Commit de `/catalogo`**

```bash
git add apps/web/app/catalogo/page.tsx apps/web/components/catalog-browser.tsx
git commit -m "feat(web): align catalog route with public foundation"
```

## Task 3: Embeber `/checkout` dentro del shell publico sin romper el flujo manual

**Files:**
- Modify: `apps/web/app/checkout/page.tsx`
- Modify: `apps/web/components/checkout-workspace.tsx`

- [ ] **Step 1: Envolver `/checkout` con la misma gramatica publica**

Reemplazar `apps/web/app/checkout/page.tsx` por:

```tsx
"use client";

import dynamic from "next/dynamic";
import { PublicRouteIntro, PublicRouteShell, PublicTrustStrip } from "../../features/public-foundation";

const CheckoutWorkspace = dynamic(
  () => import("../../components/checkout-workspace").then((module) => module.CheckoutWorkspace),
  {
    ssr: false,
    loading: () => <div className="py-16 text-center text-sm text-black/55">Cargando checkout...</div>
  }
);

const checkoutTrustItems = [
  { label: "Pago vigente", value: "El cierre visible sigue siendo manual con comprobante." },
  { label: "Documento", value: "Primero validas identidad y luego defines entrega." },
  { label: "Envío", value: "La ubicación se captura dentro del flujo, sin salir de la ruta." },
  { label: "Soporte", value: "Si algo falla, el equipo operativo confirma el pedido manualmente." }
];

export default function CheckoutPage() {
  return (
    <PublicRouteShell narrow>
      <PublicRouteIntro
        eyebrow="Checkout oficial"
        title="Confirma tu pedido con el mismo lenguaje visual de la home y el catálogo."
        description="La lógica del checkout no cambia en esta ola: mantienes el pago manual, el documento obligatorio y la validación operativa existente, pero sobre una base pública ya homologada."
        actions={[
          { href: "/catalogo", label: "Volver al catálogo", variant: "secondary" }
        ]}
      />
      <PublicTrustStrip items={checkoutTrustItems} />
      <CheckoutWorkspace presentation="public" />
    </PublicRouteShell>
  );
}
```

- [ ] **Step 2: Hacer embebible `CheckoutWorkspace` sin perder la variante fullscreen**

En `apps/web/components/checkout-workspace.tsx`:

1. Agregar `cn` desde `@huelegood/ui`:

```tsx
import {
  CHECKOUT_DOCUMENT_TYPE_OPTIONS,
  isCheckoutStandardDeliveryDepartmentCode,
  isCheckoutStandardDeliveryProvinceCode,
  type AuthSessionSummary,
  type CheckoutItemInput,
  type CheckoutDocumentType,
  type CheckoutDocumentLookupSummary,
  type CheckoutQuoteItemSummary,
  type CheckoutQuoteSummary,
  type CheckoutRequestInput,
  type CatalogProduct,
  type PeruDepartmentSummary,
  type PeruDistrictSummary,
  type PeruProvinceSummary,
  type SiteSetting
} from "@huelegood/shared";
import { cn } from "@huelegood/ui";
```

2. Introducir el modo de presentacion:

```tsx
type CheckoutWorkspacePresentation = "fullscreen" | "public";
```

3. Cambiar la firma del componente:

```tsx
export function CheckoutWorkspace({
  presentation = "fullscreen"
}: {
  presentation?: CheckoutWorkspacePresentation;
}) {
  const isFullscreen = presentation === "fullscreen";
```

4. Reemplazar el wrapper exterior que hoy fuerza fullscreen por:

```tsx
  return (
    <div
      data-checkout-fullscreen={isFullscreen ? "true" : undefined}
      className={cn(
        "w-full",
        isFullscreen
          ? "min-h-full bg-[hsl(var(--background))] px-4 pb-6 pt-4 md:px-6 md:pb-8 md:pt-6"
          : "grid gap-5"
      )}
    >
```

5. Mantener intactos los tres bloques grandes de renderizado del flujo:

- el bloque de `activeStep === 1`
- el bloque de `activeStep === 2`
- el bloque de `activeStep === 3`

La regla de este paso es no tocar `handleSubmit`, `createManualCheckout`, carga de quote, validaciones de documento ni el orden funcional del flujo.

- [ ] **Step 3: Verificar checkout en typecheck, build y smoke local**

Run:

```bash
npm run typecheck -w @huelegood/web
npm run build -w @huelegood/web
npm run dev:web
```

Expected:

- `typecheck` exit `0`
- `build` exit `0`
- `dev:web` deja `http://localhost:3000` disponible

Manual smoke obligatorio con Browser:

- abrir `/`
- abrir `/catalogo`
- abrir `/checkout`
- confirmar header/footer compartidos
- confirmar intro y trust strip nuevos en `catalogo` y `checkout`
- agregar un producto desde `/catalogo`
- entrar a `/checkout`
- confirmar que el flujo sigue mostrando pasos, documento, entrega y pago manual sin errores nuevos

- [ ] **Step 4: Commit de `/checkout`**

```bash
git add apps/web/app/checkout/page.tsx apps/web/components/checkout-workspace.tsx
git commit -m "feat(web): embed checkout in public route shell"
```

## Task 4: Verificacion final del funnel publico homologado

**Files:**
- Verification only; no new files expected

- [ ] **Step 1: Ejecutar gate final de compilacion**

Run:

```bash
npm run typecheck -w @huelegood/web
npm run build -w @huelegood/web
```

Expected: ambos comandos terminan en exit `0` con el funnel publico compilando sin regresiones de tipos.

- [ ] **Step 2: Ejecutar smoke visual cruzado**

Run:

```bash
npm run dev:web
```

Expected: el servidor de desarrollo queda listo en `http://localhost:3000`.

Manual smoke obligatorio con Browser:

- `/` mantiene la home premium actual
- `/catalogo` ya no se siente una ruta vieja desconectada
- `/checkout` ya no entra como superficie ajena a la home
- mobile: sin overflow horizontal, botones tap-friendly, trust strip legible
- desktop: spacing consistente, cards alineadas, intro visible bajo el header sticky

- [ ] **Step 3: Si el smoke detecta regresiones, volver a Task 2 o Task 3 antes de cerrar**

Usar esta regla de cierre:

```bash
git status --short
```

Expected: solo cambios ya previstos por este plan; si aparece una regresion visual o funcional, se corrige en la task correspondiente y luego se repiten `typecheck`, `build` y el smoke.
