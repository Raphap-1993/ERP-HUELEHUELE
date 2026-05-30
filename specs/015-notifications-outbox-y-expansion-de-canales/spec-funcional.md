# Spec Funcional - Notifications Outbox Y Expansion De Canales

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Notifications Outbox Y Expansion De Canales](../../docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md),
  [Reglas de notifications outbox y expansion de canales](../../docs/fase-1-analisis-requerimientos/reglas/notifications-outbox-y-expansion-de-canales.md),
  [UC-43 Materializacion y encolado de notificaciones salientes](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-43-materializacion-y-encolado-de-notificaciones-salientes.md),
  [UC-44 Delivery worker y trazabilidad append-only](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-44-delivery-worker-y-trazabilidad-append-only.md),
  [UC-45 Idempotencia y capacidad graduada por canal](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-45-idempotencia-y-capacidad-graduada-por-canal.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md),
  [ADR-015 Notifications Outbox Channel Boundary](../../docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md)

## Objetivo

Definir el slice canonico vigente de `notifications` como paquete SDD,
formalizando el outbox saliente del brownfield con una `Notification`
individual por destinatario/canal, snapshot inmutable, `NotificationLog`
append-only, `worker` como delivery tecnico y capacidad graduada por canal sin
abrir inbox, inbound tecnico, replies ni scheduler real.

## Alcance

Incluye:

- `Notification` como agregado principal del slice
- `NotificationLog` como timeline tecnico append-only
- canales `email`, `sms`, `whatsapp` e `internal`
- lifecycle `pending`, `sent`, `delivered`, `failed`
- alta manual desde `/notificaciones`
- materializacion de mensajes desde productores aguas arriba
- `source` obligatorio
- `relatedType` y `relatedId` como traza fuerte cuando el flujo ya los
  resuelve
- `scheduledAt` como metadata visible del snapshot
- guardrails de idempotencia por origen de negocio + `audience` + canal
- `worker` y adapters como frontera de delivery real

No incluye:

- inbox comercial
- threads
- replies
- inbound tecnico
- webhooks de recepcion
- scheduler real diferido
- edicion post-creacion de la notificacion
- retry o resend manual desde UI
- consola humana de remediacion del dispatch
- identidad viva del destinatario al momento del envio

## Actores

- `marketing`
- `admin`
- `super_admin`
- `notifications`
- `worker`
- `orders`
- `loyalty`
- `campaigns`
- `012` scoring y automatizaciones simples
- `014` journeys comerciales

## Reglas Funcionales Canonicas

### RF-01. Ownership operativo del slice

- `marketing` es owner operativo principal del outbox manual y de la lectura
  de estado
- `admin` y `super_admin` conservan soporte y override operativo
- el owner funcional del slice sigue siendo `notifications`; no `/crm`,
  `campaigns` ni `worker`

### RF-02. `Notification` es la unidad funcional principal

- una `Notification` representa una sola unidad por `audience` y canal
- una campana, journey o flujo transaccional materializa multiples unidades
  individuales aguas abajo
- un intento tecnico posterior no crea otra unidad funcional

### RF-03. Snapshot materializado e inmutable

- `channel`, `audience`, `subject`, `body`, `source`, `relatedType`,
  `relatedId` y `scheduledAt` quedan congelados al crearse
- `audience` representa el destino textual ya resuelto por canal
- editar el contexto aguas arriba no reescribe una `Notification` existente
- corregir contenido o destino exige crear una nueva unidad

### RF-04. `source` y trazabilidad fuerte del origen

- `source` es obligatorio
- cuando el flujo de negocio ya resuelve `relatedType` y `relatedId`, la
  expectativa canonica es conservarlos en la unidad
- la UI manual actual no los exige ni los captura como hard gate visible
- lo estrictamente manual o interno puede carecer de relacion fuerte

### RF-05. Lifecycle funcional unificado

- los estados funcionales son `pending`, `sent`, `delivered` y `failed`
- `pending` representa unidad registrada y lista para dispatch
- `sent` representa dispatch aceptado funcionalmente
- `failed` representa fallo visible de entrega o provider
- `delivered` solo aplica cuando el canal realmente puede confirmarlo

### RF-06. `NotificationLog` es append-only

- cada intento deja una entrada nueva
- cada fallo deja una entrada nueva
- cada confirmacion relevante deja una entrada nueva
- cada requeue o evento tecnico relevante deja una entrada nueva
- la historia tecnica no se corrige editando eventos anteriores

### RF-07. Frontera clara entre modulo y worker

- `notifications` registra y encola
- `worker` ejecuta el delivery tecnico
- el provider opera como detalle del adapter por canal
- los productores aguas arriba no absorben ownership del dispatch

### RF-08. `scheduledAt` no abre scheduler real

- `scheduledAt` es visible en el snapshot y en la tabla del outbox
- `scheduledAt` expresa programacion/intencion
- este corte no promete espera diferida real antes del dispatch

### RF-09. Capacidad graduada por canal

- `email` es el canal con evidencia fuerte de provider real visible
- `sms`, `whatsapp` e `internal` forman parte del canon funcional
- fuera de `email`, la madurez de provider, confirmacion o retry/backoff sigue
  siendo graduada
- el canon no finge paridad total entre canales

### RF-10. Guardrails de idempotencia

- la equivalencia canonica se define por origen de negocio + `audience` +
  canal
- el hardening futuro debe evitar duplicados equivalentes sin intencion
  explicita
- la idempotencia queda como guardrail canonico, no como hard gate ya
  demostrado universalmente por la UI manual actual

### RF-11. `/notificaciones` es workbench outbound, no consola conversacional

- la superficie principal del slice es `/notificaciones`
- la pantalla combina alta manual, lectura del outbox y lectura de logs
- la pantalla no introduce inbox, replies, timeline conversacional ni
  remediacion manual de dispatch

## Escenarios Principales

### Escenario A. Alta manual de notificacion

1. `marketing` o `admin` abre `/notificaciones`.
2. Completa `channel`, `audience`, `subject`, `body`, `source` y
   opcionalmente `scheduledAt`.
3. `notifications` valida los campos minimos.
4. Se materializa una `Notification` individual.
5. La unidad queda normalmente en `pending`.
6. `notifications` la encola para `worker`.

### Escenario B. Materializacion desde un productor aguas arriba

1. `orders`, `loyalty`, `campaigns`, `012` o `014` disparan una intencion de
   notificacion.
2. `notifications` crea una unidad individual por destinatario/canal.
3. La unidad congela snapshot y conserva `source`.
4. Si el flujo ya resolvia relacion fuerte, conserva `relatedType` y
   `relatedId`.
5. La unidad queda lista para dispatch tecnico.

### Escenario C. Delivery tecnico por worker

1. `worker` toma un job `notification.dispatch`.
2. Busca la unidad por `notificationId`.
3. Si el canal es `email` y el destino es valido, ejecuta provider real.
4. El resultado funcional queda en `sent` o `failed`.
5. La evidencia tecnica se acumula en `NotificationLog`.

### Escenario D. Lectura administrativa del outbox

1. el usuario abre `/notificaciones`
2. revisa metricas de total, pendientes, enviadas y logs
3. consulta la tabla de outbox por canal, audiencia, asunto, estado y tiempos
4. consulta la bitacora para entender eventos tecnicos u operativos
5. si necesita corregir un mensaje, debe crear otro; no editar el existente

## Criterios De Aceptacion

| ID | Criterio |
| --- | --- |
| CA-01 | `notifications` queda fijado como outbox saliente unificado |
| CA-02 | una `Notification` representa una sola unidad por `audience` y canal |
| CA-03 | el snapshot funcional es inmutable una vez creada la unidad |
| CA-04 | `NotificationLog` queda fijado como timeline tecnico append-only |
| CA-05 | `notifications` registra y encola, y `worker` ejecuta delivery tecnico |
| CA-06 | el lifecycle funcional usa `pending`, `sent`, `delivered` y `failed` |
| CA-07 | `scheduledAt` queda visible como metadata y no como scheduler real |
| CA-08 | `email` queda como delivery real fuerte y los otros canales como capacidad graduada |
| CA-09 | la idempotencia queda documentada como guardrail canonico, no como hard gate universal ya visible |
| CA-10 | `/notificaciones` queda documentado como workbench outbound y no como inbox o consola de remediacion |

## Casos Negativos Relevantes

- `channel` vacio: la creacion debe fallar
- `audience` vacia: la creacion debe fallar
- `subject` vacio: la creacion debe fallar
- `body` vacio: la creacion debe fallar
- asumir que `scheduledAt` difiere realmente el envio: incorrecto para el
  runtime actual
- asumir que la UI manual captura `relatedType` o `relatedId`: incorrecto para
  el runtime actual
- asumir retry o resend manual desde `/notificaciones`: fuera de alcance
- tratar `NotificationLog` como inbox o timeline conversacional: incorrecto

## Dependencias De Negocio

- el negocio ya tiene mensajes manuales, transaccionales y automatizados que
  convergen en `notifications`
- `marketing` necesita un workbench sobrio para alta manual y lectura de
  estado
- la frontera con `worker` y providers debe seguir separada del ownership
  comercial
- las futuras expansiones de canal no deben romper el contrato outbound ya
  fijado
