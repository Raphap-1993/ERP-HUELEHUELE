# UC-42 Reentrada Cancelacion Y Trazabilidad Del Journey

## Objetivo

Formalizar como una `journey_instance` termina, se pausa, se cancela o
reingresa sobre el mismo caso, preservando reglas de incompatibilidad,
binding estable con oportunidad activa y trazabilidad completa.

## Actores

- marketing
- ventas
- admin

## Precondiciones

- existe o existio una `journey_instance` sobre el caso comercial
- el template define elegibilidad y politica de reentrada
- el caso o la oportunidad pueden haber cambiado de contexto

## Flujo principal

1. Una instancia puede completar por exito o cancelarse por incompatibilidad
   fuerte.
2. Si la incompatibilidad es blanda, la instancia puede pausarse o desviar su
   camino.
3. Mientras una instancia siga `active` o `paused`, no puede nacer otra del
   mismo `template + case`.
4. Si la instancia estaba ligada a una oportunidad activa, mantiene binding
   estable al deal original.
5. Tras `completed` o `cancelled`, el template puede volver a instanciarse
   sobre el mismo caso si su politica lo permite.
6. La reentrada respeta `reentryCooldown`.
7. Inicio, pausa, reanudacion, branch, cancelacion, completion y reentrada
   quedan trazados en el timeline del caso.

## Reglas canonicas

- incompatibilidad fuerte cancela automaticamente
- incompatibilidad blanda pausa o desvia
- `paused` no libera la unicidad del `template + case`
- el journey no se rebindea silenciosamente a otra oportunidad
- la reentrada depende del template, no de una regla global unica
- toda transicion queda auditada en `/crm`

## Resultado esperado

El lifecycle de la instancia queda controlado y auditable, sin duplicar
journeys, sin perder historial y sin volver opaco el comportamiento cuando
cambia el contexto comercial.
