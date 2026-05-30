# Reglas De Notifications Outbox Y Expansion De Canales

- `015` es solo outbound
- `Notification` es el agregado principal
- una `Notification` representa una sola unidad por destinatario/canal
- `audience` es el snapshot textual del destino resuelto por canal:
  `email`, telefono/contacto o etiqueta interna
- la notificacion se materializa al dispararse
- el snapshot funcional es inmutable
- `NotificationLog` es append-only
- `source` es obligatorio
- `relatedType` y `relatedId` son expectativa fuerte en flujos de negocio
  reales, no hard gate visible del modulo/UI actual
- lifecycle unificado: `pending`, `sent`, `delivered`, `failed`
- `delivered` solo aplica cuando el canal/adapter realmente puede confirmarlo
- `scheduledAt` no implica scheduler real en este corte
- `notifications` gobierna el outbox
- `worker` ejecuta el dispatch
- la evidencia tecnica vive principalmente en `NotificationLog`
- retry y backoff se definen por canal/adapter; la evidencia fuerte visible
  hoy vive en `email` y en otros canales queda como capacidad progresiva y
  contractual
- la idempotencia queda como guardrail canonico por origen de negocio +
  `audience` + canal, como hardening pendiente
- `/notificaciones` es la superficie principal
