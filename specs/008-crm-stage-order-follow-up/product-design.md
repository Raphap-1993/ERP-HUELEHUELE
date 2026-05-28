# Product Design - CRM Stage Order Follow-Up

Fecha: 2026-05-28.

## Promesa de superficie

`Ventas` necesita ver de inmediato si el pedido ya esta listo para
seguimiento, en seguimiento activo o cerrado, y entender por que ruta
comercial quedo asi.

## Componentes principales

- summary tiles de `Etapa CRM` y `Seguimiento`
- `OperationGuideCard` como marco de lectura de la ruta de cobro actual
- `CommercialTraceCard`
- bloques operativos que disparan confirmacion o rechazo comercial

## Decisiones

- la vista se apoya en el tab `Operacion` ya existente, no abre una segunda
  pantalla para el mismo problema
- `Etapa CRM` y `Seguimiento` se leen juntos: uno resume la etapa derivada y
  el otro traduce la lectura operativa para `ventas`
- `CommercialTraceCard` es la pieza que explica la ruta comercial y el ultimo
  hito sin convertirse en timeline CRM
- las acciones visibles de confirmacion o rechazo pertenecen al pedido y
  deben reforzar esa lectura, no mover la pantalla hacia fulfillment o
  despacho
- la ausencia de notas, tareas y timeline manual es un guardrail de producto,
  no una carencia accidental

## Tension principal

La superficie debe explicar bien el seguimiento comercial derivado del pedido
sin vender una promesa de CRM manual. El runtime vigente ya combina tiles,
guia operativa y traza canonica; la documentacion UX debe reforzar esa
lectura sin sobreprometer timeline, tareas o ownership de operaciones que
siguen viviendo en otros bloques de `Pedidos`.

## Resultado esperado

El slice puede pasar a arquitectura y SDD con una lectura comun entre
`crmStage`, `Seguimiento`, `CommercialTraceCard` y las acciones que confirman
o rechazan comercialmente el pedido.
