# AI_CONTEXT

> Primer archivo que un agente debe leer al retomar este repositorio.
> `AGENTS.md` define como trabajar. Este archivo fija el estado real del
> proyecto y del brownfield canonico.

## Identidad
- Proyecto: `ERP-HUELEHUELE`
- Dominio: plataforma comercial modular para operar Huelegood con storefront, backoffice, API y worker sobre una sola base operativa.
- Stack: monorepo `npm` con `Next.js`, `NestJS`, `Prisma`, `PostgreSQL`, `Redis`, `BullMQ`, `Tailwind CSS`, `PM2`, `Hestia` y `Nginx`.
- Version actual: snapshot brownfield sobre producto vivo.

## Estado actual
- Fase activa: capa canonica intermedia extendida y sincronizada hasta el slice `010-crm-transversal-por-cliente`, con Fases 1-4 ya abiertas para los diez slices homologados.
- Resumen en una linea: el software ya opera con `web`, `admin`, `api` y `worker`; el trabajo actual ordena la documentacion vigente en una capa canonica por fases sin reescribir la historia del proyecto.
- Ultima actualizacion: `2026-05-28`

## Homologacion por fases
| Fase | Estado homologado | Evidencia principal |
|---|---|---|
| Fase 0 - Iniciacion | Backfilled | `docs/fase-0-iniciacion/` |
| Fase 1 - Analisis y requerimientos | Backfilled para slices `001`, `002`, `003`, `004`, `005`, `006`, `007`, `008`, `009` y `010` | `docs/fase-1-analisis-requerimientos/` |
| Fase 2 - UX/UI | Backfilled para slices `001`, `002`, `003`, `004`, `005`, `006`, `007`, `008`, `009` y `010` | `docs/fase-2-ux-ui/`, `specs/001-checkout-payments/product-design.md`, `specs/001-checkout-payments/spdd-frontend.md`, `specs/002-vendors-commissions/product-design.md`, `specs/002-vendors-commissions/spdd-frontend.md`, `specs/003-wholesale-leads-quotes/product-design.md`, `specs/003-wholesale-leads-quotes/spdd-frontend.md`, `specs/004-loyalty-points-redemptions/product-design.md`, `specs/004-loyalty-points-redemptions/spdd-frontend.md`, `specs/005-cms-content-blocks-marketing-surfaces/product-design.md`, `specs/005-cms-content-blocks-marketing-surfaces/spdd-frontend.md`, `specs/006-campaigns-marketing-automation/product-design.md`, `specs/006-campaigns-marketing-automation/spdd-frontend.md`, `specs/007-customers-identity-conflicts/product-design.md`, `specs/007-customers-identity-conflicts/spdd-frontend.md`, `specs/008-crm-stage-order-follow-up/product-design.md`, `specs/008-crm-stage-order-follow-up/spdd-frontend.md`, `specs/009-crm-manual-ampliado/product-design.md`, `specs/009-crm-manual-ampliado/spdd-frontend.md`, `specs/010-crm-transversal-por-cliente/product-design.md`, `specs/010-crm-transversal-por-cliente/spdd-frontend.md` |
| Fase 3 - Arquitectura | Backfilled para slices `001`, `002`, `003`, `004`, `005`, `006`, `007`, `008`, `009` y `010` | `docs/fase-3-arquitectura/` |
| Fase 4 - SDD | Instanciada para features `001`, `002`, `003`, `004`, `005`, `006`, `007`, `008`, `009` y `010` | `docs/fase-4-sdd/`, `specs/001-checkout-payments/`, `specs/002-vendors-commissions/`, `specs/003-wholesale-leads-quotes/`, `specs/004-loyalty-points-redemptions/`, `specs/005-cms-content-blocks-marketing-surfaces/`, `specs/006-campaigns-marketing-automation/`, `specs/007-customers-identity-conflicts/`, `specs/008-crm-stage-order-follow-up/`, `specs/009-crm-manual-ampliado/`, `specs/010-crm-transversal-por-cliente/` |
| Fase 5 - Construccion | Backfilled para el slice inicial | `docs/fase-5-construccion/`, `apps/` |
| Fase 6 - QA | Backfilled para el slice inicial | `docs/fase-6-qa/` |
| Fase 7 - Deploy | Backfilled para el slice inicial | `docs/fase-7-deploy/`, `docs/infra/`, `ecosystem.config.cjs` |
| Fase 8 - Operacion | Backfilled para el slice inicial | `docs/fase-8-operacion/` |

## Gates pendientes
- Extender la misma profundidad canonica al resto de slices del monorepo mas alla de `checkout/payments`, `vendors/commissions`, `wholesale-leads-quotes`, `loyalty-points-redemptions`, `cms-content-blocks-marketing-surfaces`, `campaigns-marketing-automation`, `customers-identity-conflicts`, `crm-stage-order-follow-up`, `crm-manual-ampliado` y `crm-transversal-por-cliente`.
- Abrir el siguiente slice propio para pipeline comercial amplio, scoring o automatizaciones posteriores al CRM transversal por cliente ya homologado.
- Convertir la frontera `payment-gateway` de arquitectura/specs a implementacion real cuando se apruebe proveedor online.
- Seguir reduciendo dependencia de los documentos tematicos antiguos a medida que cada fase gane cobertura completa.

## Blockers
- La fuente vigente esta repartida entre `docs/product/`, `docs/architecture/`, `docs/flows/`, `docs/infra/` y los artefactos historicos `docs/00-06`.
- La capa canonica ya cubre `checkout/payments`, `vendors/commissions`, `wholesale-leads-quotes`, `loyalty-points-redemptions`, `cms-content-blocks-marketing-surfaces`, `campaigns-marketing-automation`, `customers-identity-conflicts`, `crm-stage-order-follow-up`, `crm-manual-ampliado` y `crm-transversal-por-cliente`, pero no todo el monorepo.
- El slice `010` ya fija el CRM transversal por cliente as-is, pero pipeline comercial amplio, scoring y automatizaciones posteriores siguen sin corte canonico propio.
- La narrativa metodologica ya existe para diez slices; falta replicarla al resto del producto vivo.

## Proximos pasos
1. Priorizar el siguiente slice brownfield para pipeline comercial amplio, scoring o automatizaciones posteriores al CRM transversal por cliente ya homologado.
2. Mantener sincronizados `AI_CONTEXT.md`, `TRACEABILITY_MATRIX.md` y `docs/transversal/90.00-mapa-homologacion-brownfield.md` cada vez que una fase crezca.
3. Seguir reduciendo drift entre la capa canonica y documentos brownfield globales como outlines API y mapas de modulo.

## Como cargar contexto rapido
1. Leer `AGENTS.md`.
2. Leer `PROJECT_MAP.md`.
3. Leer `TRACEABILITY_MATRIX.md`.
4. Abrir `docs/transversal/90.00-mapa-homologacion-brownfield.md`.
5. Entrar a `docs/fase-0-iniciacion/` y luego a los documentos vigentes de producto o arquitectura segun el frente.

## Punteros clave
- `PROJECT_MAP.md`
- `TRACEABILITY_MATRIX.md`
- `GLOSSARY.md`
- `docs/README.md`
- `docs/product/product-vision.md`
- `docs/product/roadmap.md`
- `docs/architecture/overview.md`

## Regla de mantenimiento
- Actualiza este archivo cuando cambie la fase activa, el principal gap metodologico o la fuente vigente del proyecto.
- Si una fase se formaliza, reflejala aqui y en `TRACEABILITY_MATRIX.md` en el mismo corte.
