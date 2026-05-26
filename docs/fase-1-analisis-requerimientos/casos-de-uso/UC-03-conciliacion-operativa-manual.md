# UC-03 - Conciliacion Operativa Manual

## Objetivo

Permitir que `operador_pagos` o `admin` revise un caso pendiente, tome una decision controlada y deje al pedido en un estado comercial consistente y auditable.

## Actores

- primario: `operador_pagos`
- secundarios: `admin`, API Huelegood, worker, notificaciones, `Pedidos > Operacion`

## Disparador

Existe un pedido con pago manual pendiente o bajo revision y una solicitud operativa asociada.

## Precondiciones

- el pedido existe y tiene trazabilidad suficiente
- hay al menos una evidencia o un contexto operativo que justifica la revision
- el actor posee permisos `payments.review` o equivalentes

## Postcondiciones

### Exito

- la decision queda registrada con actor, fecha, observacion y referencia
- el estado de `payment`, `manual_payment_request` y `order` queda sincronizado
- si corresponde, el pedido queda `confirmed` y elegible para flujo operativo posterior

### Falla

- no se duplica una decision ya aplicada
- el caso conserva historial claro para soporte o reversa controlada

## Flujo principal

1. `operador_pagos` entra a la bandeja `Pagos`.
2. El sistema muestra solicitudes con contexto minimo de pedido, monto, referencia y evidencia.
3. El operador abre el caso y revisa monto, referencia, evidencia e historial.
4. El operador determina si la solicitud es aprobable, observable o rechazable.
5. Si necesita mas contexto comercial, consulta `Pedidos > Operacion` sin perder la bandeja de `Pagos`.
6. El operador registra observacion, referencia validada y decision.
7. La plataforma encola la resolucion con un identificador estable para evitar doble procesamiento.
8. Si la decision es `aprobar`, el sistema marca el pago como `paid`.
9. El pedido transiciona a `confirmed`.
10. Se dispara trazabilidad operativa para despacho, auditoria, comisiones y notificaciones.

## Flujos alternos

### A1. Observacion con reenvio permitido

En el paso 6, el operador observa la evidencia pero mantiene vigente el pedido; la solicitud vuelve a un estado que permite reenvio segun politica vigente.

### A2. Escalamiento a admin

En el paso 4 o 6, el operador detecta anomalia de referencia, monto o fraude potencial y eleva el caso a `admin`.

### A3. Consulta del detalle operativo

En el paso 5, `Pedidos > Operacion` funciona como fuente canonica de trazabilidad del pedido; `Pagos` sigue siendo solo la bandeja de comprobantes.

## Excepciones

### E1. Solicitud ya resuelta

La plataforma impide reprocesar un caso aprobado o rechazado.

### E2. Evidencia insuficiente

La solicitud no puede aprobarse y queda observada o rechazada con motivo explicito.

### E3. Error de job o sincronizacion

El job queda reintentable sin perder auditoria y sin duplicar la decision del operador.

### E4. Pedido expirado o cancelado

La solicitud no puede aprobarse; la decision debe respetar el estado comercial del pedido.

## Reglas de negocio

- `Pagos` resuelve comprobantes manuales; no sustituye el detalle canonico del pedido
- `Pedidos > Operacion` concentra trazabilidad comercial, notas, referencia y ruta operativa activa
- la resolucion operativa debe ser idempotente
- toda aprobacion deja actor, fecha, referencia y observacion
- toda denegacion deja motivo y politica aplicada sobre reenvio, expiracion o cancelacion
- el flujo futuro de pasarela online no cambia esta responsabilidad mientras siga sin confirmacion automatica estable

## Criterios de aceptacion

- un `operador_pagos` puede revisar y resolver solicitudes sin tocar catalogo ni permisos
- la plataforma impide dobles aprobaciones o dobles rechazos
- al aprobar, el pedido queda consistente para el flujo posterior
- al rechazar u observar, el historial explica claramente que ocurrio y quien lo resolvio
