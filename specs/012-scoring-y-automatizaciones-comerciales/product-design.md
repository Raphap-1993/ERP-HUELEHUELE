# Product Design - Scoring Y Automatizaciones Comerciales

Fecha: 2026-05-29.

## Promesa de superficie

`Ventas` y `marketing` necesitan entender, en una sola lectura dentro de
`/crm`, que tan caliente esta un caso comercial, por que lo esta y que acciones
simples ya sugirio o ejecuto el sistema, sin salir del workbench del cliente ni
abrir un modulo nuevo de automation.

## Componentes principales

- resumen comercial del cliente dentro de `/crm`
- badge de `scoreTier`
- razon corta del score
- sugerencia de prioridad
- indicador de candidato de follow-up
- tareas o recordatorios automaticos sobre el mismo caso
- traza visible de side effects simples
- lectura secundaria de campaigns encoladas cuando aplique

## Decisiones

- `012` extiende el mismo `customer_relationship_case` documentado en `010` y
  enriquecido en `011`
- el score visible usa solo `cold`, `warm` y `hot`
- el puntaje interno permanece tecnico y auditable, fuera de la UI principal
- la razon corta debe explicar el tier sin exponer formulas ni debug tecnico
- las sugerencias de prioridad no escriben `priority`; solo orientan a
  `ventas`
- las tareas automaticas viven sobre el caso transversal del cliente
- las campaigns encoladas siguen siendo reutilizacion de `006`, no authoring
  nuevo desde `/crm`
- la traza de automatizaciones debe hacer visible si una regla sugirio, ejecuto
  u omitio un efecto por deduplicacion o `cooldown`

## Contrato minimo del corte

- `/crm` sigue siendo la unica superficie principal del slice
- `scoreTier` usa `cold`, `warm` y `hot`
- cada caso debe poder exponer una razon corta del score
- `scoreTier` convive con `priority`, `pipelineStage`, `status` y `followUpAt`
- si existe sugerencia de prioridad, se presenta como sugerencia y no como
  cambio aplicado automaticamente
- si existe evento `followup_candidate_detected`, la UI debe hacerlo visible
  como senal operativa del caso
- si se crea una tarea automatica, debe verse en el mismo workbench del caso
- si se encola una campaign existente, debe quedar evidencia visible de esa
  accion sin salir a otra consola

## Lecturas secundarias

- `score_changed` y `followup_candidate_detected` son lecturas derivadas del
  mismo caso
- la deduplicacion y el `cooldown` son comportamiento secundario visible solo en
  la traza, no como concepto central de la pagina
- metricas agregadas por score o por automatizacion pueden existir despues, pero
  no son promesa minima del corte

## Tension principal

La superficie debe sentirse como una extension sobria y util de `/crm`: lo
suficiente para priorizar mejor y automatizar acciones seguras, sin vender un
rule builder, una suite de journeys ni un CRM con IA.

## Resultado esperado

El slice puede pasar a arquitectura y SDD con una lectura comun entre score
visible, razon explicativa, sugerencias y side effects simples sobre el mismo
cliente canonico, preservando el ownership de `010`, `011` y `006`.
