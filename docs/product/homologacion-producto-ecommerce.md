# Homologación de Producto para Ecommerce

## Objetivo

Definir la homologación funcional mínima que le falta al catálogo de Huelegood para operar ecommerce configurable con:

- variantes reales
- sabores y presentaciones administrables
- estados comerciales claros
- personalización del sistema sin hardcodes frágiles
- compatibilidad con seller-first
- compatibilidad futura con multi-almacén, triangulación y reportes

Este documento consolida el análisis funcional desde el rol `Patroclo` y contrasta documentación con el estado real del código.

## Archivos clave revisados

### Documentación

- `docs/product/product-vision.md`
- `docs/product/scope.md`
- `docs/architecture/reportes-pagos-ubigeo-multi-almacen.md`
- `docs/architecture/modules.md`
- `docs/data/domain-model.md`
- `docs/data/entities.md`
- `docs/api/api-v1-outline.md`
- `docs/flows/warehouse-fulfillment-triangulation.md`
- `docs/flows/vendors-and-commissions.md`

### Código real

- `prisma/schema.prisma`
- `prisma/demo-content.ts`
- `prisma/seed.ts`
- `packages/shared/src/types/api.ts`
- `apps/api/src/modules/products/products.service.ts`
- `apps/api/src/modules/catalog/catalog.service.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/inventory/inventory.service.ts`
- `apps/api/src/modules/core/core.service.ts`
- `apps/admin/components/products-workspace.tsx`
- `apps/admin/components/reports-workspace.tsx`

## Estado real actual

Hoy el catálogo ya tiene una base funcional, pero todavía está homologado solo para un ecommerce corto y muy curado.

### Lo que sí existe

- `products` con `categoryId`, `name`, `slug`, `shortDescription`, `longDescription`, `status`, `salesChannel`, `reportingGroup`, `isFeatured`
- `product_variants` con `sku`, `name`, `price`, `compareAtPrice`, `stockOnHand`, `lowStockThreshold`, `status`
- bundles por `product_bundle_components`
- bloqueo de productos `internal` en storefront
- `reportingGroup` como dimensión analítica básica
- imágenes por producto y variante

### Lo que todavía no existe de forma operativa completa

- stock, reserva y confirmación real por almacén
- persistencia canónica de `fulfillmentAssignment` sobre el modelo `orders` en Prisma
- estados comerciales separados de estados técnicos
- taxonomía configurable de atributos de variante
- snapshot analítico de producto en `order_items`

### Desfase importante entre docs y runtime

La documentación arquitectónica ya habla de:

- preferencia de almacén por variante
- inventario por origen
- snapshot de fulfillment
- reportes por geografía, payouts y almacenes

Pero el runtime real todavía no lo resuelve de extremo a extremo en contratos, UI admin y flujo operativo. Ese desfase debe corregirse en la primera fase.

## Estado de implementación actual de Fase 1

Hoy ya quedaron implementados en runtime:

- `productKind` en producto
- `flavorCode`, `flavorLabel`, `presentationCode`, `presentationLabel` en variante
- `defaultWarehouseId` editable end-to-end en variante
- CRUD admin mínimo de `warehouses`
- `latitude` y `longitude` opcionales en almacenes como subfase corta `Fase 1B`
- bootstrap y backfill de almacén default
- `fulfillmentAssignment` en el runtime actual de `orders` con estrategia `warehouse_default`

Siguen fuera del cierre real de Fase 1:

- motor de stock por almacén
- triangulación automática por cobertura/prioridad
- separación formal de `publicationStatus` y `commercialStatus`
- snapshots analíticos ricos en `order_items`

## Orden recomendado de las 6 fases totales

Para no mezclar contratos, UX y operación, el frente completo debe seguir este orden:

1. `Ubigeo y contratos base`
   - almacenes con `Perú` fijo y ubigeo seleccionable por nombres
   - código interno autogenerable
   - cierre de contrato entre `default warehouse`, `fulfillmentAssignment` y alertas operativas mínimas
   - subfase corta vigente: `Fase 1B georreferenciación de almacenes` con `latitude` y `longitude` opcionales
2. `Suggestion engine v1`
   - sugerencia determinista de origen por `default`, cobertura y prioridad
   - distancia solo como desempate si existe georreferenciación suficiente
   - sin `split shipment`
   - con trazabilidad de por qué se sugirió un origen
   - separando `suggestion` de `assignment`
3. `Flujo async E2E`
   - alerta interna por pedido nuevo en revisión manual
   - alerta interna por pago confirmado y pedido listo para despacho
   - consolidación de auditoría, observabilidad y colas
4. `Inventario real por almacén`
   - balances
   - reservas
   - confirmaciones por origen
5. `Reportes operativos y comerciales`
   - ventas por ubigeo
   - pagos a vendedores
   - origen y destino por almacén
6. `Optimización operativa v2`
   - triangulación más agresiva
   - reglas de SLA/costo
   - evaluación futura de `split shipment`

## Diagnóstico funcional

### 1. La variante existe, pero aún no está homologada como variante ecommerce

Hoy la variante guarda solo:

- identificación
- precio
- stock agregado
- estado técnico

Eso sirve para vender pocos SKUs, pero no para homologar portafolio con combinaciones como:

- sabor
- presentación
- pack
- edición
- intensidad

Ahora mismo esos significados viven incrustados en:

- `product.name`
- `variant.name`
- `sku`
- copy del storefront

Eso vuelve frágiles:

- filtros
- reportes
- búsqueda
- reglas de catálogo
- futura personalización del sistema

### 2. El sistema mezcla estado de ciclo de vida con estado comercial

Hoy `ProductStatus` y `VariantStatus` no separan bien:

- si el registro existe y está administrativamente activo
- si puede publicarse
- si puede venderse
- si está agotado temporalmente
- si es solo interno

Eso genera una semántica pobre para ecommerce. `draft`, `active` o `inactive` no alcanzan para operar un catálogo cambiante.

### 3. El tipo de producto todavía está implícito

Hoy un combo se deduce por:

- categoría `bundles`
- existencia de `product_bundle_components`

Eso alcanza para el corte actual, pero no es suficiente para un catálogo más configurable. El sistema necesita una clasificación explícita del producto.

### 4. El reporte futuro depende de snapshots que hoy no existen

Los reportes que se quieren construir requieren congelar en la venta:

- tipo de producto
- reporting group
- categoría
- sabor
- presentación
- origen de fulfillment

Hoy `order_items` guarda `slug`, `name`, `sku`, `quantity`, `unitPrice` y `lineTotal`, pero no congela suficiente clasificación comercial.

### 5. La personalización del sistema no debe empujar a un modelo multi-tenant

Huelegood necesita parametrización, no multi-tenant.

La personalización correcta en este contexto significa:

- catálogos configurables
- atributos configurables
- estados comerciales explícitos
- almacenes configurables
- zonas configurables
- copy y merchandising administrables

No significa:

- catálogo por vendedor
- pricing base por vendedor
- inventario por vendedor
- tenant o tienda separada

## Homologación funcional recomendada

## Principio rector

No conviene resolver sabores y presentaciones solo con columnas sueltas ni dejar todo como texto libre.

La recomendación correcta es un modelo híbrido:

- campos canónicos obligatorios para operación y reportes
- capa configurable de opciones de variante para no hardcodear el futuro del catálogo

## Campos recomendados por nivel

### Producto base

El producto sigue siendo el contenedor comercial y editorial.

Campos que deben existir o formalizarse:

- `productKind`: `single | bundle`
- `commercialName`: nombre visible para storefront
- `internalName` opcional para operación
- `categoryId`
- `reportingGroupCode`
- `reportingGroupName`
- `salesChannel`
- `lifecycleStatus`
- `publicationStatus`
- `featuredPosition` opcional
- `sellerChannelPolicy`
- `sortOrder` opcional

Notas:

- `reportingGroup` no debería quedar como texto libre permanente; conviene llevarlo a valor controlado o catálogo simple
- `sellerChannelPolicy` no le da control al vendedor; solo define si el producto participa o no en la lógica seller-first

### Variante vendible

La variante debe ser la unidad operativa de ecommerce, stock y fulfillment.

Campos faltantes o a homologar:

- `sku`
- `barcode` opcional
- `commercialLabel`
- `internalLabel` opcional
- `price`
- `compareAtPrice`
- `currencyCode`
- `lifecycleStatus`
- `commercialStatus`
- `isDefault`
- `isPurchasable`
- `lowStockThreshold`
- `defaultWarehouseId`
- `packUnitCount`
- `contentValue` opcional
- `contentUnit` opcional
- `sortOrder`
- `minOrderQuantity` opcional
- `maxOrderQuantity` opcional
- `stepQuantity` opcional

### Atributos de variante

Para evitar hardcodear solo `flavor` y `presentation`, el sistema debe soportar opciones configurables de variante.

Capas sugeridas:

- `product_option_definitions`
- `product_option_values`
- `product_variant_option_values`

Opciones iniciales canónicas para Huelegood:

- `flavor`
- `presentation`

Campos mínimos por valor de opción:

- `optionCode`
- `optionLabel`
- `valueCode`
- `valueLabel`
- `sortOrder`
- `isActive`

Además, por practicidad operativa, conviene proyectar en la variante:

- `flavorCode`
- `flavorLabel`
- `presentationCode`
- `presentationLabel`

Esa proyección simplifica:

- filtros admin
- storefront
- reportes
- exports

## Estados comerciales recomendados

## Problema

`ProductStatus` y `VariantStatus` hoy son insuficientes como semántica comercial.

## Recomendación

Separar tres dimensiones:

### Estado de ciclo de vida

Para administración y gobernanza del dato:

- `draft`
- `active`
- `inactive`
- `archived`

### Estado comercial

Para venta real y comunicación de catálogo:

- `coming_soon`
- `available`
- `temporarily_unavailable`
- `sold_out`
- `discontinued`

### Publicación/canal

Para visibilidad:

- `public`
- `internal`
- `hidden`

Nota:

- `hidden` evita usar `inactive` como comodín de publicación
- `sold_out` no reemplaza inventario, pero sí mejora lectura comercial

## Snapshots que faltan en pedido

Para reportes sólidos y no mutables, `order_items` o un recurso asociado debe congelar:

- `productId`
- `productSlug`
- `productName`
- `variantId`
- `variantSku`
- `variantName`
- `categoryId`
- `categorySlug`
- `categoryName`
- `reportingGroupCode`
- `reportingGroupName`
- `productKind`
- `flavorCode`
- `flavorLabel`
- `presentationCode`
- `presentationLabel`

Y a nivel de pedido o fulfillment:

- `fulfillmentOriginId`
- `fulfillmentOriginCode`
- `fulfillmentOriginName`
- `fulfillmentStrategy`

Sin ese snapshot, los reportes se deforman cuando:

- cambia el nombre del producto
- cambia la categoría
- cambia el reporting group
- cambia la presentación comercial

## Restricciones para no romper seller-first

La homologación de producto no debe cruzar estas líneas:

- el vendedor no administra catálogo
- el vendedor no define inventario
- el vendedor no cambia precio base
- el vendedor no tiene almacén propio
- no se introduce `tenant_id`
- no se crea subtienda por vendedor

Seller-first debe mantenerse así:

- el vendedor sigue siendo canal de adquisición y comisión
- el catálogo sigue centralizado
- la atribución sigue ocurriendo en checkout/pedido
- la elegibilidad comercial puede configurarse por producto, pero no delegarse al vendedor

## Campos faltantes priorizados

### Críticos para Fase 1

- `productKind`
- `publicationStatus`
- `sellerChannelPolicy`
- `defaultWarehouseId`
- `commercialStatus`
- `isPurchasable`
- `sortOrder`
- `flavorCode`
- `flavorLabel`
- `presentationCode`
- `presentationLabel`
- snapshot analítico en `order_items`

### Importantes para Fase 2 o 3

- `barcode`
- `featuredPosition`
- `minOrderQuantity`
- `maxOrderQuantity`
- `stepQuantity`
- `packUnitCount`
- `contentValue`
- `contentUnit`

### Diferibles

- atributos adicionales fuera de `flavor` y `presentation`
- bundles complejos con reglas comerciales especiales
- pricing avanzado por contexto

## Backlog funcional confirmado

## Total oficial de fases

El frente `warehouses + triangulación + reportes` se mantiene en **6 fases**.

La homologación de producto para ecommerce **no abre una fase 7**; se incorpora como subfrente obligatorio dentro de la Fase 1 porque es prerequisito de contratos, snapshots y reportes.

## Fase 1. Arquitectura, contratos y homologación de catálogo

Objetivo:

- corregir el desfase entre docs y runtime
- homologar producto y variante como base ecommerce
- preparar contratos para multi-almacén y reportes

Backlog funcional:

- introducir `productKind`
- separar `publicationStatus` y `commercialStatus`
- extender variante con `defaultWarehouseId`
- introducir taxonomía de opciones de variante
- cerrar catálogo inicial de `flavor` y `presentation`
- extender contratos de `packages/shared`
- definir snapshots analíticos de `order_items`
- definir contratos de `warehouse` y `order_fulfillment`
- bootstrapear un almacén default editable y asignar variantes existentes a ese origen inicial
- cerrar `warehouses` admin, `productKind`, `flavor/presentation` y `fulfillmentAssignment` base en el runtime actual

## Fase 2. Suggestion engine v1 y guardrails operativos

Backlog funcional:

- sugerencia trazable de origen por `default warehouse + coverage + priority`
- separación explícita entre `suggestion` y `assignment`
- soporte mínimo en admin para recalcular y confirmar origen sugerido
- edición operativa de `serviceAreas` desde `warehouses`
- pedido manual de backoffice con `ubigeo` Perú normalizado
- validación de candidato por stock real de `warehouse_inventory_balances`
- bloqueo de `assignment` cuando no hay cobertura o stock suficiente
- recomposición de reserva cuando el pedido cambia de origen
- backfill inicial de balances desde `defaultWarehouseId + stockOnHand`
- sin `split shipment`

## Fase 3. Flujo async E2E

Backlog funcional:

- alerta interna por pedido nuevo en revisión manual
- alerta interna por pago confirmado y pedido listo para despacho
- consolidación de auditoría, observabilidad y colas

## Fase 4. Inventario multi-almacén operativo v2

Backlog funcional:

- tooling admin para ajuste y conciliación por almacén
- transferencias entre almacenes
- conteos y trazabilidad operacional más fina
- reportes operativos de saldo, reserva y venta por origen

## Fase 5. Reportes operativos y comerciales

Backlog funcional:

- ventas por ubigeo
- pagos a vendedores
- origen y destino por almacén

## Fase 6. Optimización operativa v2

Backlog funcional:

- triangulación más agresiva
- reglas de SLA/costo
- evaluación futura de `split shipment`

## Lista accionable

1. Corregir primero el modelo de producto y variante antes de construir reportes nuevos.
2. Tratar `flavor` y `presentation` como atributos configurables, no como texto incrustado en `name`.
3. Mantener `reportingGroup` pero convertirlo en valor controlado, no en string libre indefinido.
4. Separar `lifecycleStatus`, `commercialStatus` y `publicationStatus`.
5. Introducir `defaultWarehouseId` en variante, no en producto.
6. Persistir snapshots analíticos de catálogo en `order_items`.
7. Mantener seller-first con catálogo, stock y pricing centralizados.
8. No abrir `split shipment` en la primera ola.
9. Hacer que el admin permita configurar sabores, presentaciones, almacenes y estados sin hardcodes de frontend.
10. Recién después de homologar catálogo construir reportes geográficos y triangulación automática.

## Criterio de cierre de este análisis

Huelegood queda listo para pasar a diseño de contratos e implementación cuando:

- producto base y variante tengan semántica comercial explícita
- sabores y presentaciones dejen de vivir solo en `name`
- el catálogo pueda parametrizarse sin tocar código por cada nueva combinación
- los pedidos congelen clasificación comercial suficiente para reportes
- la futura triangulación lea `defaultWarehouseId` desde variante y no desde heurísticas

## Actualización de corte vigente

La base operativa de `stock por almacén` ya no está diferida:

- el runtime ya persiste y usa `warehouse_inventory_balances`
- la `suggestion` filtra candidatos por cobertura y stock
- la `assignment` ya no puede confirmarse contra un almacén sin cobertura o sin stock suficiente
- al cambiar el origen, la reserva del pedido se recompone sobre el nuevo almacén

Lo que sigue pendiente para fases posteriores no es la existencia del balance por almacén, sino su operación avanzada:

- edición administrativa de stock por almacén
- transferencias
- split shipment
- optimización por costo, SLA o ruteo
