# Contrato Canonico Aroma Variante

[Indice docs](../README.md) | [Fuente unica producto y branding runtime](../architecture/product-branding-runtime-source-of-truth.md) | [Inventario por variante, sabor y almacén](./inventory-variant-warehouse-operations.md)

## Objetivo

Cerrar la ambiguedad entre `Aromas` como copy editorial y `aroma` como opcion vendible real.

En Huelegood:

- el cliente compra una `variante`
- la operacion reserva y consolida una `variante`
- inventario controla saldo por `variante + almacen`

## Regla Madre

`1 aroma vendible = 1 product_variant active`

Eso implica:

- `slug` identifica el producto y la PDP
- `variantId` identifica la opcion vendible real
- `sku` es identificador operativo de apoyo, no la identidad publica principal
- `detailAttributes.Aromas` es solo contenido editorial

## Invariantes

1. Si un producto tiene mas de una variante `active`, storefront y checkout deben exigir `variantId`.
2. Si un producto tiene una sola variante `active` comprable, backend puede resolverla automaticamente.
3. La combinacion `flavorCode + presentationCode` debe ser unica dentro del producto.
4. `WarehouseInventoryBalance(variantId, warehouseId)` es el saldo canonico.
5. `pending_payment` y `payment_under_review` reservan; `paid` y `confirmed` consolidan; `cancelled`, `refunded` y `expired` liberan o revierten.
6. El descuento fisico final debe salir desde el evento operativo definido por negocio. Hoy el hito recomendado es `despacho`.

## Superficies

### Catalogo y PDP

- `Aromas` en la ficha publica nunca crea compra por si mismo.
- Si hay multiples variantes activas, la PDP muestra seleccion explicita por variante.
- El CTA principal compra la variante actualmente seleccionada.
- Precio, stock, galeria y badges de stock deben seguir a la variante seleccionada.
- Si una variante esta `active` pero sin stock, debe poder verse como opcion, pero no ser comprable.
- Si una variante esta `inactive`, no debe aparecer como opcion de compra nueva.

### Checkout web

- El carrito persiste `slug + variantId`.
- Si el producto exige seleccion de variante, el quick-add de checkout no agrega por `slug`; debe redirigir a la PDP para elegir aroma o presentacion.
- Un carrito viejo sin `variantId` solo puede resolverse automaticamente si el producto tiene una sola variante activa comprable.
- Si existen varias variantes activas comprables y falta `variantId`, la cotizacion falla y la linea debe rearmarse.

### Pedido manual y carga masiva

- El pedido manual debe operar sobre la variante exacta.
- La carga masiva puede recibir `variant_id` o `producto_sku`, pero antes de crear la orden debe resolverse a una variante activa inequivoca.
- `slug` o nombre del producto solo sirven para display, no como identidad vendible final.

### Inventario

- `physical_count` reemplaza el stock final de la combinacion `variantId + warehouseId`.
- `stock_receipt` suma mercaderia nueva a esa combinacion.
- Los combos no tienen stock fisico propio; descuentan desde sus componentes.

### Fulfillment

- `defaultWarehouseId` de la variante es preferencia inicial, no garantia absoluta.
- Si fulfillment reasigna origen, la reserva debe moverse a la nueva pareja `variantId + warehouseId` o rechazarse sin mutar el estado previo.

## Casos Borde

- `Aroma agotado`: visible como `Sin stock`, no comprable.
- `Variante inactive`: fuera de pickers publicos y manuales; cualquier intento forzado falla.
- `Carrito viejo sin variantId`: solo se autocorrige si queda una unica variante activa comprable.
- `Cambio de almacen`: nunca puede cambiar aroma o variante; solo puede mover la reserva de almacen.
- `Copy editorial desfasado`: si `Aromas` menciona opciones que no existen como variantes activas, el producto esta mal modelado y debe corregirse en catalogo.

## Acceptance Criteria

1. `POST /store/checkout/quote` sin `variantId` falla cuando el producto tiene multiples variantes activas comprables.
2. La PDP no compra desde `detailAttributes.Aromas`; compra desde la variante seleccionada.
3. El stock resumen del producto sigue comprable si la variante default queda agotada pero otra variante activa aun tiene saldo.
4. Reserva, consolidacion y reversa se registran sobre la misma pareja `variantId + warehouseId`.
5. Pedido manual, bulk, checkout y reportes persisten `variantId`, SKU, aroma, presentacion y almacen sin reinterpretaciones posteriores.
6. `premium-negro` en local demo debe exponer varias variantes vendibles reales para poder probar el selector de aroma.
