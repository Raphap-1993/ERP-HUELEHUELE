# Reglas De Automatizacion Comercial Amplia

- `014` vive sobre `customer_relationship_case`
- `marketing` es owner del catalogo de templates
- `ventas` consume efectos y resuelve pasos humanos como owner operativo
  principal dentro de `/crm`
- `marketing` puede resolver pasos humanos de forma secundaria cuando el
  template o el flujo lo requieran
- una sola instancia no terminal por `template + customer_relationship_case`
- un mismo caso puede tener varios journeys activos si son de templates
  distintos
- una instancia `paused` no libera la unicidad del mismo `template + case`
- templates cerrados: `followup_recovery`, `reactivation_nurture`,
  `opportunity_progression`, `post_loss_recovery`
- estados de instancia: `active`, `paused`, `completed`, `cancelled`
- `journeyAssignee` se hereda por defecto del `assignee` del caso
- tipos de paso: `wait`, `condition`, `create_followup_task`,
  `manual_review`, `suggest_priority`, `enqueue_existing_campaign`,
  `mark_journey_milestone`
- las condiciones solo usan senales canonizadas del caso y de la oportunidad
- no se disparan otros journeys desde una instancia
- no se mutan automaticamente `pipelineStage`, `status` ni
  `opportunityStage`
- no se crea `commercial_opportunity` automaticamente
- el binding con oportunidad activa es estable al deal original
- incompatibilidad fuerte cancela
- incompatibilidad blanda pausa o desvia
- `manual_review` bloquea y reanuda al resolverse
- waits y timers se delegan a `worker/BullMQ`
- la reentrada depende del template y respeta `reentryCooldown`
- toda transicion y todo paso dejan traza obligatoria dentro de `/crm`
