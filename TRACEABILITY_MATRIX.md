# TRACEABILITY_MATRIX

> Matriz global de trazabilidad del brownfield. Fija que fase ya tiene capa
> canonica, que evidencia sigue viva en el repo y donde quedan los principales
> gaps.

## Homologacion por fases
| Fase | Estado | Evidencia en repo | Gap principal |
|---|---|---|---|
| Fase 0 - Iniciacion | Backfilled | `docs/fase-0-iniciacion/00.01-vision-proyecto.md`, `00.02-roadmap.md`, `00.03-estimacion-tiempo-costo.md`, `00.04-roles-y-responsabilidades.md`, `00.05-checklist-adopcion.md`, `00.06-estrategia-homologacion-brownfield.md` | Mantener la capa canonica alineada al producto vivo |
| Fase 1 - Analisis y requerimientos | Backfilled para el slice inicial | `docs/fase-1-analisis-requerimientos/` | Replicar el mismo nivel al resto de dominios |
| Fase 2 - UX/UI | Backfilled para el slice inicial | `docs/fase-2-ux-ui/`, `specs/001-checkout-payments/product-design.md`, `spdd-frontend.md`, `prototype.md`, `prototype-validation.md` | Extender SPDD visual a otras superficies |
| Fase 3 - Arquitectura | Backfilled para el slice inicial | `docs/fase-3-arquitectura/` | Implementar la frontera `payment-gateway` cuando el negocio la apruebe |
| Fase 4 - SDD | Instanciada para `001-checkout-payments` | `docs/fase-4-sdd/`, `specs/001-checkout-payments/` | Abrir specs adicionales por feature real |
| Fase 5 - Construccion | Backfilled para el slice inicial | `docs/fase-5-construccion/`, `apps/web/`, `apps/admin/`, `apps/api/`, `apps/worker/` | Mapear mas frentes del codigo vivo |
| Fase 6 - QA | Backfilled para el slice inicial | `docs/fase-6-qa/` | Sistematizar evidencia repetible fuera del slice inicial |
| Fase 7 - Deploy | Backfilled para el slice inicial | `docs/fase-7-deploy/`, `docs/infra/deployment-strategy.md`, `ecosystem.config.cjs` | Replicar la misma claridad en otros cortes operativos |
| Fase 8 - Operacion | Backfilled para el slice inicial | `docs/fase-8-operacion/` | Consolidar runbooks y metricas mas alla de checkout/payments |

## Matriz macro de negocio
| Item | Objetivo | Fuente vigente | Destino canonico | Estado |
|---|---|---|---|---|
| `REQ-HH-001` | Operar una plataforma comercial propia para Huelegood | `docs/product/product-vision.md`, `docs/product/scope.md` | `docs/fase-0-iniciacion/00.01-vision-proyecto.md` | Backfilled |
| `REQ-HH-002` | Sostener ventas directas con checkout, pagos online y pagos manuales | `docs/product/scope.md`, `docs/flows/checkout-openpay.md`, `docs/flows/manual-payments.md` | Fase 1 y Fase 2 canonicas | En formalizacion |
| `REQ-HH-003` | Formalizar el canal seller con atribucion y comisiones | `docs/product/product-vision.md`, `docs/flows/vendors-and-commissions.md` | Fase 1 canonica | En formalizacion |
| `REQ-HH-004` | Atender leads mayoristas y distribuidores desde operacion | `docs/product/scope.md`, `docs/flows/wholesale-flow.md` | Fase 1 canonica | En formalizacion |
| `REQ-HH-005` | Operar CMS, marketing, loyalty y CRM basico desde backoffice | `docs/product/scope.md`, `docs/product/roadmap.md` | Fase 1 y Fase 5 canonicas | En formalizacion |
| `REQ-HH-006` | Mantener un monolito modular con `PostgreSQL`, `Redis`, `BullMQ` y despliegue controlado | `docs/architecture/overview.md`, `docs/infra/deployment-strategy.md` | Fase 3, Fase 7 y Fase 8 canonicas | En formalizacion |

## Gaps abiertos
- La trazabilidad canonica ya existe para `001-checkout-payments`, pero falta replicarla al resto del roadmap vivo.
- Los documentos tematicos vigentes siguen siendo necesarios para dominios aun no homologados.
- La capa brownfield intermedia todavia no reemplaza toda la documentacion historica del monorepo.

## Regla de mantenimiento
- Si un requerimiento cambia de estado o se formaliza una nueva fase, actualiza esta matriz en el mismo corte.
- No inventes nuevos `REQ-HH-*` sin una necesidad real del negocio o de la operacion.
