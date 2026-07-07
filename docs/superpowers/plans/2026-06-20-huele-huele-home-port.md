# Plan: Port Home Huele Huele Verde

## Objetivo

Llevar el prototipo `huele-huele-home` al storefront real `/` conservando la direccion verde, la mascota animada y la informacion comercial oficial, sin romper contratos runtime de CMS, catalogo, producto, stock, variantes, checkout ni mayoristas.

## Alcance

- Superficie directa: `apps/web/app/page.tsx` mediante `StorefrontGameHome`.
- Componentes nuevos o ajustados dentro de `apps/web/components`.
- Contenido estructurado/testeable dentro de `apps/web/lib`.
- Asset de mascota dentro de `apps/web/public/brand`.
- CSS scoped para la nueva home dentro de `apps/web/app/globals.css`.

## Guardrails

- No hardcodear catalogo vendible como fuente canonica de compra.
- Si hay catalogo runtime, precio y CTA salen de `CatalogProduct`.
- Si no hay catalogo runtime, la home conserva contenido de marca y deriva a `/catalogo`.
- No tocar `apps/api`, `apps/admin`, `apps/worker`, Prisma ni checkout.
- Respetar `prefers-reduced-motion`.
- No revertir cambios existentes en el worktree.

## Validacion

- Red/green test para el contrato de contenido de la home.
- `npm run typecheck -w @huelegood/web`.
- `npm run build -w @huelegood/web`.
- QA visual con Playwright en desktop y mobile.

## Trazabilidad

- Source prototype: `/Users/rapha/Documents/Codex/2026-06-19/quiero/outputs/huele-huele-home`.
- Repo target: `/Users/rapha/Projects/ERP-HUELEHUELE`.
- App target: `apps/web`.
