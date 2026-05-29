# UC-32 Bandeja Y Priorizacion Del Pipeline Comercial

## Objetivo

Formalizar la bandeja comercial filtrable dentro de `/crm` para operar la
cola del pipeline amplio sin convertirla en kanban ni en modulo separado.

## Actores

- ventas
- marketing

## Precondiciones

- el `customer_relationship_case` ya existe
- la bandeja comercial vive dentro de `/crm`
- `followUpAt` y `lastPipelineActivityAt` pueden leerse en la cola

## Flujo principal

1. El operador entra a la bandeja comercial dentro de `/crm`.
2. Filtra por `commercialOwner`, `assignee`, `pipelineStage`, `priority`,
   `commercialChannel` y `status`.
3. Revisa las vistas de pendientes de hoy y vencidos usando `followUpAt`.
4. Usa `lastPipelineActivityAt` para priorizar sin abrir todo el timeline.
5. Decide el siguiente movimiento comercial del caso.

## Reglas canonicas

- la bandeja comercial sigue dentro de `/crm`
- la cola se filtra por owner, assignee, etapa, prioridad, canal y status
- pendientes de hoy y vencidos se leen desde `followUpAt`
- `lastPipelineActivityAt` resume la ultima actividad comercial relevante
- el slice no vende kanban complejo ni app separada

## Resultado esperado

La operacion comercial puede priorizar y ordenar el pipeline sobre el mismo
caso transversal, con lectura rapida de urgencia, canal y actividad
reciente.
