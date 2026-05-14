# Playbook Corto Rollout Multi-aroma Productivo

[Indice docs](../README.md) | [Contrato canonico aroma variante](./aroma-variant-purchase-contract.md) | [Inventario por variante, sabor y almacen](./inventory-variant-warehouse-operations.md)

## Objetivo

Convertir un producto modelado como single aroma a multi-aroma vendible real sin romper el contrato de compra ni el control de inventario. El primer corte operativo debe arrancar por `premium-negro`.

## Regla Madre Del Corte

Antes de cargar stock o abrir ventas, el producto ya debe cumplir esto:

- `1 aroma vendible = 1 product_variant active`
- compra, reserva y consolidacion siempre por `variantId`
- saldo operativo siempre por `variantId + warehouseId`
- `detailAttributes.Aromas` solo describe; no vende

## Secuencia Obligatoria

### 1. Cerrar el modelado single

- mantener el `slug` publico del producto
- definir la matriz real `aroma -> variantId -> sku -> defaultWarehouseId`
- si la variante historica actual representa un aroma real, conservarla para ese aroma; no reutilizar una sola variante historica para cubrir varios aromas
- si un aroma aparece en copy pero no existira como `product_variant active`, quitarlo del copy antes de abrir

### 2. Convertir a multi-aroma real

- crear una `product_variant` vendible por cada aroma realmente comercializable
- asegurar unicidad de `flavorCode + presentationCode` dentro del producto
- dejar `inactive` cualquier aroma todavia no listo para vender
- desde que existan multiples variantes activas, storefront, checkout, pedido manual y carga masiva deben resolver la compra con `variantId`

### 3. Preparar stock por variante + almacen

- validar que los almacenes de salida existan y esten `active`
- asignar `defaultWarehouseId` a cada variante como origen preferido inicial
- crear al menos una fila en `warehouse_inventory_balances` por cada variante activa
- usar `physical_count` cuando el conteo inicial reemplaza la verdad fisica
- usar `stock_receipt` solo cuando entra mercaderia nueva sobre un saldo ya saneado

### 4. Reconciliar antes de abrir

- si el producto ya tuvo ventas, alinear `reservedQuantity` y `committedQuantity` contra pedidos vigentes antes de publicar el nuevo esquema
- no abrir checkout si alguna variante publica queda con `availableStock` negativo
- no cambiar aroma durante fulfillment; solo puede cambiar el almacen asignado

## Primer Corte: `premium-negro`

Orden recomendado:

1. Mantener `slug = premium-negro`.
2. Definir el set inicial de aromas realmente vendibles para ese producto.
3. Crear o ajustar una variante vendible por aroma con su `variantId`, `sku`, `flavorCode`, `presentationCode` y `defaultWarehouseId`.
4. Cargar primero el stock del almacen principal de cada variante.
5. Si habra stock en mas de un almacen, crear las filas adicionales de `warehouse_inventory_balances` despues del conteo principal, nunca como stock paralelo informal.
6. Verificar que la PDP muestre selector por variante y que el CTA compre la variante seleccionada.
7. Verificar que cualquier flujo sin `variantId` falle o se rearme cuando el producto ya tenga multiples variantes activas.

## Go / No-Go

El corte queda listo solo si se cumple todo:

- `premium-negro` ya no depende de `detailAttributes.Aromas` para vender
- cada aroma vendible tiene su propia variante activa
- cada variante activa tiene al menos un balance sano por almacen
- `availableStock = stockOnHand - reservedQuantity - committedQuantity` no queda negativo
- pedido manual, bulk, checkout y reportes persisten `variantId`, `sku`, aroma, presentacion y almacen

## Regla Para Escalar Despues

Una vez estabilizado `premium-negro`, repetir la misma secuencia producto por producto: primero variante vendible real, despues stock por `variantId + warehouseId`, y solo al final apertura comercial.
