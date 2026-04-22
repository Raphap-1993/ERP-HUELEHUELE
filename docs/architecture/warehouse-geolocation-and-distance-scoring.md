# Arquitectura: Georreferenciación de Almacenes y Distance Scoring

## Objetivo

Formalizar la subfase corta `Fase 1B: georreferenciación de almacenes` para dejar una base útil antes de construir la triangulación completa de fulfillment.

## Decisiones vigentes

### 1. `ubigeo` sigue siendo la fuente geográfica canónica

La operación de Huelegood sigue descansando en:

- `department`
- `province`
- `district`
- `serviceAreas`

Las coordenadas no reemplazan ese modelo. Solo lo complementan.

### 2. `latitude` y `longitude` son opcionales

Cada almacén puede guardar coordenadas exactas, pero:

- no son obligatorias para crear o editar el almacén
- no bloquean pagos manuales ni confirmación operativa
- no reemplazan la dirección legible ni el ubigeo normalizado

### 3. La captura inicial es manual

En esta fase se acepta:

- ingreso manual de `latitud`
- ingreso manual de `longitud`
- extracción básica desde enlace de mapa o texto `lat,lng`

No se integra todavía un proveedor de geocodificación ni un SDK de mapa embebido.

### 4. La coordenada entra como señal secundaria del motor

El `suggestion engine v1` debe seguir este orden:

1. asignación manual existente
2. almacén por defecto de la variante
3. cobertura por `serviceAreas` y ubigeo
4. prioridad operativa
5. stock por almacén cuando exista
6. distancia como desempate, solo si hay datos suficientes

La distancia no debe ser la verdad principal de decisión en esta etapa.

## Modelo de datos

### Runtime actual

`warehouses` ya puede persistir:

- `latitude`
- `longitude`

Ambos campos se tratan como par:

- si uno viene lleno y el otro vacío, la API rechaza la solicitud
- si ambos vienen vacíos, el almacén sigue siendo válido

### Campos reservados para una fase posterior

Todavía no se implementan, pero quedan aprobados conceptualmente:

- `geoSource`
- `geoConfidence`
- `geoUpdatedAt`

Eso servirá más adelante para distinguir:

- coordenada cargada manualmente
- coordenada geocodificada
- calidad del dato

## Cómo entra al scoring

### Reglas mínimas

- si el pedido no tiene destino georreferenciable, no se usa distancia
- si dos almacenes son elegibles por cobertura y prioridad, la distancia puede desempatar
- si falta stock por almacén, la distancia no puede imponer una salida incorrecta

### Estrategia recomendada

1. filtrar almacenes activos
2. filtrar cobertura compatible
3. aplicar preferencia de `defaultWarehouse`
4. aplicar prioridad operativa
5. usar distancia solo entre candidatos elegibles restantes
6. persistir motivo de sugerencia y origen final en el pedido

## Qué queda fuera en esta subfase

- mapa embebido en admin
- geocodificación automática contra proveedor externo
- cálculo de rutas reales
- ETA
- costo logístico por transportista
- optimización de reparto
- `split shipment`

## Relación con el flujo async E2E

La georreferenciación de almacenes no debe bloquear:

- `payment.manual.requested`
- revisión de pago manual
- `order.dispatch.ready`
- alertas internas a operación

El flujo async sigue siendo independiente. Las coordenadas solo enriquecen la futura sugerencia de origen.

## Estado actual de la subfase

Hoy ya quedaron resueltos:

- contrato compartido con `latitude` y `longitude`
- persistencia opcional en `warehouses`
- validación de rango y validación de par
- captura operativa básica en admin

Pendiente para la siguiente fase:

- coordenadas o centroides del destino
- scoring determinista con persistencia de sugerencia
- stock real por almacén
