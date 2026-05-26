# UC-02 - Pago Manual con Comprobante

## Objetivo

Permitir que un cliente pague fuera de la plataforma por billetera virtual y remita un comprobante que deje el pedido listo para revision humana.

## Actores

- primario: `cliente`
- secundarios: storefront web, API Huelegood, storage privado de evidencias, notificaciones

## Disparador

El cliente llega al paso `pago y confirmacion` del checkout publico.

## Precondiciones

- el cliente ya valido identidad, entrega y contacto
- la billetera virtual vigente y sus instrucciones estan configuradas
- la plataforma acepta carga de evidencia en formatos permitidos

## Postcondiciones

### Exito

- existe un `payment` en estado pendiente o equivalente del flujo manual
- existe una `manual_payment_request`
- existe al menos una `payment_evidence`
- el caso entra a revision operativa

### Falla

- la evidencia invalida no se persiste
- no se confirma un pago por upload fallido o incompleto

## Flujo principal

1. El cliente revisa el resumen final del pedido.
2. La UI muestra el numero y titular de la billetera virtual.
3. El cliente ejecuta el pago fuera de la plataforma.
4. El cliente pulsa `Pagar ahora` y abre el modal de comprobante.
5. El cliente adjunta uno o mas archivos validos segun la politica vigente.
6. El cliente confirma el envio.
7. La web envia el request del checkout manual.
8. La API recalcula quote y valida consistencia minima.
9. La API crea el pedido y el `payment` asociado segun el comportamiento actual del runtime.
10. La API crea la `manual_payment_request`.
11. La API persiste la evidencia privada vinculada a la solicitud.
12. El pedido pasa a una ruta de revision operativa manual.
13. La plataforma deja alerta interna para el equipo de pagos y notifica el resultado de recepcion al cliente si corresponde.

## Flujos alternos

### A1. Multiples evidencias

En el paso 5, el cliente adjunta mas de un archivo; todos quedan ligados a la misma solicitud operativa.

### A2. Reenvio permitido

Si una solicitud fue observada pero el pedido sigue vigente, el cliente puede reenviar evidencia segun politica de operacion.

## Excepciones

### E1. Archivo invalido

El upload se rechaza de inmediato y el cliente debe adjuntar un formato permitido.

### E2. Evidencia ilegible o incompleta

La solicitud puede entrar o volver a revision con observacion explicita; no se confirma el pedido.

### E3. Pedido expirado

La API rechaza nueva evidencia y el cliente no puede continuar por este pedido.

### E4. Referencia sospechosa o monto inconsistente

La solicitud queda marcada para analisis humano y no avanza a confirmacion automatica.

## Reglas de negocio

- la evidencia no puede quedar publica por URL abierta
- la solicitud manual es una entidad operativa distinta de la transaccion de pago
- la aprobacion siempre depende de un revisor humano en MVP
- el flujo vigente no reintroduce pasarela online visible ni confirmacion automatica
- la decision operativa posterior debe ser idempotente

## Criterios de aceptacion

- el cliente puede cerrar el paso final solo cuando adjunta evidencia valida
- el sistema conserva actor, timestamp y archivos asociados a la solicitud
- la solicitud queda disponible para `operador_pagos`
- el pedido no se confirma por el solo hecho de subir un comprobante
