# UC-31 Apertura Y Etapado Del Caso Comercial

## Objetivo

Formalizar como el pipeline comercial amplio se inicializa sobre el mismo
`customer_relationship_case`, agregando etapa, prioridad y canal sin abrir
una oportunidad separada.

## Actores

- ventas
- marketing
- customers

## Precondiciones

- existe un cliente canonico valido en `customers`
- el `customer_relationship_case` ya existe o se acaba de abrir
- `/crm` es la superficie visible principal del caso

## Flujo principal

1. El `customer_relationship_case` ya existe o se acaba de abrir.
2. `ventas` inicializa `pipelineStage` en `new` o en otra etapa si ya hay
   contexto suficiente.
3. El operador define `priority` y `commercialChannel`.
4. El caso conserva `commercialOwner`, `assignee`, `nextStep` y
   `followUpAt`.
5. Todo cambio posterior de etapa queda trazado en el timeline.

## Reglas canonicas

- el pipeline vive sobre el mismo `customer_relationship_case`
- `pipelineStage` es manual por `ventas`
- `priority` y `commercialChannel` son campos manuales del caso
- el flujo no abre `commercial_opportunity`
- todo cambio de etapa deja trazabilidad en el timeline

## Resultado esperado

El caso transversal queda incorporado al pipeline comercial amplio con
etapa, prioridad y canal explicitos, preservando el mismo ownership
comercial ya definido por `010`.
