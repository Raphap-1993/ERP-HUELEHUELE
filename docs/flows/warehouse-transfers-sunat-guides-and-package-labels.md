# Flujo: Transferencias, Guias SUNAT y Stickers de Paquete

## Objetivo

Definir el flujo E2E que Huelegood debe seguir cuando la operacion ya no termina en:

- asignar un origen al pedido
- imprimir una etiqueta operativa

Sino que tambien debe cubrir:

- transferencias entre almacenes
- armado fisico del paquete
- emision de guia de remision alineada a SUNAT
- impresion de sticker de caja consistente con la guia y con el contenido real
- cierre operativo del despacho o de la transferencia

## Fecha de corte y referencias externas verificadas

Documento contrastado el `2026-04-14` con fuentes oficiales de `SUNAT`:

- Guia de Remision Electronica - GRE: <https://cpe.sunat.gob.pe/landing/guia-de-remision-electronica-gre>
- Guia de remision fisica - aspectos generales: <https://orientacion.sunat.gob.pe/guias-de-remision-comprobantes-de-pago-fisicos-empresas>
- Guia de remision remitente - datos y motivos de traslado: <https://orientacion.sunat.gob.pe/02-guia-de-remision-remitente>
- Reglamento de comprobantes de pago, capitulo de guias: <https://www.sunat.gob.pe/legislacion/comprob/regla/capituloV.pdf>

Lectura operativa derivada de esas fuentes:

- `SUNAT` reconoce el motivo `traslado entre establecimientos de una misma empresa`
- en `transporte privado` emite `GRE Remitente`
- en `transporte publico` intervienen `GRE Remitente` y `GRE Transportista`
- la guia debe emitirse antes del traslado
- la `GRE` con `QR` puede sustentar el traslado sin necesidad de impresion fisica, aunque la operacion puede decidir imprimirla

Nota:

- esto no reemplaza asesoria legal o tributaria especifica
- cuando exista duda de interpretacion, el ERP debe bloquear la salida y escalar a validacion administrativa

## Por que hace falta este documento

La documentacion actual ya cubre:

- origen logistico del pedido
- triangulacion entre almacenes
- etiqueta operativa de despacho

Pero todavia no separa con suficiente claridad cinco artefactos distintos:

1. `pedido`
2. `paquete`
3. `guia`
4. `sticker`
5. `transferencia entre almacenes`

Ese vacio ya es riesgoso cuando el negocio quiere:

- mover stock entre almacenes
- despachar con terceros
- sostener fiscalizacion o control policial en ruta
- evitar que el paquete fisico diga una cosa y la guia otra

## Alcance

Incluye:

- transferencias entre almacenes
- despacho outbound de pedidos web y manuales
- snapshot de paquete para salida fisica
- snapshot de guia para sustento legal de traslado
- sticker de caja derivado del mismo snapshot operativo
- control de consistencia entre paquete, guia y pedido o transferencia
- incidentes de traslado y necesidad de `GRE por Eventos`

No incluye:

- exportacion o aduanas
- `split shipment`
- consolidacion de multiples pedidos en un solo paquete como capacidad abierta por defecto
- ruteo por costo, SLA o optimizacion de carrier
- integracion inmediata con `SUNAT` o carrier especifico si antes no se cierra el contrato funcional

## Principios rectores

### 1. `Pedido`, `paquete`, `guia` y `sticker` no son lo mismo

- el `pedido` es el agregado comercial
- el `paquete` es la unidad fisica que realmente sale
- la `guia` es el sustento legal del traslado
- el `sticker` es una pieza operativa visible sobre la caja

No se deben colapsar en un solo artefacto ni en un solo payload.

### 2. El `sticker` no reemplaza la guia

La etiqueta operativa de caja:

- ayuda a pick/pack/despacho
- no reemplaza la `GRE`
- no debe presentarse como documento legal principal

### 3. La salida fisica debe usar un snapshot inmutable

Antes de imprimir sticker o emitir guia, el sistema debe congelar un `package snapshot` con:

- origen
- destino
- contenido
- cantidades
- bultos
- peso declarado cuando aplique
- modo de transporte

La guia y el sticker deben derivar del mismo snapshot.

### 4. No se debe despachar ni transferir con stock ambiguo

Toda salida debe apoyarse en:

- `warehouseId + variantId`
- stock suficiente
- origen ya confirmado
- actor y hora de salida auditables

### 5. Transferir entre almacenes no es un ajuste de inventario disfrazado

Una transferencia requiere:

- solicitud
- reserva o separacion en origen
- despacho fisico
- recepcion en destino
- trazabilidad de incidencias

No debe resolverse como una suma en un almacen y una resta en otro sin flujo intermedio.

### 6. Primera fase sin `split shipment`

En este corte:

- un pedido usa un solo origen
- un despacho outbound usa un solo paquete operativo por pedido
- una transferencia usa un solo origen y un solo destino por transaccion

Si luego se necesita multipaquete o consolidacion, eso entra como segunda fase.

## Conceptos canonicos

### `Order`

Agregado comercial de venta. Sigue siendo dueño de:

- cliente
- direccion de destino
- pago
- timeline comercial
- `fulfillmentAssignment`

### `Fulfillment assignment`

Origen logistico confirmado del pedido. Es el dato canónico para:

- reservar stock
- preparar paquete
- emitir guia outbound
- imprimir sticker

### `Warehouse transfer`

Movimiento interno de bienes entre dos establecimientos del mismo negocio. No depende de un cliente final.

### `Dispatch shipment`

Ejecucion logistica de salida hacia cliente final desde un origen ya asignado.

### `Package snapshot`

Foto inmutable del paquete o bulto antes de salir.

Campos minimos sugeridos:

- `packageId`
- `shipmentType`: `outbound_order | warehouse_transfer`
- `orderNumber` o `transferNumber`
- `originWarehouseId`
- `destinationType`: `customer | warehouse`
- `destinationSnapshot`
- `items`
- `totalUnits`
- `packageCount`
- `packageIndex` si en el futuro hay multipaquete
- `declaredWeight`
- `notesForHandling`
- `packedAt`
- `packedBy`

### `Transport guide snapshot`

Foto del documento de traslado usado por la operacion.

Campos minimos sugeridos:

- `guideType`: `sunat_remitente | sunat_transportista | sunat_event`
- `series`
- `number`
- `qrValue` o referencia verificable
- `cdrStatus`
- `issuedAt`
- `transferStartAt`
- `transportMode`: `private | public`
- `motive`
- `carrierSnapshot`
- `vehicleSnapshot`
- `driverSnapshot`
- `sourceDocumentUrl` opcional si se decide guardar representacion PDF

### `Operational package label`

Sticker de caja derivado del `package snapshot`.

Debe incluir:

- `packageId`
- referencia principal: `orderNumber` o `transferNumber`
- origen
- destino
- resumen de contenido
- total de unidades o bultos
- referencia de guia emitida
- barcode o QR interno del paquete

No debe incluir:

- montos
- datos de pago
- documento del cliente
- notas internas sensibles

## Ownership funcional por modulo

### `orders`

Sigue siendo dueño de:

- pedido
- estado comercial
- direccion del cliente
- origen confirmado del pedido

No debe ser dueño de:

- recepcion en destino de una transferencia
- ciclo de vida detallado del paquete
- snapshot legal de guia como flujo independiente

### `inventory`

Debe ser dueño de:

- saldo por almacen
- reserva y confirmacion de stock
- separacion para transferencia
- egreso en origen
- ingreso en destino al recepcionar
- diferencias e incidencias de conciliacion

### `dispatch` o superficie logistica equivalente

Debe ser dueño de:

- paquete
- checklist de alistamiento
- emision o registro de guias
- impresion de stickers
- salida fisica
- cierre de entrega o recepcion

### `warehouses`

Sigue siendo dueño de:

- datos del establecimiento
- prioridad
- cobertura
- datos operativos del punto de salida o recepcion

## Flujo E2E A: transferencia entre almacenes

### Precondiciones

- ambos almacenes existen y estan activos
- el origen tiene stock suficiente
- la transferencia fue aprobada por actor autorizado

### Pasos

1. Operacion crea una `transfer request` indicando origen, destino, variantes y cantidades.
2. La API valida stock suficiente en el almacen origen.
3. `inventory` separa las unidades para la transferencia y evita doble uso comercial.
4. Operacion hace picking y packing de la transferencia.
5. El sistema crea un `package snapshot` de transferencia.
6. Si el traslado requiere sustento `SUNAT`, el sistema emite o registra la `GRE` correspondiente con motivo `traslado entre establecimientos de una misma empresa`.
7. El sistema genera el `sticker` del bulto usando el mismo snapshot.
8. Operacion despacha la transferencia y el movimiento queda `in_transit`.
9. El almacen destino recibe, valida cantidades y confirma recepcion.
10. `inventory` consolida el ingreso en destino.
11. Si hay diferencias, se abre incidencia y no se cierra automaticamente la transferencia.

### Regla de transporte

- `private`: la empresa mueve con su propia unidad; el flujo minimo requiere `GRE Remitente`
- `public`: un tercero transporta; el flujo debe contemplar `GRE Remitente` y referencia o integracion con `GRE Transportista`

## Flujo E2E B: pedido listo para despacho a cliente

### Precondiciones

- el pedido esta comercialmente elegible
- el pedido ya tiene `fulfillmentAssignment`
- el origen confirmado tiene stock reservado o confirmado segun estado

### Pasos

1. Operacion abre el pedido en `Despachos`.
2. El sistema toma como unica verdad el `fulfillmentAssignment`.
3. Operacion hace picking desde ese almacen.
4. El sistema crea el `package snapshot` outbound.
5. Si el despacho requiere `GRE`, la emite o registra antes de la salida.
6. El sistema imprime el `sticker` del paquete con referencia al pedido y a la guia.
7. Operacion despacha fisicamente el paquete.
8. El pedido pasa a estado logistico correspondiente y deja auditoria.

### Regla de bloqueo

No debe permitirse marcar `shipped` si falta cualquiera de estos puntos:

- origen confirmado
- paquete congelado
- guia emitida o registrada cuando aplique
- consistencia de cantidades entre paquete y pedido

## Flujo E2E C: incidente, transbordo o reinicio

Si durante el traslado ocurre:

- cambio de vehiculo
- imposibilidad de llegar al punto previsto
- devolucion a origen
- desvio excepcional

El flujo correcto no es editar silenciosamente la guia original. Debe existir:

- incidencia operativa
- snapshot del evento
- `GRE por Eventos` o documento equivalente segun el caso
- trazabilidad de actor, causa y hora

## Reglas duras de consistencia

### Entre pedido y paquete

- no puede salir una variante o cantidad que no pertenezca al pedido
- no puede omitirse una linea sin dejar incidencia explicita

### Entre transferencia y paquete

- el contenido del bulto debe coincidir con la solicitud aprobada o con su ultima version autorizada

### Entre paquete y guia

- origen y destino deben coincidir
- el contenido declarado debe coincidir a nivel operativo con el paquete
- el tipo de traslado debe coincidir con el caso real
- la guia no debe referenciar un paquete mutable

### Entre sticker y guia

- el `sticker` debe mostrar la misma referencia principal del paquete
- si existe guia emitida, debe mostrar `serie-numero` o referencia verificable
- no puede imprimirse un sticker final de salida apuntando a otra guia

## Estados minimos sugeridos

### `warehouse_transfer`

- `draft`
- `approved`
- `picking`
- `packed`
- `guide_pending`
- `guide_ready`
- `dispatched`
- `in_transit`
- `received`
- `incident`
- `cancelled`

### `dispatch_shipment`

- `pending_pack`
- `packed`
- `guide_pending`
- `guide_ready`
- `dispatched`
- `delivered`
- `incident`
- `void`

### `package`

- `draft`
- `sealed`
- `labelled`
- `dispatched`
- `received_or_delivered`
- `void`

## Casos borde relevantes

- pedido confirmado pero sin origen asignado
- pedido con origen asignado y luego reasignado antes de packing
- transferencia aprobada y luego cancelada antes de salida
- diferencia fisica entre picked y packed
- carrier tercero sin datos completos para la guia
- transbordo o cambio de vehiculo en ruta
- devolucion del paquete al origen
- perdida, dano o apertura de bulto
- intento de reimprimir sticker luego de reemitir una guia distinta

## Decision de UX/operacion para primera fase

Para reducir riesgo legal y operativo, el primer corte debe usar:

- `1 pedido = 1 paquete outbound`
- `1 transferencia = 1 embarque interno`
- `1 paquete = 1 sticker principal`

Eso evita abrir demasiado pronto:

- consolidacion de varios pedidos en una misma caja
- multipaquete por pedido
- manifiestos de carga internos complejos

## Criterios de aceptacion

- una transferencia entre almacenes no se resuelve como ajuste manual sin flujo
- ningun despacho outbound sale sin origen confirmado
- `guia` y `sticker` derivan del mismo `package snapshot`
- la operacion puede distinguir claramente `pedido`, `paquete`, `guia` y `transferencia`
- existe trazabilidad de incidentes y necesidad de `GRE por Eventos`
- el modulo de etiquetas deja explicito que el sticker no reemplaza la guia

## Impacto documental inmediato

Este documento obliga a revisar y mantener alineados:

- [warehouse-fulfillment-triangulation.md](./warehouse-fulfillment-triangulation.md)
- [order-dispatch-labels.md](./order-dispatch-labels.md)
- [reportes-pagos-ubigeo-multi-almacen.md](../architecture/reportes-pagos-ubigeo-multi-almacen.md)

