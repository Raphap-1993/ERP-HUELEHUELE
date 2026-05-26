# UC-06 Comisiones Payouts Y Panel Vendedor

## Objetivo

Formalizar el ciclo que va desde la comision derivada de un pedido confirmado
hasta su liquidacion y lectura en el panel vendedor.

## Actores

- seller_manager
- admin
- worker
- vendedor
- commissions

## Precondiciones

- el pedido ya quedo comercialmente confirmado
- existe `vendorCode` efectivo y regla de comision aplicable
- el runtime de payouts sigue vigente

## Flujo principal

1. `commissions` deriva la comision desde el pedido confirmado.
2. La comision madura segun regla, ventana y elegibilidad.
3. `seller_manager` o `admin` prepara la corrida de payout.
4. `worker` genera `commission_payout` y sus `payout_items`.
5. Operacion liquida el payout.
6. El vendedor consulta comisiones, payouts y estado comercial en `/panel-vendedor`.

## Reglas canonicas

- la comision nace desde el pedido; no desde el panel
- los payouts viven por `vendorCode` y periodo
- el panel vendedor consume verdad derivada
- una vez cruzado el lock financiero, la regularizacion ya no es edicion normal de pedido

## Resultado esperado

El canal seller-first queda cerrado de punta a punta: atribucion, comision,
liquidacion y lectura por parte del vendedor comparten una sola narrativa
operativa.
