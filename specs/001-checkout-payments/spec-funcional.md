# Spec Funcional - Checkout Payments

Fecha: 2026-05-26.

## Objetivo

Definir la primera feature SDD del slice `checkout publico + pago manual + frontera canonica de payment gateway idempotente`, preservando el comportamiento brownfield vigente y cerrando ownership operativo.

## Alcance

Incluye:

- checkout publico en `/checkout`;
- pago manual con evidencia;
- una sola ruta online activa como maximo;
- conciliacion operativa online desde `Pedidos > Operacion`;
- frontera tecnica para webhook/idempotencia del provider online.

No incluye:

- multi-provider simultaneo;
- pagos parciales;
- split de pagos;
- suscripciones;
- refund automatizado;
- reactivacion de cupones o vendor codes en UI publica;
- mover conciliacion online a `Pagos`.

## Actores

- cliente final
- storefront web
- operador de pagos
- operador de pedidos / operacion
- API Huelegood
- worker BullMQ
- provider online activo

## Reglas Funcionales Canonicas

### RF-01. Manual visible hoy

El checkout publico debe mostrar `manual payment` como ruta disponible en el corte actual, aun si existe un provider online activo.

### RF-02. Un solo provider online activo

El sistema puede tener como maximo un provider online activo al mismo tiempo. Si no hay provider online habilitado, el checkout opera solo con `manual`.

### RF-03. Public checkout sin coupling al proveedor

La experiencia publica no debe depender del nombre del proveedor para definir la logica de negocio. La decision del provider activo pertenece al backend.

### RF-04. Ownership manual en `Pagos`

Toda solicitud manual con comprobante debe entrar a la bandeja `Pagos`, con actor, evidencia, referencia, observacion y estado trazables.

### RF-05. Ownership online en `Pedidos > Operacion`

Los pedidos online pendientes deben resolverse operacionalmente desde `Pedidos > Operacion`. `Pagos` no debe ser la superficie de confirmacion online.

### RF-06. Auto confirm futura solo en `captured/paid`

Cuando exista webhook productivo, la confirmacion automatica online solo puede dispararse para eventos normalizados a `captured` o `paid`.

### RF-07. `authorized` no confirma venta

Estados intermedios del proveedor como `authorized`, `pending` o equivalentes no deben confirmar pedido, inventario ni reportabilidad comercial.

### RF-08. Idempotencia obligatoria de checkout

Todo intento de checkout debe llevar `clientRequestId`. Un reintento con el mismo contenido devuelve el mismo pedido. Un reintento con contenido distinto debe fallar.

### RF-09. Evidencia manual no publica

Los comprobantes manuales deben almacenarse con acceso controlado y retencion operativa trazable.

### RF-10. Pago completo solamente

En este slice solo se soporta pago completo del pedido, tanto para registro manual directo como para aprobacion de comprobante manual.

### RF-11. Reglas de envio existentes se conservan

Se mantienen las reglas ya vigentes:

- `delivery` solo Lima provincia y Callao;
- provincia solo por `Shalom`;
- envio a provincia se paga al recoger.

### RF-12. Auditoria y observabilidad obligatorias

Toda decision manual u online debe dejar auditoria, evento operativo y una ruta comercial visible en el pedido.

## Escenarios Principales

### Escenario A. Checkout manual con comprobante

1. el cliente completa el wizard y elige `manual`;
2. el sistema crea pedido y solicitud manual;
3. el cliente sube evidencia;
4. `Pagos` revisa y aprueba o rechaza;
5. si aprueba, el pedido queda confirmado y listo para operacion;
6. si rechaza, el pedido queda cancelado o fuera de flujo segun politica vigente.

### Escenario B. Checkout online con provider activo

1. el cliente completa el wizard y elige la opcion online;
2. el backend resuelve el provider online activo;
3. el sistema crea pedido `pending_payment` y devuelve `checkoutUrl`;
4. operacion valida el cobro y confirma desde `Pedidos > Operacion`;
5. la trazabilidad del pedido conserva la ruta online.

### Escenario C. Webhook futuro

1. el provider emite un evento firmado;
2. el gateway lo valida y deduplica;
3. si el estado normalizado es `captured/paid`, puede confirmar automaticamente;
4. cualquier otro estado solo se persiste para trazabilidad.

## Criterios De Aceptacion

| ID | Criterio |
| --- | --- |
| CA-01 | el checkout siempre ofrece `manual` |
| CA-02 | nunca hay dos providers online visibles a la vez |
| CA-03 | `Pagos` lista comprobantes manuales y deja claro que no confirma online |
| CA-04 | `Pedidos > Operacion` expone la ruta activa del pedido y permite conciliacion online controlada |
| CA-05 | un webhook `authorized` no confirma el pedido |
| CA-06 | un webhook `captured` o `paid` puede confirmar el pedido cuando la automatizacion este habilitada |
| CA-07 | repetir el mismo checkout con igual `clientRequestId` no duplica pedido ni reserva stock |
| CA-08 | repetir el mismo `providerEventId` no duplica confirmacion |
| CA-09 | la evidencia manual queda trazable sin URL publica abierta |
| CA-10 | toda confirmacion o rechazo deja auditoria y evento operativo |

## Casos Negativos Relevantes

- provider online deshabilitado: el checkout sigue operando por manual.
- provider responde error o timeout: el pedido queda pendiente o falla sin romper la opcion manual.
- webhook duplicado: no duplica confirmacion.
- operacion intenta registrar pago manual sobre pedido online: se bloquea.
- operacion intenta confirmar online desde `Pagos`: la UI y API deben impedirlo.

## Dependencias De Negocio

- operacion acepta seguir conciliando online desde `Pedidos > Operacion` en el corte actual;
- pagos acepta conservar ownership exclusivo de comprobantes manuales;
- el negocio no exige multi-provider simultaneo en esta fase.
