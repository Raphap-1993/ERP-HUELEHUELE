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
- Fase activa: extension de la capa canonica intermedia al slice `002-vendors-commissions`, con Fases 1-4 ya abiertas y sincronizacion transversal en curso.
- Resumen en una linea: el software ya opera con `web`, `admin`, `api` y `worker`; el trabajo actual ordena la documentacion vigente en una capa canonica por fases sin reescribir la historia del proyecto.
- Ultima actualizacion: `2026-05-26`

## Homologacion por fases
| Fase | Estado homologado | Evidencia principal |
|---|---|---|
| Fase 0 - Iniciacion | Backfilled | `docs/fase-0-iniciacion/` |
| Fase 1 - Analisis y requerimientos | Backfilled para slices `001` y `002` | `docs/fase-1-analisis-requerimientos/` |
| Fase 2 - UX/UI | Backfilled para slices `001` y `002` | `docs/fase-2-ux-ui/`, `specs/001-checkout-payments/product-design.md`, `specs/001-checkout-payments/spdd-frontend.md`, `specs/002-vendors-commissions/product-design.md`, `specs/002-vendors-commissions/spdd-frontend.md` |
| Fase 3 - Arquitectura | Backfilled para slices `001` y `002` | `docs/fase-3-arquitectura/` |
| Fase 4 - SDD | Instanciada para features `001` y `002` | `docs/fase-4-sdd/`, `specs/001-checkout-payments/`, `specs/002-vendors-commissions/` |
| Fase 5 - Construccion | Backfilled para el slice inicial | `docs/fase-5-construccion/`, `apps/` |
| Fase 6 - QA | Backfilled para el slice inicial | `docs/fase-6-qa/` |
| Fase 7 - Deploy | Backfilled para el slice inicial | `docs/fase-7-deploy/`, `docs/infra/`, `ecosystem.config.cjs` |
| Fase 8 - Operacion | Backfilled para el slice inicial | `docs/fase-8-operacion/` |

## Gates pendientes
- Extender la misma profundidad canonica al resto de slices del monorepo mas alla de `checkout/payments`.
- Validar y cerrar la capa transversal para `vendors/commissions` antes de abrir un tercer slice.
- Convertir la frontera `payment-gateway` de arquitectura/specs a implementacion real cuando se apruebe proveedor online.
- Seguir reduciendo dependencia de los documentos tematicos antiguos a medida que cada fase gane cobertura completa.

## Blockers
- La fuente vigente esta repartida entre `docs/product/`, `docs/architecture/`, `docs/flows/`, `docs/infra/` y los artefactos historicos `docs/00-06`.
- La capa canonica ya cubre `checkout/payments` y `vendors/commissions`, pero no todo el monorepo.
- La narrativa metodologica ya existe para dos slices; falta replicarla al resto del producto vivo.

## Proximos pasos
1. Revisar y aprobar la extension canonica del slice `vendors/commissions`.
2. Elegir el siguiente slice brownfield para repetir el patron de homologacion.
3. Mantener sincronizados `AI_CONTEXT.md`, `TRACEABILITY_MATRIX.md` y `docs/transversal/90.00-mapa-homologacion-brownfield.md` cada vez que una fase crezca.

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
