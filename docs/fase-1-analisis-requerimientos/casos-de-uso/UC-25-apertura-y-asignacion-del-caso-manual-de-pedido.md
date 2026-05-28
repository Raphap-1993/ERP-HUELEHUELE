# UC-25 Apertura Y Asignacion Del Caso Manual De Pedido

## Objetivo

Formalizar como `ventas` abre un `order_follow_up_case` sobre un pedido ya
elegible, asignando responsable y siguiente accion sin crear mas de un caso
por pedido.

## Actores

- ventas
- orders

## Precondiciones

- existe un pedido operativo dentro de `orders`
- el pedido ya tiene `crmStage` relevante
- el pedido todavia no tiene un `order_follow_up_case` abierto
- `Pedidos > Operacion` puede mostrar el workbench manual

## Flujo principal

1. El pedido ya tiene `crmStage` relevante.
2. `ventas` abre el caso manual.
3. Se asigna `assignee`.
4. Se registran `nextStep` y `followUpAt`.
5. El pedido queda con un solo `order_follow_up_case` activo.

## Reglas canonicas

- el caso solo se abre sobre pedidos con `crmStage` relevante
- `ventas` es owner operativo principal de la apertura
- `assignee` forma parte del contrato canonico del caso
- `nextStep` y `followUpAt` son obligatorios al abrir el caso
- el runtime solo permite un caso por pedido

## Resultado esperado

El pedido queda con un workbench manual explicito, asignado y listo para
seguimiento humano disciplinado dentro del modulo de `Pedidos`.
