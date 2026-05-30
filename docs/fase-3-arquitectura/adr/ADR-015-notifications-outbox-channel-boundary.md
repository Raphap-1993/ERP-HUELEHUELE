# ADR-015 Notifications Outbox Channel Boundary

Fecha: 2026-05-29.

## Estado

Aprobado para la fase 3 canonica brownfield del slice
`015-notifications-outbox-y-expansion-de-canales`.

## Contexto

El runtime vigente ya expone `/notificaciones` como superficie de lectura y
alta manual, `notifications.service` como fachada del outbox, y `worker` con
dispatch real visible al menos para `email`. Al mismo tiempo, `campaigns`,
scoring y journeys ya producen o pueden producir mensajes salientes, pero no
deben absorber la frontera de delivery tecnico.

El problema de este corte no es abrir una experiencia de soporte, un inbox por
cliente ni un scheduler real, sino fijar la frontera que permita:

- tratar cada envio como una unidad individual por destinatario/canal;
- separar snapshot funcional y evidencia tecnica;
- mantener desacoplados productores aguas arriba, outbox y worker;
- y admitir expansion de canales sin fingir paridad total de delivery.

Ademas, el repo deja visible una tension brownfield que hay que preservar en el
canon: el schema Prisma historico no coincide plenamente con el contrato
funcional actual expuesto por `packages/shared`, la UI de `/notificaciones` y
`notifications.service`.

## Decision

El slice brownfield `015` se canoniza en `notifications` como outbox saliente
unificado, manteniendo `Notification` como agregado principal y
`NotificationLog` como timeline tecnico append-only, con `worker` y adapters
por canal como frontera de dispatch.

La decision incluye estas reglas:

1. `notifications` sigue siendo el dominio ancla del outbox saliente.
2. `Notification` sigue siendo la unidad funcional principal.
3. una `Notification` representa una sola unidad por `audience` y canal.
4. el snapshot funcional se materializa al dispararse y no se edita.
5. `source` es obligatorio.
6. `relatedType` y `relatedId` se conservan cuando el flujo ya los resuelve,
   sin endurecerse aun como hard gate universal de la UI manual.
7. `NotificationLog` concentra la evidencia tecnica append-only.
8. `notifications` registra, persiste y encola.
9. `worker` ejecuta el dispatch real.
10. el worker reintenta sobre la misma unidad y no crea otra notificacion por
    intento tecnico.
11. el lifecycle funcional usa `pending`, `sent`, `delivered` y `failed`.
12. `delivered` solo aplica cuando el canal realmente puede confirmarlo.
13. `email` queda como canal con evidencia fuerte de provider real.
14. `sms`, `whatsapp` e `internal` quedan canonizados con capacidad graduada.
15. `scheduledAt` queda como metadata visible y no como scheduler real.
16. el canon funcional visible prevalece sobre lecturas aisladas del schema
    Prisma legacy.
17. el slice no abre inbox, replies, inbound tecnico ni consola humana de
    remediacion.

## Guardrails Derivados

1. `006` sigue gobernando authoring y orquestacion de campaigns.
2. `012` sigue gobernando reglas simples y side effects comerciales.
3. `014` sigue gobernando journeys multi-step sobre el caso comercial.
4. ninguno de esos slices asume ownership del dispatch tecnico final.
5. `/notificaciones` no debe venderse como inbox ni como soporte humano.
6. `scheduledAt` no debe usarse para prometer scheduling real hasta otro corte
   explicito.
7. cualquier inbound por canal requiere otra ADR.

## Alternativas Rechazadas

### 1. Mover el outbox a `/crm`

Rechazada porque:

- mezcla delivery tecnico con workbench comercial;
- borra la frontera ya visible de `/notificaciones`;
- complica ownership entre `marketing`, `ventas` y `worker`.

### 2. Abrir multireceptor dentro de una sola `Notification`

Rechazada porque:

- debilita trazabilidad por destinatario/canal;
- complica reintentos y estados funcionales;
- contradice el runtime visible del servicio.

### 3. Mezclar evidencia tecnica dentro del agregado padre

Rechazada porque:

- hace opaca la frontera entre snapshot funcional y delivery tecnico;
- ensucia la lectura administrativa del outbox;
- dificulta mantener un timeline append-only serio.

### 4. Prometer scheduler real a partir de `scheduledAt`

Rechazada porque:

- el runtime visible no lo demuestra hoy;
- crea una expectativa operacional falsa;
- adelanta un corte tecnico distinto del problema actual.

## Consecuencias

### Positivas

- deja una frontera clara entre intencion de comunicar y delivery tecnico;
- preserva una unidad individual trazable por destinatario/canal;
- permite expansion progresiva de canales sin romper el canon;
- mantiene a `/notificaciones` como workbench serio del outbox.

### Negativas aceptadas

- la UI sigue siendo simple y sin consola de remediacion;
- `scheduledAt` sigue siendo solo metadata;
- la paridad de delivery entre canales no existe todavia;
- el schema Prisma queda reconocido como brownfield parcial, no como verdad
  funcional unica.

## Regla De Reevaluacion

Esta ADR solo debe reabrirse si:

- se aprueba inbox o mensajeria bidireccional real;
- se incorpora inbound tecnico por algun canal;
- se habilita scheduler real de dispatch diferido;
- se abandona `Notification` como unidad individual por destinatario/canal;
- o `notifications` deja de ser la frontera central del outbox saliente.
