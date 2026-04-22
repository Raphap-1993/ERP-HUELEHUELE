# Casos de Uso

## CU-01 Registrar vendedor

### Actores

- postulante
- seller_manager
- admin

### Flujo principal

1. El actor inicia el alta por web o admin.
2. El sistema valida datos obligatorios.
3. El sistema detecta duplicados por email o identidad comercial basica.
4. El sistema registra la postulacion o el alta manual.
5. Si la postulacion se aprueba, se crea el vendedor y al menos un codigo activo.
6. El vendedor queda disponible para atribucion y reportes.

### Reglas

- no debe existir un vendedor activo duplicado por email
- la aprobacion debe dejar codigo de vendedor utilizable
- el estado inicial permitido es `active` o equivalente operacional definido

## CU-02 Crear venta manual

### Actores

- admin
- ventas

### Flujo principal

1. Operacion crea un pedido manual desde backoffice.
2. Selecciona cliente, items, vendedor opcional y estado inicial.
3. El sistema registra canal `manual`.
4. Si nace como pendiente, reserva stock.
5. Si nace confirmada o pagada, confirma stock.
6. El pedido queda visible en reportes cuando alcance estado comercial valido.

## CU-03 Registrar pedido manual

### Actores

- admin
- operador_pagos

### Flujo principal

1. Operacion crea pedido manual pendiente.
2. El sistema reserva stock.
3. Si existe comprobante, operacion revisa la solicitud en `Pagos`.
4. Si no existe solicitud manual y el metodo es `manual`, operacion registra el pago directo desde `Pedidos > Operacion`.
5. El sistema confirma stock, fecha de venta y trazabilidad comercial en el detalle operativo del pedido.

## CU-04 Recibir pedido web

### Actores

- cliente
- web
- API

### Flujo principal

1. Cliente cotiza carrito y completa checkout.
2. El sistema crea el pedido con canal `web`.
3. El sistema registra `vendorCode` y resuelve `vendorId` cuando corresponda.
4. El sistema reserva stock al crear el pedido pendiente de pago.
5. El pedido espera confirmacion del pago online o manual.

## CU-05 Confirmar venta

### Actores

- API
- operador_pagos
- admin
- integracion de pago

### Flujo principal

1. El sistema recibe confirmacion valida de pago o decision operativa equivalente.
2. Si la orden es `openpay` y sigue pendiente, la conciliacion manual se ejecuta desde `Pedidos > Operacion`.
3. Si existe `manual_request`, la decision se toma desde `Pagos` o desde el detalle operativo del pedido con el mismo contexto.
4. El pedido pasa al primer estado comercial valido.
5. El sistema registra fecha de confirmacion comercial.
6. El sistema confirma stock.
7. El sistema actualiza reportes y trazabilidad.

### Regla homologada

- el evento canonico es la confirmacion de pago o venta, no el despacho
- el detalle de `Pedidos > Operacion` es la vista canonica para seguir la trazabilidad comercial del pedido; `Pagos` solo resuelve la bandeja de comprobantes

## CU-06 Descontar stock

### Actores

- API
- inventory service

### Flujo principal

1. El pedido cambia a un estado que requiere reserva o confirmacion.
2. `InventoryService` evalua el estado.
3. Si es pendiente, reserva stock.
4. Si es venta confirmada, consolida stock.
5. Si es cancelacion o expiracion, libera o revierte.

## CU-07 Cancelar venta o revertir stock

### Actores

- admin
- operador_pagos
- API

### Flujo principal

1. Operacion cancela, expira o reembolsa un pedido.
2. El sistema identifica si el stock estaba reservado o confirmado.
3. El sistema libera o revierte segun corresponda.
4. El sistema deja auditoria y actualiza reportes.

## CU-08 Consultar ventas por vendedor

### Actores

- admin
- ventas
- seller_manager

### Flujo principal

1. El actor abre reportes.
2. Define rango de fechas y filtros.
3. El sistema devuelve ventas validas agrupadas por vendedor.
4. El actor puede revisar detalle de pedidos y fechas.

## CU-09 Consultar ventas por producto

### Actores

- admin
- ventas

### Flujo principal

1. El actor abre reportes.
2. Define rango de fechas y filtros.
3. El sistema devuelve unidades e ingresos por producto.
4. El actor puede ver detalle de fechas de venta por item.

## CU-10 Consultar ventas por rango de fechas

### Actores

- admin
- ventas

### Flujo principal

1. El actor define `from` y `to`.
2. El sistema toma solo ventas con fecha de confirmacion comercial dentro del rango.
3. El sistema permite filtrar por canal, vendedor y producto.
