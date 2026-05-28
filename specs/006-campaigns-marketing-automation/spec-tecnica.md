# Spec Tecnica - Campaigns Marketing Automation

Fecha: 2026-05-27.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

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

## Objetivo Tecnico

Formalizar y endurecer las fronteras tecnicas del slice brownfield de
campaigns sin abrir un automation engine nuevo. El slice debe preservar la
separacion entre `marketing`, `segments`, `templates`, `notifications` y
`worker`, dejando explicito que la campana es el agregado comercial,
`scheduledAt` es la programacion basica vigente, y el dispatch tecnico real no
se inicia hoy desde `createCampaign()`.

## Baseline Real Del Repo

### Contratos compartidos y enums

- `packages/shared/src/types/api.ts`
  - define `MarketingSegmentSummary`, `MarketingTemplateSummary`,
    `MarketingCampaignSummary`, `MarketingEventSummary` y
    `MarketingCampaignInput`
  - fija `channel` en `email`, `sms` y `whatsapp`
  - expone `status` y `runStatus` de campana en el contrato compartido
- `packages/shared/src/domain/enums.ts`
  - define `CampaignStatus`, `CampaignRunStatus`, `CampaignRecipientStatus`,
    `NotificationStatus` y `NotificationChannel`
- `packages/shared/src/domain/admin-access.ts`
  - fija `adminAccessRoles.marketing` para `super_admin`, `admin` y
    `marketing`

### API y modulo `marketing`

- `apps/api/src/modules/marketing/marketing.controller.ts`
  - expone `GET /admin/campaigns`
  - expone `POST /admin/campaigns`
  - expone `GET /admin/campaigns/segments`
  - expone `GET /admin/campaigns/templates`
  - expone `GET /admin/campaigns/events`
- `apps/api/src/modules/marketing/marketing.service.ts`
  - `listCampaigns()` devuelve campanas con metricas `total`, `running`,
    `scheduled` y `completed`
  - `listSegments()` devuelve catalogo read-only con `definition`,
    `audienceSize` y `status`
  - `listTemplates()` devuelve catalogo read-only con `channel`, `subject` y
    `status`
  - `listEvents()` devuelve el log operativo del dominio `marketing`
  - `createCampaign()` valida `name`, `goal`, existencia de IDs y
    compatibilidad entre `template.channel` y `campaign.channel`
  - `createCampaign()` crea `cmp-*`, congela `segmentName`, `templateName`,
    `bodyPreview` y `recipients`, y fija el nacimiento en `running/running` o
    `scheduled/queued` segun `scheduledAt`
  - `createCampaign()` registra auditoria `marketing.campaign.created`
  - `recordEvent()` agrega `campaign.created` y `campaign.scheduled` cuando
    corresponde
  - `persistState()` guarda `segments`, `templates`, `campaigns` y `events`
    dentro del snapshot `marketing`

### Persistencia snapshot-backed

- `apps/api/src/persistence/module-state.service.ts`
  - `load()` y `save()` leen y escriben snapshots por `moduleName`
  - `marketing` persiste sobre Prisma `moduleSnapshot`
  - el vocabulario heredado del repo sigue siendo `moduleSnapshot` /
    `module_snapshots`

### Workbench admin y cliente HTTP

- `apps/admin/app/marketing/page.tsx`
  - publica la superficie visible `/marketing` en el dominio admin con
    `AdminAuthGate` y
    `allowedRoles={adminAccessRoles.marketing}`
- `apps/admin/components/marketing-workspace.tsx`
  - carga en paralelo `fetchCampaigns()`, `fetchCampaignSegments()` y
    `fetchCampaignTemplates()`
  - muestra metricas de campanas: total, activas, programadas y completadas
  - opera modal `Nueva campana` con `name`, `goal`, `segmentId`,
    `templateId`, `channel` y `scheduledAt`
  - preselecciona el primer segmento y la primera plantilla disponibles
  - muestra tarjeta de resumen posterior para segmento y plantilla
  - renderiza tabla de campanas y tabla read-only de plantillas
  - no consume `fetchCampaignEvents()` ni renderiza timeline visible de eventos
- `apps/admin/lib/api.ts`
  - define `fetchCampaigns()`, `createCampaign()`,
    `fetchCampaignSegments()`, `fetchCampaignTemplates()` y
    `fetchCampaignEvents()`

### Frontera con `notifications` y `worker`

- `apps/api/src/modules/notifications/notifications.service.ts`
  - `createNotification()` / `queueNotification()` registran la notificacion,
    persisten estado tecnico y disparan dispatch asincrono
  - `listNotifications()` y `listLogs()` son el read model tecnico del modulo
  - `markNotificationSent()` y `markNotificationFailed()` resuelven el estado
    tecnico real
- `apps/worker/src/main.ts`
  - `processNotificationDispatch()` consulta la notificacion ya creada,
    ejecuta delivery real y marca `sent` o `failed`
  - el worker es duenio del dispatch real sobre jobs ya encolados

## Frontera Tecnica Objetivo

### 1. `marketing` sigue siendo el master del agregado `campaigns`

- define objetivo comercial, segmento elegido, plantilla elegida, canal y
  `scheduledAt`
- persiste campaign record, catalog snapshot, auditoria y eventos propios
- no absorbe cola, provider dispatch ni estado tecnico final de entrega

### 2. `segments` y `templates` siguen siendo dependencias read-only

- exponen inventario vigente de audiencia y contenido por canal
- resuelven validacion minima real de existencia y compatibilidad
- no reciben authoring completo ni lifecycle propio en este slice

### 3. `notifications` sigue siendo el owner de cola y estado tecnico

- conserva `notification` record, logs y estados
  `pending/sent/delivered/failed`
- absorbe la intencion downstream cuando una integracion explicita cruza esa
  frontera
- no decide objetivo comercial, audiencia elegida ni snapshot de campana

### 4. `worker` sigue siendo el owner del dispatch real

- procesa `NotificationDispatchJobData` ya encolado
- integra proveedor y marca resultado real de envio o fallo
- no crea campanas ni gobierna catalogos de marketing

### 5. `/marketing` sigue siendo workbench simple, no automation suite

- muestra lectura operativa de campanas y plantillas disponibles
- usa catalogos read-only y scheduling basico
- no se convierte en journey builder ni timeline E2E de delivery

## Boundary Del Snapshot De Campana

El boundary del snapshot queda fijado en la creacion de la campana y se divide
en dos capas coherentes dentro del registro persistido.

### Atributos propios de la campana

- `id`
- `name`
- `segmentId`
- `templateId`
- `channel`
- `status`
- `runStatus`
- `goal`
- `scheduledAt`
- `createdAt`
- `updatedAt`

### Datos congelados del catalogo consumido

- `segmentName`
- `templateName`
- `bodyPreview`
- `recipients`

### No cruza al snapshot de campana

- authoring futuro de `segments`
- authoring futuro de `templates`
- queue/log/status tecnico de `notifications`
- dispatch real de `worker`
- journeys, triggers multi-step o CRM ampliado

## Ajustes Minimos Recomendados

Este slice no abre un modulo nuevo. Solo cierra contratos vivos del
brownfield.

### Shared contracts

Rutas candidatas:

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/domain/admin-access.ts`

Ajustes recomendados:

- mantener `MarketingCampaignSummary` como lectura operativa canonica
- sostener `MarketingCampaignInput` con `scheduledAt` como scheduling basico
- endurecer el lenguaje de `CampaignStatus` y `CampaignRunStatus`
- conservar `segments` y `templates` como contratos read-only

### API y modulo `marketing`

Rutas candidatas:

- `apps/api/src/modules/marketing/marketing.controller.ts`
- `apps/api/src/modules/marketing/marketing.service.ts`
- `apps/api/src/persistence/module-state.service.ts`

Ajustes recomendados:

- conservar `createCampaign()` como puerta canonica del agregado
- mantener como hard gates `name`, `goal`, existencia de IDs y compatibilidad
  de canal
- sostener el snapshot congelado de catalogo en la campana creada
- persistir `segments`, `templates`, `campaigns` y `events` sobre el snapshot
  `marketing`
- no describir ni introducir llamada directa a `NotificationsService` desde
  `createCampaign()`

### Admin y cliente HTTP

Rutas candidatas:

- `apps/admin/app/marketing/page.tsx`
- `apps/admin/components/marketing-workspace.tsx`
- `apps/admin/lib/api.ts`

Ajustes recomendados:

- mantener `/marketing` como superficie visible principal del slice
- distinguir con claridad UI `/marketing` vs API `/admin/campaigns`
- sostener carga paralela de campanas, segmentos y plantillas
- conservar los resumenes posteriores de segmento y plantilla
- no vender `fetchCampaignEvents()` como capacidad visible de la pantalla

### Frontera `marketing -> notifications -> worker`

Rutas candidatas:

- `apps/api/src/modules/notifications/notifications.service.ts`
- `apps/worker/src/main.ts`

Ajustes recomendados:

- preservar `notifications` como dueno de cola, logs y estado tecnico
- preservar `worker` como dueno del dispatch real
- documentar la frontera como desacople canonico y no como handoff runtime ya
  soportado por el flujo de creacion

## Reglas Tecnicas Del Slice

1. `campaigns` sigue siendo el agregado principal del slice.
2. `segments` y `templates` siguen siendo catalogos read-only `as-is`.
3. `createCampaign()` valida hoy `name`, `goal`, existencia de IDs y
   compatibilidad entre `template.channel` y `campaign.channel`.
4. Sin `scheduledAt`, la campana nace `running/running`.
5. Con `scheduledAt`, la campana nace `scheduled/queued`.
6. El campaign record conserva atributos propios de la campana y el snapshot
   congelado de catalogo.
7. `marketing` conserva auditoria, historial y eventos del dominio de
   campaigns.
8. El snapshot del modulo `marketing` persiste `segments`, `templates`,
   `campaigns` y `events` sobre `moduleSnapshot` / `module_snapshots`.
9. `fetchCampaignEvents()` existe en cliente y API, pero no forma parte de la
   superficie visible actual de `/marketing`.
10. El estado tecnico final de entrega no vive en `campaigns`; vive en
    `notifications` cuando esa frontera se cruza.
11. El dispatch real no vive en `marketing`; vive en `worker` para jobs ya
    encolados.
12. Journeys, automation multi-step, CRM ampliado y authoring completo de
    catalogos quedan fuera de este corte.

## Seguridad Y Observabilidad

Guardrails ya visibles o exigibles para este slice:

- `adminAccessRoles.marketing` limita el workbench a `super_admin`, `admin` y
  `marketing`
- `@RequireRoles(...adminAccessRoles.marketing)` protege controllers de
  campanas, segmentos, plantillas y eventos
- `createCampaign()` registra auditoria `marketing.campaign.created`
- `recordEvent()` deja trazas como `campaign.created` y `campaign.scheduled`
- `persistState()` guarda el snapshot `marketing` completo via
  `ModuleStateService`
- el desacople con `notifications` permite separar trazabilidad comercial de
  trazabilidad tecnica de entrega

## Estrategia De Implementacion

### Release 1. Contrato compartido y snapshot de campana

- consolidar tipos compartidos de campana, catalogos y estados
- fijar `scheduledAt` como scheduling basico del slice
- endurecer el boundary del snapshot congelado

### Release 2. Workbench operativo y catalogos read-only

- sostener `/marketing` como superficie principal visible
- preservar consumo read-only de `segments` y `templates`
- evitar que la UI prometa authoring o automation suite

### Release 3. Frontera de dispatch y regression suite

- fijar la frontera `marketing -> notifications -> worker`
- defender que `createCampaign()` no hace hoy handoff runtime a notificaciones
- cubrir estados iniciales, snapshot y contratos de frontera con pruebas

## Estrategia De Pruebas

### API

Rutas candidatas:

- `apps/api/src/modules/marketing/marketing.service.ts`
- pruebas del modulo `marketing`

Cobertura esperada:

- creacion con `name`, `goal`, `segmentId` y `templateId` existentes
- rechazo de `name` vacio
- rechazo de `goal` vacio
- rechazo de `segmentId` inexistente
- rechazo de `templateId` inexistente
- rechazo por incompatibilidad de canal
- nacimiento en `running/running` sin `scheduledAt`
- nacimiento en `scheduled/queued` con `scheduledAt`
- congelamiento de `segmentName`, `templateName`, `bodyPreview` y `recipients`
- persistencia de auditoria y eventos propios de `marketing`

### Admin y frontera

- validar que `/marketing` siga siendo la superficie visible principal
- validar que la API del slice siga expuesta por `/admin/campaigns`
- validar que la UI no dependa de `fetchCampaignEvents()` para renderizar
- validar que el slice no describa como vigente un enqueue directo desde
  `createCampaign()`
- validar que `notifications` y `worker` sigan siendo owners del delivery
  tecnico cuando esa frontera se cruza por otro flujo

## Riesgos Tecnicos Abiertos

- el modulo `marketing` sigue apoyandose en snapshot de modulo y no en un
  storage relacional dedicado por agregado
- el endpoint de eventos existe, pero el workbench actual no lo consume ni lo
  valida visualmente
- el runtime actual no aplica hard gate por `segment.status` ni
  `template.status`, por lo que sobredocumentar elegibilidad seria incorrecto
- la frontera hacia `notifications` puede seguir siendo progresiva, pero el
  ownership ya queda canonizado por Fase 3 y ADR-006
