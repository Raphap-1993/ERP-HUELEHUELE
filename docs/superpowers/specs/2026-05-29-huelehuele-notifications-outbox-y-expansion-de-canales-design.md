# Huele Huele Notifications Outbox Y Expansion De Canales Design

Fecha: 2026-05-29.

## Objetivo

Definir el slice brownfield `015-notifications-outbox-y-expansion-de-canales`
como el outbox canonico unificado para todo mensaje saliente del producto,
formalizando `notifications`, `worker`, adapters por canal, trazabilidad
append-only y guardrails de unicidad del mensaje sin abrir inbox bidireccional,
conversaciones por cliente, inbound tecnico ni una consola manual de
remediacion.

## Contexto

La homologacion actual ya fijo:

- `006-campaigns-marketing-automation` para campaigns y la frontera de
  dispatch desacoplada con `notifications/worker`;
- `012-scoring-y-automatizaciones-comerciales` para score y reglas simples
  que pueden producir mensajes salientes;
- `014-automatizacion-comercial-amplia` para journeys multi-step cerrados que
  tambien pueden encolar mensajes;
- `/notificaciones` como superficie visible real para cola, estado y logs;
- `worker` con entrega real visible al menos para `email`.

El gap que queda ya no es marketing authoring, ni CRM, ni pipeline, ni
journeys. El gap es cerrar el dominio del mensaje saliente como outbox serio:
una unidad individual por destinatario/canal, con snapshot materializado,
timeline tecnico append-only, adapters desacoplados y capacidad graduada por
canal.

## Decision De Perimetro

El slice `015` cubre:

- outbox canonico unificado para todas las notificaciones salientes
- `Notification` como agregado principal
- una `Notification` por destinatario y canal
- snapshot materializado de destinatario y contenido
- inmutabilidad una vez creada
- canales `email`, `sms`, `whatsapp` e `internal`
- lifecycle unificado `pending`, `sent`, `delivered`, `failed`
- `NotificationLog` como timeline tecnico append-only
- guardrails de idempotencia por origen de negocio + destinatario + canal
- trazabilidad fuerte de origen con `source` y, cuando el flujo ya los
  resuelve, `relatedType` y `relatedId`
- frontera tecnica `notifications` + `worker` + adapters/provider por canal
- retry y backoff por canal con capacidad graduada
- workbench principal en `/notificaciones`
- vistas secundarias por origen, canal, relacion y estado
- relacion explicita con productores aguas arriba como `orders`, `loyalty`,
  `campaigns`, scoring y journeys

No cubre:

- inbox comercial
- conversaciones o `threads`
- mensajes inbound
- webhooks de recepcion
- replies bidireccionales
- scheduler real diferido a partir de `scheduledAt`
- edicion de una notificacion ya creada
- resend o retry manual desde UI
- consola de remediacion humana del dispatch
- identidad viva del destinatario en tiempo de envio

## Agregado Principal

El agregado principal del slice es `Notification`.

Reglas:

- una `Notification` representa una sola unidad de envio
- la unidad es individual por destinatario y por canal
- campaigns, journeys y flujos transaccionales materializan muchas
  `Notification` individuales aguas abajo
- el agregado no se reemplaza por `OutboxBatch` ni `MessageEnvelope` en este
  corte
- el `worker` reintenta sobre la misma `Notification`; no crea otra para el
  mismo intento tecnico

## Snapshot Materializado

La `Notification` se congela al dispararse.

Campos funcionales canonizados:

- `channel`
- `audience`
- `subject`
- `body`
- `source`
- `relatedType`
- `relatedId`
- `scheduledAt`

Reglas:

- el contenido no se renderiza en vivo al momento del dispatch
- editar una plantilla, campaña o journey aguas arriba no reescribe una
  `Notification` ya creada
- `audience` representa el snapshot textual del destino ya resuelto por canal:
  email, telefono/contacto o etiqueta interna segun corresponda
- el destinatario se trata como snapshot materializado, no como identidad viva
  que se resuelve tarde desde `customers` o `vendors`

## Inmutabilidad

Una vez creada, la `Notification` es inmutable.

Reglas:

- no se edita `audience`
- no se edita `subject`
- no se edita `body`
- no se edita `channel`
- no se edita la relacion de origen
- si hubo error de contenido o de destinatario, la correccion requiere crear
  una nueva `Notification`

## Ownership

- `marketing` es owner operativo principal del outbox manual y de la lectura
  de estado
- `admin` y `super_admin` actuan como override
- `notifications` gobierna el registro logico y el estado funcional del
  mensaje
- `worker` gobierna la ejecucion tecnica del dispatch
- `ventas` participa solo como consumidor indirecto cuando el mensaje queda
  enlazado a CRM, oportunidades o journeys

## Superficies

### Superficie principal

- `/notificaciones`

El modulo `notifications` sigue siendo el workbench principal. No se mueve a
`/crm` ni se convierte en bandeja comercial general.

### Capacidades visibles `as-is`

- crear notificacion manual
- listar outbox
- leer estado de cada mensaje
- leer logs tecnicos
- filtrar por canal
- filtrar por origen
- filtrar por estado
- filtrar por relacion de negocio

### Vistas secundarias

- vista por `source`
- vista por `relatedType`
- vista por `relatedId`
- vista por `channel`
- vista por `status`

## Canales Canonizados

El slice fija estos canales:

- `email`
- `sms`
- `whatsapp`
- `internal`

Reglas:

- `email` ya tiene delivery real visible por provider
- `sms` y `whatsapp` existen en esquema, contratos y UI
- `internal` vive dentro del mismo outbox, pero con semantica propia
- la capacidad real es graduada por canal; el canon no finge que todos estan
  igual de probados

## Lifecycle Unificado

La `Notification` usa:

- `pending`
- `sent`
- `delivered`
- `failed`

Reglas:

- el lifecycle se comparte entre canales
- los detalles de provider viven fuera del agregado padre
- `sent` y `failed` tienen evidencia runtime fuerte hoy
- `delivered` sigue siendo estado valido, pero solo se usa cuando el
  adapter/provider o el canal interno realmente puede confirmarlo

## `ScheduledAt`

`scheduledAt` queda canonizado `as-is`.

Reglas:

- existe como intencion o metadata visible
- no implica scheduler real diferido en este corte
- una notificacion con `scheduledAt` hoy sigue entrando al outbox y al worker
  como unidad inmediata
- cualquier scheduler real posterior requiere un slice nuevo o una ampliacion
  explicita del canon

## Trazabilidad Fuerte De Origen

El outbox fija una traza fuerte de procedencia.

Reglas:

- `source` es obligatorio
- cuando el flujo de negocio ya resuelve `relatedType` y `relatedId`, la
  expectativa canonica es conservarlos en la `Notification`
- el runtime visible no endurece hoy esa traza como hard gate universal del
  modulo o de la UI manual
- solo lo puramente manual o interno puede quedar sin relacion fuerte

Lecturas tipicas:

- notificacion manual
- notificacion transaccional
- notificacion materializada desde campaña
- notificacion disparada desde automation o journey

## NotificationLog

`NotificationLog` es el timeline tecnico append-only del delivery.

Reglas:

- la historia no se edita
- cada intento deja una entrada nueva
- cada requeue deja una entrada nueva
- cada fallo deja una entrada nueva
- cada confirmacion relevante del provider deja una entrada nueva

La evidencia tecnica vive principalmente aqui:

- provider
- provider message id
- request payload
- response payload
- error
- backoff
- intento
- evento tecnico de cola o dispatch

El agregado `Notification` conserva solo:

- snapshot funcional
- estado funcional
- timestamps principales

## Guardrails De Idempotencia

El outbox fija guardrails de idempotencia por:

- origen de negocio
- destinatario
- canal

Reglas:

- la direccion canonica del dominio es evitar que el mismo evento de negocio
  materialice otra `Notification` equivalente para el mismo destinatario y
  canal sin intencion explicita
- el runtime visible de `createNotification` no endurece hoy ese control como
  hard gate universal del modulo
- los reintentos tecnicos viven dentro de la misma `Notification`
- la deduplicacion fuerte sigue siendo un frente de hardening posterior si el
  brownfield decide cerrarlo de forma mas estricta

## Frontera Tecnica De Dispatch

La frontera tecnica queda asi:

- `notifications` gobierna el registro del outbox
- `notifications` gobierna el estado logico del mensaje
- `worker` ejecuta la entrega real
- cada canal usa un adapter o provider desacoplado

Reglas:

- `email` ya tiene adapter/provider real visible
- `sms` y `whatsapp` quedan como adapters progresivos, no como logica
  ad-hoc dispersa dentro del `worker`
- `internal` comparte el modelo de outbox, aunque no dependa de provider
  externo

## Retry Y Backoff

El slice canoniza retry y backoff por canal con capacidad graduada.

Reglas:

- la politica vive en la frontera del adapter/canal
- `email` tiene la evidencia real mas fuerte hoy
- `sms` y `whatsapp` quedan con contrato progresivo de retry/backoff, no con
  evidencia uniforme de runtime ya probada
- los reintentos no crean otra `Notification`
- la traza de retry y backoff vive en `NotificationLog` cuando el adapter del
  canal realmente la expone

## Productores Aguas Arriba

Los productores aguas arriba no entregan el mensaje; materializan el outbox.

Productores tipicos:

- `orders`
- `payments`
- `loyalty`
- `campaigns`
- scoring y automatizaciones simples
- journeys comerciales

Reglas:

- el productor materializa la `Notification` al dispararse
- el snapshot queda congelado desde el origen
- `notifications` no decide el contenido estrategico ni el lifecycle
  comercial
- `notifications` solo registra, encola, entrega y traza el mensaje saliente

## Frontera Con Slices Previos

### Con `006-campaigns-marketing-automation`

- campaigns orquesta y decide audiencia o template aguas arriba
- `015` materializa mensajes individuales en el outbox
- `015` no absorbe authoring de campaigns

### Con `012-scoring-y-automatizaciones-comerciales`

- `012` puede sugerir o disparar acciones simples
- `015` recibe la notificacion ya materializada
- `015` no absorbe reglas comerciales ni score

### Con `014-automatizacion-comercial-amplia`

- `014` define journeys, waits, pasos y campañas existentes
- `015` actua como outbox y delivery del mensaje saliente
- `015` no absorbe el engine del journey

## Semantica Del Canal `internal`

`internal` se canoniza dentro del mismo outbox con semantica propia.

Reglas:

- comparte el mismo agregado
- comparte el mismo lifecycle general
- comparte el mismo modelo de logs
- no depende necesariamente de provider externo para considerarse entregado

## Fuera De Alcance

- inbox comercial por cliente
- timeline conversacional bidireccional
- recepcion inbound tecnica
- respuestas humanas desde el sistema
- agrupacion en threads
- remediacion manual completa del dispatch
- scheduler real de mensajes diferidos
- render tardio de templates al enviar

## Consecuencia Arquitectonica

El slice `015` cierra `notifications` como un outbox saliente serio y
auditado, reutilizable por `orders`, `loyalty`, `campaigns`, scoring y
journeys, sin confundirlo con un inbox comercial ni con una capa de
conversacion bidireccional.

Esto deja preparados dos cortes futuros posibles, si el brownfield vivo los
justifica:

- inbox o conversacion comercial real
- nuevos canales con delivery confirmado e inbound tecnico propio
