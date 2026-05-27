# Huele Huele Campaigns Marketing Automation Brownfield Design

Fecha: 2026-05-27.

## Objetivo

Definir el diseno del siguiente slice brownfield a homologar en
`ERP-HUELEHUELE`: `006-campaigns-marketing-automation`.

El slice debe consolidar en la capa canonica intermedia el modulo vigente de
`marketing`, cubriendo `campaigns`, `segments`, `templates`, scheduling
basico, estados de corrida, eventos de marketing y la frontera de dispatch
hacia `notifications/worker`, sin convertir el dominio en un journey engine,
sin mezclarlo con CRM ampliado y sin inventar authoring completo donde hoy
solo existe lectura operativa.

## Contexto

La branch `codex/homologacion-capa-canonica` ya dejo homologados:

- `001-checkout-payments` como base transaccional;
- `002-vendors-commissions` como canal seller-first;
- `003-wholesale-leads-quotes` como funnel B2B asistido;
- `004-loyalty-points-redemptions` como programa de puntos y canjes;
- `005-cms-content-blocks-marketing-surfaces` como CMS/editorial `as-is`.

Dentro de `REQ-HH-005` sigue quedando un frente vivo que todavia no tiene
slice propio:

- `campaigns`;
- `segments`;
- `templates`;
- eventos de marketing;
- frontera operativa hacia `notifications` y `worker`;
- automatizacion basica por scheduling.

El repo ya demuestra runtime real para este dominio:

- `apps/api/src/modules/marketing/marketing.service.ts`;
- `apps/api/src/modules/marketing/marketing.controller.ts`;
- `apps/admin/components/marketing-workspace.tsx`;
- `packages/shared/src/types/api.ts`;
- `packages/shared/src/domain/enums.ts`;
- `docs/architecture/modules.md`.

El objetivo no es inventar un motor nuevo de automatizacion, sino formalizar
el bounded context de campanas que ya existe hoy:

- marketing crea campanas;
- selecciona segmento y plantilla;
- fija canal y objetivo;
- puede programarlas con `scheduledAt`;
- registra eventos y estados;
- deja el dispatch real a `notifications/worker`.

## Fuentes brownfield

- `docs/product/scope.md`
- `docs/product/roadmap.md`
- `docs/product/roles-and-permissions.md`
- `docs/architecture/modules.md`
- `docs/product/requirements-impact-plan-2026-03.md`

Fuentes de contraste tecnico y de superficie real del repo:

- `apps/api/src/modules/marketing/marketing.service.ts`
- `apps/api/src/modules/marketing/marketing.controller.ts`
- `apps/api/src/modules/notifications/notifications.service.ts`
- `apps/worker/src/main.ts`
- `apps/admin/components/marketing-workspace.tsx`
- `apps/admin/components/dashboard-workspace.tsx`
- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/mock-data.ts`

## Alcance del slice

### Dentro de alcance

- `campaigns` como agregado operativo principal;
- `segments` como catalogo read-only usado por campanas;
- `templates` como catalogo read-only usado por campanas;
- `channel`:
  - `email`
  - `sms`
  - `whatsapp`
- `scheduledAt` como scheduling basico;
- estados de campana:
  - `draft`
  - `scheduled`
  - `running`
  - `completed`
  - `cancelled`
- estados de corrida:
  - `queued`
  - `running`
  - `completed`
  - `failed`
- snapshot operativo congelado al crear la campana:
  - `segmentName`
  - `templateName`
  - `bodyPreview`
  - `recipients`
- `events` de marketing como bitacora operativa;
- frontera canonicamente explicita hacia `notifications` y `worker`;
- ownership operativo principal en `marketing`.

### Fuera de alcance

- journeys;
- reglas automaticas multi-step;
- engine de automation reactiva amplia;
- authoring completo de `segments`;
- authoring completo de `templates`;
- versionado editorial sofisticado de plantillas;
- A/B testing de campanas;
- scoring, attribution o analytics avanzados;
- CRM ampliado;
- cambiar ownership de entrega hacia `marketing`;
- garantizar que todos los canales ya tengan dispatch productivo real.

## Estrategia recomendada

La homologacion debe hacerse `as-is`, usando el comportamiento real del runtime
como verdad operativa y dejando explicitas las fronteras del dominio.

Eso implica:

- tratar `campaigns` como el agregado principal;
- tratar `segments` y `templates` como catalogos read-only `as-is`;
- fijar que una campana nace:
  - `running/running` si no tiene `scheduledAt`;
  - `scheduled/queued` si llega con `scheduledAt`;
- congelar snapshot operativo al crear la campana;
- dejar `marketing` como orquestador;
- dejar `notifications/worker` como frontera de entrega real;
- no fingir authoring de segmentos o plantillas que hoy no esta cerrado;
- no fingir reglas de elegibilidad mas estrictas de las que hoy existen.

No conviene abrir ahora un journey builder, triggers por eventos multi-step ni
un CRM de automatizacion comercial. Este slice primero necesita fijar
lenguaje canonico sobre el modulo real que ya corre.

## Approaches evaluados

### 1. Campaign orchestration con catalogos read-only y dispatch separado

Incluye campanas, segmentos, plantillas, scheduling, snapshot operativo,
eventos y frontera a `notifications/worker`.

Ventajas:

- calza con el runtime real;
- cierra ownership sin mezclar dominios;
- deja visible la frontera entre orquestacion y entrega.

Costo:

- no resuelve authoring completo de segmentos o plantillas;
- no abre journeys ni automatizacion avanzada.

### 2. Solo campañas con referencias externas

Campanas quedan dentro, pero `segments` y `templates` se tratan como dominio
externo fuera del slice.

Ventaja:

- corte mas corto.

Costo:

- deja incompleto el circuito real que ya existe en `marketing-workspace`;
- obliga a explicar dependencias fuertes como si fueran ajenas al dominio.

### 3. Marketing automation amplio

Campanas, segmentos, plantillas, triggers, journeys, reglas automaticas y
analitica operativa.

Ventaja:

- vision mas potente a futuro.

Costo:

- ya no seria homologacion `as-is`;
- abriria demasiado alcance y borraria la frontera con CRM ampliado.

### Opcion elegida

Se elige la opcion `1`: campaign orchestration con catalogos read-only y
dispatch separado.

## Ownership canonico

### `marketing`

Dueno de:

- crear campanas;
- programarlas o correrlas inmediatamente;
- congelar snapshot operativo;
- registrar historial y eventos del dominio;
- mostrar estado operativo en `/marketing`.

No decide:

- entrega real del mensaje;
- estado final de envio por proveedor;
- journeys automaticos complejos;
- CRM ampliado.

### `segments`

Dueno de:

- catalogo de audiencia disponible para campanas;
- `name`, `definition`, `audienceSize`, `status`.

En este slice:

- entra como dependencia read-only `as-is`;
- no abre authoring completo ni lifecycle propio.

### `templates`

Dueno de:

- catalogo de plantillas disponibles por canal;
- `name`, `channel`, `subject`, `status`, `bodyPreview`.

En este slice:

- entra como dependencia read-only `as-is`;
- no abre editor, versionado ni aprobaciones multinivel.

### `notifications`

Dueno de:

- cola de notificaciones;
- registro de notificaciones y logs;
- persistencia del estado de dispatch.

No decide:

- la definicion operativa de la campana;
- el segmento o la plantilla elegida;
- el objetivo comercial de marketing.

### `worker`

Dueno de:

- procesamiento de colas;
- envio real por canal soportado;
- resultado tecnico del dispatch;
- marca de `sent/failed/skipped` en notificaciones.

No decide:

- si la campana existe o no;
- su scheduling canonico;
- el snapshot de negocio de marketing.

## Modelo funcional del slice

### `MarketingCampaign`

Es el agregado principal del slice.

Campos operativos minimos:

- `id`
- `name`
- `segmentId`
- `segmentName`
- `templateId`
- `templateName`
- `channel`
- `status`
- `runStatus`
- `recipients`
- `goal`
- `scheduledAt`
- `createdAt`
- `updatedAt`
- `bodyPreview`
- `metrics`
- `history`

### `MarketingSegment`

Catalogo read-only usado al crear campañas.

Campos visibles:

- `id`
- `name`
- `definition`
- `audienceSize`
- `status`
- `updatedAt`

### `MarketingTemplate`

Catalogo read-only usado al crear campañas.

Campos visibles:

- `id`
- `name`
- `channel`
- `subject`
- `status`
- `updatedAt`
- `bodyPreview` a nivel de runtime interno

### `MarketingEvent`

Bitacora operativa del slice.

Campos visibles:

- `id`
- `eventName`
- `source`
- `subject`
- `payloadSummary`
- `occurredAt`
- `relatedType`
- `relatedId`

## Reglas canonicas

### RC-01. Nacimiento de campaña

- si `scheduledAt` viene vacio, la campana nace:
  - `status = running`
  - `runStatus = running`
- si `scheduledAt` viene informado, la campana nace:
  - `status = scheduled`
  - `runStatus = queued`

### RC-02. Snapshot congelado al crear

- la campana conserva `segmentId` y `templateId`
- pero tambien congela:
  - `segmentName`
  - `templateName`
  - `bodyPreview`
  - `recipients`
- cambios posteriores en segmento o plantilla no deben reescribir retroactivamente
  la historia operativa de la campaña ya creada

### RC-03. Validacion minima real del runtime

El runtime actual exige:

- que `segmentId` exista;
- que `templateId` exista;
- que `template.channel` coincida con `campaign.channel`;
- que `name` y `goal` no vengan vacios.

El runtime actual no bloquea todavia por:

- `segment.status = inactive`;
- `template.status = draft`;
- otras reglas mas estrictas de elegibilidad.

Eso queda documentado como verdad `as-is`, no como recomendacion de producto.

### RC-04. `segments` y `templates` quedan read-only

- el slice incluye `segments` y `templates` porque son dependencias directas
  del flujo
- pero no abre authoring completo de esos catalogos
- la verdad operativa de este corte vive en consumo y seleccion, no en edicion

### RC-05. `marketing` orquesta, no despacha

- `marketing` registra la campana, su estado, su snapshot y sus eventos
- `marketing` no realiza dispatch directo ni entrega final del mensaje
- el envio real pertenece a `notifications/worker`

### RC-06. Frontera con `notifications`

- la campana puede originar eventos del dominio:
  - `campaign.created`
  - `campaign.scheduled`
  - `campaign.run.started`
- la entrega y trazabilidad de notificaciones pertenecen a `notifications`
- los resultados tecnicos de envio no deben reescribir ownership del modulo
  `marketing`

### RC-07. Frontera con `worker`

- `worker` procesa la cola y ejecuta el dispatch real
- el slice no promete que todos los canales ya tengan entrega productiva
  equivalente
- el soporte mas visible hoy esta en `email`; otros canales existen en
  contrato, pero no se elevan aqui a garantia operativa completa si el runtime
  no lo demuestra

### RC-08. Fuera de alcance de CRM ampliado

- el slice puede convivir con `marketing events` y señales comerciales
- pero no abre pipeline CRM amplio, lead scoring, journeys o orquestacion
  multi-step
- cualquier automatizacion amplia posterior requiere slice propio

## Superficies afectadas

### `apps/admin/components/marketing-workspace.tsx`

Surface operativa principal del slice.

Debe representar:

- metricas de campañas;
- listado de campañas;
- seleccion de segmento;
- seleccion de plantilla;
- definicion de canal;
- `scheduledAt`;
- creacion de campaña;
- visibilidad operacional, no builder avanzado.

### `apps/api/src/modules/marketing/marketing.controller.ts`

Expone hoy:

- `GET /admin/campaigns`
- `POST /admin/campaigns`
- `GET /admin/campaigns/segments`
- `GET /admin/campaigns/templates`
- `GET /admin/campaigns/events`

### `apps/api/src/modules/notifications/notifications.service.ts`

Representa la frontera de cola, notificaciones y logs.

### `apps/worker/src/main.ts`

Representa el procesamiento real de dispatch y la salida por proveedor
soportado.

## Estados y lifecycle

### Campaign status

- `draft`
- `scheduled`
- `running`
- `completed`
- `cancelled`

### Campaign run status

- `queued`
- `running`
- `completed`
- `failed`

### Catalog statuses

#### Segment

- `active`
- `inactive`

#### Template

- `draft`
- `active`
- `archived`

## Escenarios principales

### Escenario A. Campaña inmediata

1. `marketing` elige segmento, plantilla y canal.
2. No informa `scheduledAt`.
3. El sistema crea la campaña como `running/running`.
4. La campaña queda registrada con snapshot operativo congelado.
5. El dominio registra evento de inicio y deja la entrega a la frontera
   `notifications/worker`.

### Escenario B. Campaña programada

1. `marketing` elige segmento, plantilla, canal y fecha.
2. Informa `scheduledAt`.
3. El sistema crea la campaña como `scheduled/queued`.
4. Se registra el evento `campaign.scheduled`.
5. La corrida futura queda separada del dispatch real.

### Escenario C. Catálogo referencia cambió después

1. Una campaña ya fue creada.
2. Luego cambia el nombre del segmento o la plantilla.
3. La campaña conserva `segmentName`, `templateName`, `bodyPreview` y
   `recipients` originales.
4. El slice protege la lectura historica de la campaña.

### Escenario D. Dispatch técnico fuera de marketing

1. `marketing` registra campaña y evento.
2. `notifications` encola notificaciones relacionadas.
3. `worker` ejecuta el dispatch real.
4. Los resultados tecnicos viven en `notifications`, no reescriben ownership
   del agregado `campaign`.

## Riesgos abiertos

- el runtime actual todavia no endurece elegibilidad por `segment.status` o
  `template.status`
- los canales `sms` y `whatsapp` existen a nivel de contrato, pero no deben
  venderse aqui como capacidad plenamente equiparada a `email` sin evidencia
  adicional
- el slice no cubre authoring de segmentos o plantillas
- el slice no cubre journeys ni automatizacion reactiva amplia

## Resultado esperado de la homologacion

Si este slice se homologa bien:

- `marketing` queda formalizado como bounded context operativo real;
- `campaigns` quedan canonizadas con snapshot, scheduling y estados;
- `segments` y `templates` quedan ubicados como catalogos read-only `as-is`;
- la frontera con `notifications/worker` queda clara;
- `REQ-HH-005` reduce otra mezcla de alcance sin confundir CMS/editorial con
  campaigns ni con CRM ampliado.
