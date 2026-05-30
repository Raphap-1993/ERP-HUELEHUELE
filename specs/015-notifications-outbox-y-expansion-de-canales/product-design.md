# Product Design - Notifications Outbox Y Expansion De Canales

Fecha: 2026-05-29.

## Promesa de superficie

`Marketing` y `admin` necesitan una lectura operativa simple del mensaje
saliente dentro de `/notificaciones`: crear una unidad manual, ver el outbox,
leer su estado y revisar la bitacora tecnica sin confundir esa superficie con
una bandeja de conversaciones ni con una consola de soporte.

## Componentes principales

- encabezado del modulo `Notificaciones`
- metric cards de volumen y estado basico
- formulario `Nueva notificación`
- tabla principal del outbox
- tabla secundaria de bitacora
- mensajes inline de `loading` y `error`

## Decisiones

- `/notificaciones` sigue siendo la unica superficie principal del slice
- `Notification` se lee como unidad individual por `audience` y canal
- la creacion manual convive con mensajes que llegan desde productores aguas
  arriba, pero la pagina no distingue visualmente un pipeline por origen
- `scheduledAt` se muestra como programacion visible, no como scheduler
  garantizado
- `NotificationLog` se presenta como lectura tecnica resumida, no como debug
  profundo por provider
- la UI actual expone `email`, `sms`, `whatsapp` e `internal` en el selector
  de canal, pero no promete la misma profundidad de delivery por todos
- los campos `relatedType` y `relatedId` existen en contrato, pero no forman
  parte de la captura manual ni de la tabla visible actual
- las vistas secundarias por origen, relacion o estado quedan hoy resueltas
  por lectura tabular y futura evolucion, no por controles de filtro ya
  presentes en pantalla

## Contrato minimo del corte

- el formulario manual debe poder crear una notificacion con `channel`,
  `audience`, `subject`, `body`, `source` y `scheduledAt`
- la tabla del outbox debe mostrar `Canal`, `Audiencia`, `Asunto`, `Estado`,
  `Origen`, `Programada`, `Enviada` y `Actualizada`
- la tabla de bitacora debe mostrar `Evento`, `Fuente`, `Sujeto`, `Detalle` y
  `Fecha`
- la pantalla no introduce inbox, reply, edicion post-creacion, retry manual
  ni remediacion del dispatch
- `pending`, `sent`, `delivered` y `failed` se leen como lifecycle visible,
  aunque no todos los canales tengan la misma evidencia de confirmacion

## Lecturas secundarias

- `source` funciona como lectura operativa del origen del mensaje
- `scheduledAt` funciona como marca temporal visible del snapshot
- `sentAt` funciona como evidencia funcional de dispatch realizado
- la bitacora complementa el outbox, pero no reemplaza una consola tecnica de
  provider

## Tension principal

La superficie debe dejar claro que el producto ya tiene un outbox serio y un
worker real, pero todavia no tiene una experiencia de soporte, un inbox por
cliente ni un scheduler confiable por `scheduledAt`. El diseño debe conservar
esa honestidad operativa.

## Resultado esperado

El slice puede pasar a arquitectura y SDD con una lectura comun entre alta
manual, outbox visible y timeline tecnico resumido, manteniendo la frontera
entre mensaje saliente, delivery tecnico y futuras expansiones de canales.
