# Reglas De Pipeline Comercial Amplio

- `011` vive sobre `customer_relationship_case`
- no abre `commercial_opportunity`
- `pipelineStage` usa `new`, `contacted`, `engaged`, `nurturing`, `won` y
  `lost`
- `pipelineStage` es manual por `ventas`
- `status` y `pipelineStage` son ejes separados con guardrails suaves
- se permiten saltos manuales entre etapas
- todo cambio de etapa deja trazabilidad en el timeline
- `priority` usa `low`, `medium` y `high`
- `priority` es manual
- `commercialChannel` usa `storefront`, `vendor`, `wholesale`,
  `manual_outreach`, `reactivation` y `referral`
- `commercialChannel` es el origen principal del caso
- el pipeline se filtra por canal, no por subpipelines separados
- `lostReason` usa `no_response`, `price`, `timing`, `competition`,
  `not_fit` y `other`
- `lostReason` es obligatorio al pasar a `lost`
- `won` exige nota de cierre y evidencia o referencia
- `won` no se marca automaticamente desde eventos del sistema
- `lastPipelineActivityAt` resume la ultima actividad comercial relevante
- `lastPipelineActivityAt` se actualiza con cambios de etapa y actividad
  manual relevante
- `followUpAt` sigue siendo la unica fecha objetivo operativa del caso
- `won` y `lost` son cierres comerciales, no cierres tecnicos del caso
- el slice no abre forecast, scoring ni automatizaciones comerciales
