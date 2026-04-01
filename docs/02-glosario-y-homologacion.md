# Glosario y Homologacion

## Objetivo

Eliminar ambigüedades funcionales y tecnicas entre analisis, arquitectura, UI y desarrollo.

## Terminos homologados

### Usuario

Identidad autenticable del sistema. Puede ser cliente, admin o vendedor.

### Vendedor

Actor comercial del canal seller-first. Promueve ventas y comisiones. No controla catalogo, precio base ni inventario.

### Cliente

Persona que compra o intenta comprar productos de Huele Huele.

### Pedido

Agregado transaccional central del sistema. Contiene snapshot comercial, cliente, direccion, items, montos, canal, atribucion de vendedor y estado.

### Venta

Lectura funcional de un `pedido` que ya alcanzo un estado comercial valido para considerarse confirmado.

Regla homologada:

- en este proyecto no se crea una entidad separada llamada `venta` para el runtime actual;
- la venta se deriva del `pedido` confirmado.

### Orden web

Pedido creado desde `web` por el checkout publico.

### Pedido manual

Pedido o venta creada desde `admin`.

### Venta manual

Pedido manual que ya nacio confirmado o fue confirmado despues mediante registro o aprobacion de pago.

### Compra proveedor

Ingreso o abastecimiento de stock desde un proveedor. No equivale a venta ni a pedido del cliente.

Estado actual:

- fuera del alcance de este corte.

### Detalle de venta

Conjunto de lineas vendidas del documento comercial.

Regla homologada:

- en codigo actual el equivalente es `order_items` o `items` del pedido.

### Movimiento de inventario

Registro de una variacion o evento operativo de stock con referencia al documento origen.

### Stock base

Stock fisico inicial o base cargado para una variante.

### Stock reservado

Stock comprometido temporalmente por pedidos pendientes de pago o en revision.

### Stock confirmado

Stock ya consumido por una venta confirmada.

### Stock disponible

Stock vendible restante despues de descontar reservas y consumos confirmados segun la politica homologada.

### Confirmacion de venta

Momento en que el pedido alcanza un estado comercial valido para considerarse venta confirmada.

Regla homologada:

- el evento principal es la confirmacion de pago o el estado operativo equivalente definido por el modulo `orders`.

### Cancelacion

Cambio de estado que invalida la venta y obliga a liberar o revertir stock si ya habia sido reservado o confirmado.

### Canal de venta

Origen operacional del pedido o venta.

Valores homologados para este corte:

- `web`
- `manual`

## Ambiguedades detectadas y correccion propuesta

### Ambiguedad 1: venta vs pedido

Problema:

- en documentos y UI se usa `venta` para hablar de pedidos confirmados, pero el runtime opera con `orders`.

Homologacion:

- el agregado tecnico sigue siendo `order`;
- la palabra `venta` se usa para reportes y analisis solo cuando el pedido ya es comercialmente valido.

### Ambiguedad 2: stock vs stock disponible

Problema:

- `stockOnHand` aparece como si fuera el stock final disponible, pero el runtime descuenta tambien reservas y confirmaciones en otro lugar.

Homologacion:

- `stock base` = stock inicial o cargado
- `stock reservado` = pedidos pendientes
- `stock confirmado` = ventas confirmadas
- `stock disponible` = stock base menos compromisos vigentes segun politica central

### Ambiguedad 3: vendedor vs codigo de vendedor

Problema:

- el pedido guarda hoy `vendorCode`, pero eso no siempre equivale a una relacion fuerte con `vendor`.

Homologacion:

- `vendorCode` es el mecanismo de atribucion
- `vendorId` es la referencia de dominio
- los reportes deben preferir `vendorId` y mostrar `vendorCode` y `vendorName`

### Ambiguedad 4: fecha de venta

Problema:

- `createdAt` del pedido no siempre equivale a la fecha real de venta confirmada.

Homologacion:

- `fecha de creacion` = cuando nace el pedido
- `fecha de confirmacion comercial` = cuando el pedido pasa a estado valido de venta
- para reportes de ventas debe usarse la fecha de confirmacion comercial

## Lenguaje obligatorio en documentacion y desarrollo

- usar `pedido` para el agregado central
- usar `venta` solo como vista funcional derivada de un pedido confirmado
- usar `compra proveedor` solo para abastecimiento de stock
- usar `stock disponible` cuando la cifra ya incorpora reservas y confirmaciones
- usar `vendedor` para el actor comercial y `codigo de vendedor` para el identificador de atribucion
