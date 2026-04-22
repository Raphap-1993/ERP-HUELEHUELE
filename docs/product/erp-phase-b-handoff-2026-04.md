# Handoff Fase B ERP 2026-04

## Objetivo

Dejar un cierre consultable de `Fase B` del frente ERP comercial para que el equipo no dependa de memoria implícita al continuar con `Fase C`.

Fecha de corte:

- `2026-04-15`

## Decisión operativa vigente

- Huelegood mantiene `confirmacion manual controlada desde backoffice` para pedidos web con pago online.
- El webhook Openpay productivo no es requisito de cierre de `Fase B`.
- La automatizacion real con Openpay queda fuera de este corte hasta que exista habilitacion fiscal y operativa para usar la pasarela en producción.

## Alcance que queda cerrado en Fase B

- trazabilidad comercial del `order` como agregado central
- persistencia operativa de `vendorId`, `vendorCode`, `vendorName`, `salesChannel`, `createdAt` y `confirmedAt`
- politica unica de stock entre pedido manual y orden web
- definicion canonica de venta valida compartida entre `orders`, `inventory`, `reports` y `commissions`
- reportes backend por vendedor, producto, fecha y canal
- suite de dominio y validacion tecnica base del monorepo

## Qué ya no debe reabrirse en Fase B

- crear una entidad separada de `sales`
- duplicar reglas de confirmacion comercial por modulo
- reintroducir logica de stock fuera de `InventoryService`
- tratar la ausencia de webhook Openpay como deuda del corte cuando la operacion oficial es manual

## Evidencia de cierre tecnico

- `npm run typecheck`
- `npm run test:erp-sales`
- `npm run build`

Referencia de validacion:

- [06-validacion-y-pruebas.md](../06-validacion-y-pruebas.md)

## Supuestos obligatorios para seguir

- si un pedido web requiere consolidacion comercial, la operacion la resuelve desde admin
- reportes, comisiones e inventario siguen leyendo la misma semantica comercial
- cualquier cambio transversal del lifecycle comercial debe actualizar codigo y `docs/`

## Entrada oficial a Fase C

La siguiente fase no es rehacer backend base. Es completar superficie operativa:

1. conectar filtros de reportes admin al backend y exportacion CSV
2. endurecer UX operativa de pedidos, pagos y reportes
3. mantener handoff y documentacion como parte obligatoria del cierre

## Archivos fuente relacionados

- [05-plan-de-implementacion.md](../05-plan-de-implementacion.md)
- [04-diseno-tecnico.md](../04-diseno-tecnico.md)
- [06-validacion-y-pruebas.md](../06-validacion-y-pruebas.md)
- [manual-payments.md](../flows/manual-payments.md)
- [checkout-openpay.md](../flows/checkout-openpay.md)
