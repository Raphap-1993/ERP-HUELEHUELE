# UC-10 Acumulacion Y Liberacion De Puntos

## Objetivo

Formalizar la asignacion de puntos sobre pedidos elegibles y su posterior
liberacion a saldo disponible.

## Actores

- cliente autenticado
- orders
- loyalty

## Precondiciones

- existe una `loyalty_rule` activa
- el cliente tiene o puede resolver una cuenta loyalty valida
- el pedido ya llego al estado evaluable del dominio

## Flujo principal

1. El pedido cruza el hito elegible definido por `orders`.
2. `orders` dispara el earn correspondiente.
3. Loyalty registra `loyalty_movement`.
4. Si el pedido aun no libera saldo, el movimiento queda `pending`.
5. Cuando el dominio lo confirma, el movimiento pasa a `available`.
6. La cuenta actualiza saldo pendiente, disponible y movimiento reciente.

## Reglas canonicas

- earn depende de elegibilidad del pedido
- una sola `loyalty_rule` activa gobierna la acumulacion
- los puntos no deben quedar `available` antes del hito elegible
- la cuenta siempre conserva trazabilidad del movimiento asociado

## Resultado esperado

El cliente acumula puntos de forma consistente y auditable, sin adelantar saldo
disponible antes del momento correcto del dominio.
