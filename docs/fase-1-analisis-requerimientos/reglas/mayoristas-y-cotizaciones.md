# Reglas De Mayoristas Y Cotizaciones

- `wholesale` y `distributor` comparten modulo y funnel
- los duplicados se marcan para revision; no se fusionan automaticamente
- la cotizacion parte del catalogo real
- el `tier` orienta, pero no bloquea la edicion comercial
- `accepted` no crea pedido
- `accepted` no equivale a `won`
- `won` no equivale a `order`
- el entitlement mayorista se gana solo en `won`
- si el email ya existe, se reutiliza la misma cuenta
- el entitlement se suspende sin borrar historial
- `lost` puede reabrirse conservando historial
- `/cuenta` solo muestra resumen comercial basico
