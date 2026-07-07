# 016-inbox-comercial-y-comunicacion-bidireccional - Checkpoint

Fecha: 2026-05-30

## Estado

El slice `016` quedó en fase de homologacion funcional, con el perimetro ya bastante cerrado para inbox comercial bidireccional sobre `email` y conversaciones existentes.

## Decision fija

- El slice canoniza un inbox de lectura y respuesta sobre conversaciones existentes.
- El inbound real empieza por `email/replies`.
- El agregado principal es `thread/conversation`.
- Cada thread puede entrar primero sin resolver y luego vincularse al cliente correcto.
- Un thread agrupa una conversacion continua; solo abre otro si cambia claramente el asunto.
- El thread tiene estado propio: `open`, `pending_reply`, `answered`, `closed`.
- Se responde desde el mismo thread, pero la entrega real sigue pasando por `notifications`.
- Cada respuesta queda ligada a un mensaje saliente individual.
- Hay `owner` unico por thread y `assignee` actual.
- Hay SLA/timeout visible, sin automatizacion dura.
- El thread puede cerrarse manualmente, incluso si quedan pendientes, con aviso.
- Hay una bandeja unica con filtros por owner, estado y asignacion.
- Se incluyen adjuntos y metadatos canonicos.
- Hay `internal notes` separadas de los mensajes reales.
- Las notas internas viven en un timeline paralelo ligado al thread.
- Se permite reasignacion con historial de ownership.
- La vinculacion a `customer_relationship_case` / `commercial_opportunity` se intenta automaticamente y la UI permite correccion manual.
- Existe una vista de triage para mensajes sin resolver.
- El triage no responde hasta resolver la vinculacion.
- `email` es el canal fuerte; `internal` y `whatsapp` quedan solo si el inbound real existe de verdad en runtime.
- Se habilitan busqueda por texto y filtros desde el inicio.
- Se agregan tags manuales con catalogo corto: `sales`, `support`, `billing`, `follow_up`, `other`.
- Un solo tag principal por thread.
- El cierre operativo pasa a `closed` y luego `archived` para separar resolucion de limpieza historica.

## Pendiente abierto

- Definir si `archived` sera automatico despues de `closed`, manual, o mixto.

## Proximo paso recomendado

- Retomar desde la decision pendiente de `archived`.
- Si se confirma el flujo, seguir con la arquitectura funcional final del slice `016`.

