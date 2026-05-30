# Spec Tareas - Notifications Outbox Y Expansion De Canales

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Traceability](traceability.md)

## Backlog Canonico

### T1. Contratos shared del outbox

- sostener `NotificationSummary`, `NotificationLogSummary` y `NotificationInput`
- sostener enums compartidos de `NotificationChannel` y `NotificationStatus`
- mantener `adminAccessRoles.notifications`

### T2. Hardening del agregado `Notification`

- reforzar snapshot individual por `audience` y canal
- sostener `source` obligatorio
- conservar `relatedType` y `relatedId` cuando el flujo ya los resuelve
- endurecer guardrails de duplicado funcional

### T3. Boundary tecnico `notifications -> worker`

- sostener `notification.dispatch` como job canonico
- sostener `markNotificationSent()` y `markNotificationFailed()`
- sostener `recordEvent()` como timeline append-only
- mantener requeue de pendientes al bootstrap

### T4. Adapters por canal y capacidad graduada

- sostener `email` con provider real visible
- explicitar contractualmente `sms`, `whatsapp` e `internal`
- documentar retry/backoff y confirmacion por canal segun madurez real

### T5. Workbench admin `/notificaciones`

- conservar alta manual del mensaje
- conservar metricas, tabla de outbox y tabla de bitacora
- no introducir inbox, retry manual, resend ni edicion post-creacion
- no vender filtros dedicados hasta soportarlos realmente

### T6. Trazabilidad y observabilidad

- sostener auditoria `notification.queued`, `notification.sent`,
  `notification.failed`
- sostener eventos estructurados del worker
- preservar evidencia tecnica y funcional sin mezclarla

### T7. Alineacion brownfield de persistencia

- documentar el gap entre schema Prisma y contrato visible
- priorizar el contrato service-first en futuras implementaciones
- planear convergencia gradual si se ejecuta hardening estructural

### T8. Integracion con productores aguas arriba

- mantener a `campaigns`, `orders`, `loyalty`, `012` y `014` como productores
  desacoplados
- no trasladar ownership de delivery a los productores
- conservar `source` y relacion fuerte cuando el flujo ya la conoce

## Criterio De Priorizacion

- primero contrato compartido y boundary del agregado
- despues dispatch tecnico y logs append-only
- luego workbench admin y expansion gradual por canal
- finalmente alineacion de persistencia e integracion fuerte con productores
