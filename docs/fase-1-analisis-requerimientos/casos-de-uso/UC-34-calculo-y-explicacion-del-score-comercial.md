# UC-34 Calculo Y Explicacion Del Score Comercial

## Objetivo

Formalizar el recalculo determinista del score comercial sobre
`customer_relationship_case` y su explicacion visible en `/crm` sin exponer
el puntaje interno ni abrir override manual.

## Actores

- marketing
- ventas
- customers

## Precondiciones

- existe un cliente canonico valido en `customers`
- el `customer_relationship_case` ya existe
- el caso ya puede recibir triggers comerciales o transaccionales del slice
- `/crm` es la superficie visible principal del caso

## Flujo principal

1. Un trigger fuente o derivado impacta el `customer_relationship_case`.
2. El sistema recalcula el score de forma determinista y auditable.
3. El puntaje interno se colapsa a `cold`, `warm` o `hot`.
4. Si cambia el resultado efectivo, el slice deriva `score_changed`.
5. `/crm` muestra el tier visible y una razon corta del score.
6. `ventas` usa esa lectura para priorizar el siguiente movimiento comercial.

## Reglas canonicas

- el score vive sobre el mismo `customer_relationship_case`
- el score es determinista y auditable
- la UI solo muestra `cold`, `warm` y `hot`
- el puntaje interno no se expone en `/crm`
- la razon visible debe explicar el resultado sin abrir la mecanica completa
- el score no admite override manual

## Resultado esperado

El caso comercial queda clasificado de forma trazable con un tier visible y
una explicacion corta util para `marketing` y `ventas`, sin abrir otra
entidad ni esconder la causa del resultado.
