# UC-35 Ejecucion De Reglas Y Acciones Simples

## Objetivo

Formalizar como una regla comercial activa evalua triggers validos y ejecuta
acciones simples, auditables y cerradas sobre el mismo caso comercial.

## Actores

- marketing
- ventas
- worker

## Precondiciones

- existe un `customer_relationship_case` operativo en `/crm`
- el catalogo cerrado de reglas ya define trigger, filtros, accion y `order`
- la regla evaluada esta `active`
- si la accion reutiliza campaigns, la campaign ya existe en el slice `006`

## Flujo principal

1. Una regla activa recibe un trigger valido.
2. El sistema evalua la regla segun su `order`.
3. La regla revisa filtros simples de elegibilidad sobre el mismo caso.
4. Si aplica, ejecuta solo una accion del catalogo cerrado del slice.
5. La regla puede recalcular score, sugerir prioridad, crear tarea o encolar
   una campaign existente.
6. El side effect o la sugerencia quedan trazados sobre el mismo caso.
7. `ventas` consume el efecto dentro de `/crm` sin salir a otra consola.

## Reglas canonicas

- el catalogo de reglas es cerrado
- las reglas usan `active` o `inactive`, `order`, `cooldown` y filtros
  simples
- `suggest_priority` no cambia `priority` automaticamente
- `enqueue_existing_campaign` solo reutiliza campaigns ya existentes de `006`
- las automatizaciones no mueven `pipelineStage` ni `status`

## Resultado esperado

Las reglas activas pueden generar efectos simples y seguros sobre el mismo
caso transversal, con ownership de `marketing`, consumo operativo por
`ventas` y trazabilidad suficiente para auditoria.
