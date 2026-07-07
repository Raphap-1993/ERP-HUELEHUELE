# Public UX Green Cut Design

## Goal

Convert the public Huele Huele storefront into one canonical green visual system based on the new home, while preserving the existing runtime contracts for catalog, product detail, cart, checkout, authentication, wholesale access, seller access, and vendor applications.

## Scope

The public UX cut applies to:

- `/`
- `/catalogo`
- `/producto/[slug]`
- `/checkout`
- `/mayoristas`
- `/cuenta`
- `/panel-vendedor`
- `/trabaja-con-nosotros`

The cut does not apply to `apps/admin`, internal ERP workbenches, API behavior, Prisma, worker jobs, inventory logic, stock reservation, quote calculation, payment ownership, or access-control semantics.

## Direction: Huele Verde Vivo

The public system uses the home as the source of visual truth:

- deep green atmospheric canvas
- warm off-white panels
- yellow/lime primary commerce CTAs
- dark green secondary actions
- Baloo 2 display typography and Nunito body typography
- the lorito mascot as a guide, not decoration on every component
- smooth motion based on `transform` and `opacity`
- visible product, price, stock, variant and checkout states

The previous `storefront-v2-game` / `StorefrontGameTemporal` visual language remains a historical baseline and should not be the public production look. Pixel typography, thick arcade borders, heavy pixel shadows, and game wording should leave canonical public routes.

## Public Route Decisions

`/catalogo` and `/producto/[slug]` are the first continuity path from the home. They must adopt the green style fully while preserving price, stock, variants, image fallback, direct add-to-cart, select-variant, and sold-out modes.

`/checkout` inherits the green brand but stays transactional. It should not feel playful while the user enters document, delivery and payment information. The lorito can appear in empty or success states only.

`/mayoristas` remains a single route with two modes: public lead capture and authenticated wholesale portal when the session has `portal.wholesale.read`. The code already implements this direction; docs should align with it.

`/cuenta` remains a public gateway. It authenticates, shows account/loyalty only when allowed, and redirects commercial sessions to the correct portal.

`/panel-vendedor` is public web but operational. It should use the same green public frame with denser, calmer panels.

`/trabaja-con-nosotros` should join the green public system and stop using the older premium/editorial look as a separate brand language.

## Architecture

Create reusable public primitives in `apps/web/components/huele-public-ui.tsx`:

- `HuelePublicPage`
- `HueleSection`
- `HuelePanel`
- `HueleButtonLink`
- `HueleButton`
- `HueleBadge`
- `HueleMascot`
- `HueleFieldShell`
- `HueleStatusCard`

Create commerce-specific helpers in `apps/web/components/huele-commerce-action.tsx`:

- render the right CTA from `resolveStorefrontPrimaryAction`
- use `AddToCartLink` for direct purchase
- link to PDP/variant selector for products that require a variant
- render disabled state for sold-out products

Keep data helpers in `apps/web/lib`. Do not duplicate catalog, stock, variant, checkout quote, session or access-control logic in visual components.

## Motion

Use restrained motion:

- section entry: 500-700ms
- button feedback: 100-180ms
- card hover: transform/box-shadow only
- form and checkout controls: no decorative animation
- always respect `prefers-reduced-motion`

## QA Contract

Minimum verification for this cut:

- `node --import tsx --test apps/web/lib/storefront-purchase.test.ts apps/web/lib/storefront-runtime.test.ts apps/web/lib/huele-home-content.test.ts apps/web/lib/portal-access.test.ts apps/web/features/storefront-v2/lib/media.test.ts`
- `npm run typecheck -w @huelegood/web`
- `npm run build -w @huelegood/web`
- browser smoke on `/`, `/catalogo`, `/producto/clasico-verde`, `/checkout`, `/mayoristas`, `/cuenta`, `/panel-vendedor`, `/trabaja-con-nosotros`
- desktop and mobile overflow check
- console/pageerror check
- reduced-motion check

## Open Risks

The repo worktree is already dirty. This cut must avoid reverting unrelated edits.

`/checkout` is a large client component. The first cut should reskin its frame and high-level surfaces without rewriting order/payment logic.

The old preview routes under `/storefront-v2-game/*` can remain accessible as non-indexable references, but they are not the canonical public UX.
