# Traceability - Campaigns Marketing Automation

Fecha: 2026-05-27.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Campaigns Marketing Automation](../../docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md),
  [Reglas de campaigns y marketing automation](../../docs/fase-1-analisis-requerimientos/reglas/campaigns-y-marketing-automation.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.05-campaigns-marketing-automation-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md),
  [ADR-006 Campaigns Dispatch Boundary](../../docs/fase-3-arquitectura/adr/ADR-006-campaigns-dispatch-boundary.md)

## Objetivo

Trazar las reglas canonicas del slice campaigns contra sus fuentes brownfield,
los artefactos canonicos abiertos en Fases 1-3, el paquete SDD del slice y el
baseline tecnico real del monorepo.

## Matriz

| ID | Regla canonica | Fuentes brownfield | Artefactos canonicos del slice | Baseline tecnico actual | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- |
| TR-01 | `marketing` es el owner operativo principal del slice y `admin`/`super_admin` actuan como soporte y override | [roles-and-permissions.md](../../docs/product/roles-and-permissions.md), [requirements-impact-plan-2026-03.md](../../docs/product/requirements-impact-plan-2026-03.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md), [Fase 2](../../docs/fase-2-ux-ui/02.05-campaigns-marketing-automation-ux-ui.md), [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md) | [admin-access.ts](../../packages/shared/src/domain/admin-access.ts), [page.tsx](../../apps/admin/app/marketing/page.tsx), [marketing.controller.ts](../../apps/api/src/modules/marketing/marketing.controller.ts) | revisar `adminAccessRoles.marketing`, acceso protegido a la UI `/marketing` y proteccion de la API `/admin/campaigns` |
| TR-02 | `campaigns` es el agregado principal del slice | [roadmap.md](../../docs/product/roadmap.md), [modules.md](../../docs/architecture/modules.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md), [Fase 3](../../docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md), [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md) | [page.tsx](../../apps/admin/app/marketing/page.tsx), [marketing-workspace.tsx](../../apps/admin/components/marketing-workspace.tsx), [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts) :: `createCampaign()`, `listCampaigns()`, [types/api.ts](../../packages/shared/src/types/api.ts) :: `MarketingCampaignSummary` | smoke de workbench UI en `/marketing` y contraste de lectura API por `/admin/campaigns` |
| TR-03 | `segments` y `templates` se consumen como catalogos read-only `as-is` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md), [Reglas de campaigns y marketing automation](../../docs/fase-1-analisis-requerimientos/reglas/campaigns-y-marketing-automation.md) | [spec-funcional.md](spec-funcional.md) :: `RF-03`, [spec-tareas.md](spec-tareas.md) :: `T4`, [Fase 2](../../docs/fase-2-ux-ui/02.05-campaigns-marketing-automation-ux-ui.md), [spdd-frontend.md](spdd-frontend.md), [spec-tecnica.md](spec-tecnica.md) | [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts) :: `listSegments()`, `listTemplates()`, [marketing-workspace.tsx](../../apps/admin/components/marketing-workspace.tsx) | revisar que la UI `/marketing` solo seleccione catalogos read-only y contrastar continuidad entre `RF-03` y `T4` |
| TR-04 | la creacion de campana exige como hard gate real `name`, `goal`, existencia de `segmentId`, existencia de `templateId` y compatibilidad entre `template.channel` y `campaign.channel` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md), [Fase 3](../../docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md), [ADR-006](../../docs/fase-3-arquitectura/adr/ADR-006-campaigns-dispatch-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) | [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts) :: `createCampaign()`, `requireSegment()`, `requireTemplate()` | probar rechazo por `name` vacio, `goal` vacio, ID inexistente y `channel` incompatible |
| TR-05 | `scheduledAt` es el unico scheduling basico del slice y define el nacimiento `running/running` o `scheduled/queued` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md), [Fase 2](../../docs/fase-2-ux-ui/02.05-campaigns-marketing-automation-ux-ui.md), [ADR-006](../../docs/fase-3-arquitectura/adr/ADR-006-campaigns-dispatch-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) | [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts) :: `scheduledAt`, `status`, `runStatus`, [enums.ts](../../packages/shared/src/domain/enums.ts) | probar creacion sin `scheduledAt` y con `scheduledAt` informado |
| TR-06 | la campana congela `segmentName`, `templateName`, `bodyPreview` y `recipients` al crearse | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md), [Fase 3](../../docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md), [ADR-006](../../docs/fase-3-arquitectura/adr/ADR-006-campaigns-dispatch-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md) | [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts) :: `createCampaign()`, `buildSnapshot()` | revisar snapshot persistido y validar que cambios posteriores del catalogo no reescriban la campana |
| TR-07 | `marketing` conserva auditoria, historial y eventos del dominio, pero no el estado tecnico final de entrega | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md), [Fase 2](../../docs/fase-2-ux-ui/02.05-campaigns-marketing-automation-ux-ui.md), [Fase 3](../../docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) | [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts) :: `recordEvent()`, `history`, `auditService.recordAdminAction()` | validar evento `campaign.created`, auditoria `marketing.campaign.created` e historial operativo de campana |
| TR-08 | la frontera `marketing -> notifications -> worker` es boundary canonico desacoplado, no handoff runtime ya cableado desde `createCampaign()` | [Fase 3](../../docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md), [ADR-006](../../docs/fase-3-arquitectura/adr/ADR-006-campaigns-dispatch-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [traceability.md](traceability.md) | [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts), [notifications.service.ts](../../apps/api/src/modules/notifications/notifications.service.ts), [main.ts](../../apps/worker/src/main.ts) | contrastar ausencia de llamada desde `createCampaign()` y ownership tecnico en `notifications`/`worker` |
| TR-09 | `/marketing` es el workbench visible de campanas con catalogos read-only, y no muestra hoy timeline visible de eventos | [Fase 2](../../docs/fase-2-ux-ui/02.05-campaigns-marketing-automation-ux-ui.md), [Product Design](product-design.md), [SPDD Frontend](spdd-frontend.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md) | [marketing-workspace.tsx](../../apps/admin/components/marketing-workspace.tsx), [api.ts](../../apps/admin/lib/api.ts) :: `fetchCampaignEvents()` | revisar que la UI `/marketing` cargue campanas/segmentos/plantillas y no renderice eventos |
| TR-10 | el snapshot `marketing` persiste `segments`, `templates`, `campaigns` y `events` sobre `moduleSnapshot` / `module_snapshots` | [modules.md](../../docs/architecture/modules.md), [entities.md](../../docs/data/entities.md), [GLOSSARY.md](../../GLOSSARY.md) | [Fase 3](../../docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) | [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts) :: `persistState()`, `buildSnapshot()`, [module-state.service.ts](../../apps/api/src/persistence/module-state.service.ts) | revisar persistencia del snapshot `marketing` via Prisma `moduleSnapshot` |
| TR-11 | el slice no abre journeys, automation multi-step, authoring completo de catalogos ni CRM ampliado | [roadmap.md](../../docs/product/roadmap.md), [requirements-impact-plan-2026-03.md](../../docs/product/requirements-impact-plan-2026-03.md) | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md), [ADR-006](../../docs/fase-3-arquitectura/adr/ADR-006-campaigns-dispatch-boundary.md), [spec-funcional.md](spec-funcional.md), [spec-tareas.md](spec-tareas.md) | [marketing-workspace.tsx](../../apps/admin/components/marketing-workspace.tsx), [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts), [types/api.ts](../../packages/shared/src/types/api.ts) | revisar ausencia de builder, triggers multi-step y entidades de CRM ampliado en contratos y superficie |
| TR-12 | el slice 006 absorbe la continuidad diferida de `campaigns`, `segments` y `templates` que 004 y 005 dejaban para slices posteriores | [traceability 004](../004-loyalty-points-redemptions/traceability.md), [traceability 005](../005-cms-content-blocks-marketing-surfaces/traceability.md) | [spec-tareas.md](spec-tareas.md) :: `T4`, [traceability.md](traceability.md), [spec-funcional.md](spec-funcional.md) | [marketing.service.ts](../../apps/api/src/modules/marketing/marketing.service.ts), [marketing-workspace.tsx](../../apps/admin/components/marketing-workspace.tsx), [types/api.ts](../../packages/shared/src/types/api.ts) | contrastar que el scope activo de `campaigns`, `segments` y `templates` ya vive en 006 y no queda declarado como pendiente |

## Dependencias Fuera De Este Ownership

- journeys y automation multi-step requieren un slice y ADR propios
- authoring completo de `segments` requiere un corte adicional
- authoring completo de `templates` requiere un corte adicional
- la continuidad diferida de `campaigns`, `segments` y `templates` respecto de
  004 y 005 queda absorbida por este slice 006
- analytics avanzados de delivery requieren ampliar el ownership entre
  `marketing`, `notifications` y observabilidad
- un handoff runtime directo desde `createCampaign()` hacia cola exigiria
  reabrir ADR-006

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- conectado con las fuentes reales del brownfield de campaigns
- alineado con Fases 1, 2 y 3 ya aprobadas
- conectado con su propio paquete SDD de [spec-funcional.md](spec-funcional.md),
  [spec-tecnica.md](spec-tecnica.md) y [spec-tareas.md](spec-tareas.md)
- listo para evolucionar a implementacion futura sin inventar un automation
  engine ni mezclar el agregado comercial con la entrega tecnica
