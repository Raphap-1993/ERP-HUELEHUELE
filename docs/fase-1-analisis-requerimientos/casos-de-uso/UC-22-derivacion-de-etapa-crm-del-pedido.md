# UC-22 Derivacion De Etapa CRM Del Pedido

## Objetivo

Formalizar como `orders` deriva `crmStage` desde el lifecycle transaccional
del pedido sin convertir la etapa CRM en un workflow editable manualmente.

## Actores

- ventas
- orders

## Precondiciones

- existe un pedido operativo dentro del dominio `orders`
- el pedido ya tiene `orderStatus` y `paymentStatus` validos
- `Pedidos > Operacion` puede leer la etapa CRM derivada

## Flujo principal

1. El pedido cambia de estado o de situacion de pago.
2. `orders` recalcula `crmStage`.
3. El pedido queda en `ready_for_followup`, `followup`, `closed` o sin etapa.
4. `Pedidos > Operacion` refleja la etapa y el seguimiento sin edicion
   manual.

## Reglas canonicas

- `crmStage` se deriva desde `orderStatus` y `paymentStatus`
- `crmStage` no se mueve manualmente como si fuera un pipeline comercial
- `ready_for_followup` aparece cuando la venta ya queda comercialmente
  confirmada
- `followup` aparece durante el tramo operativo posterior que sigue activo
- `closed` aparece cuando el pedido llega a `Delivered` o `Completed`

## Resultado esperado

La etapa CRM del pedido queda trazable, coherente con el runtime y alineada
con el ownership real de `orders`.
