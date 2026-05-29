# Reglas De Pipeline Comercial Amplio

- `011` vive sobre `customer_relationship_case`
- no abre `commercial_opportunity`
- `pipelineStage` usa `new`, `contacted`, `engaged`, `nurturing`, `won` y
  `lost`
- `pipelineStage` es manual por `ventas`
- `pipelineStage` nace en `new` y no puede quedar nulo al abrir el caso
- `status` y `pipelineStage` son ejes separados con guardrails suaves
- se permiten saltos manuales entre etapas
- todo cambio de etapa deja trazabilidad en el timeline
- `priority` usa `low`, `medium` y `high`
- `priority` es manual
- `commercialChannel` usa `storefront`, `vendor`, `wholesale`,
  `manual_outreach`, `reactivation` y `referral`
- `commercialChannel` es el origen principal del caso
- `commercialChannel` no modela el canal de cada contacto del timeline
- `commercialChannel` no cambia libremente en cada movimiento del pipeline
- el pipeline se filtra por canal, no por subpipelines separados
- `lostReason` usa `no_response`, `price`, `timing`, `competition`,
  `not_fit` y `other`
- `lostReason` es obligatorio al pasar a `lost`
- `won` exige nota de cierre y evidencia o referencia
- `won` no se marca automaticamente desde eventos del sistema
- tras `won`, se sugiere `resolved` si ya no queda trabajo activo
- tras `lost`, se sugiere `dormant` si podria existir reactivacion futura o
  `resolved` si la relacion comercial queda cerrada
- la reapertura desde `lost` devuelve `pipelineStage` a `contacted`
- la reapertura limpia el `lostReason` vigente y conserva la razon previa en
  la traza historica
- la reapertura exige revalidar `commercialOwner`, `assignee`, `nextStep`,
  `followUpAt` y `priority`
- `lastPipelineActivityAt` resume la ultima actividad comercial relevante
- `lastPipelineActivityAt` se actualiza con cambios de etapa
- `lastPipelineActivityAt` se actualiza con `note`, `call`, `whatsapp` y
  `email`
- `lastPipelineActivityAt` se actualiza con cierres `won` y `lost`
- `lastPipelineActivityAt` se actualiza con reapertura comercial
- `followUpAt` sigue siendo la unica fecha objetivo operativa del caso
- `won` y `lost` son cierres comerciales, no cierres tecnicos del caso
- se evita `pipelineStage = new` junto con `status = resolved`
- se evita `pipelineStage = won` junto con `status = dormant`
- se evita `pipelineStage = lost` con `status = open` o
  `waiting_customer` si falta `lostReason`
- el slice no abre forecast, scoring ni automatizaciones comerciales
