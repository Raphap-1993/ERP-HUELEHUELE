# Flujo: Pago Manual con Comprobante

## Objetivo

Permitir compras mediante pago manual, con carga de comprobante y revisión operativa antes de confirmar el pedido.

Nota operativa vigente:

- la UI pública actual de `/checkout` no expone cupones, códigos de vendedor ni mensajes de descuento
- la API conserva soporte técnico para esos campos si se reactiva la experiencia promocional más adelante
- para este corte ERP, la confirmación comercial oficial de pagos no automatizados o pagos online pendientes de conciliación se resuelve desde backoffice mediante revisión y confirmación manual controlada

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
7. La API registra una alerta interna para `operador_pagos`.
8. Un operador revisa monto, referencia, evidencia y coherencia del pedido.
9. El operador aprueba o rechaza la solicitud.
10. La decisión se encola en BullMQ para dejar trazabilidad y ejecución idempotente.
11. Si aprueba, el worker aplica la conciliación, marca `payment` como `paid` y deja el pedido en `confirmed`, listo para despacho operativo.
12. La API registra una alerta interna `order.dispatch.ready` para gestión de envío.
13. Si rechaza, el worker deja registro del motivo y el pedido pasa a `cancelled` según la política vigente.
14. Se notifica al cliente el resultado.

## Subflujo: registro manual directo desde admin

Además del circuito con comprobante, el admin dispone de un registro manual directo sobre un pedido ya existente.

Pasos:

1. operación abre el detalle del pedido en backoffice.
2. si el pedido sigue impago, usa primero la lectura de `ruta de conciliación activa` para distinguir si debe revisar comprobante o registrar un cobro directo.
3. si el pedido usa `paymentMethod=manual` y no tiene `manual_request`, registra monto completo, referencia y nota desde `Pedidos > Operación`.
4. si el pedido usa `paymentMethod=openpay`, no usa este subflujo; debe pasar por la conciliación online controlada del flujo web.
5. la API marca `payment_status=paid`, actualiza `order_status=confirmed`, sincroniza inventario y liquida el frente de comisiones.
6. el pedido vuelve a su state machine normal y puede pasar a `preparing`, `shipped`, `delivered` o `completed`.

Reglas:

- no reemplaza la revisión con comprobante; es un segundo camino operacional.
- no aplica a pedidos `openpay`; esa ruta se confirma por conciliación online desde backoffice.
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
- `order.dispatch.ready`

## Procesos asíncronos involucrados

- notificación al operador sobre nuevo comprobante
- alerta interna al equipo de pagos cuando el pedido entra en revisión manual
- conciliación asíncrona de aprobación o rechazo vía worker
- recordatorios al cliente si falta resolución o evidencia
- expiración automática de pedidos pendientes
- notificación de aprobación o rechazo
- alerta interna al equipo de despachos cuando el pedido queda confirmado

## Observaciones de implementación

- La UI de revisión debe exponer contexto del pedido, historial y evidencias en una sola vista.
- `Pagos` resuelve la bandeja de comprobantes y deja explícito que los `openpay` pendientes se resuelven desde `Pedidos > Operación`.
- `Pedidos > Operación` debe mostrar una guía de ruta activa para que operación no mezcle `comprobante manual`, `registro manual directo` y `conciliación Openpay`.
- `Pedidos > Operación` es la vista canonica de trazabilidad comercial del pedido; `Pagos` no reemplaza ese detalle operativo.
- El checkout público actual se presenta sin superficie promocional; cualquier reactivación de cupones o código de vendedor debe volver a documentarse.
- La API debe separar claramente el concepto de solicitud manual de la transacción de pago.
- La resolución operativa debe encolar un job con `jobId` estable para evitar doble conciliación.
- La decisión del operador debe ser idempotente: una solicitud ya aprobada o rechazada no se procesa dos veces.
- Debe existir política de retención de evidencias por razones operativas y de auditoría.
- El runtime actual ya registra alertas internas básicas para `operador_pagos` y `operador_despachos`, pero todavía no existe un outbox canónico ni una bandeja operativa persistente por evento.
- La georreferenciación de almacenes no bloquea este flujo; si faltan coordenadas, el pedido igual puede revisarse, aprobarse y pasar a despacho.
