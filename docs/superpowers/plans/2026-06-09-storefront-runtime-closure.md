# Storefront Runtime Closure

Fecha: `2026-06-09`
Proyecto: `ERP-HUELEHUELE`
Coordinación: `Jarvis / Viernes`

## Objetivo

Cerrar los huecos restantes del frente `catalogo + productos persistidos + media publica` para que el storefront publico deje de depender de fallbacks silenciosos y quede listo para seguir con UX encima de runtime real.

## Cierre ejecutado

- `apps/web/app/layout.tsx` ahora consume `site-settings` y `navigation` runtime; el fallback estatico queda solo como resiliencia.
- `apps/web/components/storefront-game-home.tsx` ahora resuelve la media hero desde `cms.siteSetting.heroProductImageUrl` o desde la primera imagen real de producto antes de caer al visual temporal.
- `apps/web/components/catalog-browser.tsx`, `apps/web/app/producto/[slug]/page.tsx`, `apps/web/features/storefront-v2-premium/layouts/storefront-v2-premium-page.tsx` y `apps/web/features/storefront-v2/lib/content.ts` ya no habilitan fallback estatico por defecto; solo se activa con `NEXT_PUBLIC_ALLOW_STOREFRONT_STATIC_FALLBACKS=true`.
- `apps/web/lib/storefront-runtime.ts` centraliza curacion de productos, politica de fallback y resolucion de hero media.
- `docs/architecture/product-branding-runtime-source-of-truth.md` queda alineado con la politica real del runtime publico.

## Resultado operativo

- si el API responde, `home`, `catalogo`, `PDP`, `checkout` y el shell publico consumen runtime canonico;
- si el API falla, la web ya no inventa catalogo vendible por defecto;
- la navegacion publica y la media base del shell responden al estado administrado en CMS;
- el fallback estatico sigue disponible solo como mecanismo tecnico explicito de desarrollo.

## Verificación

- `node --import tsx --test apps/web/lib/storefront-runtime.test.ts`
- `npm run typecheck -w @huelegood/web`
- `npm run build -w @huelegood/web`
- `npm run test:erp-sales`
- `npm run typecheck`
- `npm run build`
- QA local en `http://localhost:3107`

## Nota

Con este corte, la brecha principal restante para “terminar ecommerce” ya no es contrato runtime de producto/media sino cierre visual y alcance funcional de superficies secundarias como `cuenta`.
