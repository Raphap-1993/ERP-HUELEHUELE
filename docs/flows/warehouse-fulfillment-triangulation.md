# Flujo: Almacén por Defecto y Triangulación de Fulfillment

## Objetivo

Definir cómo Huelegood debe:

- configurar almacenes con ubicación operativa real
- asignar un almacén por defecto a cada variante
- resolver el origen de salida de un pedido
- permitir triangulación entre dos almacenes sin romper la arquitectura actual

## Principios rectores

### 1. El almacén por defecto no es el origen final garantizado

El almacén por defecto expresa la primera preferencia operativa de una variante. La asignación final del pedido puede cambiar por stock, cobertura o decisión humana.

### 2. La ubicación del almacén debe ser utilizable, no decorativa

Cada almacén debe guardar ubicación operativa con ubigeo suficiente para:

- cobertura
- priorización
- triangulación origen-destino
- reportes por origen

### 3. El pedido debe conservar el origen resuelto

La triangulación no debe recalcularse cada vez que una pantalla lee el pedido. El origen resuelto debe persistirse en el pedido o en su recurso de fulfillment asociado.

### 4. Primera fase sin split shipment

Durante la primera etapa, un pedido usa un solo almacén origen. Si un pedido requiere dividir líneas entre dos almacenes, eso se trata como fase posterior.

## Actores

- `admin`
- `ventas`
- operador de `despachos`
- API Huelegood
- `products`
- `inventory`
- `orders`

## Conceptos base

### Almacén por defecto

Preferencia de origen definida en la variante del producto.

### Almacén asignado al pedido

Origen finalmente elegido para despachar ese pedido específico.

### Triangulación

Decisión operativa que cruza:

- origen candidato
- destino del pedido
- cobertura
- prioridad
- stock disponible
- distancia geográfica opcional como desempate

## Precondiciones

- existen uno o más almacenes activos
- cada almacén tiene ubicación operativa configurada
- las variantes vendibles tienen almacén por defecto
- el pedido ya tiene destino normalizado con ubigeo

## Subflujo A: configuración del almacén

### Pasos

1. Operación crea o edita un almacén desde backoffice.
2. El sistema registra código, nombre, estado y prioridad.
3. El sistema registra dirección operativa y ubigeo del almacén.
4. Operación configura opcionalmente áreas de cobertura o prioridad geográfica.
5. El almacén queda disponible para catálogo, inventario y fulfillment.

Estado actual de este corte:

- el backoffice ya permite editar `serviceAreas` dentro del formulario del almacén
- la cobertura se captura con selects de `Perú -> departamento -> provincia -> distrito`
- si no existen `serviceAreas`, el motor usa el ubigeo del almacén como cobertura implícita

### Datos mínimos

- `code`
- `name`
- `status`
- `priority`
- `line1`
- `line2` opcional
- `departmentCode`
- `departmentName`
- `provinceCode`
- `provinceName`
- `districtCode`
- `districtName`
- `latitude` opcional
- `longitude` opcional

### Nota de UX operativa

- el admin no debería editar códigos crudos de ubigeo
- la captura correcta es `Perú` fijo con selects dependientes `departamento -> provincia -> distrito`
- si operación no define `code`, el sistema puede generarlo como identificador interno
- el dato importante para negocio es la ubicación legible del punto de salida, no el código técnico
- si operación conoce la coordenada exacta del punto, puede guardarla como dato opcional sin volverla obligatoria

## Subfase corta vigente: `Fase 1B`

Huelegood cierra primero una subfase corta de georreferenciación de almacenes:

- captura manual de `latitud` y `longitud`
- extracción básica desde enlace de mapa o `lat,lng`
- validación de rango y consistencia del par
- uso futuro de distancia solo como señal secundaria

Esta subfase no cambia la regla principal:

- `ubigeo + cobertura + prioridad + stock` siguen siendo la base de triangulación

## Subflujo B: asignación de almacén por defecto a variante

### Pasos

1. Operación crea o edita un producto.
2. Para cada variante define el almacén por defecto.
3. La API valida que el almacén exista y esté activo.
4. La variante queda lista para quote, pedido e inventario.

### Reglas

- el almacén por defecto se persiste en la variante, no como texto libre
- backoffice puede ofrecer un atajo para aplicar el mismo almacén a todas las variantes de un producto
- una variante no puede apuntar a un almacén inactivo

## Subflujo C: resolución automática del origen del pedido

### Pasos

1. El pedido se crea o pasa a un punto elegible para reservar stock.
2. El sistema lee el destino y su ubigeo.
3. El sistema revisa el almacén por defecto de las variantes involucradas.
4. El motor construye una `suggestion` determinista con `default warehouse + cobertura + prioridad`.
5. Si existe un origen común elegible y la condición es segura, el sistema puede autoasignarlo.
6. Cada candidato debe validar cobertura y stock suficiente para todas las líneas.
7. Si el almacén por defecto no aplica, el sistema evalúa otro almacén por cobertura y prioridad.
8. Si un candidato cubre el destino pero no alcanza stock, la sugerencia debe quedar bloqueada con detalle de faltantes.
9. Si todavía existen varios candidatos equivalentes y hay datos georreferenciables, puede usar cercanía como desempate.
10. La `suggestion` no reserva stock ni confirma despacho por sí sola.
11. La `assignment` sí se persiste en el recurso de fulfillment del pedido.
12. `inventory`, `dispatch`, etiqueta y reportes leen solo el origen asignado.

Límite de este flujo:

- este documento llega hasta `assignment`
- `paquete`, `guía`, `sticker` y `transferencias entre almacenes` se gobiernan en [warehouse-transfers-sunat-guides-and-package-labels.md](./warehouse-transfers-sunat-guides-and-package-labels.md)

Nota operativa vigente:

- los pedidos manuales creados desde backoffice ya deben capturar `ubigeo` Perú normalizado para que la sugerencia por cobertura también sirva fuera del checkout público

### Orden recomendado de resolución

1. asignación manual existente
2. almacén por defecto de la variante
3. almacén alternativo por cobertura
4. almacén alternativo por prioridad
5. cercanía geográfica como desempate opcional
6. excepción operativa para revisión humana

### Diferencia entre `suggestion` y `assignment`

- `suggestion`: recomendación calculada por el motor; no reserva stock, no confirma despacho y no muta el pedido por sí sola
- `assignment`: origen confirmado del pedido; ese sí alimenta despacho, auditoría, reportes y etiquetas

Nota de frontera:

- `assignment` no equivale todavía a `paquete listo`, `guía emitida` ni `salida física cerrada`

Regla operativa vigente:

- la `suggestion` ya descarta candidatos sin stock suficiente por almacén y puede exponer `blockingReason` y `missingLines`
- la `assignment` valida almacén activo, cobertura y stock antes de persistirse
- cuando una reasignación cambia de origen, la reserva del pedido se recompone contra el nuevo almacén para no dejar saldo retenido en el anterior

## Subflujo D: reasignación manual

### Pasos

1. Operación abre el fulfillment del pedido.
2. Selecciona un nuevo almacén origen.
3. La API valida que el pedido siga en una etapa elegible.
4. La API valida stock y reglas mínimas de cobertura.
5. El sistema libera o recompone la reserva anterior según aplique.
6. El sistema persiste el nuevo origen y deja auditoría.

### Regla mínima recomendada

La reasignación manual debe permitirse antes de `shipped`. Después de ese estado, solo debe permitirse como excepción administrativa explícita.

## Estados y datos mínimos del fulfillment

Estados sugeridos:

- `pending_assignment`
- `assigned`
- `reassigned`
- `blocked`

Campos mínimos:

- `orderId`
- `warehouseId`
- `warehouseCode`
- `warehouseName`
- `strategy`
- `assignedAt`
- `assignedBy`
- `notes`

## Reglas de negocio

- la triangulación no debe vivir en frontend
- el almacén por defecto es un input de decisión, no el resultado final obligatorio
- el origen del pedido debe ser reutilizable por inventario, despacho y reportes
- la primera fase no divide un pedido entre dos almacenes
- un producto no puede quedar vendible sin una política clara de origen por variante
- el stock operativo se valida por `warehouseId + variantId`, no solo por stock agregado de la variante
- la distancia no puede reemplazar cobertura ni stock como criterio principal
- si no hay candidato claro, el resultado correcto es excepción operativa, no autoasignación forzada

## Errores posibles

| Error | Resultado esperado |
| --- | --- |
| variante sin almacén por defecto | bloqueo operativo o corrección obligatoria |
| almacén por defecto inactivo | rechazo de edición o corrección antes de vender |
| no hay stock en origen por defecto | búsqueda de origen alternativo |
| ningún almacén cubre o soporta la salida | pedido queda en excepción operativa |
| intento de reasignar un pedido ya enviado | rechazo o escalamiento administrativo |

## Eventos recomendados

- `warehouse.created`
- `warehouse.updated`
- `product.variant.default_warehouse_set`
- `order.fulfillment.assigned`
- `order.fulfillment.reassigned`
- `inventory.reserved`
- `inventory.confirmed`

## API recomendada

### Almacenes

- `GET /admin/warehouses`
- `POST /admin/warehouses`
- `PATCH /admin/warehouses/:id`
- `serviceAreas` viajan dentro de `POST /admin/warehouses` y `PATCH /admin/warehouses/:id`

### Fulfillment

- `GET /admin/orders/:orderNumber/fulfillment`
- `POST /admin/orders/:orderNumber/fulfillment/suggest`
- `POST /admin/orders/:orderNumber/fulfillment/assign`
- `POST /admin/orders/:orderNumber/fulfillment/reassign`

## Observaciones de implementación

- el catálogo de almacenes debe ser reusable desde `products`, `inventory`, `orders` y `reports`
- si la fase inicial necesita simplicidad, puede arrancar con dos almacenes activos y un mapeo de cobertura pequeño
- cuando no exista cobertura configurada, la sugerencia puede caer temporalmente en `default + prioridad` o en el ubigeo propio del almacén, pero eso debe quedar explícito y documentado
- primera implementación recomendada para triangulación: `scoring` determinista y auditable, no un optimizador opaco
- aunque la sugerencia ya filtra por stock real por almacén, sigue siendo una recomendación: solo la `assignment` muta el pedido y recompone la reserva
