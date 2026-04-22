# Auditoria E2E del Checkout Publico

## Objetivo

Auditar el flujo real que sigue un cliente desde que entra al checkout publico hasta que el sistema intenta crear el pedido, reservar stock y dejarlo listo para pago o revision operativa.

Este documento toma como referencia el runtime actual del monorepo, no un flujo aspiracional.

## Alcance auditado

- entrada desde catalogo publico hacia `/checkout`
- paso de documento e identidad
- paso de entrega y ubigeo
- paso de contacto
- paso de pago manual con billetera virtual y comprobante
- endpoints `quote`, `document-lookup`, `manual`, `openpay` y upload de evidencia
- servicios `commerce`, `orders`, `products` e `inventory`
- cierre operativo posterior en backoffice

## Flujo E2E real hoy

1. El cliente entra al checkout desde catálogo o landing con `slug` y variante opcional.
2. `CheckoutWorkspace` arranca hoy con `paymentMethod="manual"` hardcodeado.
3. La web cotiza con `POST /store/checkout/quote`.
4. `CommerceService.buildQuote()` recalcula subtotal, shipping y total, pero no valida disponibilidad operativa real de stock.
5. El cliente valida documento, ubigeo, dirección y WhatsApp.
6. En el paso 3, la UI empuja primero a pagar con billetera virtual y luego a subir el comprobante.
7. Cuando el cliente confirma el modal de comprobante, recién entonces `handleSubmit()` llama a `POST /store/checkout/manual`.
8. La API normaliza el request, vuelve a recalcular la cotización y crea el pedido vía `OrdersService.createCheckoutOrder()`.
9. Durante la creación del pedido, `OrdersService` intenta reservar stock mediante `InventoryService.syncOrder()`.
10. Si la reserva falla, el backend lanza una excepción de inventario y el frontend muestra el mensaje casi en crudo en la parte superior del checkout.

## Hallazgos priorizados

### P0. El flujo manual permite pagar antes de reservar stock

Hallazgo:

- En el flujo publico actual el pedido no se crea ni reserva inventario antes de abrir el modal de pago manual.
- El cliente puede pagar y subir comprobante antes de que el sistema confirme si existe stock reservable.

Evidencia:

- `apps/web/components/checkout-workspace.tsx`
- `YapePaymentModal` dispara `handleSubmit()` solo despues de confirmar el comprobante
- `OrdersService.createCheckoutOrder()` reserva stock recien al crear el pedido

Impacto:

- riesgo de cobrar a un cliente sin haber bloqueado inventario
- mala experiencia si el error aparece despues del pago
- mayor carga operativa para reversas y soporte

### P0. El error de stock filtra detalles tecnicos incomprensibles al cliente

Hallazgo:

- La API devuelve un mensaje tecnico con SKU, `warehouseId` UUID y saldo negativo.
- `requestJson()` propaga ese `message` tal cual y `CheckoutWorkspace` lo pinta en `quoteError`.

Ejemplo observado:

- `No hay stock suficiente para HG-PN-001 en <uuid>. Disponible: -339, solicitado: 1.`

Impacto:

- el usuario no entiende el problema real
- el mensaje expone detalles internos de almacén
- no orienta ninguna accion de recuperacion clara

### P0. La cotizacion no falla temprano cuando ya no hay disponibilidad operativa

Hallazgo:

- `ProductsService.resolveCheckoutItems()` valida existencia, variante y cantidad, pero no valida disponibilidad operativa real.
- El primer control fuerte de stock ocurre durante `reserveLines()` en inventario, demasiado tarde para la experiencia publica.

Impacto:

- el usuario avanza todo el checkout con una falsa sensacion de disponibilidad
- el error explota al final del proceso, cuando el costo emocional y operativo ya es alto

### P1. El stock negativo grande sugiere descuadre operacional o de modelo

Hallazgo:

- El mensaje observado muestra disponibilidad `-339`, no `0` o `-1`.
- `InventoryService` calcula `availableStock = stockOnHand - reservedQuantity - committedQuantity`.
- `committedQuantity` queda acumulado por pedidos confirmados y `rebuildFromOrders()` rehidrata inventario replayeando pedidos historicos con `skipAvailabilityCheck`.

Hipotesis fuertes:

- existe un descuadre en `warehouse_inventory_balances` o en el snapshot `inventory`
- `stockOnHand` se esta tratando como stock actual editable, mientras `committedQuantity` acumula historico confirmado y vuelve a descontarse
- el sistema puede estar mezclando stock base, stock actual y consumo historico en una sola lectura operativa

Impacto:

- el checkout falla incluso para cantidades pequenas
- el banner tecnico es solo sintoma; el problema real parece estar en la capa de inventario

### P1. El checkout publico esta alineado a pago manual, pero naming y docs siguen mezclando Openpay

Hallazgo:

- La UI publica arranca fija en `manual`.
- El copy de algunas capas documentales y del dominio todavia habla de `Openpay` como si fuera el camino principal del checkout publico.

Impacto:

- confunde negocio, QA y soporte
- dificulta entender que se espera del paso 3 y de la conciliacion posterior

### P2. El nombre del comprador no tiene suficiente jerarquia visual en el resumen final

Hallazgo:

- En el paso 3 la tarjeta `Contacto` muestra el nombre en `text-lg`, casi con el mismo peso visual que el resto del contenido.
- Cuando existe un banner de error arriba, el nombre pierde protagonismo y legibilidad para la verificacion humana final.

Impacto:

- el usuario revisa peor si el nombre autocompletado por DNI es correcto
- se reduce la claridad de una decision critica justo antes de pagar

### P2. WhatsApp se valida por presencia, no por formato operativo

Hallazgo:

- El frontend exige que el campo exista, pero no que tenga formato homologado.
- El backend del checkout tampoco endurece un formato internacional para este caso.

Impacto:

- pueden entrar telefonos ambiguos o inutiles para coordinacion
- el paso dice `WhatsApp obligatorio`, pero no asegura calidad operativa del dato

## Forense del caso real observado

Corte local auditado: `2026-04-15`.

Hallazgos confirmados en base local:

- `HG-PN-001` en `WH-DEFAULT / Almacén Miraflores` tiene `stockOnHand=120`, `reservedQuantity=27`, `committedQuantity=432`, por lo que el disponible operativo queda en `-339`.
- `HG-CV-001` en ese mismo almacén tiene `stockOnHand=120`, `reservedQuantity=27`, `committedQuantity=630`, con disponible operativo de `-537`.
- En el snapshot `orders`, las asignaciones activas por SKU no justifican esos comprometidos: `HG-PN-001` muestra `48` unidades confirmadas y `3` bajo revisión; `HG-CV-001` muestra `70` confirmadas y `3` bajo revisión.
- En el snapshot `inventory`, el ledger histórico registra `48` confirmaciones para `HG-PN-001` y `70` para `HG-CV-001`, lo que vuelve a reforzar que el problema principal no está en la demanda vigente sino en el balance persistido por almacén.

Conclusión operativa:

- el checkout público está fallando por descuadre en `warehouse_inventory_balances`
- el mensaje técnico visto por el cliente es un síntoma; la causa real es que el balance operativo quedó inflado frente a los pedidos activos y al historial que sí se puede reconstruir

## Hotfix público aplicado en este corte

- el checkout ya traduce conflictos de inventario a un mensaje comercial entendible
- la UI pública ya no muestra UUIDs de almacén ni saldos negativos internos como parte del banner de error
- el nombre del comprador quedó con mayor jerarquía visual en el resumen final del paso 3

## Mapa de componentes involucrados

### Web publica

- `apps/web/components/checkout-workspace.tsx`
- `apps/web/components/yape-payment-modal.tsx`
- `apps/web/lib/api.ts`

### API y dominio

- `apps/api/src/modules/commerce/commerce.controller.ts`
- `apps/api/src/modules/commerce/commerce.service.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/inventory/inventory.service.ts`
- `apps/api/src/modules/products/products.service.ts`

### Operacion y recuperacion

- `apps/admin/components/inventory-workspace.tsx`
- `scripts/backfill-default-warehouse.ts`
- `scripts/backfill-warehouse-balances.ts`

## Recomendaciones de correccion por orden

### 1. Hotfix de UX y errores

- traducir conflictos de stock del backend a un mensaje humano: producto sin disponibilidad, pide actualizar carrito o contactar soporte
- no exponer `warehouseId`, UUIDs ni saldos tecnicos en la UI publica
- dejar el detalle tecnico solo en logs, auditoria u observabilidad

### 2. Correccion de flujo

- crear o reservar el pedido antes de pedir pago manual
- si el flujo sigue siendo manual, el modal de billetera debe operar sobre un pedido ya creado y con stock bloqueado
- agregar expiracion visible de esa reserva si el cliente abandona el flujo

### 3. Falla temprana de disponibilidad

- validar disponibilidad operativa real en `quote` o antes de abrir el modal de pago
- si no se quiere bloquear stock en `quote`, al menos hacer un preflight de disponibilidad y devolver un mensaje comercial entendible

### 4. Auditoria operacional de inventario

- revisar `warehouse_inventory_balances`, snapshot `inventory` y variantes con stock negativo operativo
- validar si `stockOnHand` representa stock base o stock actual editable
- decidir si `committedQuantity` debe representar historico acumulado o solo compromiso operativo vigente
- usar `Inventario` admin como lectura de control antes de reabrir el checkout en producción

### 5. Alineacion de naming y copy

- explicitar si el checkout publico vigente es `pago manual con billetera` o `Openpay`
- renombrar el paso 3 y sus mensajes segun el flujo real
- subir la jerarquia visual del nombre del comprador en la tarjeta de confirmacion final

### 6. Endurecimiento de validaciones

- validar formato de WhatsApp, no solo presencia
- mejorar la semantica de mensajes por seccion: identidad, entrega, contacto, stock, pago

## Siguiente paso recomendado

El siguiente corte no deberia empezar por cosmética. Primero hay que cerrar dos frentes:

1. confirmar por que el inventario operativo llega a negativos grandes
2. mover la reserva de stock antes del pago manual del cliente

Recién después conviene entrar al refinamiento visual del nombre, jerarquía de resumen y copy del paso final.
