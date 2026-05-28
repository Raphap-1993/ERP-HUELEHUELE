# SPDD Frontend - Campaigns Marketing Automation

Fecha: 2026-05-27.

## Superficies cubiertas

- `/marketing`

## Contratos visibles

- metricas de campanas: total, activas, programadas y completadas
- modal `Nueva campana` con `name`, `goal`, `segmentId`, `templateId`,
  `channel` y `scheduledAt`
- tabla de campanas con columna principal `Campana` (`campaign.name`), mas
  `segmentName`, `channel`, `status`, `runStatus`, `recipients` y
  `scheduledAt`
- selector read-only de segmentos que lista nombres
- tarjeta de resumen posterior para segmento con `name` y `audienceSize`
- selector read-only de plantillas que lista nombres
- tarjeta de resumen posterior para plantilla con `name` y `subject`
- tabla read-only de plantillas con `channel`, `subject`, `status` y
  `updatedAt`, y con columna principal `Plantilla` (`template.name`)
- mensajes inline de `loading` y `error`
- `fetchCampaignEvents()` existe en cliente, pero no se consume ni se renderiza
  en la superficie actual

## Reglas visibles

- no hay editor de segmentos ni editor de plantillas dentro de
  `/marketing`
- la UI exige `name`, `goal`, `segmentId` y `templateId` para crear la
  campana
- el backend valida `name`, `goal`, existencia de IDs y compatibilidad entre
  `template.channel` y `campaign.channel`
- dejar `scheduledAt` vacio equivale a corrida inmediata; informarlo abre
  programacion basica
- el `status` de segmento existe a nivel de API pero no se ve hoy en pantalla
- crear campana en este runtime persiste campaign, auditoria y eventos propios
  de `marketing`, pero no dispara un handoff real a `NotificationsService`
- la cola y la entrega tecnica permanecen fuera de la superficie y fuera del
  flujo visible actual de `/marketing`

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.05-campaigns-marketing-automation.md`
- `docs/fase-1-analisis-requerimientos/reglas/campaigns-y-marketing-automation.md`

## Dependencias de Fase 3

- el ownership entre `marketing`, `notifications` y `worker`
- la ADR de frontera entre orquestacion comercial y dispatch tecnico del slice
