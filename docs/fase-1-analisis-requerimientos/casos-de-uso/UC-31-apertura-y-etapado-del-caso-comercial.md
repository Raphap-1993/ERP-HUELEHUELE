# UC-31 Apertura Y Etapado Del Caso Comercial

## Objetivo

Formalizar como el pipeline comercial amplio se inicializa sobre el mismo
`customer_relationship_case`, agregando etapa, prioridad y canal sin abrir
`commercial_opportunity`.

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
2. Al abrir el caso, `pipelineStage` nace por defecto en `new` y no puede
   quedar nulo.
3. `ventas` puede inicializar otra etapa solo si ya existe contexto
   comercial suficiente.
4. El operador define `priority` y `commercialChannel`.
5. `commercialChannel` queda como origen principal del caso y no como canal
   cambiante por cada contacto.
6. El caso conserva `commercialOwner`, `assignee`, `nextStep` y
   `followUpAt`.
7. Todo cambio posterior de etapa queda trazado en el timeline.

## Reglas canonicas

- el pipeline vive sobre el mismo `customer_relationship_case`
- `pipelineStage` es manual por `ventas`
- `pipelineStage` nace en `new` y no queda nulo al abrir el caso
- `priority` y `commercialChannel` son campos manuales del caso
- `commercialChannel` modela el origen principal del caso
- el flujo no abre `commercial_opportunity`
- todo cambio de etapa deja trazabilidad en el timeline

## Resultado esperado

El caso transversal queda incorporado al pipeline comercial amplio con
etapa, prioridad y canal explicitos, preservando el mismo ownership
comercial ya definido por `010`.
