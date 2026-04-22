# Flujo: Checkout con Openpay

## Objetivo

Permitir que un cliente complete una compra online usando Openpay, preservando trazabilidad del pedido, descuentos, código de vendedor y transacciones de pago.

Nota operativa vigente:

- la UI pública actual de `/checkout` no expone cupones, códigos de vendedor ni mensajes de descuento
- la API mantiene soporte técnico para `couponCode` y `vendorCode` para una reactivación futura controlada
- para este corte, la confirmación final del pago online se resuelve por conciliación manual controlada desde backoffice, no por webhook productivo
- esa conciliación se ejecuta desde `Pedidos > Operación`, no desde la bandeja de `Pagos`

## Actores

- cliente
- storefront web
- API Huelegood
- Openpay
- worker
- notificaciones

## Precondiciones

- existe al menos un producto publicable y disponible
- el carrito contiene items válidos
- si existe una atribución comercial o beneficio promocional por otro canal, ya fue validado por la API antes de crear el pedido
- Openpay está configurado con credenciales válidas

## Pasos

1. El cliente navega catálogo y agrega productos al carrito.
2. El sistema cotiza subtotal, shipping si aplica y total con las reglas comerciales vigentes.
3. El cliente completa primero tipo y número de documento, luego contacto y dirección.
4. La web consulta primero a la API de Huelegood para recuperar un cliente previo por `documentType + documentNumber` y evitar duplicidad cuando ya existe coincidencia canónica.
5. Si no existe coincidencia local y el documento es `DNI`, la API consulta `ApiPeru` para validar el número y autocompletar el nombre.
6. La dirección se captura con ubigeo normalizado de Perú: departamento, provincia y distrito.
7. Si el cliente elige `delivery` estándar, el checkout solo permite ubigeo de la provincia de Lima y Callao.
8. Si el cliente marca envío a provincia, el checkout fuerza carrier `Shalom`, solicita la sucursal más cercana y deja el flete como pago contra recojo.
9. La web solicita a la API la creación del pedido desde el carrito.
10. La API crea `order`, `order_items`, `order_addresses` y snapshot comercial.
11. La API crea un registro `payment` en estado inicial y genera el intento con Openpay.
12. La web redirige o embebe el flujo de Openpay según la modalidad elegida.
13. Openpay responde resultado inmediato o diferido.
14. La API registra `payment_transactions`.
15. Operación abre el pedido en `Pedidos > Operación`, registra referencia y nota del cobro validado y ejecuta la confirmación controlada desde backoffice.
16. La API actualiza `payments` y transiciona `orders` a `confirmed`, dejándolo elegible para el flujo operativo y de despacho.
17. Se disparan procesos asíncronos post-pago: notificación, atribución de comisión, evaluación de puntos y auditoría.

## Estados involucrados

### Pedido

- `draft`
- `pending_payment`
- `paid`
- `confirmed`
- `cancelled`
- `expired`

### Pago

- `initiated`
- `pending`
- `authorized` o `paid`
- `failed`
- `expired`

Nota:

Si Openpay utiliza un estado intermedio distinto al modelo local, se persiste en `payment_transactions`, pero el agregado `payments` se traduce a un estado interno estable.

## Reglas de negocio

- Un pedido solo puede tener una atribución activa de vendedor.
- Un pedido conserva snapshot de precios y descuentos aunque luego cambie el catálogo.
- La comisión no se paga en este flujo; solo se deja lista la atribución.
- La asignación de puntos no debe quedar disponible hasta que el pedido alcance estado elegible definido por el dominio.
- Todo checkout web exige tipo y número de documento válidos del cliente.
- El checkout intenta recuperar clientes previos por documento antes de depender de `ApiPeru`.
- Si el documento es `DNI` y no existe coincidencia local, el checkout valida contra `ApiPeru` y autocompleta el nombre desde la API backend de Huelegood.
- La dirección pública del checkout se guarda con departamento, provincia y distrito normalizados para Perú.
- Si el cliente elige `delivery` estándar, el checkout solo permite ubigeo de la provincia de Lima y Callao.
- Si el cliente elige envío a provincia, el checkout solo permite `Shalom`.
- El envío a provincia requiere además el nombre de sucursal de recojo.
- El costo del envío a provincia no se cobra en el checkout; se paga al momento de recoger en agencia.

## Errores posibles

| Error | Resultado esperado |
| --- | --- |
| carrito vacío o inconsistente | no se crea pedido |
| cupón inválido o vencido | se rechaza validación antes de crear pedido |
| código de vendedor inválido o inactivo | se ignora o rechaza según política comercial |
| error de comunicación con Openpay | `payment` queda `pending` o `failed` según contexto; se informa al cliente |
| webhook o callback no disponible en este corte | la orden permanece pendiente hasta conciliación manual operativa |
| total alterado entre carrito y pedido | la API recalcula y responde error de consistencia |
| timeout de proveedor | pedido queda `pending_payment` hasta reconciliación o expiración |

## Eventos disparados

- `cart.checked_out`
- `order.created`
- `payment.created`
- `payment.openpay.initiated`
- `payment.openpay.authorized`
- `payment.openpay.failed`
- `order.paid`
- `order.confirmed`

## Procesos asíncronos involucrados

- conciliación manual controlada del pago online
- notificación de confirmación de pedido
- creación o actualización de atribución de comisión
- evaluación de asignación de puntos
- registro de auditoría ampliado

## Observaciones de implementación

- El endpoint de creación de pedido usa una clave de idempotencia para devolver el mismo pedido ante reintentos del frontend.
- La conciliación online vigente se hace desde backoffice y debe dejar actor, referencia y `confirmedAt`.
- La UI admin debe impedir que un pedido `openpay` se confirme por la ruta de `registro manual directo`.
- La vista canonica para seguir la trazabilidad comercial del pedido es `Pedidos > Operación`; `Pagos` solo resuelve comprobantes manuales.
- Si el pago no se confirma dentro de la ventana operativa, el pedido debe transicionar a `expired`.
