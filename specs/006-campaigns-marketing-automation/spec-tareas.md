# Spec Tareas - Campaigns Marketing Automation

Fecha: 2026-05-27.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Campaigns Marketing Automation](../../docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md),
  [Reglas de campaigns y marketing automation](../../docs/fase-1-analisis-requerimientos/reglas/campaigns-y-marketing-automation.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.05-campaigns-marketing-automation-ux-ui.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.08-campaigns-marketing-automation.md),
  [ADR-006 Campaigns Dispatch Boundary](../../docs/fase-3-arquitectura/adr/ADR-006-campaigns-dispatch-boundary.md)

## Objetivo

Convertir la arquitectura canonica brownfield del slice campaigns en un
backlog tecnico ejecutable, cerrando agregado principal, catalogos read-only,
scheduling basico, snapshot congelado y frontera de dispatch desacoplada sin
abrir journeys, authoring completo de catalogos ni handoff runtime inexistente
desde `createCampaign()`, y absorbiendo con precision el scope de
`campaigns`, `segments` y `templates` que venia diferido desde slices previos.

## Reglas De Ejecucion

- no convertir `/marketing` en journey builder ni automation suite
- no abrir authoring completo de `segments` ni `templates`
- no introducir hard gates por estado de catalogo que el runtime actual no
  hace
- no describir `createCampaign()` como llamado hoy a `NotificationsService`
- no mover cola, logs ni delivery tecnico dentro de `marketing`
- no abrir CRM ampliado, analytics avanzados ni A/B testing en este slice

## Backlog Canonico

### T1. Consolidar contratos compartidos de campana y catalogos

**Resultado esperado**

El repo expresa con claridad el lenguaje compartido de `campaigns`,
`segments`, `templates`, `status`, `runStatus` y `scheduledAt`.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/domain/admin-access.ts`

**Checklist**

- [ ] mantener `MarketingCampaignSummary` como lectura operativa canonica
- [ ] sostener `MarketingCampaignInput` con `scheduledAt` como programacion
  basica
- [ ] fijar `CampaignStatus` y `CampaignRunStatus` como vocabulario del slice
- [ ] mantener `segments` y `templates` como catalogos read-only del contrato
- [ ] conservar `adminAccessRoles.marketing` para `super_admin`, `admin` y
  `marketing`

### T2. Endurecer creacion de campana y snapshot congelado

**Resultado esperado**

`createCampaign()` queda fijado como puerta canonica del agregado, con
validaciones minimas reales y snapshot de negocio congelado al crear.

**Rutas candidatas**

- `apps/api/src/modules/marketing/marketing.service.ts`
- `apps/api/src/modules/marketing/marketing.controller.ts`

**Checklist**

- [ ] mantener validacion de `name` y `goal`
- [ ] mantener exigencia de `segmentId` existente
- [ ] mantener exigencia de `templateId` existente
- [ ] mantener compatibilidad entre `template.channel` y
  `campaign.channel`
- [ ] congelar `segmentName`, `templateName`, `bodyPreview` y `recipients`
- [ ] no reescribir retroactivamente una campana por cambios posteriores del
  catalogo

### T3. Blindar scheduling basico y estados iniciales

**Resultado esperado**

El slice sostiene una sola semantica de programacion y nacimiento de estados
para la campana.

**Rutas candidatas**

- `apps/api/src/modules/marketing/marketing.service.ts`
- `packages/shared/src/domain/enums.ts`

**Checklist**

- [ ] sostener `scheduledAt` como unico mecanismo canonico de scheduling
- [ ] mantener nacimiento `running/running` sin `scheduledAt`
- [ ] mantener nacimiento `scheduled/queued` con `scheduledAt`
- [ ] no sobreafirmar transiciones no evidenciadas por el flujo actual de
  creacion

### T4. Mantener `segments` y `templates` como catalogos read-only

**Resultado esperado**

La seleccion operativa de catalogos sigue existiendo sin abrir editor ni
lifecycle propio desde este slice, y el corte 006 absorbe explicitamente la
continuidad diferida de `campaigns`, `segments` y `templates` que 004 y 005
dejaban para slices posteriores.

**Rutas candidatas**

- `apps/api/src/modules/marketing/marketing.service.ts`
- `apps/admin/components/marketing-workspace.tsx`
- `apps/admin/lib/api.ts`
- `specs/004-loyalty-points-redemptions/traceability.md`
- `specs/005-cms-content-blocks-marketing-surfaces/traceability.md`

**Checklist**

- [ ] sostener `listSegments()` como lectura read-only de audiencia
- [ ] sostener `listTemplates()` como lectura read-only de plantillas
- [ ] mantener seleccion operativa desde `/marketing`
- [ ] no abrir authoring completo de `segments`
- [ ] no abrir authoring completo de `templates`
- [ ] no convertir `status` de catalogo en hard gate nuevo si el runtime actual
  no lo hace
- [ ] dejar explicita la absorcion del scope diferido de `campaigns`,
  `segments` y `templates` respecto de 004 y 005

### T5. Consolidar `/marketing` como workbench principal `as-is`

**Resultado esperado**

La UX vigente queda defendida como workbench operativo simple de campanas y
consulta read-only de plantillas.

**Rutas candidatas**

- `apps/admin/app/marketing/page.tsx`
- `apps/admin/components/marketing-workspace.tsx`
- `apps/admin/lib/api.ts`

**Checklist**

- [ ] mantener metricas de campanas: total, activas, programadas y completadas
- [ ] mantener modal `Nueva campana` con `name`, `goal`, `segmentId`,
  `templateId`, `channel` y `scheduledAt`
- [ ] mantener resumen posterior de segmento con `audienceSize`
- [ ] mantener resumen posterior de plantilla con `subject`
- [ ] mantener tabla principal de campanas y tabla read-only de plantillas
- [ ] distinguir con claridad UI `/marketing` vs API `/admin/campaigns`
- [ ] no presentar la pantalla como journey builder, analytics suite ni CRM
  ampliado

### T6. Fijar auditoria, eventos y persistencia snapshot-backed

**Resultado esperado**

La campana deja trazabilidad operativa suficiente dentro de `marketing` y el
snapshot del modulo preserva todos los componentes del slice.

**Rutas candidatas**

- `apps/api/src/modules/marketing/marketing.service.ts`
- `apps/api/src/persistence/module-state.service.ts`

**Checklist**

- [ ] mantener auditoria `marketing.campaign.created`
- [ ] mantener eventos `campaign.created` y `campaign.scheduled` cuando
  corresponda
- [ ] sostener historial operativo de campana dentro del agregado
- [ ] persistir `segments`, `templates`, `campaigns` y `events` sobre el
  snapshot `marketing`
- [ ] conservar vocabulario `moduleSnapshot` / `module_snapshots`

### T7. Documentar y proteger la frontera `marketing -> notifications -> worker`

**Resultado esperado**

El slice conserva ownership claro entre orquestacion comercial, cola tecnica y
dispatch real.

**Rutas candidatas**

- `apps/api/src/modules/marketing/marketing.service.ts`
- `apps/api/src/modules/notifications/notifications.service.ts`
- `apps/worker/src/main.ts`

**Checklist**

- [ ] dejar explicito que `marketing` termina hoy en campaign record, snapshot,
  auditoria y eventos
- [ ] sostener a `notifications` como dueno de cola, logs y estado tecnico
- [ ] sostener a `worker` como dueno del dispatch real sobre jobs encolados
- [ ] no describir `createCampaign()` como enqueue directo a notificaciones
- [ ] no mezclar `runStatus` de campana con `pending/sent/delivered/failed` de
  entrega tecnica

### T8. Regression suite del slice

**Resultado esperado**

Los contratos criticos del slice quedan defendidos por pruebas y smokes de
frontera.

**Rutas candidatas**

- pruebas del modulo `marketing`
- pruebas de `notifications`
- smokes del workbench admin

**Checklist**

- [ ] probar creacion inmediata y programada de campanas
- [ ] probar rechazo por IDs inexistentes
- [ ] probar rechazo por incompatibilidad de canal
- [ ] probar congelamiento del snapshot operativo
- [ ] probar persistencia de auditoria y eventos en `marketing`
- [ ] probar que la UI no depende de un timeline visible de eventos
- [ ] probar que la documentacion distingue UI `/marketing` vs API
  `/admin/campaigns`
- [ ] probar que el slice no asume handoff runtime directo desde
  `createCampaign()`

## Orden Recomendado

1. `T1`
2. `T2`
3. `T3`
4. `T4`
5. `T5`
6. `T6`
7. `T7`
8. `T8`

## Definition Of Done Del Slice

- `campaigns` queda fijado como agregado principal del slice
- `segments` y `templates` quedan cerrados como catalogos read-only `as-is`
- `scheduledAt` queda formalizado como scheduling basico vigente
- el snapshot de campana queda congelado al momento de crearla
- `/marketing` queda defendido como workbench simple de campanas
- la frontera `marketing -> notifications -> worker` queda canonizada sin
  sobreescribirla como handoff runtime ya cableado
- el slice no abre journeys, authoring completo de catalogos, CRM ampliado ni
  delivery tecnico dentro de `marketing`
