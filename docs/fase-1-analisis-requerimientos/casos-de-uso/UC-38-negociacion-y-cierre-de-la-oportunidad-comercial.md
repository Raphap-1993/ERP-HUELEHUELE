# UC-38 Negociacion Y Cierre De La Oportunidad Comercial

## Objetivo

Formalizar el lifecycle operativo de una `commercial_opportunity`, sus campos
minimos obligatorios, el seguimiento puntual de la negociacion y sus reglas de
cierre en `won` o `lost`.

## Actores

- ventas
- marketing

## Precondiciones

- existe una `commercial_opportunity` activa dentro del caso comercial del
  cliente
- la oportunidad ya fue tipificada y asignada
- el workbench principal sigue viviendo en `/crm`

## Flujo principal

1. `ventas` opera la oportunidad en `qualified`, `proposal` o `negotiation`.
2. El sistema exige `expectedValue`, `currency` y `targetCloseAt` en esos
   estados activos.
3. La negociacion puntual se documenta en timeline y tareas propias de la
   oportunidad.
4. `ventas` puede actualizar owner, assignee, canal o referencias si la
   negociacion concreta lo requiere.
5. La oportunidad cierra como `won` o `lost`.
6. Si cierra como `won`, queda cerrada de forma estable.
7. Si cierra como `lost`, debe registrar `lostReason`.

## Reglas canonicas

- el lifecycle de la oportunidad es manual por `ventas`
- la oportunidad no usa probabilidad de cierre
- el cierre `won` no equivale a forecast ni a quote engine nuevo
- el cierre `lost` no derriba automaticamente el caso padre
- las referencias del deal pueden ser principales o secundarias

## Resultado esperado

La negociacion concreta queda operada con su propio valor esperado,
cronograma, timeline y cierre, sin mezclarse con el timeline general del
cliente.
