# Reglas De Scoring Y Automatizaciones Comerciales

- `012` vive sobre `customer_relationship_case`
- no abre `commercial_opportunity`
- el score es determinista y auditable
- el tier visible usa `cold`, `warm` y `hot`
- el puntaje interno no se muestra en UI
- el score no admite override manual
- triggers fuente: `pipeline_stage_changed`, `followup_due`,
  `followup_overdue`, `order_confirmed`, `payment_confirmed`,
  `case_reopened`
- eventos derivados: `score_changed`, `followup_candidate_detected`
- el catalogo de reglas es cerrado y predefinido
- cada regla usa `active` o `inactive`
- cada regla usa `order` de evaluacion determinista
- cada regla usa `cooldown`
- cada regla puede aplicar filtros simples sobre el mismo caso
- acciones cerradas: `recalculate_score`, `suggest_priority`,
  `create_followup_task`, `enqueue_existing_campaign`
- `suggest_priority` no cambia `priority` automaticamente
- `enqueue_existing_campaign` solo reutiliza campaigns existentes de `006`
- la deduplicacion base usa `ruleId + customerRelationshipCaseId + actionType`
- el `cooldown` bloquea repeticion de side effects, no el recalculo del score
- las automatizaciones no mueven `pipelineStage` ni `status`
- `marketing` es owner principal del catalogo; `ventas` consume efectos en
  `/crm`
