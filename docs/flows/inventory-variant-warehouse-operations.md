# Inventario por Variante, Sabor y Almacén

## Objetivo

Explicar cómo debe operar el stock de Huelegood cuando un mismo producto tiene varias variantes físicas, por ejemplo sabores o presentaciones, y ese stock además está repartido entre varios almacenes.

Este documento es el manual operativo del flujo actual en `Admin > Inventario`.

## Regla madre

En Huelegood no se controla stock al nivel del producto genérico.

La unidad real de control es:

- `1 variante física vendible`
- `en 1 almacén específico`

En términos de sistema, el saldo canónico es:

- `WarehouseInventoryBalance(variantId, warehouseId)`

Eso significa:

- si un producto "Negro" tiene sabores `Menta`, `Sandía` y `Limón`, cada sabor debe existir como variante propia
- si además el stock está repartido entre `Miraflores`, `Arequipa` y `Trujillo`, cada combinación `variante + almacén` lleva su propio saldo

## Cómo pensar el stock correctamente

Ejemplo:

Producto: `Huele Huele Negro`

Variantes físicas:

- `Negro - Menta`
- `Negro - Sandía`
- `Negro - Limón`

Distribución real:

- `Negro - Menta`
  - `Miraflores`: `20`
  - `Arequipa`: `5`
- `Negro - Sandía`
  - `Miraflores`: `30`
  - `Arequipa`: `10`
- `Negro - Limón`
  - `Miraflores`: `50`
  - `Arequipa`: `15`

Lectura correcta:

- el producto no tiene un único stock editable de `100`
- el sistema suma saldos por variante y por almacén
- lo que se vende, reserva o ajusta siempre es una variante física concreta

## Qué muestra `Admin > Inventario`

La pantalla agrupa por variante física y despliega detalle por almacén.

Cada fila visible te deja ver:

- producto
- variante
- SKU
- sabor
- presentación
- stock físico
- stock disponible
- almacén base o preferido
- almacenes adicionales

Regla importante:

- `stock físico` = lo que realmente existe en ese almacén
- `disponible` = `stock físico - reservado - comprometido`

## Qué hace cada acción

### `Ajustar`

Abre el modal `Ajustar stock físico`.

Ese modal sirve para:

- corregir un conteo puntual
- registrar una diferencia encontrada en almacén
- fijar el stock final contado de una variante en un almacén

No sirve para:

- sumar mercadería recibida como si fuera un ingreso incremental
- mover stock entre almacenes

Regla exacta:

- el campo `Nuevo stock contado` reemplaza el stock físico actual de esa variante en ese almacén

Ejemplo:

- hoy el sistema dice `66`
- cuentas físicamente y encuentras `72`
- guardas `72`
- el nuevo stock físico pasa a ser `72`

### `Agregar almacén`

Sirve para crear la fila inicial de una variante en un almacén donde todavía no existe.

Uso correcto:

- el sabor ya existe como variante
- el almacén ya existe y está activo
- falta registrar que esa variante también opera ahí

Puedes:

- crearla con stock inicial `0`
- crearla con un conteo inicial distinto de `0`

Nota:

- si trabajas por lote, no es obligatorio crear primero la fila manualmente
- el lote masivo puede crear la combinación `variante + almacén` al aplicar la línea, siempre que el SKU exista y el almacén esté activo
- `Agregar almacén` es la vía manual cuando quieres habilitarla visualmente antes de cargar stock

### `Ingreso / conteo masivo`

Este es el flujo para trabajar lotes.

Tiene dos modos distintos:

#### `Conteo físico`

Uso:

- inventario general
- cierre de almacén
- reconciliación física

Efecto:

- cada fila reemplaza el stock físico final de esa `variante + almacén`

Si subes:

- `MIRAFLORES + NEGRO MENTA = 20`

el sistema deja esa combinación exactamente en `20`, no suma `20`.

#### `Ingreso de mercadería`

Uso:

- compra recibida
- reposición
- nueva mercadería ingresada

Efecto:

- cada fila suma unidades nuevas al stock físico actual de esa `variante + almacén`

Si hoy tienes:

- `Negro - Menta` en `Miraflores` = `20`

y cargas:

- `Miraflores + Negro Menta + 12`

el nuevo stock físico queda en `32`.

## Cuándo usar cada modo

Usa `Conteo físico` cuando:

- estás diciendo cuánto existe realmente al final del conteo
- quieres corregir un saldo completo
- el equipo ya contó físicamente

Usa `Ingreso de mercadería` cuando:

- te llegó mercadería nueva
- solo quieres sumar lo recibido
- todavía no estás rehaciendo todo el inventario del almacén

## Cómo afecta a los demás flujos

### Pedido manual

El pedido manual ya no debería empujar una variante por defecto silenciosa.

Ahora debes elegir la variante física correcta, por ejemplo:

- `Negro - Menta`
- `Negro - Sandía`
- `Negro - Limón`

Eso asegura que el pedido reserve el sabor correcto.

### Carga masiva de pedidos

La plantilla masiva ya trabaja con `producto_sku` físico, no con producto genérico.

Por eso el usuario que importa pedidos debe elegir el SKU exacto de la variante vendida.

### Compra desde la web

Si un producto tiene varias variantes activas, el checkout debe recibir `variantId` explícito.

Eso evita que una venta de `Menta` termine descontando `Limón` o el SKU por defecto.

### Combos virtuales

Los combos no llevan stock físico propio.

Se calculan desde sus componentes.

Regla:

- no ajustar stock al combo
- ajustar stock a las variantes físicas unitarias que lo componen

## Manual rápido de uso

### Caso 1. Recibiste mercadería nueva

Haz esto:

1. Entra a `Admin > Inventario`.
2. Haz clic en `Ingreso / conteo masivo`.
3. Elige `Ingreso de mercadería`.
4. Descarga la plantilla.
5. Llena una fila por cada `variante + almacén`.
6. En `cantidad`, escribe solo las unidades que acaban de ingresar.
7. Sube el archivo.
8. Revisa que el lote quede `listo`.
9. Aplica el lote.
10. Verifica el resultado por filas.

### Caso 2. Hiciste inventario físico real

Haz esto:

1. Entra a `Admin > Inventario`.
2. Haz clic en `Ingreso / conteo masivo`.
3. Elige `Conteo físico`.
4. Descarga la plantilla.
5. Llena una fila por cada `variante + almacén`.
6. En `cantidad`, escribe el stock final contado.
7. Sube el archivo.
8. Revisa observaciones.
9. Aplica el lote.
10. Confirma que el disponible no haya quedado negativo por error.

### Caso 3. Solo quieres corregir una variante puntual

Haz esto:

1. Busca el producto en `Inventario`.
2. Abre `Ver almacenes`.
3. Ubica el almacén correcto.
4. Haz clic en `Ajustar`.
5. Escribe el `Nuevo stock contado`.
6. Añade el motivo.
7. Guarda.

### Caso 4. Un sabor empieza a operar en un almacén nuevo

Haz esto:

1. Busca la variante en `Inventario`.
2. Haz clic en `Agregar almacén`.
3. Selecciona el almacén.
4. Registra el conteo inicial o `0`.
5. Guarda.
6. Luego carga stock con `Ingreso de mercadería` o con conteo si corresponde.

## Cómo llenar la plantilla masiva

Columnas:

- `almacen_codigo`
- `producto_sku`
- `cantidad`
- `motivo`

Reglas:

- `almacen_codigo`: elige el almacén exacto
- `producto_sku`: elige la variante física exacta
- `cantidad`: depende del modo
- `motivo`: opcional por fila

Interpretación de `cantidad`:

- en `Ingreso de mercadería`: unidades que ingresan
- en `Conteo físico`: stock final contado

## Ejemplo de ingreso de mercadería

Si recibiste:

- `12` de `Negro - Menta` para `Miraflores`
- `8` de `Negro - Sandía` para `Miraflores`
- `15` de `Negro - Limón` para `Arequipa`

el lote debe ir así:

```csv
almacen_codigo,producto_sku,cantidad,motivo
WH-LIMA-CENTRAL,SKU-NEGRO-MENTA,12,Ingreso proveedor mayo
WH-LIMA-CENTRAL,SKU-NEGRO-SANDIA,8,Ingreso proveedor mayo
WH-AREQUIPA-SUR,SKU-NEGRO-LIMON,15,Ingreso proveedor mayo
```

## Ejemplo de conteo físico

Si después de contar encuentras:

- `Negro - Menta` en `Miraflores` = `18`
- `Negro - Sandía` en `Miraflores` = `29`
- `Negro - Limón` en `Arequipa` = `14`

el lote debe ir así:

```csv
almacen_codigo,producto_sku,cantidad,motivo
WH-LIMA-CENTRAL,SKU-NEGRO-MENTA,18,Conteo físico cierre mayo
WH-LIMA-CENTRAL,SKU-NEGRO-SANDIA,29,Conteo físico cierre mayo
WH-AREQUIPA-SUR,SKU-NEGRO-LIMON,14,Conteo físico cierre mayo
```

## Qué no hacer

- no cargar stock al producto genérico si el control real es por sabor
- no usar `Conteo físico` cuando en realidad solo quieres sumar una reposición
- no usar `Ingreso de mercadería` cuando quieres corregir un descuadre total
- no ajustar stock a combos virtuales
- no mezclar sabores distintos bajo el mismo SKU
- no duplicar una variante en dos filas del mismo lote con el mismo almacén si el objetivo es una sola cifra final

## Secuencia recomendada para tu caso

Si hoy te llegó mercadería nueva y además quieres ordenar el control por sabor, la secuencia sana es:

1. Asegurar que cada sabor exista como variante propia.
2. Confirmar que cada variante tenga su SKU físico correcto.
3. Verificar que los almacenes reales estén activos.
4. Crear filas faltantes con `Agregar almacén`.
5. Cargar la nueva mercadería con `Ingreso de mercadería`.
6. Después hacer un conteo físico si quieres dejar el saldo reconciliado.
7. Validar pedidos manuales, carga masiva de pedidos y checkout sobre la variante correcta.

## Criterio operativo final

La pregunta correcta ya no es:

- "¿cuánto stock tiene el producto Negro?"

Ahora debe ser:

- "¿cuánto stock tiene la variante exacta y en qué almacén?"

Ese es el nivel al que debe trabajar operación para que ventas, pedidos, carga masiva, checkout y despacho usen el mismo dato.
