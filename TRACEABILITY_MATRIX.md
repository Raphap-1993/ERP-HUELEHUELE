# TRACEABILITY_MATRIX

> Matriz global de trazabilidad del brownfield. Fija que fase ya tiene capa
> canonica, que evidencia sigue viva en el repo y donde quedan los principales
> gaps.

## Homologacion por fases
| Fase | Estado | Evidencia en repo | Gap principal |
|---|---|---|---|
| Fase 0 - Iniciacion | Backfilled | `docs/fase-0-iniciacion/00.01-vision-proyecto.md`, `00.02-roadmap.md`, `00.03-estimacion-tiempo-costo.md`, `00.04-roles-y-responsabilidades.md`, `00.05-checklist-adopcion.md`, `00.06-estrategia-homologacion-brownfield.md` | Mantener la capa canonica alineada al producto vivo |
| Fase 1 - Analisis y requerimientos | Backfilled para slices `001`, `002`, `003`, `004`, `005`, `006`, `007` y `008` | `docs/fase-1-analisis-requerimientos/` | Replicar el mismo nivel al resto de dominios y separar futuros slices de CRM manual/ampliado |
| Fase 2 - UX/UI | Backfilled para slices `001`, `002`, `003`, `004`, `005`, `006`, `007` y `008` | `docs/fase-2-ux-ui/`, `specs/001-checkout-payments/product-design.md`, `spdd-frontend.md`, `prototype.md`, `prototype-validation.md`, `specs/002-vendors-commissions/product-design.md`, `specs/002-vendors-commissions/spdd-frontend.md`, `specs/003-wholesale-leads-quotes/product-design.md`, `specs/003-wholesale-leads-quotes/spdd-frontend.md`, `specs/004-loyalty-points-redemptions/product-design.md`, `specs/004-loyalty-points-redemptions/spdd-frontend.md`, `specs/005-cms-content-blocks-marketing-surfaces/product-design.md`, `specs/005-cms-content-blocks-marketing-surfaces/spdd-frontend.md`, `specs/006-campaigns-marketing-automation/product-design.md`, `specs/006-campaigns-marketing-automation/spdd-frontend.md`, `specs/007-customers-identity-conflicts/product-design.md`, `specs/007-customers-identity-conflicts/spdd-frontend.md`, `specs/008-crm-stage-order-follow-up/product-design.md`, `specs/008-crm-stage-order-follow-up/spdd-frontend.md` | Extender SPDD visual a otras superficies sin mezclar seguimiento derivado con CRM manual |
| Fase 3 - Arquitectura | Backfilled para slices `001`, `002`, `003`, `004`, `005`, `006`, `007` y `008` | `docs/fase-3-arquitectura/` | Implementar la frontera `payment-gateway` cuando el negocio la apruebe y seguir bajando dominios brownfield al canon |
| Fase 4 - SDD | Instanciada para `001-checkout-payments`, `002-vendors-commissions`, `003-wholesale-leads-quotes`, `004-loyalty-points-redemptions`, `005-cms-content-blocks-marketing-surfaces`, `006-campaigns-marketing-automation`, `007-customers-identity-conflicts` y `008-crm-stage-order-follow-up` | `docs/fase-4-sdd/`, `specs/001-checkout-payments/`, `specs/002-vendors-commissions/`, `specs/003-wholesale-leads-quotes/`, `specs/004-loyalty-points-redemptions/`, `specs/005-cms-content-blocks-marketing-surfaces/`, `specs/006-campaigns-marketing-automation/`, `specs/007-customers-identity-conflicts/`, `specs/008-crm-stage-order-follow-up/` | Abrir specs adicionales por feature real, empezando por CRM manual/ampliado posterior al seguimiento derivado |
| Fase 5 - Construccion | Backfilled para el slice inicial | `docs/fase-5-construccion/`, `apps/web/`, `apps/admin/`, `apps/api/`, `apps/worker/` | Mapear mas frentes del codigo vivo |
| Fase 6 - QA | Backfilled para el slice inicial | `docs/fase-6-qa/` | Sistematizar evidencia repetible fuera del slice inicial |
| Fase 7 - Deploy | Backfilled para el slice inicial | `docs/fase-7-deploy/`, `docs/infra/deployment-strategy.md`, `ecosystem.config.cjs` | Replicar la misma claridad en otros cortes operativos |
| Fase 8 - Operacion | Backfilled para el slice inicial | `docs/fase-8-operacion/` | Consolidar runbooks y metricas mas alla de checkout/payments |

## Matriz macro de negocio
| Item | Objetivo | Fuente vigente | Destino canonico | Estado |
|---|---|---|---|---|
| `REQ-HH-001` | Operar una plataforma comercial propia para Huelegood | `docs/product/product-vision.md`, `docs/product/scope.md` | `docs/fase-0-iniciacion/00.01-vision-proyecto.md` | Backfilled |
| `REQ-HH-002` | Sostener ventas directas con checkout, pagos online y pagos manuales | `docs/product/scope.md`, `docs/flows/checkout-openpay.md`, `docs/flows/manual-payments.md` | Fases 1-4 canonicas del slice `001-checkout-payments` | Backfilled para estado actual + frontera futura |
| `REQ-HH-003` | Formalizar el canal seller con atribucion y comisiones | `docs/product/product-vision.md`, `docs/flows/vendors-and-commissions.md`, `docs/flows/vendor-application.md` | Fases 1-4 canonicas del slice `002-vendors-commissions` | Backfilled para estado actual seller-first |
| `REQ-HH-004` | Atender leads mayoristas y distribuidores desde operacion | `docs/product/scope.md`, `docs/flows/wholesale-flow.md`, `docs/flows/commercial-accesses.md` | Fases 1-4 canonicas del slice `003-wholesale-leads-quotes` | Backfilled para estado actual wholesale |
| `REQ-HH-005` | Operar CMS/editorial, marketing content, loyalty y CRM basico desde backoffice | `docs/product/scope.md`, `docs/product/roadmap.md`, `docs/product/roles-and-permissions.md`, `docs/storefront-v2-premium-landing.md`, `docs/flows/loyalty-flow.md` | Fases 1-4 canonicas de los slices `004-loyalty-points-redemptions`, `005-cms-content-blocks-marketing-surfaces`, `006-campaigns-marketing-automation`, `007-customers-identity-conflicts` y `008-crm-stage-order-follow-up` + slices futuros para CRM manual/ampliado | Parcial: loyalty, CMS/editorial, campaigns, maestro de clientes y seguimiento derivado backfilled; CRM manual/ampliado pendiente |
| `REQ-HH-006` | Mantener un monolito modular con `PostgreSQL`, `Redis`, `BullMQ` y despliegue controlado | `docs/architecture/overview.md`, `docs/infra/deployment-strategy.md` | Fase 3, Fase 7 y Fase 8 canonicas | En formalizacion |

## Gaps abiertos
- La trazabilidad canonica ya existe para `001-checkout-payments`, `002-vendors-commissions`, `003-wholesale-leads-quotes`, `004-loyalty-points-redemptions`, `005-cms-content-blocks-marketing-surfaces`, `006-campaigns-marketing-automation`, `007-customers-identity-conflicts` y `008-crm-stage-order-follow-up`, pero falta replicarla al resto del roadmap vivo.
- Los documentos tematicos vigentes siguen siendo necesarios para dominios aun no homologados, especialmente CRM manual/ampliado y automatizaciones mas alla del scheduling basico.
- La capa brownfield intermedia todavia no reemplaza toda la documentacion historica del monorepo.

## Regla de mantenimiento
- Si un requerimiento cambia de estado o se formaliza una nueva fase, actualiza esta matriz en el mismo corte.
- No inventes nuevos `REQ-HH-*` sin una necesidad real del negocio o de la operacion.
