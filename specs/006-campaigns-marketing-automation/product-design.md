# Product Design - Campaigns Marketing Automation

Fecha: 2026-05-27.

## Experiencia objetivo

- workbench de campanas claro y operativo en `/marketing` sobre el dominio
  admin
- creacion simple con scheduling basico y snapshot de negocio
- catalogos read-only de segmentos y plantillas sin authoring adicional

## Decisiones

- `campaigns` es el agregado principal y concentra la lectura operativa
- `segments` se seleccionan como dependencia read-only y el dropdown muestra
  solo `name`; la audiencia aparece en una tarjeta de resumen separada
- `templates` se seleccionan como dependencia read-only y ademas quedan
  visibles en tabla con `status`; el dropdown muestra `name` y el `subject`
  aparece en una tarjeta de resumen separada
- `scheduledAt` separa corrida inmediata de programacion basica
- la UI muestra `status` y `runStatus`, pero no expone timeline de eventos ni
  delivery tecnico dentro del workbench
- la campana congela snapshot de segmento, plantilla y destinatarios al
  crearse, aunque la inspeccion detallada del snapshot no forma parte de esta
  fase
- la relacion con `notifications` y `worker` se conserva como frontera
  canonica del slice fuera del workbench, no como handoff runtime ya
  ejecutado desde la creacion de campana

## Tension principal

La experiencia debe dejar claro que `marketing` puede registrar, programar y
seguir campanas reales, pero sin vender una promesa falsa de automation suite
completa. El runtime vigente resuelve bien la creacion operativa y la lectura
de estado, pero mantiene fuera de pantalla la bitacora de eventos y no dispara
desde esta superficie un handoff real a `notifications`; la documentacion UX
debe respetar esa frontera as-is.

## Resultado esperado

El slice puede evolucionar a arquitectura y SDD con una lectura comun entre
workbench de marketing, catalogos read-only y frontera de dispatch
desacoplada.
