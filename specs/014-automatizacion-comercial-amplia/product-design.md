# Product Design - Automatizacion Comercial Amplia

Fecha: 2026-05-29.

## Promesa de superficie

`Ventas` necesita operar secuencias comerciales multi-step dentro de `/crm`,
viendo en una sola lectura el estado del caso, la oportunidad ligada cuando
aplique, el journey activo, sus pasos manuales y sus hitos, sin confundir
esa capa de automation con un builder libre ni con una consola separada.

## Componentes principales

- resumen general del cliente dentro de `/crm`
- bloque principal de journey activo o pausado
- `journeyAssignee`
- estado de la instancia
- template de origen
- paso actual o ultimo paso ejecutado
- `manual_review` pendiente cuando exista
- milestone trail
- referencia a oportunidad activa ligada
- razon de pausa o cancelacion
- bandeja secundaria de journeys

## Decisiones

- `014` extiende el `customer_relationship_case` documentado en `010`, el
  pipeline amplio de `011`, el score y reglas simples de `012` y el deal
  puntual de `013`
- el journey vive sobre el caso del cliente; la oportunidad es solo contexto
  ligado cuando aplique
- el detalle del cliente sigue siendo la superficie principal
- la bandeja secundaria de journeys vive dentro del mismo `/crm`
- los pasos `manual_review` se resuelven dentro del workbench comercial
- el template se lee como contrato cerrado, no como flow configurable
- la traza del journey debe sentirse operativa y auditable, no tecnica

## Contrato minimo del corte

- una sola instancia no terminal por `template + case`
- un mismo caso puede tener varios journeys activos si son templates
  distintos
- estados de instancia `active`, `paused`, `completed`, `cancelled`
- templates canonicos: `followup_recovery`, `reactivation_nurture`,
  `opportunity_progression`, `post_loss_recovery`
- tipos de paso visibles: `wait`, `condition`, `manual_review`,
  `create_followup_task`, `suggest_priority`, `enqueue_existing_campaign`,
  `mark_journey_milestone`
- `manual_review` bloquea hasta resolverse
- el journey puede completar por exito o cancelarse por incompatibilidad

## Lecturas secundarias

- el binding con oportunidad activa es lectura contextual, no una fusion de
  state machines
- la bandeja puede servir para leer journeys activos, pausados o historicos
- milestones y trazas son soporte operativo, no un log tecnico crudo
- la apertura manual excepcional puede existir, pero no debe presentarse como
  bypass normal del sistema

## Tension principal

La superficie debe sentirse como una capa seria de automation comercial sobre
el mismo `/crm`: suficiente para coordinar waits, decisiones y acciones
humanas, pero sin prometer inbox, chaining entre journeys, workflow libre ni
mutaciones automaticas de pipeline o del deal.

## Resultado esperado

El slice puede pasar a arquitectura y SDD con una lectura comun entre caso,
deal y journey, preservando ownership, trazabilidad y control humano dentro
del mismo workbench comercial.
