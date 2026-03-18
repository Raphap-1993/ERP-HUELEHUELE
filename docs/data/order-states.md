# Estados de Pedido

## Objetivo

Definir una máquina de estados simple y controlada para pedidos, compatible con Openpay, pagos manuales, comisiones y puntos.

## Estados propuestos

| Estado | Significado | Siguientes estados válidos |
| --- | --- | --- |
| `draft` | pedido recién creado desde carrito, aún no presentado como pendiente de cobro | `pending_payment`, `cancelled` |
| `pending_payment` | pedido esperando pago o confirmación inicial | `paid`, `payment_under_review`, `expired`, `cancelled` |
| `payment_under_review` | pedido con pago manual o caso operativo en revisión | `paid`, `pending_payment`, `cancelled`, `expired` |
| `paid` | pago confirmado y registrado | `confirmed`, `cancelled`, `refunded` |
| `confirmed` | orden validada operativamente para continuar | `preparing`, `cancelled`, `refunded` |
| `preparing` | pedido en preparación | `shipped`, `cancelled` |
| `shipped` | pedido despachado | `delivered`, `refunded` excepcional según resolución operativa |
| `delivered` | pedido entregado | `completed`, `refunded` |
| `completed` | ciclo comercial cerrado | `refunded` excepcional |
| `cancelled` | pedido cancelado | terminal |
| `refunded` | pago devuelto total o parcialmente según implementación futura | terminal |
| `expired` | no se recibió pago dentro de la ventana válida | terminal |

## Transiciones clave

### Checkout Openpay

- `draft` -> `pending_payment`
- `pending_payment` -> `paid`
- `paid` -> `confirmed`

### Pago manual

- `pending_payment` -> `payment_under_review`
- `payment_under_review` -> `paid`
- `payment_under_review` -> `pending_payment` si se rechaza pero sigue vigente

### Cierre operativo

- `confirmed` -> `preparing`
- `preparing` -> `shipped`
- `shipped` -> `delivered`
- `delivered` -> `completed`

## Reglas

- Toda transición debe registrarse en `order_status_history`.
- `paid` no implica necesariamente `completed`.
- Puntos y comisiones pueden depender de `completed` aunque el pago ocurra antes.
- Un pedido `expired` no debe volver a estado activo sin recreación o intervención explícita controlada.

## Estados terminales

- `completed`
- `cancelled`
- `refunded`
- `expired`

## Consideraciones operativas

- Si el negocio decide no modelar `preparing` o `shipped` en la primera iteración, pueden mantenerse internamente, pero el modelo objetivo debe preservarse desde ahora.
- El admin debe mostrar un `TimelinePedido` basado en este historial.
