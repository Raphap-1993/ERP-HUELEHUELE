# Reglas De Vendedores Y Comisiones

- un pedido solo tiene un `vendorCode` efectivo
- el `vendorCode` corregido debe resolver a un vendedor activo
- no se permite `A -> none` si ya hubo comision materializada
- no se permite correccion si la comision esta en `payable`, `scheduled_for_payout` o `paid`
- no se permite correccion hacia vendedor sin regla aplicable si eso deja la comision historica divergente
- payouts viven por `vendorCode` y periodo
- el panel vendedor consume verdad derivada; no recalcula negocio
- `orders` es la puerta primaria de correccion post-pedido
- `commissions` recompone la consecuencia financiera; no corrige la atribucion primaria
