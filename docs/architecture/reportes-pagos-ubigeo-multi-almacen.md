# Arquitectura: Reportes, Pagos a Vendedores, Ubigeo y Doble Almacén

## Objetivo

Definir la evolución arquitectónica necesaria para:

- simplificar el módulo de `Reportes` y convertirlo en una superficie más ordenada
- controlar y auditar pagos a vendedores como reportes operativos reales
- medir ventas por zona, ubigeo, tipo de producto y departamento
- soportar dos almacenes con asignación de origen y triangulación de despacho

Este documento fija decisiones de arquitectura y contratos. No implementa todavía el cambio.

## Contexto actual

Hoy el sistema ya tiene piezas útiles, pero todavía no tiene una arquitectura suficiente para el requerimiento completo:

- `apps/admin/components/reports-workspace.tsx` concentra demasiadas vistas en una sola pantalla
- `apps/api/src/modules/core/reports.controller.ts` y `apps/api/src/modules/core/core.service.ts` exponen un reporte general por periodo, no un hub de reportes por dominio
- `orders` ya persiste `confirmedAt`, `vendorCode`, `vendorName`, `salesChannel` y la dirección del pedido
- `commerce` y `orders` ya capturan ubigeo normalizado
- `prisma/schema.prisma` ya contiene `departmentCode`, `provinceCode` y `districtCode` en `order_addresses` y `customer_addresses`
- `inventory` reserva y confirma stock, pero sus contratos actuales no tienen dimensión de `warehouse`
- `dispatches` existe como vista operativa derivada de `orders`, pero aún no modela origen de despacho

## Problema real

El requerimiento no es una mejora cosmética del módulo de reportes. Cambia cuatro cosas estructurales:

1. cambia la información que el negocio necesita consultar
2. cambia los contratos de datos que hoy viajan entre `orders`, `inventory`, `core` y `admin`
3. cambia la forma en la que se asigna inventario y origen logístico
4. obliga a separar reportes por dominio en lugar de seguir creciendo una sola pantalla

## Decisiones de arquitectura

### 1. `Reportes` deja de ser una sola vista general y pasa a ser un hub por dominios

La simplificación de interfaz no debe resolverse metiendo más tarjetas en la página actual. La solución correcta es pasar de un `workspace` único a una arquitectura de reportes por dominios:

- `Resumen`
- `Ventas`
- `Pagos a vendedores`
- `Operación y almacenes`

Cada dominio debe tener sus propios filtros, KPIs, tablas y exportaciones. El reporte general actual pasa a ser solo la portada o `overview`.

### 2. `core` sigue siendo agregador de lectura, no dueño de reglas de negocio

`core` puede seguir construyendo read models y exports, pero no debe absorber la lógica sensible del nuevo flujo.

La propiedad funcional queda así:

- `orders`: pedido, estado comercial, snapshot de cliente, destino, confirmación comercial y snapshot de fulfillment
- `payments`: cobro al cliente y revisión manual del pago
- `commissions`: elegibilidad, cálculo, payout y conciliación de pagos a vendedores
- `inventory`: stock, reservas, confirmaciones, reversas y saldo por almacén
- `core`: vistas agregadas, métricas, tablas analíticas y exportes

### 3. El control de pagos a vendedores se modela como reporte operativo sobre `commissions` y `commission_payouts`

No se debe crear un módulo contable nuevo para este corte.

El “pago a vendedores” se entiende como una proyección operativa sobre:

- comisiones en `payable`
- comisiones en `scheduled_for_payout`
- payouts en `draft`, `approved`, `paid` y `cancelled`
- referencias, fechas, bonos, descuentos y conciliación

Eso permite controlar deuda pendiente, histórico pagado y casos bloqueados sin duplicar el dominio monetario.

### 4. La analítica geográfica usa el snapshot del pedido y ubigeo normalizado

La base geográfica ya existe en el pedido. La fuente canónica para reportes geográficos debe ser la dirección del pedido al momento de la venta, no la dirección viva del cliente.

Dimensiones recomendadas:

- `department`
- `province`
- `district`
- `zone`

Regla importante:

- `department`, `province` y `district` salen del ubigeo normalizado
- `zone` no debe ser un texto libre ni una heurística en frontend; debe salir de una configuración explícita de agrupación comercial u operativa

### 5. El doble almacén se modela como stock multi-origen dentro del mismo negocio, no como multi-tenant

Huelegood sigue siendo una sola operación comercial.

Tener dos almacenes implica:

- un mismo catálogo
- una misma política comercial
- un mismo pedido
- varios posibles orígenes de despacho
- stock segmentado por almacén

No implica:

- multi-tenant
- catálogos distintos por almacén
- precios base distintos por almacén
- frontends distintos

### 6. El almacén por defecto vive en la variante, no en una heurística de reporte

El negocio pide “poner productos en un almacén por defecto”, pero operativamente el stock y la salida existen a nivel de variante.

La decisión recomendada es:

- la preferencia de almacén por defecto se persiste en `product_variants`
- `products` puede exponer esa preferencia como valor derivado o masivo en backoffice para simplificar UX
- bundles no definen un almacén propio independiente; cada componente sigue resolviendo su variante y su almacén por defecto

Esto evita dos errores:

- atar el stock a un nivel demasiado abstracto
- perder trazabilidad cuando un producto tiene varias variantes con comportamiento distinto

### 7. La ubicación del almacén debe ser configurable y normalizada

Cada almacén debe tener ubicación operativa configurable, con dirección y ubigeo suficiente para triangulación.

Campos mínimos recomendados:

- dirección operativa
- `departmentCode`
- `departmentName`
- `provinceCode`
- `provinceName`
- `districtCode`
- `districtName`
- `latitude` opcional
- `longitude` opcional
- prioridad operativa
- estado

La ubicación del almacén no es decorativa. Debe servir para:

- reglas de cobertura
- priorización de salida
- triangulación origen-destino
- reportes operativos por origen geográfico

Reglas de esta subfase:

- `ubigeo` sigue siendo obligatorio y canónico
- la coordenada exacta se captura como mejora operativa opcional
- la distancia no reemplaza cobertura ni stock como criterio principal
- la primera captura puede ser manual, sin proveedor externo

### 8. El almacén por defecto es la primera preferencia, no una obligación irreversible

La resolución del origen debe seguir este orden:

1. origen asignado manualmente al pedido, si ya existe
2. almacén por defecto de la variante, si tiene stock y aplica a la cobertura
3. otro almacén elegible según cobertura, prioridad y stock
4. excepción operativa para revisión humana

Eso permite conservar la intención base del catálogo sin bloquear la operación real cuando el negocio necesite triangular salidas.

### 9. El pedido debe guardar un snapshot de fulfillment/origen

La decisión de desde dónde saldrá la mercadería no debe vivir solo en `inventory` ni deducirse en tiempo real desde la pantalla.

Cada pedido debe poder conservar al menos:

- `fulfillmentOriginId`
- `fulfillmentOriginCode`
- `fulfillmentOriginName`
- `fulfillmentStrategy`
- `fulfillmentAssignedAt`
- `fulfillmentAssignedBy`
- `fulfillmentNotes`

Esto permite:

- trazabilidad
- reimpresión consistente
- reportes por origen
- auditoría de reasignaciones

### 10. La primera versión debe usar un solo origen por pedido

Para no disparar complejidad innecesaria, la versión inicial no debe soportar partir un mismo pedido entre dos almacenes.

Primera fase operativa:

- un pedido
- un origen asignado
- una reserva sobre ese origen
- una sola salida logística

Si más adelante el negocio necesita `split shipment`, eso debe entrar como una segunda fase con reglas y contratos nuevos.

## Arquitectura objetivo del módulo de reportes

### Superficie admin recomendada

La navegación de `Reportes` debe reorganizarse en cuatro áreas:

### Resumen

- ventas confirmadas
- ingresos
- conversión
- métodos de pago
- tendencia diaria

### Ventas

- por producto
- por `reportingGroup`
- por categoría
- por departamento, provincia, distrito y zona
- por canal
- por vendedor

### Pagos a vendedores

- saldo por pagar
- payouts preparados
- payouts pagados
- comisiones bloqueadas o revertidas
- histórico por vendedor y periodo

### Operación y almacenes

- stock por almacén
- reservas por almacén
- pedidos asignados por origen
- despachos por origen y destino
- excepciones de reasignación

## Filtros transversales recomendados

No todos los filtros deben estar visibles todo el tiempo. Deben aparecer por dominio.

Filtros comunes:

- rango de fechas
- canal
- estado comercial válido

Filtros de ventas:

- vendedor
- producto
- `reportingGroup`
- categoría
- departamento
- provincia
- distrito
- zona

Filtros de payouts:

- vendedor
- periodo
- estado de comisión
- estado de payout

Filtros operativos:

- almacén origen
- destino
- carrier
- estado de pedido

## Contratos a modificar

### Contratos compartidos

Los contratos actuales no alcanzan para modelar multi-almacén ni reportes geográficos ricos.

Cambios mínimos recomendados en `packages/shared`:

- extender `ProductVariantSummary` y `ProductVariantInput` con:
  - `defaultWarehouseId`
  - `defaultWarehouseCode`
  - `defaultWarehouseName`
- extender `InventoryAllocationSummary` con:
  - `warehouseId`
  - `warehouseCode`
  - `warehouseName`
- extender `AdminOrderDetail` y `AdminDispatchOrderSummary` con:
  - datos de origen logístico
  - estado o estrategia de fulfillment
- introducir contratos nuevos:
  - `WarehouseSummary`
  - `WarehouseStockRow`
  - `GeoSalesReportRow`
  - `VendorPayoutReportRow`
  - `OrderFulfillmentSummary`
  - `WarehouseDispatchReportRow`

### API de reportes

El endpoint actual `GET /admin/reports` debe quedar como `overview` y no seguir creciendo como endpoint universal.

Endpoints recomendados:

- `GET /admin/reports/overview`
- `GET /admin/reports/sales/products`
- `GET /admin/reports/sales/geo`
- `GET /admin/reports/sales/vendors`
- `GET /admin/reports/vendors/payouts`
- `GET /admin/reports/operations/warehouses`
- `GET /admin/reports/operations/dispatch`

Exports recomendados:

- `GET /admin/reports/sales/geo/export`
- `GET /admin/reports/vendors/payouts/export`
- `GET /admin/reports/operations/warehouses/export`

### API operativa complementaria

Para soportar el cambio de flujo hacen falta contratos operativos adicionales:

- `GET /admin/warehouses`
- `POST /admin/warehouses`
- `PATCH /admin/warehouses/:id`
- `GET /admin/orders/:orderNumber/fulfillment`
- `POST /admin/orders/:orderNumber/fulfillment/assign`
- `POST /admin/orders/:orderNumber/fulfillment/reassign`

## Modelo de datos recomendado

### Reuso explícito de lo ya existente

No hace falta inventar nuevas bases para todo:

- `products.reportingGroup` ya sirve como dimensión de tipo de producto
- `order_addresses` ya guarda ubigeo suficiente para medición geográfica
- `commission_payouts` y `payout_items` ya son base para reportes de pagos a vendedores
- el UX de catálogo puede seguir trabajando sobre `products`, pero la preferencia de origen debe bajar a `product_variants`

## Nuevas entidades recomendadas

Para el nuevo flujo sí hace falta introducir modelado explícito de almacenes y asignación de origen:

### `warehouses`

Campos mínimos:

- `id`
- `code`
- `name`
- `status`
- `priority`
- `address`
- `departmentCode`
- `provinceCode`
- `districtCode`

### `warehouse_service_areas`

Propósito:

- definir cobertura logística o prioridad por destino
- evitar hardcodear reglas por ubigeo en el frontend

Campos sugeridos:

- `warehouseId`
- `scopeType` (`department`, `province`, `district`, `zone`)
- `scopeCode`
- `priority`
- `isActive`

### default warehouse en variante

La preferencia de origen debe persistirse en la variante mediante una referencia como:

- `product_variants.defaultWarehouseId`

Reglas:

- la variante no puede apuntar a un almacén inactivo
- backoffice puede ofrecer “aplicar a todas las variantes” para simplificar la operación
- el almacén por defecto no reemplaza la asignación final del pedido

### `order_fulfillment_assignments`

Propósito:

- persistir la decisión operativa de origen

Campos sugeridos:

- `orderId`
- `warehouseId`
- `status`
- `strategy`
- `assignedAt`
- `assignedBy`
- `notes`

### stock por almacén

Hay dos caminos válidos, pero se debe elegir uno y mantenerlo consistente:

1. extender `inventory_movements` con `warehouseId` y derivar saldos por ledger
2. crear una lectura explícita de balance por almacén y seguir dejando `inventory_movements` como traza

Para Huelegood, el camino más seguro es:

- `inventory_movements` con dimensión `warehouseId`
- una lectura agregada por almacén para operaciones y reportes

## Regla incremental de implementación

El runtime actual usa snapshots para varios módulos. Eso no invalida el cambio arquitectónico, pero sí obliga a una transición ordenada.

Regla:

- el contrato de negocio se define primero
- la persistencia temporal puede convivir en snapshots si hace falta
- la fuente canónica del flujo no debe duplicarse entre snapshot y lógica ad hoc de frontend

## Flujo objetivo para doble almacén

1. Se crea o confirma el pedido.
2. El sistema ya conoce el destino por ubigeo.
3. Se resuelve el almacén candidato según:
   - asignación manual existente
   - almacén por defecto de la variante
   - cobertura
   - prioridad
   - regla operativa vigente
4. El motor produce primero una `suggestion` trazable.
5. Solo la `assignment` confirmada guarda el snapshot de origen del pedido.
6. `inventory` reserva o confirma stock contra ese origen usando saldo real por almacén.
7. `dispatch` y la etiqueta leen ese mismo origen asignado.
8. Si operación necesita corregir el origen antes del envío, la reasignación deja auditoría y vuelve a verificar stock.

## Regla de triangulación

La triangulación debe entenderse como una decisión explícita de origen frente a destino, no como magia implícita.

Variables mínimas:

- almacén origen
- destino del pedido
- almacén por defecto de la variante
- carrier o modalidad
- prioridad operativa
- cobertura geográfica
- stock disponible por almacén

Variables diferidas para una fase posterior:

- costo logístico
- tiempo estimado
- optimización automática avanzada
- split shipment

## KPIs y reportes que habilita este diseño

### Pagos a vendedores

- comisión total pendiente por vendedor
- monto ya pagado por periodo
- payouts abiertos, aprobados y pagados
- comisiones bloqueadas y motivo
- tiempo promedio desde `payable` hasta `paid`

### Ventas geográficas

- ventas por departamento
- ventas por provincia
- ventas por distrito
- ventas por zona operativa
- mezcla de productos por geografía
- comparación entre origen y destino

### Producto y portafolio

- ventas por `reportingGroup`
- ventas por categoría
- ventas por SKU
- ticket promedio por tipo de producto y geografía

### Operación multi-almacén

- stock disponible por almacén
- reservas por almacén
- ventas despachadas por almacén
- pedidos reasignados entre almacenes
- mapa origen-destino por periodo
- calidad de sugerencia vs origen finalmente asignado

## Permisos recomendados

El modelo actual de roles sirve como base, pero el crecimiento del módulo sugiere separar permisos por dominio.

Permisos recomendados:

- `reports.overview.read`
- `reports.sales.read`
- `reports.payouts.read`
- `reports.fulfillment.read`
- `reports.export`
- `warehouses.read`
- `warehouses.manage`
- `orders.fulfillment.assign`

Asignación funcional sugerida:

- `admin`: acceso amplio
- `seller_manager`: payouts y vendedores
- `ventas`: ventas y geografía
- `operador_pagos`: lectura acotada, no liquidación a vendedores
- `dispatch` o equivalente operativo: almacenes y origen de despacho

## Fases recomendadas

### Fase 1. Arquitectura y contratos

- cerrar contratos compartidos
- definir endpoints nuevos
- fijar modelo de almacenes y fulfillment
- documentar zonas operativas
- crear un almacén default editable y backfillear variantes actuales a ese origen inicial
- dejar `warehouses` operable en admin y persistir `fulfillmentAssignment` en el runtime vigente de pedidos

### Fase 2. Suggestion engine v1 y guardrails operativos

- scoring determinista y auditable
- `suggestion` separada de `assignment`
- uso de `default warehouse + coverage + priority`
- fallback operativo explícito
- validación por `warehouse_inventory_balances`
- bloqueo de `assignment` sin cobertura o stock suficiente
- recomposición de reserva al cambiar de origen

### Fase 3. Reporte de pagos a vendedores

- vistas por vendedor, estado y periodo
- exportación
- trazabilidad de payout

### Fase 4. Reporte geográfico

- ventas por ubigeo
- ventas por `zone`
- cruces por `reportingGroup` y categoría

### Fase 5. Operación multi-almacén v2

- alta de almacenes
- tooling admin de stock por almacén
- transferencias entre almacenes
- snapshots de paquete y salida física
- guías de remisión y trazabilidad de traslado
- stickers operativos consistentes con guía y contenido
- conciliación operativa por origen
- reportes operativos por origen

### Fase 6. Triangulación avanzada

- reglas automáticas
- alertas de excepción
- posibles sugerencias de reasignación

## Riesgos a controlar

- mezclar “pago a vendedor” con contabilidad general y terminar abriendo un alcance mayor al necesario
- seguir metiendo todo en `GET /admin/reports` y convertir `core` en un módulo inmanejable
- hardcodear zonas en frontend o en helpers dispersos
- guardar el almacén por defecto solo a nivel producto y perder precisión operativa por variante
- modelar el doble almacén sin snapshot de origen en el pedido
- permitir que `worker` reasigne o altere estados sin pasar por módulos dueños
- querer soportar split shipment demasiado pronto

## Preguntas que deben cerrarse antes de implementar

- cuáles serán exactamente los dos almacenes iniciales y qué cobertura tendrá cada uno
- si la zona comercial será una tabla configurable o un mapeo fijo definido por operación
- si operación podrá reasignar origen manualmente y hasta qué estado del pedido
- si el primer corte necesitará comparar origen vs destino solo en reportes o también en dashboards operativos en tiempo real

## Actualización de alcance posterior

Este documento ya no debe tratar `transferencias entre almacenes` como duda abierta. El nuevo alcance operativo asume que:

- sí existirá transferencia entre establecimientos
- la salida física requerirá distinguir `pedido`, `paquete`, `guía` y `sticker`
- la etiqueta operativa no reemplaza el documento legal de traslado
- el flujo de incidentes debe contemplar `GRE por Eventos` o trazabilidad equivalente

La fuente de detalle para este frente vive en [warehouse-transfers-sunat-guides-and-package-labels.md](../flows/warehouse-transfers-sunat-guides-and-package-labels.md).

## Criterios de aceptación arquitectónicos

- `Reportes` queda separado por dominios y no como una única pantalla saturada
- existe una fuente canónica para reportar pagos a vendedores
- las ventas geográficas se apoyan en ubigeo persistido del pedido
- el tipo de producto se reporta con `reportingGroup` y categoría, no con textos ambiguos
- cada variante puede conservar un almacén por defecto configurable
- cada almacén tiene ubicación operativa configurable y usable para triangulación
- cada pedido puede registrar un origen logístico explícito
- el stock y los movimientos distinguen almacén
- `core` solo agrega lecturas; no absorbe reglas de pagos, comisiones ni inventario

## Archivos base revisados para esta decisión

- `apps/admin/components/reports-workspace.tsx`
- `apps/api/src/modules/core/reports.controller.ts`
- `apps/api/src/modules/core/core.service.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/inventory/inventory.service.ts`
- `apps/api/src/modules/commissions/commissions.service.ts`
- `packages/shared/src/types/api.ts`
- `prisma/schema.prisma`
- `docs/architecture/modules.md`
- `docs/data/domain-model.md`
- `docs/flows/vendors-and-commissions.md`
- `docs/flows/order-dispatch-labels.md`
