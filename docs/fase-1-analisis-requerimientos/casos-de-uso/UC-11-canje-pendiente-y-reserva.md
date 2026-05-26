# UC-11 Canje Pendiente Y Reserva

## Objetivo

Formalizar el canje operativo de puntos como solicitud con reserva inmediata
del saldo.

## Actores

- marketing
- admin
- loyalty

## Precondiciones

- la cuenta loyalty existe
- el cliente tiene saldo `available` suficiente
- el canje se registra desde operacion, no desde `/cuenta`

## Flujo principal

1. Operacion crea un `redemption`.
2. Loyalty valida saldo suficiente.
3. Los puntos se reservan de inmediato.
4. El canje queda `pending`.
5. Marketing o admin marcan `applied` o `cancelled`.
6. `applied` consume definitivamente la reserva.
7. `cancelled` devuelve los puntos a `available`.

## Reglas canonicas

- un canje `pending` reserva puntos de inmediato
- no se permite doble gasto sobre saldo reservado
- `applied` y `cancelled` deben dejar auditoria de actor y decision
- la recompensa del canje se registra como `reward` libre/manual

## Resultado esperado

El programa evita sobregiro del saldo y mantiene una trazabilidad clara del
canje, incluso antes de su resolucion final.
