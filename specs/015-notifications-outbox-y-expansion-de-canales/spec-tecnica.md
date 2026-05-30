# Spec Tecnica - Notifications Outbox Y Expansion De Canales

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Notifications Outbox Y Expansion De Canales](../../docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md),
  [Reglas de notifications outbox y expansion de canales](../../docs/fase-1-analisis-requerimientos/reglas/notifications-outbox-y-expansion-de-canales.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md),
  [ADR-015 Notifications Outbox Channel Boundary](../../docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md)

## Objetivo Tecnico

Formalizar y endurecer la frontera tecnica del outbox saliente del repo sin
abrir inbox ni scheduler real. El slice debe preservar la separacion entre
productores aguas arriba, `notifications`, `worker`, adapters por canal y
provider real, dejando explicito que el contrato funcional visible del
agregado manda sobre un schema Prisma brownfield parcial.

## Baseline Real Del Repo

### Contratos compartidos y enums

- `packages/shared/src/types/api.ts`
  - define `NotificationSummary`, `NotificationLogSummary` y
    `NotificationInput`
  - expone `channel`, `audience`, `subject`, `body`, `source`,
    `relatedType`, `relatedId`, `scheduledAt`, `sentAt`, `createdAt` y
    `updatedAt`
- `packages/shared/src/domain/admin-access.ts`
  - fija `adminAccessRoles.notifications` para `super_admin`, `admin`,
    `marketing` y `ventas`
- enums compartidos visibles en runtime:
  - `NotificationChannel`
  - `NotificationStatus`
  - `QueueName.Notifications`

### API y modulo `notifications`

- `apps/api/src/modules/notifications/notifications.controller.ts`
  - expone `GET /admin/notifications`
  - expone `POST /admin/notifications`
  - expone `GET /admin/notifications/logs`
- `apps/api/src/modules/notifications/notifications.service.ts`
  - `listNotifications()` devuelve outbox con metricas funcionales
  - `listLogs()` devuelve timeline tecnico resumido
  - `createNotification()` valida `channel`, `audience`, `subject` y `body`
  - `createNotification()` normaliza `source`, `relatedType`, `relatedId` y
    `scheduledAt`
  - `createNotification()` materializa la unidad, la persiste y dispara
    `dispatchNotification()`
  - `markNotificationSent()` y `markNotificationFailed()` resuelven el estado
    funcional y registran observabilidad/auditoria
  - `recordEvent()` agrega logs append-only
  - `queueNotification()` reutiliza `createNotification()`

### Persistencia runtime-visible

- `notifications.service` mantiene `Map<string, NotificationRecord>` y lista
  de logs en memoria de modulo
- `ModuleStateService` persiste y restaura snapshot del modulo
- `onModuleInit()` reencola pendientes salvo que
  `HUELEGOOD_DISABLE_NOTIFICATION_REQUEUE=1`
- el contrato visible actual es snapshot-backed y service-driven

### Worker y provider real

- `apps/worker/src/main.ts`
  - registra `notification.dispatch` dentro de `QueueName.Notifications`
  - usa `NotificationsService.findByIdFresh()` para leer la unidad
  - en `email`, intenta dispatch real via Resend
  - marca `failed` si el provider falla
  - marca `sent` si el provider acepta el envio
  - registra logs estructurados `notifications.email.*` y
    `notifications.dispatch.*`

### Admin y cliente HTTP

- `apps/admin/app/notificaciones/page.tsx`
  - publica `/notificaciones` bajo `AdminAuthGate`
- `apps/admin/components/notifications-workspace.tsx`
  - carga `fetchNotifications()` y `fetchNotificationLogs()`
  - crea notificaciones manuales via `createNotification()`
  - muestra metricas, tabla del outbox y tabla de bitacora
  - no expone retry manual, resend, cancelacion, reply ni filtros dedicados
- `apps/admin/lib/api.ts`
  - define `fetchNotifications()`, `createNotification()` y
    `fetchNotificationLogs()`

### Prisma legacy y desalineacion controlada

- `prisma/schema.prisma`
  - conserva `Notification` con `type`, `recipientType`, `recipientId`,
    `payloadJson` y relacion opcional a `Template`
  - conserva `NotificationLog` con `provider`, `status`, payloads de request
    y response
- esa forma legacy no coincide por completo con el contrato funcional
  visible del servicio, la UI y `packages/shared`
- para `015`, la verdad tecnica canonica es service-first y no schema-first

## Frontera Tecnica Objetivo

### 1. Productores aguas arriba siguen declarando intencion

- `orders`, `loyalty`, `campaigns`, `012` y `014` pueden disparar
  notificaciones
- no deben absorber ownership del outbox
- deben aportar `source` y relacion de negocio cuando ya la tengan resuelta

### 2. `notifications` sigue siendo el master del outbox

- materializa la unidad funcional
- persiste snapshot funcional y logs relacionados
- encola trabajo tecnico
- publica lectura administrativa del outbox

### 3. `worker` sigue siendo el owner del delivery real

- procesa jobs ya encolados
- resuelve provider/adapters
- marca resultado funcional del envio
- no gobierna contenido ni ownership comercial del mensaje

### 4. Los adapters siguen separados por canal

- `email` usa provider real visible hoy
- `sms`, `whatsapp` e `internal` quedan como superficie contractual y
  capacidad progresiva
- el canon no exige misma profundidad de retry/backoff o confirmacion entre
  todos los canales

### 5. `/notificaciones` sigue siendo workbench simple

- muestra el outbox materializado y la bitacora
- permite alta manual
- no se convierte en consola de soporte ni en inbox

## Boundary Del Snapshot Y Del Log

### Atributos del snapshot funcional

- `id`
- `channel`
- `audience`
- `subject`
- `body`
- `source`
- `relatedType`
- `relatedId`
- `scheduledAt`
- `status`
- `sentAt`
- `createdAt`
- `updatedAt`

### Atributos del timeline tecnico visible

- `id`
- `eventName`
- `source`
- `subject`
- `detail`
- `notificationId`
- `relatedType`
- `relatedId`
- `occurredAt`

### Evidencia tecnica reservada al boundary de log/provider

- provider
- provider message id
- payload request/response
- errores
- backoff
- requeue

## Ajustes Minimos Recomendados

### Contratos shared

Rutas candidatas:

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/admin-access.ts`

Ajustes recomendados:

- sostener `NotificationSummary`, `NotificationLogSummary` y `NotificationInput`
  como contratos canonicos del slice
- mantener `adminAccessRoles.notifications` sin abrir otro set de acceso
- endurecer el lenguaje del snapshot individual por `audience` y canal

### API y modulo `notifications`

Rutas candidatas:

- `apps/api/src/modules/notifications/notifications.controller.ts`
- `apps/api/src/modules/notifications/notifications.service.ts`

Ajustes recomendados:

- mantener `createNotification()` como puerta canonica del agregado
- sostener `source` obligatorio en todos los caminos
- conservar `relatedType` y `relatedId` cuando existan aguas arriba
- endurecer guardrails de idempotencia por origen + `audience` + canal
- sostener requeue de pendientes al bootstrap sin vender scheduler real

### Worker y adapters

Rutas candidatas:

- `apps/worker/src/main.ts`

Ajustes recomendados:

- mantener `notification.dispatch` como job canonico
- sostener dispatch real de `email` via Resend
- preparar adapters graduados para `sms`, `whatsapp` e `internal`
- registrar logs estructurados por resultado tecnico

### Admin y cliente HTTP

Rutas candidatas:

- `apps/admin/app/notificaciones/page.tsx`
- `apps/admin/components/notifications-workspace.tsx`
- `apps/admin/lib/api.ts`

Ajustes recomendados:

- sostener `/notificaciones` como superficie visible unica
- conservar alta manual y lectura de estado/logs
- no introducir botones de retry manual, resend, reply o edicion post-creacion
- no prometer filtros dedicados hasta que realmente existan en runtime

### Persistencia y alineacion brownfield

Rutas candidatas:

- `prisma/schema.prisma`
- `apps/api/src/persistence/module-state.service.ts`

Ajustes recomendados:

- documentar explicitamente el gap entre schema legacy y contrato visible
- evitar implementar features nuevas leyendo solo el schema Prisma
- alinear gradualmente schema y servicio cuando se ejecute hardening real del
  slice

## Reglas Tecnicas Del Slice

1. `Notification` sigue siendo el agregado principal del outbox.
2. una unidad funcional es individual por `audience` y canal.
3. el snapshot se congela al crearse y no se edita.
4. `NotificationLog` sigue siendo append-only.
5. `notifications` registra, persiste y encola.
6. `worker` ejecuta delivery tecnico y actualiza estado funcional.
7. `scheduledAt` no debe activar scheduler real en este corte.
8. `email` concentra la evidencia fuerte del provider.
9. los otros canales conservan capacidad graduada sin paridad obligatoria.
10. la UI manual no expone hoy `relatedType` ni `relatedId`.
11. la UI visible no expone hoy retry manual ni filtros dedicados.
12. el contrato funcional visible prevalece sobre el schema Prisma legacy
    cuando haya divergencia brownfield.

## Riesgos Tecnicos Y Mitigaciones

| Riesgo | Mitigacion canonica |
| --- | --- |
| tratar Prisma legacy como verdad unica | hacer service-first el canon del slice |
| duplicar ownership entre productor y worker | dejar a `notifications` como registro y a `worker` como delivery |
| usar `scheduledAt` como scheduler real | tratarlo solo como metadata visible |
| prometer paridad total entre canales | fijar madurez graduada por canal |
| mezclar log tecnico y snapshot funcional | sostener boundary claro entre ambos |
| introducir UX de soporte no soportada | prohibir retry manual, resend, reply e inbox |

## Definition Of Done Tecnica Del Slice

- el repo expresa `015` como outbox saliente unificado y no como inbox
- `Notification` y `NotificationLog` quedan fijados como lenguaje tecnico
  canonico del slice
- `worker` queda acotado al delivery tecnico por job
- la tension schema legacy vs contrato visible queda documentada
- `/notificaciones` queda defendido como superficie unica y simple del slice
- el slice deja explicito que scheduler real, inbound y reply quedan fuera
