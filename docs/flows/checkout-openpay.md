# Flujo: Checkout con Openpay

## Objetivo

Permitir que un cliente complete una compra online usando Openpay, preservando trazabilidad del pedido, descuentos, código de vendedor y transacciones de pago.

Nota operativa vigente:

- la UI pública actual de `/checkout` no expone cupones, códigos de vendedor ni mensajes de descuento
- la API mantiene soporte técnico para `couponCode` y `vendorCode` para una reactivación futura controlada

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
3. El cliente completa datos de contacto y dirección.
4. Si el cliente marca envío a provincia, el checkout exige tipo y número de documento compatible con `SUNAT`, fuerza carrier `Shalom`, solicita la sucursal más cercana y deja el flete como pago contra recojo.
5. La web solicita a la API la creación del pedido desde el carrito.
6. La API crea `order`, `order_items`, `order_addresses` y snapshot comercial.
7. La API crea un registro `payment` en estado inicial y genera el intento con Openpay.
8. La web redirige o embebe el flujo de Openpay según la modalidad elegida.
9. Openpay responde resultado inmediato o diferido.
10. La API registra `payment_transactions`.
11. El webhook de Openpay confirma el resultado final.
12. La API actualiza `payments` y transiciona `orders` a estado elegible.
13. Se disparan procesos asíncronos post-pago: notificación, atribución de comisión, evaluación de puntos y auditoría.

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
- Si el cliente elige envío a provincia, el checkout solo permite `Shalom`.
- El envío a provincia requiere tipo y número de documento válido del cliente, además del nombre de sucursal de recojo.
- El costo del envío a provincia no se cobra en el checkout; se paga al momento de recoger en agencia.

## Errores posibles

| Error | Resultado esperado |
| --- | --- |
| carrito vacío o inconsistente | no se crea pedido |
| cupón inválido o vencido | se rechaza validación antes de crear pedido |
| código de vendedor inválido o inactivo | se ignora o rechaza según política comercial |
| error de comunicación con Openpay | `payment` queda `pending` o `failed` según contexto; se informa al cliente |
| webhook duplicado | se ignora por idempotencia |
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

- conciliación de webhook Openpay
- notificación de confirmación de pedido
- creación o actualización de atribución de comisión
- evaluación de asignación de puntos
- registro de auditoría ampliado

## Observaciones de implementación

- El endpoint de creación de pedido usa una clave de idempotencia para devolver el mismo pedido ante reintentos del frontend.
- El webhook debe validar firma y registrar payload bruto para trazabilidad.
- Si el pago no se confirma dentro de la ventana operativa, el pedido debe transicionar a `expired`.
