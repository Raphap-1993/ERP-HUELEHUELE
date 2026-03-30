# Flujo: Pago Manual con Comprobante

## Objetivo

Permitir compras mediante pago manual, con carga de comprobante y revisión operativa antes de confirmar el pedido.

## Actores

- cliente
- storefront web
- API Huelegood
- operador_pagos o admin
- worker
- notificaciones

## Precondiciones

- el pedido fue creado correctamente
- el método de pago manual está habilitado
- existe instrucción visible para que el cliente sepa cómo pagar
- la plataforma acepta carga de evidencia en formatos válidos

## Pasos

1. El cliente arma su carrito y elige `manual_payment`.
2. La API crea el pedido y un `payment` asociado en estado `pending`.
3. El cliente recibe instrucciones de pago manual.
4. El cliente sube uno o más comprobantes.
5. La API crea `manual_payment_request` y `payment_evidences`.
6. El pedido transiciona a `payment_under_review`.
7. Un operador revisa monto, referencia, evidencia y coherencia del pedido.
8. El operador aprueba o rechaza la solicitud.
9. La decisión se encola en BullMQ para dejar trazabilidad y ejecución idempotente.
10. Si aprueba, el worker aplica la conciliación, marca `payment` como `paid` y el pedido sigue su flujo post-pago.
11. Si rechaza, el worker deja registro del motivo y el pedido pasa a `cancelled` según la política vigente.
12. Se notifica al cliente el resultado.

## Subflujo: registro manual directo desde admin

Además del circuito con comprobante, el admin dispone de un registro manual directo sobre un pedido ya existente.

Pasos:

1. operación abre el detalle del pedido en backoffice.
2. si el pedido sigue impago y no tiene `manual_request`, registra monto completo, referencia y nota.
3. la API marca `payment_status=paid`, actualiza `order_status=paid`, sincroniza inventario y liquida el frente de comisiones.
4. el pedido vuelve a su state machine normal y puede pasar a `confirmed`, `preparing`, `shipped`, `delivered` o `completed`.

Reglas:

- no reemplaza la revisión con comprobante; es un segundo camino operacional.
- sólo acepta pago completo.
- deja auditoría y actor explícitos.

## Estados involucrados

### Pedido

- `pending_payment`
- `payment_under_review`
- `paid`
- `confirmed`
- `expired`
- `cancelled`

### Solicitud de pago manual

- `submitted`
- `under_review`
- `approved`
- `rejected`
- `expired`

### Evidencia

- `uploaded`
- `validated`
- `flagged`

## Reglas de negocio

- No se confirma un pedido manual sin revisión humana en MVP.
- Toda aprobación debe registrar usuario revisor, fecha y observación.
- La evidencia no debe quedar pública ni accesible por URL abierta.
- El rechazo puede permitir reenvío de evidencia solo si el pedido sigue vigente.

## Errores posibles

| Error | Resultado esperado |
| --- | --- |
| archivo inválido | rechazo inmediato de upload |
| evidencia ilegible o incompleta | solicitud queda o vuelve a revisión con observación |
| monto no coincide | rechazo o escalamiento operativo |
| referencia duplicada sospechosa | solicitud marcada para revisión manual profunda |
| pedido expirado | no se acepta nueva evidencia |
| operador aprueba por error | auditoría y reversa controlada por admin |

## Eventos disparados

- `payment.manual.requested`
- `payment.evidence.uploaded`
- `payment.manual.sent_to_review`
- `payment.manual.approved`
- `payment.manual.rejected`
- `order.payment_under_review`
- `order.paid`

## Procesos asíncronos involucrados

- notificación al operador sobre nuevo comprobante
- conciliación asíncrona de aprobación o rechazo vía worker
- recordatorios al cliente si falta resolución o evidencia
- expiración automática de pedidos pendientes
- notificación de aprobación o rechazo

## Observaciones de implementación

- La UI de revisión debe exponer contexto del pedido, historial y evidencias en una sola vista.
- La API debe separar claramente el concepto de solicitud manual de la transacción de pago.
- La resolución operativa debe encolar un job con `jobId` estable para evitar doble conciliación.
- La decisión del operador debe ser idempotente: una solicitud ya aprobada o rechazada no se procesa dos veces.
- Debe existir política de retención de evidencias por razones operativas y de auditoría.
