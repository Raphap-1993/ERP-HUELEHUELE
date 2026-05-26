# Fase 1 - Analisis y Requerimientos

[README principal](../../README.md) | [Indice docs](../README.md)

## Objetivo
Consolidar el slice inicial `checkout publico + pago manual + frontera futura de gateway` en requerimientos, actores, casos de uso y reglas de negocio trazables.

## Documentos
- [01.00-analisis-requerimientos.md](01.00-analisis-requerimientos.md)
- [casos-de-uso/UC-01-checkout-publico.md](casos-de-uso/UC-01-checkout-publico.md)
- [casos-de-uso/UC-02-pago-manual-con-comprobante.md](casos-de-uso/UC-02-pago-manual-con-comprobante.md)
- [casos-de-uso/UC-03-conciliacion-operativa-manual.md](casos-de-uso/UC-03-conciliacion-operativa-manual.md)
- [reglas/checkout-y-pagos.md](reglas/checkout-y-pagos.md)

## Slice 002 - Vendors Commissions
- [01.01-vendors-commissions.md](01.01-vendors-commissions.md)
- [casos-de-uso/UC-04-postulacion-vendedor.md](casos-de-uso/UC-04-postulacion-vendedor.md)
- [casos-de-uso/UC-05-atribucion-vendedor-en-pedido.md](casos-de-uso/UC-05-atribucion-vendedor-en-pedido.md)
- [casos-de-uso/UC-06-comisiones-payouts-y-panel-vendedor.md](casos-de-uso/UC-06-comisiones-payouts-y-panel-vendedor.md)
- [reglas/vendedores-y-comisiones.md](reglas/vendedores-y-comisiones.md)

## Slice 003 - Wholesale Leads Quotes
- [01.02-wholesale-leads-quotes.md](01.02-wholesale-leads-quotes.md)
- [casos-de-uso/UC-07-captura-y-calificacion-mayorista.md](casos-de-uso/UC-07-captura-y-calificacion-mayorista.md)
- [casos-de-uso/UC-08-cotizacion-y-cierre-comercial.md](casos-de-uso/UC-08-cotizacion-y-cierre-comercial.md)
- [casos-de-uso/UC-09-entitlement-mayorista-y-resumen-en-cuenta.md](casos-de-uso/UC-09-entitlement-mayorista-y-resumen-en-cuenta.md)
- [reglas/mayoristas-y-cotizaciones.md](reglas/mayoristas-y-cotizaciones.md)

## Slice 004 - Loyalty Points Redemptions
- [01.03-loyalty-points-redemptions.md](01.03-loyalty-points-redemptions.md)
- [casos-de-uso/UC-10-acumulacion-y-liberacion-de-puntos.md](casos-de-uso/UC-10-acumulacion-y-liberacion-de-puntos.md)
- [casos-de-uso/UC-11-canje-pendiente-y-reserva.md](casos-de-uso/UC-11-canje-pendiente-y-reserva.md)
- [casos-de-uso/UC-12-ajustes-manuales-y-reversa-automatica.md](casos-de-uso/UC-12-ajustes-manuales-y-reversa-automatica.md)
- [reglas/loyalty-y-canjes.md](reglas/loyalty-y-canjes.md)

## Criterio de cierre
- El slice inicial ya tiene RF, actores, estados y reglas canónicas.
- La separación entre `Pagos` y `Pedidos > Operacion` queda explícita.
