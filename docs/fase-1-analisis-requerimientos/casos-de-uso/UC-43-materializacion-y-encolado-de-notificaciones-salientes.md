# UC-43 Materializacion Y Encolado De Notificaciones Salientes

## Objetivo

Formalizar como un productor aguas arriba o una accion manual abre una unidad
saliente del outbox, materializando una `Notification` individual por
destinatario/canal con snapshot inmutable y estado inicial controlado.

## Actores

- marketing
- orders
- loyalty
- journeys
- notifications

## Precondiciones

- existe una intencion valida de disparar un mensaje saliente
- el canal y el destinatario ya fueron resueltos por el productor
- el contexto de negocio ya conoce su `source` y, cuando aplica,
  espera aportar `relatedType` y `relatedId`

## Flujo principal

1. Un productor aguas arriba decide disparar un mensaje saliente.
2. Se materializa una `Notification` individual por `audience` resuelta y
   canal.
3. El snapshot congela `audience` como destino textual ya resuelto por canal
   (`email`, telefono/contacto o etiqueta interna), `subject`, `body`,
   `channel`, `source`, `relatedType`, `relatedId` y `scheduledAt`.
4. La `Notification` queda en estado `pending`.
5. `notifications` la encola para `worker`.

## Reglas canonicas

- una `Notification` no agrupa multiples destinatarios ni multiples canales
- el mensaje queda materializado al dispararse y no se renderiza en vivo
- `source` es obligatorio
- `relatedType` y `relatedId` son expectativa fuerte en flujos de negocio
  reales, aunque el modulo visible hoy no los bloquee como hard gate
- `scheduledAt` puede quedar visible en el snapshot sin abrir scheduler real

## Resultado esperado

El outbox queda poblado con unidades individuales, trazables e inmutables,
listas para ser procesadas por `worker` sin depender del estado futuro del
productor aguas arriba.
