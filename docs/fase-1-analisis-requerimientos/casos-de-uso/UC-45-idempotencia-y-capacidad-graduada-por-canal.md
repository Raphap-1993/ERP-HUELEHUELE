# UC-45 Idempotencia Y Capacidad Graduada Por Canal

## Objetivo

Formalizar como el outbox evita duplicados equivalentes y a la vez canoniza
canales con distinta madurez operativa sin fingir que todos tienen el mismo
nivel de delivery real.

## Actores

- notifications
- worker
- marketing

## Precondiciones

- existe un origen de negocio identificable para el disparo
- el destinatario y el canal ya fueron resueltos
- el sistema conoce la capacidad real disponible por canal

## Flujo principal

1. Un mismo origen intenta disparar un mensaje equivalente.
2. El canon define equivalencia por origen de negocio + `audience` +
   canal.
3. El hardening pendiente debe evitar materializar una nueva `Notification`
   equivalente sin intencion explicita.
4. `email` se trata como delivery real visible.
5. `sms`, `whatsapp` e `internal` quedan canonizados con capacidad graduada.

## Reglas canonicas

- la idempotencia queda como guardrail canonico contra duplicados
  funcionales, no como comportamiento ya probado del modulo visible
- una excepcion a la idempotencia debe ser explicita y auditable
- `email` es el canal de referencia para dispatch real probado en este corte
- `sms`, `whatsapp` e `internal` forman parte del canon aunque su evidencia o
  madurez de provider, confirmacion o retry/backoff sea parcial
- fuera de `email`, retry/backoff quedan como capacidad progresiva y
  contractual por canal
- el canon no abre inbox ni recepcion bidireccional para justificar nuevos
  canales

## Resultado esperado

El outbox queda orientado a endurecer la duplicacion funcional y a la vez
preparado para crecer por canal con semantica estable, sin prometer una
paridad de delivery que el brownfield todavia no tiene.
