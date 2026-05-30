# SPDD Frontend - Notifications Outbox Y Expansion De Canales

Fecha: 2026-05-29.

## Superficies cubiertas

- `/notificaciones`
- `NotificationsWorkspace`
- tablas de outbox y bitacora dentro del mismo workbench

## Contratos visibles

- `NotificationsWorkspace` como shell unica del slice
- metric cards de total, pendientes, enviadas y logs
- formulario manual con `channel`, `audience`, `subject`, `body`, `source` y
  `scheduledAt`
- tabla del outbox con `channel`, `audience`, `subject`, `status`, `source`,
  `scheduledAt`, `sentAt` y `updatedAt`
- tabla de bitacora con `eventName`, `source`, `subject`, `detail` y
  `occurredAt`
- estados visibles `pending`, `sent`, `delivered`, `failed`
- canales visibles `email`, `sms`, `whatsapp`, `internal`

## Reglas visibles

- `/notificaciones` sigue siendo la unica superficie principal del slice
- la UI no promete inbox, reply, thread ni experiencia bidireccional
- la UI no promete delivery confirmado para todos los canales
- `scheduledAt` se muestra como metadata visible, no como scheduler probado
- la captura manual no expone hoy `relatedType` ni `relatedId`
- la tabla visible tampoco expone hoy `relatedType` ni `relatedId`
- la bitacora visible es resumen tecnico-operativo y no log crudo de provider
- la UI no introduce botones de retry manual, resend, cancelacion ni edicion
  posterior de la unidad
- hoy no existen widgets dedicados de filtro por `channel`, `source`, `status`
  o relacion; esas lecturas quedan implícitas en columnas y futura evolucion

## Lecturas derivadas

- `source` sirve para distinguir mensajes manuales, transaccionales o
  materializados aguas arriba
- `sentAt` y `updatedAt` ayudan a leer si la unidad ya salio del sistema o
  sigue pendiente
- la bitacora complementa el outbox cuando hay fallos o actividad tecnica
  relevante

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md`
- `docs/fase-1-analisis-requerimientos/reglas/notifications-outbox-y-expansion-de-canales.md`

## Dependencias de Fase 3

- la frontera entre `notifications` y `worker`
- la separacion entre snapshot funcional y `NotificationLog` append-only
- la capacidad graduada de delivery por canal
- la ADR que preserve `015` como outbox outbound y no como inbox
