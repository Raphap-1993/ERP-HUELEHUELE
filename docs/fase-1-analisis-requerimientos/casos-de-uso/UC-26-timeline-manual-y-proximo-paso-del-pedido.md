# UC-26 Timeline Manual Y Proximo Paso Del Pedido

## Objetivo

Formalizar el timeline manual del `order_follow_up_case`, preservando un
registro inmutable de actividad humana y manteniendo `nextStep` y
`followUpAt` como disciplina minima del caso.

## Actores

- ventas
- marketing
- orders

## Precondiciones

- el caso manual del pedido ya existe
- el caso sigue en estado `open` o `waiting_customer`
- la vista `Pedidos > Operacion` ya permite operar el caso

## Flujo principal

1. El caso manual ya existe.
2. El operador agrega una entrada al timeline con `type` y `note`.
3. La entrada puede llevar referencia o evidencia opcional.
4. El caso mantiene `nextStep` y `followUpAt` obligatorios mientras siga
   abierto.
5. Las tareas opcionales pueden crearse, editarse y marcarse `done`.

## Reglas canonicas

- el timeline usa `note`, `call`, `whatsapp`, `email` y `status_change`
- las entradas del timeline son inmutables una vez creadas
- `marketing` puede participar operativamente, pero no es owner principal
- las tareas usan `pending` y `done`
- `nextStep` y `followUpAt` no pueden omitirse mientras el caso siga abierto

## Resultado esperado

El caso manual conserva una traza humana seria del seguimiento del pedido y
permite saber que sigue y cuando volver a actuar.
