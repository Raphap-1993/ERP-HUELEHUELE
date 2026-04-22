# Requerimientos Funcionales ERP Huele Huele

## Objetivo del negocio

Garantizar que el ERP pueda operar ventas y pedidos con trazabilidad comercial y de inventario, distinguiendo claramente:

- quien vendio
- cuando se confirmo la venta
- que productos se vendieron
- por que canal se vendieron
- como impactaron el stock

## Alcance

Incluye:

- alta y consulta de vendedores
- asociacion de vendedor a venta o pedido cuando aplique
- trazabilidad de ventas y pedidos confirmados
- politica unica de reserva, confirmacion y reversa de stock
- reportes administrativos por vendedor, producto, fecha y canal
- homologacion documental entre analisis, arquitectura y codigo

No incluye en este corte:

- reemplazo total del modelo snapshot por un dominio 100% relacional
- portal autoservicio completo para vendedores
- contabilidad o compras a proveedor
- automatizacion completa de webhook Openpay productivo si no existe infraestructura lista

## Problemas actuales

- no hay una trazabilidad homologada de vendedor y fecha de venta
- el reporte general actual no cubre vendedor ni producto
- el lenguaje funcional mezcla `venta`, `pedido`, `stock`, `confirmacion` y `pago`
- la confirmacion online del flujo web esta incompleta
- el inventario no se comunica de forma consistente entre operacion, reportes y UX

## Actores del sistema

- `cliente`
- `vendedor`
- `seller_manager`
- `ventas`
- `operador_pagos`
- `admin`
- `API Huelegood`
- `worker`

## Requerimientos funcionales

### RF-01 Registro de vendedor

El sistema debe permitir registrar vendedores por al menos dos caminos:

- postulacion comercial desde web
- alta manual desde admin

### RF-02 Consulta de vendedor

El admin debe poder consultar vendedores con:

- codigo
- estado activo o inactivo
- tipo de colaboracion
- ciudad
- ventas atribuidas
- comisiones

### RF-03 Trazabilidad comercial en pedido o venta

Toda venta o pedido confirmado debe conservar:

- `vendor_id` o equivalente consistente
- `vendor_code`
- `vendor_name`
- `sales_channel`
- fecha de creacion
- fecha de confirmacion comercial
- estado actual
- detalle de productos
- cantidades
- precios
- total

### RF-04 Politica unica de stock

El sistema debe aplicar una unica politica para todos los canales:

- reservar stock al crear pedido pendiente de pago
- confirmar consumo al confirmar pago o venta
- liberar o revertir stock al cancelar, expirar o reembolsar

### RF-05 Venta manual

Una venta manual o pedido manual desde backoffice debe:

- permitir asociar vendedor
- registrar fecha y hora
- afectar inventario segun la politica unica
- quedar disponible para reportes
- distinguir en admin entre `registro manual directo` y `revision de comprobante`, mostrando actor, nota y efecto operativo de cada ruta

### RF-06 Venta web

Una orden web debe:

- registrar el canal `web`
- conservar la atribucion comercial del vendedor cuando exista
- afectar inventario segun la politica unica
- quedar disponible para reportes cuando alcance estado de venta valida
- permitir conciliacion manual controlada desde backoffice mientras no exista webhook Openpay productivo
- impedir que la operacion use `registro manual directo` como sustituto de la conciliacion online de una orden `openpay`

### RF-07 Reporte por vendedor

El admin debe poder consultar ventas por vendedor con filtros por:

- rango de fechas
- canal
- `vendorCode` exacto cuando necesite acotar un vendedor puntual dentro del mismo workspace
- estado valido

Y ver como minimo:

- cantidad de ventas
- monto total
- ticket promedio
- ultimas ventas
- exportacion CSV consistente con el mismo scope aplicado

### RF-08 Reporte por producto

El admin debe poder consultar ventas por producto con filtros por:

- rango de fechas
- canal
- `productSlug` o `sku` exactos para acotar el scope operativo sin romper agregaciones
- estado valido

Y ver como minimo:

- unidades vendidas
- ingresos
- ultimas fechas de venta
- exportacion CSV consistente con el mismo scope aplicado

### RF-09 Fechas de venta

El sistema debe mostrar cuando se vendieron los productos, usando la fecha del evento de negocio homologado y no un campo ambiguo.

### RF-10 Trazabilidad y auditoria

Toda accion administrativa sensible debe dejar:

- actor
- fecha
- referencia del documento origen
- resumen operativo

## Requerimientos no funcionales

- mantener compatibilidad con monolito modular
- no saltarse la API desde `web` ni `admin`
- privilegiar cambios incrementales y trazables
- evitar duplicidad de logica entre web y modulo manual
- usar validaciones de negocio explicitas
- soportar idempotencia en operaciones sensibles
- documentar riesgos, impacto y rollback

## Reglas de negocio

- Huelegood es `seller-first`, no marketplace.
- El vendedor es un canal comercial; no controla stock ni pricing base.
- El agregado central de venta es el `order`.
- Para reportes administrativos de ventas cuentan solo estados comercialmente validos.
- En este corte, una venta valida se define como un pedido con pago confirmado o estado operativo equivalente.
- La fecha de venta para reportes debe ser la primera fecha de confirmacion comercial.
- El descuento de stock debe salir del mismo modulo y la misma regla para todos los canales.
- Cancelacion, expiracion y reembolso deben liberar o revertir stock segun el estado previo.

## Supuestos

- El pedido sigue siendo el agregado central; no se crea una entidad paralela de venta si no es imprescindible.
- La tabla `inventory_movements` y el schema Prisma existente son aprovechables.
- Mientras no exista webhook Openpay productivo, la confirmacion online puede requerir un paso controlado desde backoffice o un endpoint tecnico equivalente.

## Exclusiones

- compras a proveedor
- modulo contable
- multi-tenant
- extraccion total de snapshots a entidades relacionales en todos los modulos

## Criterios de aceptacion

- se puede registrar un vendedor desde admin y queda disponible para uso operativo
- la aprobacion de postulacion deja vendedor y codigo utilizables
- un pedido manual puede guardar vendedor y fechas de trazabilidad
- una orden web puede conservar vendedor, canal y fecha de confirmacion cuando la venta se valida
- el inventario se gestiona desde una politica central comun
- existen reportes por vendedor y por producto
- los reportes usan estados y fechas homologadas
- en reportes admin, filtros, metricas, tablas y CSV comparten el mismo scope aplicado
- en admin, la UX diferencia con claridad `comprobante manual`, `registro manual directo` y `conciliacion Openpay`
- la documentacion nueva queda alineada con el codigo implementado
