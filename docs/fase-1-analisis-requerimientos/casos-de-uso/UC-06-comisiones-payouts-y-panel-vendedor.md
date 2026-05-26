# UC-06 Comisiones Payouts Y Panel Vendedor

## Actores
- seller_manager
- admin
- worker
- vendedor

## Flujo principal
1. `commissions` deriva la comision desde el pedido confirmado
2. la comision madura segun regla y elegibilidad
3. `worker` prepara payouts por vendor y periodo
4. seller_manager o admin liquida el payout
5. el vendedor consulta comisiones y payouts en `/panel-vendedor`
