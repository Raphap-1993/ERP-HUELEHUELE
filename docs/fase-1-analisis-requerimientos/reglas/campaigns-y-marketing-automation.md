# Reglas De Campaigns Y Marketing Automation

- `marketing` es el dueno operativo principal del slice
- `admin` y `super_admin` conservan soporte y override operativo
- `campaigns` es el agregado principal
- `segments` y `templates` entran como catalogos read-only `as-is`
- los canales canonicos del slice son `email`, `sms` y `whatsapp`
- sin `scheduledAt` la campana nace `running/running`
- con `scheduledAt` la campana nace `scheduled/queued`
- la campana congela `segmentName`, `templateName`, `bodyPreview` y
  `recipients`
- el runtime actual exige `name`, `goal`, existencia de `segmentId`,
  existencia de `templateId` y compatibilidad entre
  `template.channel` y `campaign.channel`
- el runtime actual no bloquea por estado de catalogo como hard gate del slice
- `marketing` registra auditoria, historial y eventos del dominio
- `marketing` no despacha; `notifications/worker` despachan
- journeys, CRM ampliado y automation multi-step quedan fuera
