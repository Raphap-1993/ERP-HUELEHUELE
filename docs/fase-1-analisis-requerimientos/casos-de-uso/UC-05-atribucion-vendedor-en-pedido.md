# UC-05 Atribucion Vendedor En Pedido

## Actores
- cliente
- ventas
- admin
- seller_manager

## Flujo principal
1. el pedido nace con `vendorCode` efectivo o sin vendedor
2. `orders` persiste el snapshot comercial
3. si operacion necesita regularizar, corrige el `vendorCode` desde `Pedidos > Operacion`
4. la correccion solo se admite antes del lock financiero
5. el cambio deja auditoria y before/after completos
