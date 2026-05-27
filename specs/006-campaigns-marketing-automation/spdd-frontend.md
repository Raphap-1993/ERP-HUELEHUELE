# SPDD Frontend - Campaigns Marketing Automation

Fecha: 2026-05-27.

## Superficies cubiertas

- `/admin/marketing`

## Contratos visibles

- metricas de campanas: total, activas, programadas y completadas
- modal `Nueva campana` con `name`, `goal`, `segmentId`, `templateId`,
  `channel` y `scheduledAt`
- tabla de campanas con `segmentName`, `channel`, `status`, `runStatus`,
  `recipients` y `scheduledAt`
- selector read-only de segmentos con previsualizacion minima de
  `audienceSize`
- selector read-only de plantillas con previsualizacion de `subject`
- tabla read-only de plantillas con `channel`, `subject`, `status` y
  `updatedAt`
- mensajes inline de `loading` y `error`
- `fetchCampaignEvents()` existe en cliente, pero no se consume ni se renderiza
  en la superficie actual

## Reglas visibles

- no hay editor de segmentos ni editor de plantillas dentro de
  `/admin/marketing`
- la UI exige seleccionar `segmentId` y `templateId` para crear la campana
- el backend valida existencia de IDs y compatibilidad entre
  `template.channel` y `campaign.channel`
- dejar `scheduledAt` vacio equivale a corrida inmediata; informarlo abre
  programacion basica
- el `status` de segmento existe a nivel de API pero no se ve hoy en pantalla
- la entrega tecnica y la cola de notificaciones viven fuera de esta
  superficie

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md`
- `docs/fase-1-analisis-requerimientos/reglas/campaigns-y-marketing-automation.md`

## Dependencias de Fase 3

- el ownership entre `marketing`, `notifications` y `worker`
- la ADR de frontera entre orquestacion comercial y dispatch tecnico del slice
