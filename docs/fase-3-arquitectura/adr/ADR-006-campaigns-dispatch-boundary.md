# ADR-006 Campaigns Dispatch Boundary

Fecha: 2026-05-27.

## Estado

Aprobado para la fase 3 canonica brownfield del slice
`006-campaigns-marketing-automation`.

## Contexto

El runtime vigente ya soporta campanas dentro de `marketing`, con segmentos,
plantillas, scheduling basico, snapshot operativo y eventos del dominio. El
problema de este corte no es inventar un automation engine nuevo, sino fijar
la frontera canonica que evite mezclar:

- la orquestacion comercial de la campana;
- el authoring completo de `segments` y `templates`;
- y la cola tecnica con el dispatch real de la notificacion.

Ademas, el repo ya separa responsabilidades tecnicas en modulos distintos:

- `marketing` crea la campana y conserva su estado operativo;
- `notifications` registra la notificacion, encola y conserva el estado
  tecnico;
- `worker` procesa la cola y marca el resultado real de envio.

Lo que no debe sobreleerse del runtime visible hoy es un handoff automatico
desde `createCampaign()`: ese flujo persiste campaign record, catalog snapshot,
auditoria y eventos dentro de `marketing`, pero no llama a
`NotificationsService` ni encola dispatch real desde esa ruta.

## Decision

El slice brownfield de campaigns se canoniza con una frontera funcional
partida entre `marketing`, `notifications` y `worker`, tratada como boundary
arquitectonico y desacople canonico, no como handoff runtime ya cableado
desde `createCampaign()`.

La decision incluye estas reglas:

1. `campaigns` es el agregado principal y sigue bajo ownership de
   `marketing`.
2. `segments` y `templates` se consumen como catalogos read-only `as-is`; este
   corte no abre authoring completo para ninguno.
3. La creacion de campana solo exige como hard gate real existencia de
   `segmentId`, existencia de `templateId` y compatibilidad entre
   `template.channel` y `campaign.channel`.
4. Sin `scheduledAt`, la campana nace `running/running`; con `scheduledAt`,
   nace `scheduled/queued`.
5. El campaign record conserva atributos propios de la campana:
   `id`, `name`, `segmentId`, `templateId`, `channel`, `status`, `runStatus`,
   `goal`, `scheduledAt`, `createdAt` y `updatedAt`.
6. El catalog snapshot congela `segmentName`, `templateName`, `bodyPreview` y
   `recipients` al momento de crearla.
7. El estado tecnico de entrega y la cola no viven en `campaigns`; viven en
   `notifications` cuando esa frontera se cruza por un flujo o integracion
   explicita.
8. El dispatch real por canal soportado no vive en `marketing`; vive en
   `worker` para jobs ya encolados.

## Guardrails Derivados

1. `marketing` no debe despachar mensajes directamente por proveedor.
2. `campaigns` no debe absorber `pending/sent/delivered/failed` como si fueran
   estados propios del agregado.
3. Cambios posteriores en `segments` o `templates` no deben reescribir el
   catalog snapshot de una campana ya creada.
4. El slice no debe venderse como journeys, automation multi-step ni CRM
   ampliado.
5. `segments` y `templates` siguen siendo dependencias read-only del slice, no
   subdominios completos de authoring.
6. `createCampaign()` no debe describirse como llamado hoy a
   `NotificationsService` ni como enqueue directo de dispatch real.

## Alternativas Rechazadas

### 1. Hacer que `marketing` despache directamente

Rechazada porque:

- mezcla orquestacion comercial con delivery tecnico;
- contradice la existencia del modulo `notifications` y del `worker`;
- acopla la campana a proveedores y reintentos de bajo nivel.

### 2. Guardar el estado tecnico de entrega dentro de `campaigns`

Rechazada porque:

- mezcla lifecycle comercial con lifecycle tecnico de notificacion;
- duplica la verdad de cola y logs que ya existe en `notifications`;
- dificulta separar scheduling, estado operativo y dispatch real.

### 3. Abrir authoring completo de `segments` y `templates` en este slice

Rechazada porque:

- rompe la homologacion `as-is`;
- abre alcance no aprobado para el corte actual;
- confunde catalogos dependientes con bounded contexts propios.

## Consecuencias

### Positivas

- separa con claridad agregado de campana, cola tecnica y dispatch real;
- fija el boundary de snapshot sin inventar nuevas reglas;
- preserva a `marketing` como owner funcional del slice;
- deja a `segments` y `templates` en su papel correcto de catalogos read-only.

### Negativas aceptadas

- el slice sigue sin journeys ni automation avanzada;
- la validacion fuerte por estado de catalogo sigue fuera de alcance;
- la frontera hacia `notifications` puede seguir siendo progresiva mientras el
  runtime evoluciona, pero el ownership queda canonizado desde ahora.

## Regla De Reevaluacion

Esta ADR solo debe reabrirse si:

- producto aprueba un automation engine real con journeys multi-step;
- `segments` o `templates` reciben authoring completo como slices propios;
- cambia el ownership tecnico de la cola o del dispatch y deja de pertenecer a
  `notifications` y `worker`.
