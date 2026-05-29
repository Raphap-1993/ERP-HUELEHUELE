# Huele Huele Notifications Outbox Y Expansion De Canales Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir el slice canonico `015-notifications-outbox-y-expansion-de-canales` en `ERP-HUELEHUELE` como homologacion brownfield `as-is`, formalizando `notifications` como outbox saliente unificado, con `Notification` individual por destinatario/canal, snapshot materializado, `NotificationLog` append-only, adapters por canal y capacidad graduada de delivery sin abrir inbox, inbound tecnico ni conversacion bidireccional.

**Architecture:** La homologacion aterriza sobre el modulo `notifications`, su `worker` y la frontera ya fijada desde `006`, manteniendo a `campaigns`, `orders`, `loyalty`, `012` y `014` como productores aguas arriba. El slice consolida `/notificaciones` como workbench operativo principal, fija el lifecycle unificado `pending/sent/delivered/failed`, separa evidencia funcional de evidencia tecnica y deja `email` como delivery real probado, con `sms`, `whatsapp` e `internal` como canales canonizados de capacidad graduada.

**Tech Stack:** Markdown, git worktree, monorepo `Next.js` + `NestJS` + `Prisma`, runtime real en `apps/admin`, `apps/api`, `apps/worker`, contratos en `packages/shared`, outline API y capa transversal documental, verificacion con `git diff --check`, `git status`, `rg`, `find` y `sed`.

---

## File Structure

### Existing files to modify

- `docs/fase-1-analisis-requerimientos/README.md`
- `docs/fase-2-ux-ui/README.md`
- `docs/fase-3-arquitectura/README.md`
- `docs/fase-4-sdd/README.md`
- `docs/api/api-v1-outline.md`
- `docs/transversal/90.00-mapa-homologacion-brownfield.md`
- `AI_CONTEXT.md`
- `TRACEABILITY_MATRIX.md`
- `PROJECT_MAP.md`

### New Phase 1 files

- `docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-43-materializacion-y-encolado-de-notificaciones-salientes.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-44-delivery-worker-y-trazabilidad-append-only.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-45-idempotencia-y-capacidad-graduada-por-canal.md`
- `docs/fase-1-analisis-requerimientos/reglas/notifications-outbox-y-expansion-de-canales.md`

### New Phase 2 files

- `docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md`
- `specs/015-notifications-outbox-y-expansion-de-canales/product-design.md`
- `specs/015-notifications-outbox-y-expansion-de-canales/spdd-frontend.md`

### New Phase 3 files

- `docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md`
- `docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md`

### New Phase 4 files

- `specs/015-notifications-outbox-y-expansion-de-canales/spec-funcional.md`
- `specs/015-notifications-outbox-y-expansion-de-canales/spec-tecnica.md`
- `specs/015-notifications-outbox-y-expansion-de-canales/spec-tareas.md`
- `specs/015-notifications-outbox-y-expansion-de-canales/traceability.md`

### Responsibilities

- Fase 1 fija el dominio funcional del outbox: una `Notification` individual por destinatario/canal, snapshot materializado, inmutabilidad, `NotificationLog` append-only, `source/relatedType/relatedId`, lifecycle unificado y `scheduledAt` solo como metadata visible.
- Fase 2 fija `/notificaciones` como workbench principal `as-is`: creacion manual, tabla del outbox, filtros por origen, estado y canal, y lectura de logs tecnicos sin consola de remediacion ni edicion post-creacion.
- Fase 3 fija la frontera entre `notifications`, `worker`, adapters por canal, productores aguas arriba y la separacion entre evidencia funcional y evidencia tecnica del dispatch.
- Fase 4 convierte el slice en paquete SDD trazable para evolucion futura sin mezclar outbox saliente con inbox, inbound tecnico o conversacion bidireccional.
- La capa transversal actualiza el gap principal del canon: despues de `015` el frente pendiente ya no es “expansion de canales outbound”, sino inbox/comunicacion bidireccional o inbound tecnico solo si el brownfield lo justifica.

### Task 1: Abrir Fase 1 del slice `015-notifications-outbox-y-expansion-de-canales`

**Files:**
- Modify: `docs/fase-1-analisis-requerimientos/README.md`
- Create: `docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-43-materializacion-y-encolado-de-notificaciones-salientes.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-44-delivery-worker-y-trazabilidad-append-only.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-45-idempotencia-y-capacidad-graduada-por-canal.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/notifications-outbox-y-expansion-de-canales.md`

- [ ] **Step 1: Releer el contexto canonico y el runtime real de notifications**

Run:

```bash
sed -n '1,260p' docs/superpowers/specs/2026-05-29-huelehuele-notifications-outbox-y-expansion-de-canales-design.md
sed -n '1,260p' apps/api/src/modules/notifications/notifications.service.ts
sed -n '1,220p' apps/api/src/modules/notifications/notifications.controller.ts
sed -n '1,220p' apps/worker/src/main.ts
sed -n '1480,1615p' prisma/schema.prisma
```

Expected: evidencia de `Notification`, `NotificationLog`, `worker`, `email` real, canales `sms/whatsapp/internal`, `scheduledAt` visible y ausencia de inbox o inbound tecnico.

- [ ] **Step 2: Actualizar el indice de Fase 1**

Anadir en `docs/fase-1-analisis-requerimientos/README.md`:

```md
## Slice 015 - Notifications Outbox Y Expansion De Canales
- [01.14-notifications-outbox-y-expansion-de-canales.md](01.14-notifications-outbox-y-expansion-de-canales.md)
- [casos-de-uso/UC-43-materializacion-y-encolado-de-notificaciones-salientes.md](casos-de-uso/UC-43-materializacion-y-encolado-de-notificaciones-salientes.md)
- [casos-de-uso/UC-44-delivery-worker-y-trazabilidad-append-only.md](casos-de-uso/UC-44-delivery-worker-y-trazabilidad-append-only.md)
- [casos-de-uso/UC-45-idempotencia-y-capacidad-graduada-por-canal.md](casos-de-uso/UC-45-idempotencia-y-capacidad-graduada-por-canal.md)
- [reglas/notifications-outbox-y-expansion-de-canales.md](reglas/notifications-outbox-y-expansion-de-canales.md)
```

- [ ] **Step 3: Crear el documento rector de Fase 1**

Crear `docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md` con esta estructura base:

```md
# Fase 1 - Notifications Outbox Y Expansion De Canales

## Objetivo
Homologar `notifications` como outbox saliente canonico del brownfield, con una `Notification` individual por destinatario/canal, snapshot materializado, `NotificationLog` append-only, lifecycle unificado, adapters por canal y capacidad graduada de delivery sin abrir inbox ni inbound tecnico.

## Dentro de alcance
- `Notification`
- `NotificationLog`
- `email`
- `sms`
- `whatsapp`
- `internal`
- `pending`
- `sent`
- `delivered`
- `failed`
- `source`
- `relatedType`
- `relatedId`
- `scheduledAt` como metadata visible
- retry/backoff por canal
- idempotencia por origen + destinatario + canal
- `/notificaciones` como workbench principal

## Fuera de alcance
- inbox comercial
- threads
- replies
- inbound tecnico
- webhooks de recepcion
- scheduler real diferido
- edicion post-creacion
- resend/retry manual desde UI

## Regla critica
- una `Notification` es una unidad individual por destinatario/canal
- el snapshot funcional es inmutable
- la evidencia tecnica vive en `NotificationLog`
- `notifications` registra y encola
- `worker` entrega
```

- [ ] **Step 4: Crear los tres casos de uso canonicos**

Crear `UC-43-materializacion-y-encolado-de-notificaciones-salientes.md`:

```md
# UC-43 Materializacion Y Encolado De Notificaciones Salientes

## Actores
- marketing
- orders
- loyalty
- journeys
- notifications

## Flujo principal
1. un productor aguas arriba decide disparar un mensaje saliente
2. se materializa una `Notification` individual por destinatario y canal
3. el snapshot congela `audience`, `subject`, `body`, `channel`, `source`, `relatedType` y `relatedId`
4. la `Notification` queda en estado `pending`
5. `notifications` la encola para `worker`
```

Crear `UC-44-delivery-worker-y-trazabilidad-append-only.md`:

```md
# UC-44 Delivery Worker Y Trazabilidad Append Only

## Actores
- worker
- adapter de canal
- provider

## Flujo principal
1. `worker` toma una `Notification` pendiente
2. ejecuta el adapter correspondiente al canal
3. actualiza estado funcional a `sent` o `failed`
4. si el canal puede confirmarlo, puede registrar `delivered`
5. cada intento, fallo, provider id o requeue deja evento nuevo en `NotificationLog`
```

Crear `UC-45-idempotencia-y-capacidad-graduada-por-canal.md`:

```md
# UC-45 Idempotencia Y Capacidad Graduada Por Canal

## Actores
- notifications
- worker
- marketing

## Flujo principal
1. un mismo origen intenta disparar un mensaje equivalente
2. el sistema valida idempotencia por origen de negocio + destinatario + canal
3. no materializa una nueva `Notification` equivalente sin intencion explicita
4. `email` se trata como delivery real visible
5. `sms`, `whatsapp` e `internal` quedan canonizados con capacidad graduada
```

- [ ] **Step 5: Crear la hoja de reglas funcionales**

Crear `docs/fase-1-analisis-requerimientos/reglas/notifications-outbox-y-expansion-de-canales.md`:

```md
# Reglas De Notifications Outbox Y Expansion De Canales

- `015` es solo outbound
- `Notification` es el agregado principal
- una `Notification` representa una sola unidad por destinatario/canal
- la notificacion se materializa al dispararse
- el snapshot funcional es inmutable
- `NotificationLog` es append-only
- `source` es obligatorio
- `relatedType` y `relatedId` son obligatorios en flujos de negocio reales
- lifecycle unificado: `pending`, `sent`, `delivered`, `failed`
- `delivered` solo aplica cuando el canal/adapter realmente puede confirmarlo
- `scheduledAt` no implica scheduler real en este corte
- `notifications` gobierna el outbox
- `worker` ejecuta el dispatch
- la evidencia tecnica vive principalmente en `NotificationLog`
- retry y backoff viven por canal/adapter
- idempotencia por origen de negocio + destinatario + canal
- `/notificaciones` es la superficie principal
```

- [ ] **Step 6: Verificar Fase 1 abierta**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort | rg "01.14|UC-43|UC-44|UC-45|notifications-outbox"
rg -n "NotificationLog|scheduledAt|idempotencia|outbound|append-only" docs/fase-1-analisis-requerimientos
```

Expected: aparecen los archivos nuevos y el `rg` devuelve hits del slice `015`.

- [ ] **Step 7: Commit de Fase 1**

```bash
git add docs/fase-1-analisis-requerimientos
git commit -m "docs: open notifications outbox phase 1 slice"
```

### Task 2: Abrir Fase 2 y los artefactos UX del slice `015`

**Files:**
- Modify: `docs/fase-2-ux-ui/README.md`
- Create: `docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md`
- Create: `specs/015-notifications-outbox-y-expansion-de-canales/product-design.md`
- Create: `specs/015-notifications-outbox-y-expansion-de-canales/spdd-frontend.md`

- [ ] **Step 1: Releer la UI real de notificaciones**

Run:

```bash
sed -n '1,320p' apps/admin/components/notifications-workspace.tsx
sed -n '1,120p' apps/admin/app/notificaciones/page.tsx
sed -n '1,240p' docs/flows/campaigns-and-notifications.md
```

Expected: evidencia de formulario manual, tabla del outbox, metric cards, logs y ausencia de consola de remediacion o inbox.

- [ ] **Step 2: Actualizar el indice de Fase 2**

Anadir en `docs/fase-2-ux-ui/README.md`:

```md
## Slice 015 - Notifications Outbox Y Expansion De Canales
- [02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md](02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md)
```

- [ ] **Step 3: Crear el documento UX canonico**

Crear `docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md` con esta estructura base:

```md
# Fase 2 - Notifications Outbox Y Expansion De Canales UX/UI

## Superficie principal
- `/notificaciones`

## Objetivo de la vista
- crear mensajes manuales
- leer el outbox saliente
- inspeccionar estado y logs
- filtrar por canal, origen y estado

## Componentes principales
- encabezado de modulo
- metric cards
- formulario de nueva notificacion
- tabla del outbox
- tabla de logs

## No incluido
- inbox por cliente
- replies
- resend manual
- edicion de notificaciones creadas
```

- [ ] **Step 4: Crear `product-design.md`**

Crear `specs/015-notifications-outbox-y-expansion-de-canales/product-design.md`:

```md
# Product Design - Notifications Outbox Y Expansion De Canales

## Principio rector
`/notificaciones` es un workbench de outbox saliente, no una consola de conversacion.

## Lecturas primarias
- canal
- audiencia
- asunto
- estado
- origen
- relacion de negocio
- programacion visible
- envio realizado

## Lecturas secundarias
- logs tecnicos
- filtros por `source`
- filtros por `relatedType`
- filtros por `relatedId`
```

- [ ] **Step 5: Crear `spdd-frontend.md`**

Crear `specs/015-notifications-outbox-y-expansion-de-canales/spdd-frontend.md`:

```md
# SPDD Frontend - Notifications Outbox Y Expansion De Canales

## Contrato visual
- `NotificationsWorkspace` sigue siendo la superficie principal
- la UI no promete inbox ni delivery confirmado para todos los canales
- `scheduledAt` se muestra como metadata visible, no como scheduler probado
- `NotificationLog` se presenta como timeline tecnico de delivery

## Guardrails
- no introducir affordances de reply
- no introducir editor post-creacion
- no introducir botones de retry manual si el runtime no los soporta
```

- [ ] **Step 6: Verificar Fase 2 abierta**

Run:

```bash
find docs/fase-2-ux-ui specs/015-notifications-outbox-y-expansion-de-canales -maxdepth 2 -type f | sort
rg -n "outbox|NotificationsWorkspace|scheduledAt|NotificationLog|reply|inbox" docs/fase-2-ux-ui specs/015-notifications-outbox-y-expansion-de-canales
```

Expected: existen los artefactos nuevos y el `rg` confirma la semantica outbound del slice.

- [ ] **Step 7: Commit de Fase 2**

```bash
git add docs/fase-2-ux-ui specs/015-notifications-outbox-y-expansion-de-canales
git commit -m "docs: add notifications outbox ux slice"
```

### Task 3: Abrir Fase 3 de arquitectura y ADR del slice `015`

**Files:**
- Modify: `docs/fase-3-arquitectura/README.md`
- Create: `docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md`

- [ ] **Step 1: Releer las fronteras canonicas relacionadas**

Run:

```bash
sed -n '1,260p' docs/fase-3-arquitectura/adr/ADR-006-campaigns-dispatch-boundary.md
sed -n '1,260p' docs/fase-3-arquitectura/adr/ADR-012-customers-scoring-automation-boundary.md
sed -n '1,260p' docs/fase-3-arquitectura/adr/ADR-014-customers-commercial-journey-boundary.md
sed -n '1,220p' apps/api/src/modules/notifications/notifications.controller.ts
sed -n '1,240p' apps/worker/src/main.ts
```

Expected: evidencia de que `notifications` es frontera tecnica de dispatch separada de campaigns, scoring y journeys.

- [ ] **Step 2: Actualizar el indice de Fase 3**

Anadir en `docs/fase-3-arquitectura/README.md`:

```md
## Slice 015 - Notifications Outbox Y Expansion De Canales
- [03.17-notifications-outbox-y-expansion-de-canales.md](03.17-notifications-outbox-y-expansion-de-canales.md)
- [adr/ADR-015-notifications-outbox-channel-boundary.md](adr/ADR-015-notifications-outbox-channel-boundary.md)
```

- [ ] **Step 3: Crear el documento principal de arquitectura**

Crear `docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md`:

```md
# Fase 3 - Notifications Outbox Y Expansion De Canales

## Decisiones principales
- `Notification` sigue siendo el agregado principal
- una unidad individual por destinatario/canal
- `NotificationLog` append-only como evidencia tecnica
- `notifications` registra y encola
- `worker` ejecuta
- adapters separados por canal
- `email` real, `sms/whatsapp/internal` graduados

## Fronteras
- campaigns y journeys producen intencion
- `notifications` materializa el outbox
- el worker despacha
- el provider confirma o falla
```

- [ ] **Step 4: Crear la ADR de frontera**

Crear `docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md`:

```md
# ADR-015 Notifications Outbox Channel Boundary

## Decision
Canonizar `notifications` como outbox saliente unificado del brownfield, manteniendo `Notification` como unidad individual por destinatario/canal, `NotificationLog` como timeline tecnico append-only y `worker` + adapters como frontera de delivery.

## Se acepta porque
- refleja el runtime actual
- mantiene desacoplados campaigns, scoring y journeys
- no inventa inbox ni inbound tecnico
- permite capacidad graduada por canal

## Se rechaza
- mover el outbox a `/crm`
- abrir multireceptor dentro de una sola `Notification`
- mezclar evidencia tecnica dentro del agregado padre
- prometer scheduler real usando `scheduledAt`
```

- [ ] **Step 5: Verificar Fase 3 abierta**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 2 -type f | sort | rg "03.17|ADR-015"
rg -n "NotificationLog|adapter|worker|outbox|scheduledAt|inbound" docs/fase-3-arquitectura
```

Expected: existen los dos artefactos nuevos y el `rg` devuelve las fronteras del slice `015`.

- [ ] **Step 6: Commit de Fase 3**

```bash
git add docs/fase-3-arquitectura
git commit -m "docs: add notifications outbox architecture slice"
```

### Task 4: Abrir Fase 4 y paquete SDD del slice `015`

**Files:**
- Modify: `docs/fase-4-sdd/README.md`
- Create: `specs/015-notifications-outbox-y-expansion-de-canales/spec-funcional.md`
- Create: `specs/015-notifications-outbox-y-expansion-de-canales/spec-tecnica.md`
- Create: `specs/015-notifications-outbox-y-expansion-de-canales/spec-tareas.md`
- Create: `specs/015-notifications-outbox-y-expansion-de-canales/traceability.md`

- [ ] **Step 1: Releer paquetes SDD cercanos**

Run:

```bash
sed -n '1,260p' specs/006-campaigns-marketing-automation/spec-funcional.md
sed -n '1,260p' specs/006-campaigns-marketing-automation/spec-tecnica.md
sed -n '1,260p' specs/014-automatizacion-comercial-amplia/spec-funcional.md
sed -n '1,260p' specs/014-automatizacion-comercial-amplia/spec-tecnica.md
```

Expected: referencias de estructura para funcion, tecnica, tareas y trazabilidad del slice `015`.

- [ ] **Step 2: Actualizar el indice de Fase 4**

Anadir en `docs/fase-4-sdd/README.md`:

```md
## Slice 015 - Notifications Outbox Y Expansion De Canales
- [../../specs/015-notifications-outbox-y-expansion-de-canales/spec-funcional.md](../../specs/015-notifications-outbox-y-expansion-de-canales/spec-funcional.md)
- [../../specs/015-notifications-outbox-y-expansion-de-canales/spec-tecnica.md](../../specs/015-notifications-outbox-y-expansion-de-canales/spec-tecnica.md)
- [../../specs/015-notifications-outbox-y-expansion-de-canales/spec-tareas.md](../../specs/015-notifications-outbox-y-expansion-de-canales/spec-tareas.md)
- [../../specs/015-notifications-outbox-y-expansion-de-canales/traceability.md](../../specs/015-notifications-outbox-y-expansion-de-canales/traceability.md)
```

- [ ] **Step 3: Crear `spec-funcional.md`**

Crear `specs/015-notifications-outbox-y-expansion-de-canales/spec-funcional.md`:

```md
# Spec Funcional - Notifications Outbox Y Expansion De Canales

## Alcance
- outbox saliente unificado
- unidad individual por destinatario/canal
- `email`, `sms`, `whatsapp`, `internal`
- lifecycle `pending/sent/delivered/failed`
- `/notificaciones` como workbench principal

## Reglas funcionales clave
- snapshot materializado
- inmutabilidad post-creacion
- `NotificationLog` append-only
- idempotencia por origen + destinatario + canal
- `scheduledAt` solo como metadata visible
```

- [ ] **Step 4: Crear `spec-tecnica.md`**

Crear `specs/015-notifications-outbox-y-expansion-de-canales/spec-tecnica.md`:

```md
# Spec Tecnica - Notifications Outbox Y Expansion De Canales

## Componentes
- `apps/api/src/modules/notifications`
- `apps/worker/src/main.ts`
- `packages/shared`
- `prisma/schema.prisma`
- `apps/admin/components/notifications-workspace.tsx`

## Fronteras
- productores aguas arriba materializan la `Notification`
- `notifications` persiste y encola
- `worker` despacha
- adapters por canal encapsulan delivery
- `NotificationLog` concentra evidencia tecnica
```

- [ ] **Step 5: Crear `spec-tareas.md` y `traceability.md`**

Crear `specs/015-notifications-outbox-y-expansion-de-canales/spec-tareas.md`:

```md
# Spec Tareas - Notifications Outbox Y Expansion De Canales

1. abrir Fase 1 del slice `015`
2. abrir Fase 2 y SPDD visual
3. abrir Fase 3 y ADR de frontera
4. abrir paquete SDD en `specs/015`
5. sincronizar capa transversal y outline API
```

Crear `specs/015-notifications-outbox-y-expansion-de-canales/traceability.md`:

```md
# Traceability - Notifications Outbox Y Expansion De Canales

- design: `docs/superpowers/specs/2026-05-29-huelehuele-notifications-outbox-y-expansion-de-canales-design.md`
- fase 1: `docs/fase-1-analisis-requerimientos/01.14-notifications-outbox-y-expansion-de-canales.md`
- fase 2: `docs/fase-2-ux-ui/02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md`
- fase 3: `docs/fase-3-arquitectura/03.17-notifications-outbox-y-expansion-de-canales.md`
- adr: `docs/fase-3-arquitectura/adr/ADR-015-notifications-outbox-channel-boundary.md`
```

- [ ] **Step 6: Verificar Fase 4 abierta**

Run:

```bash
find docs/fase-4-sdd specs/015-notifications-outbox-y-expansion-de-canales -maxdepth 2 -type f | sort
rg -n "outbox|Notification|NotificationLog|scheduledAt|idempotencia|append-only" docs/fase-4-sdd specs/015-notifications-outbox-y-expansion-de-canales
```

Expected: existen los cuatro artefactos SDD y los hits funcionales/tecnicos del slice `015`.

- [ ] **Step 7: Commit de Fase 4**

```bash
git add docs/fase-4-sdd specs/015-notifications-outbox-y-expansion-de-canales
git commit -m "docs: add notifications outbox canonical specs"
```

### Task 5: Sincronizar capa transversal, outline API y cerrar el corte

**Files:**
- Modify: `docs/api/api-v1-outline.md`
- Modify: `docs/transversal/90.00-mapa-homologacion-brownfield.md`
- Modify: `AI_CONTEXT.md`
- Modify: `TRACEABILITY_MATRIX.md`
- Modify: `PROJECT_MAP.md`

- [ ] **Step 1: Actualizar el outline API**

Actualizar `docs/api/api-v1-outline.md` para que la seccion de marketing/loyalty/notificaciones incluya al menos:

```md
- `GET /admin/notifications`
- `POST /admin/notifications`
- `GET /admin/notifications/logs`
```

Y una nota corta del slice:

```md
Reglas especificas de notifications:

- `notifications` opera como outbox saliente unificado.
- `scheduledAt` es metadata visible en este corte; no scheduler probado.
- la traza tecnica de delivery vive en `notification_logs`.
```

- [ ] **Step 2: Actualizar `PROJECT_MAP.md`**

Reflejar:

```md
| `docs/fase-1-analisis-requerimientos/` | RF, casos de uso y reglas canonicas de los slices brownfield homologados `001` a `015`. |
| `docs/fase-2-ux-ui/` | UX canonica de las superficies brownfield homologadas `001` a `015`. |
| `docs/fase-3-arquitectura/` | Arquitectura, decisiones y ADRs canonicos de los slices abiertos `001` a `015`. |
| `docs/fase-4-sdd/` | Puente metodologico hacia `specs/` por feature brownfield homologada `001` a `015`. |
| `specs/` | Features canonicas por slice brownfield homologado (`001` a `015` en este corte). |
```

- [ ] **Step 3: Actualizar `AI_CONTEXT.md` y `TRACEABILITY_MATRIX.md`**

Actualizar ambas para que:

```md
- la capa canonica ya cubre `015-notifications-outbox-y-expansion-de-canales`
- el frente pendiente posterior ya no es “expansion de canales outbound”
- el siguiente gap pasa a ser inbox, inbound tecnico o conversacion bidireccional solo si el brownfield lo justifica
```

- [ ] **Step 4: Actualizar el mapa brownfield**

Actualizar `docs/transversal/90.00-mapa-homologacion-brownfield.md` para reflejar:

```md
- `specs/015-notifications-outbox-y-expansion-de-canales/` fija el decimoquinto slice brownfield homologado para outbox saliente y expansion de canales
- la documentacion vigente previa sigue siendo necesaria para inbox, inbound tecnico o mensajeria bidireccional que aun no tienen slice canonico propio
```

- [ ] **Step 5: Verificar cierre documental**

Run:

```bash
git diff --check
git status --short --branch
rg -n "001` a `015|001` a `015|015-notifications-outbox-y-expansion-de-canales|inbox|inbound tecnico|bidireccional" AI_CONTEXT.md PROJECT_MAP.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md docs/api/api-v1-outline.md
```

Expected: `git diff --check` limpio, branch sin conflictos, y los archivos transversales muestran `015` y el nuevo gap residual correcto.

- [ ] **Step 6: Commit final del corte**

```bash
git add docs/api/api-v1-outline.md docs/transversal/90.00-mapa-homologacion-brownfield.md AI_CONTEXT.md TRACEABILITY_MATRIX.md PROJECT_MAP.md
git commit -m "docs: align canonical layer for notifications outbox"
```

## Self-Review

- Cobertura del spec: el plan cubre Fase 1, Fase 2, Fase 3, Fase 4, sincronizacion transversal y outline API del slice `015`.
- Placeholder scan: no usar `TODO`, `TBD`, “similar al anterior” ni referencias vagas; si durante la ejecucion aparece drift de nombres, corregirlo en el mismo task.
- Consistencia de tipos: mantener exactamente estos ids y nombres durante toda la ejecucion:
  - `015-notifications-outbox-y-expansion-de-canales`
  - `01.14-notifications-outbox-y-expansion-de-canales.md`
  - `02.14-notifications-outbox-y-expansion-de-canales-ux-ui.md`
  - `03.17-notifications-outbox-y-expansion-de-canales.md`
  - `ADR-015-notifications-outbox-channel-boundary.md`
  - `specs/015-notifications-outbox-y-expansion-de-canales/`
  - `UC-43`, `UC-44`, `UC-45`
