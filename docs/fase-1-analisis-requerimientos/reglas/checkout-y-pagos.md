# Reglas Canonicas - Checkout y Pagos

## Objetivo

Concentrar las reglas transversales que gobiernan el slice inicial de checkout y pagos sin mezclar comportamiento vigente con capacidades futuras.

## 1. Visibilidad de canales de cobro

- la UI publica actual expone solo pago manual visible
- la existencia tecnica de `Openpay` o de otro provider no obliga a mostrarlo en el checkout
- si en el futuro se reactiva un canal online visible, debe existir un solo provider activo a la vez

## 2. Identidad del cliente

- todo checkout requiere tipo y numero de documento
- `documentType + documentNumber` es la senial primaria de cliente canonico
- si el documento es `DNI` y no existe coincidencia local, el backend consulta `ApiPeru`
- nombre y direccion no fuerzan fusion automatica de clientes

## 3. Entrega y ubigeo

- `delivery` estandar solo permite provincia de Lima y Callao
- envio a provincia solo permite `Shalom`
- envio a provincia exige sucursal de recojo
- el flete de provincia se paga contra recojo, no dentro del checkout
- la direccion debe persistirse con departamento, provincia y distrito normalizados

## 4. Estados de pedido y pago

- `draft` representa pedido aun no presentado como pendiente de cobro
- `pending_payment` representa pedido esperando pago o confirmacion inicial
- `payment_under_review` representa pago manual en revision operativa
- `paid` representa pago validado
- `confirmed` representa pedido listo para flujo operativo posterior
- `expired` y `cancelled` son estados terminales del slice activo

## 5. Evidencias y privacidad

- la evidencia del pago manual es privada
- no puede exponerse por URL abierta ni versionarse en Git
- una solicitud manual puede tener una o multiples evidencias
- una evidencia invalida, ilegible o sospechosa no confirma un pedido

## 6. Responsabilidades de backoffice

### `Pagos`

- bandeja de comprobantes manuales
- revision de monto, referencia y evidencia
- resolucion de solicitudes manuales

### `Pedidos > Operacion`

- vista canonica de trazabilidad comercial del pedido
- lectura de ruta operativa activa
- notas, referencia validada, actor y fechas del cierre comercial
- punto futuro para conciliacion controlada de pagos online mientras no exista webhook confiable

## 7. Idempotencia y control operativo

- la creacion del pedido desde checkout debe aceptar una clave de idempotencia
- la resolucion manual debe ejecutarse con `jobId` estable o equivalente
- una solicitud ya resuelta no puede procesarse dos veces
- una doble confirmacion sobre el mismo pedido debe bloquearse y auditarse

## 8. Regla de convergencia del agregado `order`

- todo camino de cobro converge en el mismo agregado `order`
- el snapshot historico de pedido, precios y direccion no se reconstruye desde el cliente vivo
- puntos, comisiones y despacho dependen del estado comercial del pedido, no solo del upload de evidencia

## 9. Mensajeria y experiencia del cliente

- el cliente no debe ver estados tecnicos internos de pagos o inventario
- los errores deben ser entendibles y accionables
- el paso 3 del wizard debe comunicar una tarea comercial clara, no instrucciones operativas internas

## 10. Frontera futura de payment gateway

- el gateway online se documenta como capacidad futura, no como comportamiento activo
- su interfaz debera ser idempotente y permitir adapters intercambiables
- la confirmacion automatica futura solo sera valida cuando el provider confirme un estado equivalente a `captured` o `paid`
- mientras esa garantia no exista, la confirmacion comercial sigue siendo manual y controlada por backoffice

## 11. Guardrails de alcance

- no reactivar cupones, codigos de vendedor o mensajes promocionales en este slice
- no mover la logica de pagos al frontend
- no redefinir la maquina de estados solo por la documentacion homologada
- no usar esta fase para prometer una automatizacion online que todavia no esta operativa
