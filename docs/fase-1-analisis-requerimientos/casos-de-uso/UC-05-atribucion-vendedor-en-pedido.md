# UC-05 Atribucion Vendedor En Pedido

## Objetivo

Formalizar como un pedido queda atribuido a un vendedor y bajo que condiciones
esa atribucion puede regularizarse despues de creado el pedido.

## Actores

- cliente
- ventas
- admin
- seller_manager
- API Huelegood
- orders
- commissions

## Precondiciones

- existe `vendorCode` valido o un pedido ya creado sin atribucion correcta
- el pedido pertenece al flujo comercial vigente
- existe, si corresponde, al menos una regla de comision aplicable

## Flujo principal

1. El pedido nace con `vendorCode` efectivo o sin vendedor.
2. `orders` persiste el snapshot comercial del pedido.
3. Si operacion necesita regularizar, corrige el `vendorCode` desde `Pedidos > Operacion`.
4. El vendedor destino debe estar activo y ser resoluble por codigo.
5. La correccion sigue siendo operativa solo antes del lock financiero.
6. El cambio deja auditoria y before/after completos.

## Reglas canonicas

- un pedido solo tiene un `vendorCode` efectivo
- `orders` es la unica puerta de correccion post-pedido
- no se permite `A -> none` si ya hubo comision materializada
- no se permite correccion cuando la comision ya esta en `payable`, `scheduled_for_payout` o `paid`
- la correccion no se resuelve cambiando el codigo maestro del vendedor

## Resultado esperado

La atribucion de vendedor queda trazable y corregible solo dentro de una
ventana comercial segura, antes de cruzar frontera financiera.
