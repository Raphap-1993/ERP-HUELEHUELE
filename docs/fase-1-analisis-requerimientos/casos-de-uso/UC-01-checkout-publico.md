# UC-01 - Checkout Publico

## Objetivo

Permitir que un cliente complete el wizard publico de compra y deje un pedido listo para su cierre manual operativo, sin exponer una pasarela online activa en la UI actual.

## Actores

- primario: `cliente`
- secundarios: storefront web, API Huelegood, servicios de identidad, notificaciones

## Disparador

El cliente llega a `/checkout` con al menos un item valido para cotizar.

## Precondiciones

- existe al menos una referencia publicable y disponible para el storefront
- el carrito contiene items y cantidades validas
- el checkout publico esta habilitado
- el metodo de pago manual esta visible y operativo

## Postcondiciones

### Exito

- el cliente completa los tres pasos del wizard
- el sistema deja un pedido y un pago asociados al cierre manual vigente
- existe trazabilidad de identidad, direccion, contacto y evidencia

### Falla

- no se crea un pedido inconsistente
- el cliente recibe un mensaje entendible y permanece en una ruta recuperable

## Flujo principal

1. El cliente ingresa al checkout y revisa el resumen del pedido.
2. La web solicita la cotizacion vigente.
3. El cliente avanza por el wizard de tres pasos: `pedido`, `datos y envio`, `pago y confirmacion`.
4. En identidad, el cliente selecciona tipo de documento e ingresa numero.
5. La API intenta recuperar un cliente previo por documento.
6. Si no existe coincidencia local y el documento es `DNI`, la API consulta `ApiPeru` y autocompleta el nombre.
7. El cliente selecciona modalidad de entrega.
8. Si la modalidad es `delivery`, la direccion queda restringida a provincia de Lima y Callao.
9. Si la modalidad es `provincia`, el checkout fuerza carrier `Shalom`, habilita alcance nacional y exige sucursal de recojo.
10. El cliente completa direccion detallada, telefono y email.
11. El paso final muestra solo pago manual visible hoy.
12. El cliente visualiza numero y titular de la billetera virtual.
13. El cliente abre el modal de comprobante.
14. El cliente sube evidencia valida y confirma el envio del checkout.
15. La API recalcula la cotizacion, crea el pedido, el pago y la solicitud manual asociada segun el estado actual del runtime.
16. El sistema deja el caso listo para revision operativa manual.

## Flujos alternos

### A1. Cliente existente por documento

En el paso 5, la API encuentra coincidencia canonica y precarga datos de contacto y direccion compatibles con el flujo actual.

### A2. Documento distinto de DNI

En el paso 6, si el documento es `CE`, pasaporte u otro permitido, el nombre queda editable y no depende de autocompletado por `ApiPeru`.

### A3. Cambio de modalidad de entrega

En el paso 7, el cliente cambia entre `delivery` y `provincia`; la UI invalida campos no compatibles y rehace la validacion de ubigeo.

## Excepciones

### E1. Carrito vacio o inconsistente

La API rechaza la cotizacion o el envio del checkout y no crea pedido.

### E2. Documento invalido

La UI no deja avanzar de seccion y muestra un error entendible.

### E3. Falla de lookup o proveedor documental

El checkout conserva la captura manual compatible con el tipo de documento y no bloquea por una razon tecnica opaca al cliente.

### E4. Evidencia invalida

El upload se rechaza antes del cierre del request y el cliente debe reenviar un archivo valido.

### E5. Inconsistencia de disponibilidad o total

La API rechaza el request final y mantiene el pedido sin crear; el cliente recibe una salida recuperable.

## Reglas de negocio

- el wizard publico conserva tres pasos y una sola intencion principal por paso
- el checkout visible hoy no expone cupones, codigos de vendedor ni pasarela online activa
- el documento del cliente es obligatorio en todo checkout
- el backend es la autoridad final para identidad, quote y creacion del pedido
- la direccion publica se persiste con ubigeo normalizado de Peru
- el checkout actual no redisenia el orden real de reserva de stock; solo documenta su estado vigente

## Datos minimos capturados

- items del pedido y cantidades
- tipo y numero de documento
- nombre del comprador
- modo de entrega
- departamento, provincia y distrito
- direccion detallada
- sucursal `Shalom` si aplica
- telefono/WhatsApp
- email
- evidencia del pago manual

## Criterios de aceptacion

- el checkout puede completarse solo con el camino manual visible vigente
- la UI no permite cerrar el flujo sin documento, contacto, direccion y evidencia
- el sistema deja el pedido trazable para revision operativa
- el cliente no ve responsabilidades internas de backoffice ni estados tecnicos del dominio
