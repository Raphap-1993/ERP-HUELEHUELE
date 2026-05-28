# Product Design - CRM Manual Ampliado

Fecha: 2026-05-28.

## Promesa de superficie

`Ventas` necesita un workbench simple y serio para saber quien sigue el
pedido, que toca hacer y cuando toca volver a actuar, sin salir del
contexto operativo del pedido.

## Componentes principales

- bloque del caso manual dentro de `Pedidos > Operacion`
- timeline manual
- `nextStep`
- `followUpAt`
- `assignee`
- tareas opcionales
- bandeja secundaria filtrada de casos abiertos

## Decisiones

- la vista extiende `Pedidos > Operacion` y no abre un CRM general separado
- el caso manual se apoya sobre el seguimiento derivado ya documentado en
  `008`
- `nextStep` y `followUpAt` funcionan como guardrails de disciplina minima,
  no como campos decorativos
- el timeline manual conserva trazabilidad humana sin convertirse en chat,
  inbox ni mensajeria real
- la bandeja secundaria vive dentro del modulo de `Pedidos`, no en dashboard
  ni en una app aparte

## Tension principal

La superficie debe verse como una extension natural del detalle operativo
del pedido: suficiente para gestionar seguimiento humano real, pero sin
prometer CRM por cliente, pipeline comercial amplio ni workbench transversal
de ventas.

## Resultado esperado

El slice puede pasar a arquitectura y SDD con una lectura comun entre caso
manual, timeline, proximo paso, seguimiento derivado y lifecycle del pedido.
