# Flujo: Etiquetas de Despacho y Alistamiento

## Objetivo

Definir cómo Huelegood debe generar etiquetas imprimibles de despacho a partir del pedido, cómo se operan desde backoffice y cómo escalar esa capacidad hacia una vista separada de alistamiento sin romper la arquitectura vigente.

## Resumen de decisión

- `orders` sigue siendo el dueño de la verdad del pedido y del snapshot operativo.
- La etiqueta es un artefacto derivado de lectura; no es una nueva fuente de verdad.
- La etiqueta operativa no reemplaza la guia de traslado exigible por `SUNAT`; si existe `GRE`, ambos artefactos deben derivar del mismo snapshot logístico.
- El formato principal no debe ser una imagen rasterizada (`png`, `jpg`) sino una plantilla `HTML/CSS` print-ready reutilizable para impresión y exportación a PDF.
- El detalle del pedido en `admin` debe ofrecer la acción puntual `Imprimir etiqueta`.
- El backoffice debe poder crecer hacia un workspace operativo separado de `Despachos` o `Alistamiento` sin duplicar la lógica de `orders`.
- La impresión no cambia por sí sola la máquina de estados del pedido.

Cuando Huelegood opere con múltiples almacenes, la etiqueta debe leer el mismo origen persistido definido en [warehouse-fulfillment-triangulation.md](./warehouse-fulfillment-triangulation.md).
Cuando el flujo también requiera `transferencias`, `GRE` y `stickers` consistentes con el paquete físico, aplicar además [warehouse-transfers-sunat-guides-and-package-labels.md](./warehouse-transfers-sunat-guides-and-package-labels.md).

## Contexto actual

Hoy el detalle de pedidos ya expone casi toda la información necesaria para una etiqueta operativa:

- número de pedido
- nombre y teléfono del cliente
- destinatario y dirección de envío
- items, canal, vendedor y referencia
- estado operativo y timeline

Sin embargo, el sistema todavía no define:

- un recurso formal de etiqueta de despacho
- reglas de elegibilidad para imprimir
- una vista dedicada de impresión
- una superficie separada para alistamiento o impresión por lote

## Alcance

Incluye:

- impresión individual desde el detalle del pedido
- payload normalizado de etiqueta expuesto por la API
- vista imprimible en `admin`
- lineamientos para un workspace futuro de `Despachos` o `Alistamiento`
- reglas mínimas de privacidad, permisos y auditoría

No incluye:

- integración nativa con carrier externo
- cambio obligatorio de la máquina de estados del pedido
- persistencia de archivos públicos de etiquetas
- modelar aún un módulo independiente `fulfillment` como dueño de dominio
- reemplazar la `GRE` o cualquier otro documento legal de traslado

## Principios rectores

### 1. La etiqueta no reemplaza al pedido

La etiqueta deriva del snapshot actual del pedido. No se edita manualmente como fuente de verdad y no debe convertirse en un documento maestro separado del agregado `orders`.

Tampoco debe convertirse en sustituto del documento de traslado. Si la operación necesita sustento `SUNAT`, la salida física debe apoyarse en un snapshot logístico compartido entre:

- etiqueta operativa
- paquete
- guia de remision

### 2. La lógica sensible sigue en la API

`admin` no debe reconstruir reglas de elegibilidad ni armar la etiqueta desde datos parciales. La API debe validar acceso, preparar el payload y devolver un contrato estable para renderizar la plantilla.

### 3. El formato fuente es print-ready, no imagen

Para imprimir bien en diferentes impresoras y tamaños, el artefacto principal debe ser:

- `HTML/CSS` con tamaño fijo y estilos `@media print`
- o PDF generado desde ese mismo template

Una imagen puede existir como preview o fallback, pero no como formato principal ni persistente.

### 4. Privacidad por defecto

La etiqueta solo muestra datos mínimos necesarios para despacho. No debe incluir datos financieros, evidencias de pago ni PII innecesaria visible en el exterior del paquete.

### 5. Evolución operativa sin sobreingeniería

El MVP nace dentro de `orders` + `admin`. Si la operación valida una cola física de packing o batch printing, entonces se habilita un workspace `Despachos` y recién más adelante se evalúa un subdominio `dispatch` o `fulfillment`.

## Actores

- `admin`
- `ventas`
- API Huelegood
- navegador / motor de impresión del cliente admin
- auditoría

Nota:

- `operador_pagos` no participa por defecto en este flujo.
- Si el negocio necesita un operador de despacho dedicado, primero debe formalizarse su rol o permisos.

## Elegibilidad recomendada

### Estados elegibles para impresión operativa

- `confirmed`
- `preparing`
- `shipped`

### Estados elegibles solo para reimpresión o trazabilidad

- `delivered`
- `completed`

### Estados bloqueados

- `draft`
- `pending_payment`
- `payment_under_review`
- `cancelled`
- `expired`
- `refunded`

## Datos incluidos en la etiqueta

### Datos mínimos obligatorios

- `orderNumber`
- nombre del destinatario
- teléfono del destinatario
- dirección línea 1
- dirección línea 2 si existe
- ciudad
- región
- país
- modo de entrega
- resumen corto de items
- cantidad total de unidades
- referencia operativa visible

### Datos opcionales según template

- `vendorCode` o vendedor si ayuda a la operación
- `originWarehouseCode` o `originWarehouseName` si la operación necesita distinguir desde qué almacén sale
- `barcode` o `QR` del `orderNumber`
- carrier
- sucursal o agencia si `deliveryMode=province_shalom_pickup`
- sugerencia de template o tamaño de impresión

### Datos excluidos por defecto

- email
- número de documento
- subtotal, descuento, envío y total
- estado de pago detallado
- referencias de comprobante
- evidencia de pago
- notas internas
- datos de comisión
- metadata de auditoría interna

## Variantes operativas

### Entrega estándar

La etiqueta muestra destinatario, dirección completa y referencia operativa.

### `province_shalom_pickup`

La etiqueta debe mostrar además:

- carrier `shalom`
- sucursal o agencia
- aclaración de recojo si aplica

No debe mover esta lógica al frontend; la API debe enviar la variante ya normalizada.

## Flujo principal

1. Un usuario con acceso a pedidos abre el detalle del pedido en backoffice.
2. Si el pedido es elegible, el sistema muestra la acción `Imprimir etiqueta`.
3. `admin` solicita a la API el payload normalizado de etiqueta.
4. La API valida permisos, existencia del pedido y elegibilidad operativa.
5. La API devuelve el contrato de etiqueta derivado del snapshot del pedido.
6. `admin` renderiza una vista dedicada de impresión en una ruta propia.
7. El usuario imprime desde navegador o exporta a PDF.
8. Si la operación requiere trazabilidad explícita, la acción deja auditoría.

## Flujos alternos

### Pedido no elegible

- la API responde `409`
- el admin ve un mensaje claro indicando que el pedido todavía no está listo para despacho o ya no aplica

### Dirección incompleta

- la API responde `409`
- el admin debe corregir el pedido o completar la dirección antes de imprimir

### Usuario sin permiso

- la API responde `403`
- no se expone la vista imprimible

### Reimpresión

- desde `Pedidos` o desde `Despachos`, el usuario vuelve a abrir la misma vista
- el pedido no cambia de estado por reimprimir

### Impresión por lote

- el workspace `Despachos` lista pedidos elegibles
- el usuario selecciona varios pedidos
- el sistema abre varias etiquetas o genera un PDF múltiple
- si se registra lote, la auditoría debe distinguir `single` vs `batch`

## Superficies de backoffice

### 1. Acción dentro de `Pedidos`

El detalle del pedido agrega:

- botón `Imprimir etiqueta`
- acceso directo a la vista print-ready
- mensaje de bloqueo si el pedido no es elegible

### 2. Workspace `Despachos` o `Alistamiento`

Se recomienda un módulo nuevo bajo `Operación diaria` con:

- listado de pedidos elegibles para despacho
- filtros por estado, ciudad, carrier, origen y fecha
- acción de imprimir individual
- acción de batch print
- visualización rápida de destinatario, destino y referencia

Este workspace es una superficie operativa derivada de `orders`, no un segundo dueño del pedido.

## API propuesta

### `GET /admin/orders/:orderNumber/dispatch-label`

Devuelve el payload normalizado para renderizar la etiqueta.

Respuesta sugerida:

```json
{
  "data": {
    "orderNumber": "HG-10121",
    "templateVersion": "dispatch-label-v1",
    "generatedAt": "2026-04-07T14:30:00.000Z",
    "recipient": {
      "name": "aracely nibia coronel yaulli",
      "phone": "940419245"
    },
    "destination": {
      "line1": "lari lari interior texao 105",
      "line2": null,
      "city": "arequipa",
      "region": "arequipa",
      "postalCode": "",
      "countryCode": "PE",
      "deliveryMode": "standard",
      "carrier": null,
      "agencyName": null
    },
    "order": {
      "reference": "MP-HG-10121",
      "salesChannel": "web",
      "vendorCode": null,
      "vendorName": null,
      "totalItems": 1,
      "items": [
        {
          "name": "Packs 3 Huele Huele Black",
          "sku": "HUELE-BLACK",
          "quantity": 1
        }
      ]
    },
    "barcode": {
      "type": "code128",
      "value": "HG-10121"
    },
    "printHint": {
      "paperSize": "A6",
      "orientation": "portrait"
    }
  }
}
```

Errores recomendados:

- `403` sin permiso
- `404` si el pedido no existe
- `409` si el pedido no es elegible o le faltan datos obligatorios

### `POST /admin/orders/:orderNumber/dispatch-label/print`

Opcional para registrar intención de impresión y trazabilidad.

Body sugerido:

```json
{
  "templateVersion": "dispatch-label-v1",
  "format": "html",
  "channel": "single"
}
```

### `GET /admin/dispatch/orders`

Opcional para el workspace de `Despachos`.

Filtros sugeridos:

- `status`
- `city`
- `deliveryMode`
- `carrier`
- `from`
- `to`

## Contrato compartido sugerido

Si se formaliza el recurso, conviene agregar en `packages/shared` un contrato dedicado, por ejemplo:

- `AdminDispatchLabelSummary`
- `AdminDispatchOrderSummary`

Esto evita acoplar la UI de impresión a `AdminOrderDetail` completo y reduce exposición de campos que no pertenecen a la etiqueta.

## Auditoría recomendada

### Evento mínimo MVP

- `orders.label.print_requested`

Campos sugeridos:

- `orderNumber`
- `templateVersion`
- `format`
- `channel`
- `occurredAt`

Nota:

- el actor debe derivarse de la sesión autenticada del backoffice, no venir desde el body del cliente

### Eventos de evolución

- `orders.label.printed`
- `orders.label.batch.generated`

## UX recomendada

- la impresión debe abrirse en una ruta dedicada o pestaña nueva
- no usar modal como superficie final de impresión
- la plantilla debe tener tamaño fijo y reglas `@media print`
- la acción visual primaria en el detalle debe ser simple y directa
- el workspace `Despachos` debe reutilizar la misma plantilla de impresión

## Criterios de aceptación

- un pedido elegible puede generar su etiqueta desde el detalle del pedido
- la etiqueta muestra solo los datos definidos en este documento
- la salida no se desborda al imprimir
- la etiqueta no expone email, documento, totales ni datos de pago
- un usuario sin permiso recibe `403`
- un pedido no elegible recibe `409` con mensaje claro
- `province_shalom_pickup` muestra su variante operativa correcta
- el workspace `Despachos` reutiliza el mismo contrato de etiqueta
- la impresión no modifica `orderStatus`

## Plan incremental recomendado

### Fase 1. MVP

- botón `Imprimir etiqueta` en detalle del pedido
- endpoint `GET /admin/orders/:orderNumber/dispatch-label`
- vista HTML/CSS print-ready
- auditoría mínima

### Fase 2. Operación diaria

- page `Despachos` o `Alistamiento`
- listado de pedidos elegibles
- batch print
- filtros operativos

### Fase 3. Escalado operativo

- PDF múltiple
- barcode o QR
- reimpresión auditada
- eventual subdominio `dispatch` o `fulfillment` si el volumen lo justifica

## Relación con otras fuentes de verdad

Este flujo debe mantenerse consistente con:

- `docs/architecture/modules.md`
- `docs/architecture/solution-architecture.md`
- `docs/data/order-states.md`
- `docs/product/roles-and-permissions.md`
- `docs/api/api-v1-outline.md`

## Estado documental

Documento nuevo creado como base técnica para implementación futura.
