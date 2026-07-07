# Control de inventario por almacén

## Objetivo

Definir cómo debe configurarse el inventario de Huelegood para que los pedidos se controlen contra stock real y el descuento ocurra por almacén, no solo por variante.

## Modelo operativo vigente

La operación actual usa estas piezas:

- `product_variants.stockOnHand`: stock base editable de la variante
- `product_variants.defaultWarehouseId`: almacén preferido de salida para esa variante
- `warehouse_inventory_balances`: saldo operativo por variante y almacén
- `inventory` snapshot: estado agregado en memoria persistido por módulo
- `orders` snapshot: fuente transaccional del pedido y de sus asignaciones de inventario

Regla de lectura operativa:

- el checkout y la reserva no deberían confiar solo en `product_variants.stockOnHand`
- la lectura que decide si se puede vender debe salir de `warehouse_inventory_balances`
- el disponible operativo por almacén se calcula como:

`availableStock = stockOnHand - reservedQuantity - committedQuantity`

## Qué significa cada cantidad

- `stockOnHand`: unidades físicas cargadas para ese almacén
- `reservedQuantity`: unidades bloqueadas por pedidos todavía no confirmados
- `committedQuantity`: unidades ya consolidadas para pedidos confirmados

Interpretación correcta:

- `reservedQuantity` y `committedQuantity` no son stock físico nuevo; son descuentos lógicos sobre el saldo del almacén
- el stock visible para vender debe salir del disponible, no del stock base de catálogo

## Configuración mínima correcta

### 1. Crear y activar almacenes reales

Cada almacén debe existir en `warehouses` con:

- `code` único y legible
- `name` operativo
- estado `active`
- ubigeo normalizado
- prioridad operativa
- cobertura geográfica si aplica

Si el almacén no existe o está inactivo, no debería usarse como origen de checkout.

### 2. Asignar origen preferido por variante

Cada variante vendible debe tener:

- `defaultWarehouseId`
- `stockOnHand` base coherente con el físico inicial

Esto se configura hoy desde `Admin > Productos`, en los campos:

- `Origen preferido`
- `Stock base`

Uso correcto:

- si la variante sale normalmente desde un solo almacén, ese almacén debe quedar como `defaultWarehouseId`
- si la variante todavía no tiene origen real, no debería publicarse como vendible

### 3. Sembrar balance operativo por almacén

Por cada variante vendible debe existir al menos una fila en `warehouse_inventory_balances` para el almacén que la despacha.

Regla mínima para un setup simple de un solo almacén:

- `warehouse_inventory_balances.stockOnHand = product_variants.stockOnHand`
- `reservedQuantity = 0`
- `committedQuantity = 0`

Regla para múltiples almacenes:

- la suma de `warehouse_inventory_balances.stockOnHand` de todos los almacenes debe representar el total físico real de la variante
- `product_variants.stockOnHand` no debe usarse como “segundo stock paralelo”; debe quedar alineado al total base o al origen único de bootstrap
- en el bootstrap local actual se siembran dos nodos operativos (`WH-LIMA-CENTRAL` y `WH-AREQUIPA-SUR`) y el stock demo se reparte entre ambos

### 4. Validar antes de abrir ventas

Antes de reabrir checkout:

- revisar `Admin > Inventario`
- confirmar que ninguna variante pública tenga disponible negativo
- confirmar que el almacén preferido de cada SKU público exista y esté activo
- confirmar que los bundles también resuelvan sus componentes a variantes con saldo real

## Cómo se descuenta el stock durante un pedido

Secuencia actual del dominio:

1. El pedido entra al flujo de reserva.
2. `InventoryService.reserveLines()` aumenta `reservedQuantity`.
3. Cuando operación confirma el pedido, `InventoryService.confirmLines()` mueve unidades de `reservedQuantity` a `committedQuantity`.
4. Si el pedido se cancela antes de confirmar, `releaseLines()` libera la reserva.
5. Si el pedido ya estaba confirmado y luego se revierte, `reverseLines()` descuenta `committedQuantity`.

Lectura práctica:

- `reservedQuantity` protege stock frente a checkout simultáneo
- `committedQuantity` deja trazado que ese stock ya fue consumido comercialmente

## Cómo operar bien cuando hay varios almacenes

Reglas recomendadas:

- no editar el stock “a ojo” en varios lugares al mismo tiempo
- usar transferencias entre almacenes para mover físico entre origen y destino
- evitar que dos almacenes crean ser el origen principal del mismo SKU sin saldo separado
- revisar coberturas y prioridades de almacén antes de cambiar el origen preferido de una variante

Buena práctica mínima:

- un SKU público debe tener un almacén principal claro
- cualquier stock adicional en otro almacén debe registrarse como balance propio de ese almacén
- el despacho debe salir del almacén asignado al pedido, no del que “todavía tenga stock en la ficha”

## Cómo trabajar ordenadamente en admin

La operación no debería resolverse desde una sola pantalla. Para consolidar el frente y evitar errores de interpretación, cada superficie debe tener una responsabilidad clara:

### `Almacenes`

Usar esta superficie para:

- alta y edición de almacenes
- ubigeo, cobertura y prioridad operativa
- activación o desactivación del nodo

No usarla para:

- editar reservas o ventas
- corregir stock histórico

### `Inventario`

Usar esta superficie para:

- leer el saldo operativo por `variante + almacén`
- detectar bajo stock, negativos y drift
- confirmar si un SKU está sano antes de vender

No usarla como reemplazo de:

- catálogo
- transferencias
- despacho

### `Transferencias`

Usar esta superficie para:

- mover stock físico entre almacenes
- dejar trazabilidad del origen y destino
- bloquear doble uso comercial del mismo stock mientras se traslada

Regla:

- cualquier movimiento físico entre dos almacenes debe salir por `Transferencias`, no por edición manual de dos saldos sueltos

### `Pedidos`

Usar esta superficie para:

- revisar qué pedido reservó stock
- confirmar o cancelar según estado comercial
- entender impacto del pedido sobre el inventario

Regla:

- un pedido debe reservar, confirmar o liberar stock; no debe “reescribir” stock físico base

### `Despachos`

Usar esta superficie para:

- picking, packing y salida operativa
- ejecutar el fulfillment del pedido ya asignado

Regla:

- despacho consume sobre un origen ya definido; no decide inventario desde cero

### `Pagos`

Usar esta superficie para:

- aprobar o rechazar el cobro
- disparar la transición comercial que consolida o libera inventario

Regla:

- pago y stock deben seguir la misma máquina de estados del pedido

### `Reconciliación`

Esto no debe ser una operación diaria normal. Debe quedar como herramienta de excepción para cuando:

- hay disponible negativo inconsistente
- un snapshot quedó contaminado
- hay drift entre pedidos, reservas y stock operativo

## Qué debe mostrar la pantalla `Inventario`

La pantalla de inventario no debería mezclar indicadores sanos con anomalías sin diferenciarlos. Si aparece un agregado como `Disponible -880`, eso ya no es un KPI normal; es una alerta operativa.

Regla visual:

- la tabla principal debe salir por `variante + almacén`
- el almacén por defecto debe verse como etiqueta operativa, no como reemplazo del saldo real
- el total de variante puede repetirse como contexto, pero la unidad de operación es el balance del almacén

KPIs recomendados:

- `Variantes activas`: cuántas referencias están operando
- `Stock físico`: suma de `stockOnHand`
- `Reservado abierto`: unidades retenidas por pedidos todavía no confirmados
- `Comprometido confirmado`: unidades ya consolidadas comercialmente
- `Disponible sano`: solo saldo libre no negativo
- `Descuadre detectado`: cantidad de variantes con disponible negativo

Lectura correcta:

- `Disponible` no debe ser la única tarjeta principal si ya hay negativos grandes
- los negativos deben verse como excepción explícita, no como parte de una métrica saludable
- la tabla principal debe priorizar primero los SKUs con drift, luego bajo stock, y después los sanos

## Rutina operativa diaria recomendada

1. Revisar `Inventario` y resolver primero cualquier variante con disponible negativo.
2. Confirmar que los pedidos nuevos hayan reservado stock correctamente.
3. Procesar pagos para consolidar o liberar reservas.
4. Ejecutar transferencias si un almacén necesita reabastecer a otro.
5. Recién después despachar.

Secuencia correcta:

- primero sanidad del saldo
- después confirmación comercial
- después movimiento físico

## Qué no hacer

- no confiar solo en `product_variants.stockOnHand` para decidir disponibilidad comercial
- no correr `backfill-default-warehouse.ts` o `backfill-warehouse-balances.ts` como solución automática a balances negativos ya contaminados
- no mezclar stock histórico vendido con stock actual disponible
- no reabrir checkout si `warehouse_inventory_balances` muestra negativos operativos para SKUs públicos

## Incidente auditado en este corte

En la base local auditada el problema no es falta simple de stock; es descuadre del balance operativo:

- `HG-PN-001`: `stockOnHand=120`, `reservedQuantity=27`, `committedQuantity=432`, disponible `-339`
- `HG-CV-001`: `stockOnHand=120`, `reservedQuantity=27`, `committedQuantity=630`, disponible `-537`

Pero el snapshot `orders` activo solo muestra:

- `HG-PN-001`: `48` confirmadas y `3` bajo revisión
- `HG-CV-001`: `70` confirmadas y `3` bajo revisión

Conclusión:

- el control del checkout debe apoyarse en balances saneados por almacén
- antes de vender otra vez hay que reconciliar `warehouse_inventory_balances` contra pedidos válidos y stock físico real

## Checklist operativo para dejarlo sano

1. Definir el almacén real por cada SKU público.
2. Contar stock físico por almacén.
3. Alinear `warehouse_inventory_balances.stockOnHand` con ese conteo.
4. Recalcular o corregir `reservedQuantity` y `committedQuantity` contra pedidos vigentes y confirmados.
5. Revisar en `Admin > Inventario` que el disponible no quede negativo.
6. Recién después habilitar pedidos públicos.

## Recomendación de endurecimiento posterior

Para que el sistema quede realmente controlado:

- reservar stock antes del pago manual del cliente
- validar disponibilidad operativa en `quote` o en un preflight previo al modal de pago
- exponer en admin herramientas explícitas de reconciliación por almacén, no solo backfills de bootstrap
