# Huele Huele Loyalty Points Redemptions Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir el slice canonico `004-loyalty-points-redemptions` en `ERP-HUELEHUELE` como homologacion brownfield `as-is`, dejando Fases 1-4 y specs listos para el programa de puntos, canjes y ledger loyalty sin abrir un motor avanzado ni autoservicio de canje.

**Architecture:** La homologacion aterriza sobre el producto vivo existente. Se crean artefactos canonicos de requerimientos, UX, arquitectura y specs para el flujo real `earn -> pending -> available -> redemption -> reversal`, fijando que los puntos pertenecen a cuentas autenticadas, que existe una sola `loyalty_rule` activa y que el canje `pending` reserva puntos de inmediato hasta resolucion operativa en `/admin/loyalty`.

**Tech Stack:** Markdown, git worktree, monorepo `Next.js` + `NestJS` + `Prisma`, docs brownfield existentes, runtime loyalty real, verificacion documental con `git diff --check`, `rg`, `find` y chequeo local de links markdown.

---

## File Structure

### Existing files to modify

- `docs/fase-1-analisis-requerimientos/README.md`
- `docs/fase-2-ux-ui/README.md`
- `docs/fase-3-arquitectura/README.md`
- `docs/fase-4-sdd/README.md`
- `docs/transversal/90.00-mapa-homologacion-brownfield.md`
- `AI_CONTEXT.md`
- `TRACEABILITY_MATRIX.md`

### New Phase 1 files

- `docs/fase-1-analisis-requerimientos/01.03-loyalty-points-redemptions.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-10-acumulacion-y-liberacion-de-puntos.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-11-canje-pendiente-y-reserva.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-12-ajustes-manuales-y-reversa-automatica.md`
- `docs/fase-1-analisis-requerimientos/reglas/loyalty-y-canjes.md`

### New Phase 2 files

- `docs/fase-2-ux-ui/02.03-loyalty-points-redemptions-ux-ui.md`
- `specs/004-loyalty-points-redemptions/product-design.md`
- `specs/004-loyalty-points-redemptions/spdd-frontend.md`

### New Phase 3 files

- `docs/fase-3-arquitectura/03.06-loyalty-points-redemptions.md`
- `docs/fase-3-arquitectura/adr/ADR-004-loyalty-redemption-reservation-boundary.md`

### New Phase 4 files

- `specs/004-loyalty-points-redemptions/spec-funcional.md`
- `specs/004-loyalty-points-redemptions/spec-tecnica.md`
- `specs/004-loyalty-points-redemptions/spec-tareas.md`
- `specs/004-loyalty-points-redemptions/traceability.md`

### Responsibilities

- Fase 1 fija alcance funcional, actores, estados y la regla canonica de earn/canje/reversa.
- Fase 2 fija el contrato UX de `/cuenta` y `/admin/loyalty` sin abrir autoservicio.
- Fase 3 fija ownership entre `loyalty`, `orders`, `marketing`, `auth` y `customers`.
- Fase 4 convierte el slice en paquete SDD trazable para ejecucion futura.
- La capa transversal actualiza el mapa brownfield y el estado metodologico del repo.

### Task 1: Abrir Fase 1 del slice `004-loyalty-points-redemptions`

**Files:**
- Modify: `docs/fase-1-analisis-requerimientos/README.md`
- Create: `docs/fase-1-analisis-requerimientos/01.03-loyalty-points-redemptions.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-10-acumulacion-y-liberacion-de-puntos.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-11-canje-pendiente-y-reserva.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-12-ajustes-manuales-y-reversa-automatica.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/loyalty-y-canjes.md`

- [ ] **Step 1: Releer fuentes loyalty y contratos actuales del runtime**

Run:

```bash
sed -n '1,240p' docs/flows/loyalty-flow.md
sed -n '1,240p' docs/flows/checkout-openpay.md
sed -n '1,220p' docs/product/scope.md
sed -n '1,220p' docs/product/roles-and-permissions.md
sed -n '1,260p' apps/api/src/modules/loyalty/loyalty.service.ts
sed -n '760,1120p' apps/api/src/modules/orders/orders.service.ts
```

Expected: reglas actuales de earn, settlement, redemption, reversal y ownership operativo.

- [ ] **Step 2: Actualizar el indice de Fase 1 para incluir el nuevo slice**

Añadir en `docs/fase-1-analisis-requerimientos/README.md`:

```md
## Slice 004 - Loyalty Points Redemptions
- [01.03-loyalty-points-redemptions.md](01.03-loyalty-points-redemptions.md)
- [casos-de-uso/UC-10-acumulacion-y-liberacion-de-puntos.md](casos-de-uso/UC-10-acumulacion-y-liberacion-de-puntos.md)
- [casos-de-uso/UC-11-canje-pendiente-y-reserva.md](casos-de-uso/UC-11-canje-pendiente-y-reserva.md)
- [casos-de-uso/UC-12-ajustes-manuales-y-reversa-automatica.md](casos-de-uso/UC-12-ajustes-manuales-y-reversa-automatica.md)
- [reglas/loyalty-y-canjes.md](reglas/loyalty-y-canjes.md)
```

- [ ] **Step 3: Crear el documento rector de Fase 1**

Crear `docs/fase-1-analisis-requerimientos/01.03-loyalty-points-redemptions.md` con esta estructura base:

```md
# Fase 1 - Loyalty Points Redemptions

## Objetivo
Homologar el programa de puntos vigente de Huele Huele sin redisenar el runtime ni abrir autoservicio de canjes.

## Dentro de alcance
- `loyalty_account`
- `loyalty_movement`
- una sola `loyalty_rule` activa
- earn sobre pedidos elegibles
- `pending -> available`
- `redemption` con reserva inmediata
- resolucion en `/admin/loyalty`
- ajustes manuales auditables
- reversa automatica
- visibilidad en `/cuenta`

## Fuera de alcance
- multiples reglas activas
- catalogo formal de recompensas
- canje autoservicio
- descuento inline en checkout
- expiracion fuerte como regla canonica

## Regla critica
- el canje `pending` reserva puntos de inmediato
- `applied` consume definitivamente
- `cancelled` libera reserva
- los puntos pertenecen a cuenta autenticada
```

- [ ] **Step 4: Crear los tres casos de uso canonicos**

Crear `UC-10-acumulacion-y-liberacion-de-puntos.md`:

```md
# UC-10 Acumulacion Y Liberacion De Puntos

## Actores
- cliente autenticado
- orders
- loyalty

## Flujo principal
1. el pedido cruza el hito elegible del dominio
2. loyalty registra movimiento `pending`
3. cuando corresponde, el movimiento pasa a `available`
4. la cuenta actualiza saldo pendiente y disponible
```

Crear `UC-11-canje-pendiente-y-reserva.md`:

```md
# UC-11 Canje Pendiente Y Reserva

## Actores
- marketing
- admin
- loyalty

## Flujo principal
1. se crea un `redemption`
2. los puntos se reservan de inmediato
3. el canje queda `pending`
4. marketing lo marca `applied` o `cancelled`
5. `applied` consume puntos; `cancelled` los devuelve a `available`
```

Crear `UC-12-ajustes-manuales-y-reversa-automatica.md`:

```md
# UC-12 Ajustes Manuales Y Reversa Automatica

## Actores
- marketing
- admin
- orders
- loyalty

## Flujo principal
1. marketing o admin registra ajuste manual auditable
2. si el pedido asociado se invalida, `orders` dispara la reversa automatica
3. loyalty revierte el saldo correspondiente
4. la cuenta conserva trazabilidad completa
```

- [ ] **Step 5: Crear la hoja de reglas funcionales**

Crear `docs/fase-1-analisis-requerimientos/reglas/loyalty-y-canjes.md`:

```md
# Reglas De Loyalty Y Canjes

- los puntos pertenecen a una cuenta cliente autenticada
- una sola `loyalty_rule` activa gobierna la acumulacion
- los puntos no quedan `available` antes del hito elegible
- el canje `pending` reserva puntos de inmediato
- `applied` consume definitivamente la reserva
- `cancelled` libera la reserva y devuelve saldo
- los ajustes manuales son auditables y excepcionales
- la reversa por invalidez del pedido es automatica
- `/cuenta` muestra visibilidad, no autoservicio
```

- [ ] **Step 6: Verificar Fase 1 abierta**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort
rg -n "loyalty|points|redemption|canje|puntos|available|pending" docs/fase-1-analisis-requerimientos
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `004`.

- [ ] **Step 7: Commit de Fase 1**

```bash
git add docs/fase-1-analisis-requerimientos
git commit -m "docs: open loyalty points phase 1 slice"
```

### Task 2: Abrir Fase 2 y los artefactos UX del slice

**Files:**
- Modify: `docs/fase-2-ux-ui/README.md`
- Create: `docs/fase-2-ux-ui/02.03-loyalty-points-redemptions-ux-ui.md`
- Create: `specs/004-loyalty-points-redemptions/product-design.md`
- Create: `specs/004-loyalty-points-redemptions/spdd-frontend.md`

- [ ] **Step 1: Releer superficies reales del runtime loyalty**

Run:

```bash
sed -n '1,240p' apps/web/components/account-workspace.tsx
sed -n '1,260p' apps/admin/components/loyalty-workspace.tsx
sed -n '1,220p' apps/admin/app/loyalty/page.tsx
```

Expected: contrato visible de `/cuenta`, `/admin/loyalty`, saldo, movimientos y canjes.

- [ ] **Step 2: Actualizar el indice de Fase 2**

Añadir en `docs/fase-2-ux-ui/README.md`:

```md
## Slice 004 - Loyalty Points Redemptions
- [02.03-loyalty-points-redemptions-ux-ui.md](02.03-loyalty-points-redemptions-ux-ui.md)
- [../../specs/004-loyalty-points-redemptions/product-design.md](../../specs/004-loyalty-points-redemptions/product-design.md)
- [../../specs/004-loyalty-points-redemptions/spdd-frontend.md](../../specs/004-loyalty-points-redemptions/spdd-frontend.md)
```

- [ ] **Step 3: Crear el documento UX de Fase 2**

Crear `docs/fase-2-ux-ui/02.03-loyalty-points-redemptions-ux-ui.md`:

```md
# Fase 2 - UX/UI Loyalty Points Redemptions

## Objetivo
Formalizar la UX del programa de puntos vigente sin convertir `/cuenta` en autoservicio de canjes.

## Superficies
- `/cuenta` con saldo, movimientos y estado de canjes
- `/admin/loyalty` como superficie operativa de marketing

## Regla UX critica
- el cliente ve visibilidad del programa
- el canje no se inicia desde `/cuenta`
- marketing resuelve el canje desde admin
```

- [ ] **Step 4: Crear `product-design.md` del slice**

Crear `specs/004-loyalty-points-redemptions/product-design.md`:

```md
# Product Design - Loyalty Points Redemptions

Fecha: 2026-05-26.

## Experiencia objetivo

- programa de puntos claro y auditable
- visibilidad simple para cliente
- control operativo para marketing

## Decisiones

- `marketing` es dueno operativo principal
- `/cuenta` muestra estado del programa, no autoservicio
- el canje se resuelve en admin
- el reward del canje es libre/manual en este estado del runtime
```

- [ ] **Step 5: Crear `spdd-frontend.md`**

Crear `specs/004-loyalty-points-redemptions/spdd-frontend.md`:

```md
# SPDD Frontend - Loyalty Points Redemptions

Fecha: 2026-05-26.

## Superficies cubiertas

- `/cuenta`
- `/admin/loyalty`

## Contratos visibles

- saldo `available`
- saldo `pending`
- movimientos
- canjes y su estado
- regla activa visible para operacion cuando aplique

## Reglas visibles

- el cliente no inicia canjes
- el canje `pending` ya implica reserva
- `applied` y `cancelled` cambian el saldo retenido
```

- [ ] **Step 6: Verificar Fase 2 abierta**

Run:

```bash
find docs/fase-2-ux-ui -maxdepth 1 -type f | sort
find specs/004-loyalty-points-redemptions -maxdepth 1 -type f | sort
```

Expected: el slice `004` queda visible en Fase 2 y en `specs/004-loyalty-points-redemptions`.

- [ ] **Step 7: Commit de Fase 2**

```bash
git add docs/fase-2-ux-ui specs/004-loyalty-points-redemptions
git commit -m "docs: add loyalty points ux slice"
```

### Task 3: Abrir Fase 3 y la ADR del slice

**Files:**
- Modify: `docs/fase-3-arquitectura/README.md`
- Create: `docs/fase-3-arquitectura/03.06-loyalty-points-redemptions.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-004-loyalty-redemption-reservation-boundary.md`

- [ ] **Step 1: Releer ownership tecnico real del runtime**

Run:

```bash
sed -n '1,260p' apps/api/src/modules/loyalty/loyalty.service.ts
sed -n '760,1120p' apps/api/src/modules/orders/orders.service.ts
sed -n '1,220p' docs/flows/loyalty-flow.md
sed -n '1,200p' docs/product/roles-and-permissions.md
```

Expected: queda clara la frontera entre `orders`, `loyalty`, `marketing` y `auth`.

- [ ] **Step 2: Actualizar el indice de Fase 3**

Añadir en `docs/fase-3-arquitectura/README.md`:

```md
## Slice 004 - Loyalty Points Redemptions
- [03.06-loyalty-points-redemptions.md](03.06-loyalty-points-redemptions.md)
- [adr/ADR-004-loyalty-redemption-reservation-boundary.md](adr/ADR-004-loyalty-redemption-reservation-boundary.md)
```

- [ ] **Step 3: Crear la arquitectura canonica del slice**

Crear `docs/fase-3-arquitectura/03.06-loyalty-points-redemptions.md` con este contenido base:

```md
# 03.06 Arquitectura Canonica Brownfield Loyalty Points Redemptions

## Objetivo
Definir ownership y fronteras entre `loyalty`, `orders`, `marketing`, `auth` y `customers`.

## Invariantes
1. los puntos pertenecen a una cuenta autenticada
2. existe una sola regla activa de acumulacion
3. `orders` dispara earn, settlement y reversal
4. `loyalty` conserva el ledger y el saldo
5. el canje `pending` reserva puntos de inmediato
6. `/cuenta` es lectura, no superficie de canje
```

- [ ] **Step 4: Crear la ADR de reserva de canje**

Crear `docs/fase-3-arquitectura/adr/ADR-004-loyalty-redemption-reservation-boundary.md`:

```md
# ADR-004 Loyalty Redemption Reservation Boundary

## Decision

- al crear un canje `pending`, los puntos se reservan de inmediato
- `applied` consume definitivamente la reserva
- `cancelled` libera la reserva
- el cliente no inicia el canje desde `/cuenta`
- marketing resuelve el canje en `/admin/loyalty`
```

- [ ] **Step 5: Verificar Fase 3 abierta**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 2 -type f | sort
rg -n "loyalty|redemption|reservation|points|marketing" docs/fase-3-arquitectura
```

Expected: el slice `004` queda visible y la ADR aparece en resultados.

- [ ] **Step 6: Commit de Fase 3**

```bash
git add docs/fase-3-arquitectura
git commit -m "docs: add loyalty points architecture slice"
```

### Task 4: Abrir Fase 4 y el paquete `specs/004-loyalty-points-redemptions`

**Files:**
- Modify: `docs/fase-4-sdd/README.md`
- Create: `specs/004-loyalty-points-redemptions/spec-funcional.md`
- Create: `specs/004-loyalty-points-redemptions/spec-tecnica.md`
- Create: `specs/004-loyalty-points-redemptions/spec-tareas.md`
- Create: `specs/004-loyalty-points-redemptions/traceability.md`

- [ ] **Step 1: Releer el spec y los patrones del slice anterior**

Run:

```bash
sed -n '1,260p' docs/superpowers/specs/2026-05-26-huelehuele-loyalty-points-redemptions-design.md
sed -n '1,260p' specs/003-wholesale-leads-quotes/spec-funcional.md
sed -n '1,280p' specs/003-wholesale-leads-quotes/spec-tecnica.md
sed -n '1,260p' specs/003-wholesale-leads-quotes/spec-tareas.md
sed -n '1,240p' specs/003-wholesale-leads-quotes/traceability.md
```

Expected: hay un patron claro para bajar el slice `004` a SDD.

- [ ] **Step 2: Actualizar el indice de Fase 4**

Añadir en `docs/fase-4-sdd/README.md`:

```md
## Slice 004 - Loyalty Points Redemptions
- [../../specs/004-loyalty-points-redemptions/spec-funcional.md](../../specs/004-loyalty-points-redemptions/spec-funcional.md)
- [../../specs/004-loyalty-points-redemptions/spec-tecnica.md](../../specs/004-loyalty-points-redemptions/spec-tecnica.md)
- [../../specs/004-loyalty-points-redemptions/spec-tareas.md](../../specs/004-loyalty-points-redemptions/spec-tareas.md)
- [../../specs/004-loyalty-points-redemptions/traceability.md](../../specs/004-loyalty-points-redemptions/traceability.md)
```

- [ ] **Step 3: Crear `spec-funcional.md`**

Crear `specs/004-loyalty-points-redemptions/spec-funcional.md` con este esqueleto:

```md
# Spec Funcional - Loyalty Points Redemptions

## Alcance
- earn
- settlement
- reversal
- redemption
- manual adjustments
- visibility in `/cuenta`

## Reglas canonicas
- cuenta autenticada
- una sola regla activa
- canje `pending` reserva puntos
- `applied` consume
- `cancelled` devuelve
- reversa automatica desde `orders`
```

- [ ] **Step 4: Crear `spec-tecnica.md`**

Crear `specs/004-loyalty-points-redemptions/spec-tecnica.md` con foco en:

```md
# Spec Tecnica - Loyalty Points Redemptions

- baseline en `loyalty.service.ts`
- relacion con `orders.service.ts`
- ownership entre `marketing`, `loyalty`, `orders`, `auth`, `customers`
- ajustes minimos recomendados a contratos compartidos
- estrategia de pruebas para earn, canje, reserva y reversa
```

- [ ] **Step 5: Crear `spec-tareas.md`**

Crear `specs/004-loyalty-points-redemptions/spec-tareas.md` con backlog de:

```md
# Spec Tareas - Loyalty Points Redemptions

- contratos compartidos de saldo y estados
- earn sobre pedidos elegibles
- settlement de puntos
- reversa automatica
- canje con reserva inmediata
- resolucion operativa del canje
- ajustes manuales auditables
- regression suite del slice
```

- [ ] **Step 6: Crear `traceability.md`**

Crear `specs/004-loyalty-points-redemptions/traceability.md` trazando:

```md
# Traceability - Loyalty Points Redemptions

- `loyalty-flow.md`
- `checkout-openpay.md`
- `loyalty.service.ts`
- `orders.service.ts`
- `account-workspace.tsx`
- `loyalty-workspace.tsx`
```

- [ ] **Step 7: Verificar Fase 4 abierta**

Run:

```bash
find specs/004-loyalty-points-redemptions -maxdepth 1 -type f | sort
rg -n "loyalty|points|redemption|pending|available|reversed|marketing" specs/004-loyalty-points-redemptions
```

Expected: el paquete `specs/004-loyalty-points-redemptions` queda completo y consistente con el spec.

- [ ] **Step 8: Commit de Fase 4**

```bash
git add docs/fase-4-sdd specs/004-loyalty-points-redemptions
git commit -m "docs: add loyalty points canonical specs"
```

### Task 5: Sincronizar la capa transversal del brownfield

**Files:**
- Modify: `docs/transversal/90.00-mapa-homologacion-brownfield.md`
- Modify: `AI_CONTEXT.md`
- Modify: `TRACEABILITY_MATRIX.md`

- [ ] **Step 1: Releer la capa transversal actual**

Run:

```bash
sed -n '1,240p' AI_CONTEXT.md
sed -n '1,240p' TRACEABILITY_MATRIX.md
sed -n '1,260p' docs/transversal/90.00-mapa-homologacion-brownfield.md
```

Expected: aparece el estado actual hasta `003-wholesale-leads-quotes`.

- [ ] **Step 2: Actualizar `AI_CONTEXT.md`**

Reflejar:

```md
- Fase activa: extension de la capa canonica intermedia al slice `004-loyalty-points-redemptions`
| Fase 1 - Analisis y requerimientos | Backfilled para slices `001`, `002`, `003` y `004` | ... |
| Fase 2 - UX/UI | Backfilled para slices `001`, `002`, `003` y `004` | ... |
| Fase 3 - Arquitectura | Backfilled para slices `001`, `002`, `003` y `004` | ... |
| Fase 4 - SDD | Instanciada para features `001`, `002`, `003` y `004` | ... |
```

- [ ] **Step 3: Actualizar `TRACEABILITY_MATRIX.md`**

Reflejar:

```md
| `REQ-HH-005` | Operar CMS, marketing, loyalty y CRM basico desde backoffice | ... | Parcial: loyalty backfilled para estado actual |
```

y ampliar Fases 1-4 para incluir el slice `004`.

- [ ] **Step 4: Actualizar el mapa brownfield**

Añadir en `docs/transversal/90.00-mapa-homologacion-brownfield.md` una fila:

```md
| `docs/flows/loyalty-flow.md` | `docs/fase-1-analisis-requerimientos/01.03-loyalty-points-redemptions.md`, `docs/fase-3-arquitectura/03.06-loyalty-points-redemptions.md`, `specs/004-loyalty-points-redemptions/` | Migrado | El programa de puntos y canjes ya aterrizo al canonico. |
```

y en el resumen del corte:

```md
- `specs/004-loyalty-points-redemptions/` fija el cuarto slice brownfield homologado para loyalty.
```

- [ ] **Step 5: Verificar sincronizacion transversal**

Run:

```bash
rg -n "004-loyalty-points-redemptions|REQ-HH-005|loyalty-flow|loyalty|points|redemption" docs/transversal/90.00-mapa-homologacion-brownfield.md AI_CONTEXT.md TRACEABILITY_MATRIX.md docs/fase-1-analisis-requerimientos/README.md docs/fase-2-ux-ui/README.md docs/fase-3-arquitectura/README.md docs/fase-4-sdd/README.md
git diff --check
```

Expected: el slice `004` ya aparece en la capa transversal y `git diff --check` queda limpio.

- [ ] **Step 6: Commit transversal**

```bash
git add AI_CONTEXT.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md docs/fase-1-analisis-requerimientos/README.md docs/fase-2-ux-ui/README.md docs/fase-3-arquitectura/README.md docs/fase-4-sdd/README.md
git commit -m "docs: align canonical layer for loyalty points"
```

## Self-Review

- El plan cubre Fases 1-4 y la sincronizacion transversal del slice `004`.
- No deja placeholders funcionales: cada tarea tiene archivos, contenido base, verificacion y commit.
- El alcance se mantiene `as-is`: una sola regla activa, cuenta autenticada, canje pendiente con reserva, resolucion en admin y reversa automatica.
- No mezcla este slice con autoservicio de canje, catalogo formal de recompensas ni multiples reglas activas.
