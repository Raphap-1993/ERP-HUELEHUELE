# Spec Funcional - Campaigns Marketing Automation

Fecha: 2026-05-27.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

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

Definir el slice canonico vigente de campaigns como paquete SDD, fijando a
`campaigns` como agregado principal, dejando `segments` y `templates` como
catalogos read-only `as-is`, formalizando el scheduling basico por
`scheduledAt` y cerrando la frontera `marketing -> notifications -> worker`
sin convertir el brownfield en un automation engine, journeys suite ni CRM
ampliado.

## Alcance

Incluye:

- `campaigns` como agregado operativo principal del slice
- `segments` como catalogo read-only de audiencia
- `templates` como catalogo read-only de contenido por canal
- canales `email`, `sms` y `whatsapp`
- creacion de campana con `name`, `goal`, `segmentId`, `templateId`,
  `channel` y `scheduledAt`
- scheduling basico por `scheduledAt`
- `status` y `runStatus` de campana
- snapshot operativo congelado con `segmentName`, `templateName`,
  `bodyPreview` y `recipients`
- auditoria, historial y eventos de dominio dentro de `marketing`
- workbench operativo en `/admin/marketing`
- frontera canonica hacia `notifications` y `worker`

No incluye:

- journeys
- triggers multi-step
- authoring completo de `segments`
- authoring completo de `templates`
- approval flow o versionado editorial de catalogos
- A/B testing de campanas
- analytics avanzados de entrega
- handoff runtime ya cableado desde `createCampaign()` hacia
  `NotificationsService`
- dispatch directo por proveedor desde `marketing`
- CRM ampliado

## Actores

- `marketing`
- `admin`
- `super_admin`
- `campaigns`
- `segments`
- `templates`
- `notifications`
- `worker`

## Reglas Funcionales Canonicas

### RF-01. Ownership operativo del slice

- `marketing` es el dueno operativo principal del workbench y de la campana
- `admin` y `super_admin` conservan soporte y override operativo
- el owner funcional del slice sigue siendo `marketing`; no `notifications`

### RF-02. `campaigns` es el agregado principal

- la unidad operativa central del slice es la campana
- la campana concentra `status`, `runStatus`, objetivo, canal, programacion y
  snapshot operativo
- `segments` y `templates` no se promocionan a subdominios authorables en este
  corte

### RF-03. Catalogos read-only de `segments` y `templates`

- `segments` y `templates` se consumen como catalogos read-only `as-is`
- la UX de creacion usa esos catalogos como dependencias existentes
- este slice no abre editor, lifecycle ni versionado propio para ellos

### RF-04. Hard gates minimos reales del runtime

- la creacion exige existencia de `segmentId`
- la creacion exige existencia de `templateId`
- la creacion exige compatibilidad entre `template.channel` y
  `campaign.channel`
- el runtime actual no eleva el estado de segmento o plantilla a hard gate
  fuerte de este slice

### RF-05. Scheduling basico por `scheduledAt`

- `scheduledAt` es el unico mecanismo canonico de programacion del slice
- sin `scheduledAt`, la campana nace `running/running`
- con `scheduledAt`, la campana nace `scheduled/queued`

### RF-06. Snapshot operativo congelado al crear la campana

- la campana conserva `segmentId` y `templateId` como referencias del catalogo
- la campana congela `segmentName`, `templateName`, `bodyPreview` y
  `recipients` al momento de crearse
- cambios posteriores en segmentos o plantillas no deben reescribir
  retroactivamente una campana ya creada

### RF-07. Estados operativos visibles

- `status` de campana usa `draft`, `scheduled`, `running`, `completed` y
  `cancelled`
- `runStatus` usa `queued`, `running`, `completed` y `failed`
- en el runtime visible hoy, el nacimiento comprobado es:
  - `running/running` sin `scheduledAt`
  - `scheduled/queued` con `scheduledAt`
- el slice no sobreafirma transiciones no evidenciadas por el flujo actual de
  creacion

### RF-08. Auditoria, historial y eventos dentro de `marketing`

- `marketing` registra auditoria administrativa de la creacion de campanas
- `marketing` conserva historial y eventos del dominio asociados a la campana
- esa trazabilidad debe existir aunque el estado tecnico final del envio viva
  fuera del agregado `campaigns`

### RF-09. Frontera canonica de dispatch desacoplado

- `marketing` termina hoy en campaign record, catalog snapshot, auditoria y
  eventos del dominio
- `notifications` es el bounded context de cola, notificacion, logs y estado
  tecnico de entrega cuando esa frontera se cruza por otro flujo o integracion
  explicita
- `worker` procesa los jobs ya encolados y ejecuta el dispatch real por canal
  soportado
- `createCampaign()` no debe describirse como handoff runtime ya cableado a
  `notifications`

### RF-10. `/admin/marketing` como workbench simple

- `/admin/marketing` es la superficie principal del slice
- la pantalla opera campanas reales con catalogos read-only y scheduling basico
- la superficie no promete journeys, timeline visible de eventos ni delivery
  tecnico E2E desde el workbench

### RF-11. Sin automation suite ni CRM ampliado

- el slice no modela journeys
- el slice no modela automation multi-step
- el slice no se extiende a CRM ampliado ni a analytics avanzados

## Escenarios Principales

### Escenario A. Creacion inmediata de campana

1. `marketing` abre `/admin/marketing`.
2. Define nombre, objetivo, segmento, plantilla y canal.
3. Deja `scheduledAt` vacio.
4. `campaigns` valida IDs y compatibilidad de canal.
5. La campana se registra con `status = running` y `runStatus = running`.
6. `marketing` persiste la campana, su snapshot, auditoria y eventos.

### Escenario B. Campana programada

1. `marketing` completa el formulario de nueva campana.
2. Informa `scheduledAt`.
3. `campaigns` registra la campana y congela el snapshot operativo.
4. La campana nace `scheduled/queued`.
5. El workbench refleja la programacion basica sin mostrar dispatch tecnico.

### Escenario C. Consumo read-only de catalogos

1. `marketing` consulta segmentos disponibles.
2. `marketing` consulta plantillas disponibles.
3. La UI selecciona IDs existentes del catalogo.
4. El sistema muestra resumen de audiencia y `subject` sin abrir authoring
   adicional.

### Escenario D. Snapshot congelado frente a cambios de catalogo

1. Una campana ya fue creada con segmento y plantilla validos.
2. Luego cambia el nombre del segmento o la plantilla en el catalogo fuente.
3. La campana creada conserva `segmentName`, `templateName`, `bodyPreview` y
   `recipients` congelados.
4. El historial operativo de la campana no se reescribe retroactivamente.

### Escenario E. Frontera de dispatch fuera del workbench

1. `marketing` registra una campana en el workbench.
2. El flujo visible actual termina en `marketing`.
3. Si una intencion downstream cruza la frontera, `notifications` absorbe cola
   y estado tecnico por otra integracion explicita.
4. `worker` procesa jobs ya encolados y resuelve el envio real.

## Criterios De Aceptacion

| ID | Criterio |
| --- | --- |
| CA-01 | `marketing` es el owner operativo principal del slice |
| CA-02 | `campaigns` queda fijado como agregado principal |
| CA-03 | `segments` y `templates` quedan como catalogos read-only `as-is` |
| CA-04 | la creacion valida existencia de `segmentId`, `templateId` y compatibilidad de canal |
| CA-05 | `scheduledAt` es el unico mecanismo canonico de scheduling del slice |
| CA-06 | sin `scheduledAt` la campana nace `running/running`, y con `scheduledAt` nace `scheduled/queued` |
| CA-07 | la campana congela `segmentName`, `templateName`, `bodyPreview` y `recipients` al crearse |
| CA-08 | `marketing` conserva auditoria, historial y eventos del dominio de campana |
| CA-09 | la frontera `marketing -> notifications -> worker` queda documentada como boundary canonico desacoplado, no como handoff runtime ya cableado desde `createCampaign()` |
| CA-10 | el slice no abre journeys, authoring completo de catalogos, CRM ampliado ni dispatch directo desde `marketing` |

## Casos Negativos Relevantes

- `segmentId` inexistente: la creacion debe fallar
- `templateId` inexistente: la creacion debe fallar
- `template.channel` distinto de `campaign.channel`: la creacion debe fallar
- asumir bloqueo fuerte por `segment.status` o `template.status`: incorrecto
  para el runtime actual
- asumir que `createCampaign()` ya encola una notificacion: incorrecto para el
  runtime actual
- intentar authoring completo de segmentos o plantillas desde
  `/admin/marketing`: fuera de alcance
- intentar usar el slice como journey builder o CRM ampliado: fuera de alcance

## Dependencias De Negocio

- el negocio ya opera campanas reales desde `/admin/marketing`
- `marketing` necesita programacion basica y lectura operativa sin sobrecargar
  la interfaz
- `segments` y `templates` ya existen como catalogos dependientes del modulo
- la frontera de entrega tecnica debe seguir separada del agregado comercial de
  campanas
