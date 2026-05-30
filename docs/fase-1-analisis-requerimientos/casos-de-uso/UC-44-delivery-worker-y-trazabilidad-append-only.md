# UC-44 Delivery Worker Y Trazabilidad Append Only

## Objetivo

Formalizar como `worker` procesa una `Notification` pendiente, delega el envio
al adapter del canal y deja evidencia tecnica append-only sin mezclarla con
el snapshot funcional del mensaje.

## Actores

- worker
- adapter de canal
- provider

## Precondiciones

- existe una `Notification` en estado `pending`
- el canal ya fue materializado y conoce su adapter o contrato de entrega
- `NotificationLog` esta disponible como timeline tecnico del dispatch

## Flujo principal

1. `worker` toma una `Notification` pendiente.
2. Ejecuta el adapter correspondiente al canal.
3. Actualiza estado funcional a `sent` o `failed`.
4. Si el canal puede confirmarlo, puede registrar `delivered`.
5. Cada intento y fallo visible deja evento nuevo en `NotificationLog`; si
   existe provider id, retry/backoff tecnico o requeue del adapter, tambien
   queda registrado como evento nuevo.

## Reglas canonicas

- `notifications` no entrega directamente; registra y encola
- `worker` es owner de la ejecucion tecnica del dispatch
- `NotificationLog` es append-only y no se corrige editando eventos previos
- `delivered` solo existe cuando el canal o provider realmente puede
  confirmarlo
- `email` concentra hoy la evidencia fuerte visible de adapter, retry tecnico
  y provider
- `sms`, `whatsapp` e `internal` quedan con capacidad progresiva y
  contractual; no se afirma paridad ya probada de retry/backoff
- el detalle tecnico del provider vive en el timeline, no en la semantica del
  snapshot funcional

## Resultado esperado

El delivery queda desacoplado del modulo funcional, con estados visibles,
evidencia tecnica acumulativa y trazabilidad suficiente para explicar
dispatch, fallo, confirmacion o evento tecnico relevante por cada unidad
saliente.
