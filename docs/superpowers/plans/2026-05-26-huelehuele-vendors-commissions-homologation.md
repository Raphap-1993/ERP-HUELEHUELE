# Huele Huele Vendors Commissions Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir el slice canonico `002-vendors-commissions` en `ERP-HUELEHUELE` como homologacion brownfield `as-is`, dejando Fases 1-4 y specs listos sin redisenar el runtime.

**Architecture:** La homologacion aterriza sobre el producto vivo existente. Se crean artefactos canonicos de requerimientos, UX, arquitectura y specs para el flujo seller-first real: postulacion, alta, `vendorCode`, atribucion, comisiones, payouts y panel vendedor. La regla critica del slice es la correccion post-pedido del `vendorCode`, permitida solo antes del lock financiero.

**Tech Stack:** Markdown, git worktree, monorepo `Next.js` + `NestJS` + `Prisma`, docs brownfield existentes, verificacion documental con `git diff --check`, `rg` y chequeo local de links markdown.

---

## File Structure

### Existing files to modify

- `docs/fase-1-analisis-requerimientos/README.md`
- `docs/fase-2-ux-ui/README.md`
- `docs/fase-3-arquitectura/README.md`
- `docs/transversal/90.00-mapa-homologacion-brownfield.md`
- `AI_CONTEXT.md`
- `TRACEABILITY_MATRIX.md`

### New Phase 1 files

- `docs/fase-1-analisis-requerimientos/01.01-vendors-commissions.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-04-postulacion-vendedor.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-05-atribucion-vendedor-en-pedido.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-06-comisiones-payouts-y-panel-vendedor.md`
- `docs/fase-1-analisis-requerimientos/reglas/vendedores-y-comisiones.md`

### New Phase 2 files

- `docs/fase-2-ux-ui/02.01-vendors-commissions-ux-ui.md`
- `specs/002-vendors-commissions/product-design.md`
- `specs/002-vendors-commissions/spdd-frontend.md`

### New Phase 3 files

- `docs/fase-3-arquitectura/03.04-vendors-commissions.md`
- `docs/fase-3-arquitectura/adr/ADR-002-vendor-attribution-financial-lock.md`

### New Phase 4 files

- `specs/002-vendors-commissions/spec-funcional.md`
- `specs/002-vendors-commissions/spec-tecnica.md`
- `specs/002-vendors-commissions/spec-tareas.md`
- `specs/002-vendors-commissions/traceability.md`

### Responsibilities

- Fase 1 fija alcance funcional, actores, estados y la regla canonica de correccion post-pedido.
- Fase 2 fija el contrato UX del runtime vigente sin abrir rediseno visual.
- Fase 3 fija ownership, lock financiero, eventos y auditoria.
- Fase 4 convierte el slice en paquete SDD trazable para ejecucion futura.

### Task 1: Abrir Fase 1 del slice `002-vendors-commissions`

**Files:**
- Modify: `docs/fase-1-analisis-requerimientos/README.md`
- Create: `docs/fase-1-analisis-requerimientos/01.01-vendors-commissions.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-04-postulacion-vendedor.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-05-atribucion-vendedor-en-pedido.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-06-comisiones-payouts-y-panel-vendedor.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/vendedores-y-comisiones.md`

- [ ] **Step 1: Releer fuentes seller-first y el contrato actual del slice**

Run:

```bash
sed -n '1,220p' docs/flows/vendors-and-commissions.md
sed -n '1,220p' docs/flows/vendor-application.md
sed -n '1,220p' docs/flows/commercial-accesses.md
sed -n '1,220p' docs/product/scope.md
sed -n '1,220p' docs/product/roles-and-permissions.md
```

Expected: reglas actuales de postulacion, atribucion, comisiones, payouts y acceso al panel vendedor.

- [ ] **Step 2: Actualizar el indice de Fase 1 para incluir el nuevo slice**

Añadir en `docs/fase-1-analisis-requerimientos/README.md` una nueva seccion de documentos:

```md
## Slice 002 - Vendors Commissions
- [01.01-vendors-commissions.md](01.01-vendors-commissions.md)
- [casos-de-uso/UC-04-postulacion-vendedor.md](casos-de-uso/UC-04-postulacion-vendedor.md)
- [casos-de-uso/UC-05-atribucion-vendedor-en-pedido.md](casos-de-uso/UC-05-atribucion-vendedor-en-pedido.md)
- [casos-de-uso/UC-06-comisiones-payouts-y-panel-vendedor.md](casos-de-uso/UC-06-comisiones-payouts-y-panel-vendedor.md)
- [reglas/vendedores-y-comisiones.md](reglas/vendedores-y-comisiones.md)
```

- [ ] **Step 3: Crear el documento rector de Fase 1**

Crear `docs/fase-1-analisis-requerimientos/01.01-vendors-commissions.md` con este contenido base:

```md
# Fase 1 - Vendors Commissions

## Objetivo
Homologar el flujo seller-first vigente de Huele Huele sin redisenar el runtime.

## Dentro de alcance
- postulacion publica `/trabaja-con-nosotros`
- aprobacion y alta de vendedor
- `vendorCode`, `preferredCode`, `collaborationType`
- atribucion comercial del pedido
- correccion operativa de atribucion post-pedido
- comisiones
- payouts
- panel vendedor

## Fuera de alcance
- marketplace
- multi-vendor por pedido
- rediseno visual
- ajustes financieros post-payout

## Regla critica
- la correccion de `vendorCode` post-pedido es excepcional
- se permite antes del lock financiero
- se bloquea desde `payable`, `scheduled_for_payout` o `paid`
- `orders` es dueno del cambio
- `commissions` recompone la consecuencia financiera
```

- [ ] **Step 4: Crear los tres casos de uso canonicos**

Crear `UC-04-postulacion-vendedor.md`:

```md
# UC-04 Postulacion Vendedor

## Actores
- postulante
- seller_manager
- admin

## Flujo principal
1. el postulante completa `/trabaja-con-nosotros`
2. la API crea `vendor_application`
3. seller_manager revisa identidad, contacto y contexto comercial
4. si aprueba, se crea o vincula `vendor`
5. se define `preferredCode` o se genera `vendorCode`
6. si corresponde, se crea acceso comercial y se habilita `/panel-vendedor`
```

Crear `UC-05-atribucion-vendedor-en-pedido.md`:

```md
# UC-05 Atribucion Vendedor En Pedido

## Actores
- cliente
- ventas
- admin
- seller_manager

## Flujo principal
1. el pedido nace con `vendorCode` efectivo o sin vendedor
2. `orders` persiste el snapshot comercial
3. si operacion necesita regularizar, corrige el `vendorCode` desde `Pedidos > Operacion`
4. la correccion solo se admite antes del lock financiero
5. el cambio deja auditoria y before/after completos
```

Crear `UC-06-comisiones-payouts-y-panel-vendedor.md`:

```md
# UC-06 Comisiones Payouts Y Panel Vendedor

## Actores
- seller_manager
- admin
- worker
- vendedor

## Flujo principal
1. `commissions` deriva la comision desde el pedido confirmado
2. la comision madura segun regla y elegibilidad
3. `worker` prepara payouts por vendor y periodo
4. seller_manager o admin liquida el payout
5. el vendedor consulta comisiones y payouts en `/panel-vendedor`
```

- [ ] **Step 5: Crear la hoja de reglas funcionales**

Crear `docs/fase-1-analisis-requerimientos/reglas/vendedores-y-comisiones.md` con reglas explicitas:

```md
# Reglas De Vendedores Y Comisiones

- un pedido solo tiene un `vendorCode` efectivo
- el `vendorCode` corregido debe resolver a un vendedor activo
- no se permite `A -> none` si ya hubo comision materializada
- no se permite correccion si la comision esta en `payable`, `scheduled_for_payout` o `paid`
- payouts viven por `vendorCode` y periodo
- el panel vendedor consume verdad derivada; no recalcula negocio
```

- [ ] **Step 6: Verificar Fase 1 abierta**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort
rg -n "vendors-commissions|vendorCode|panel-vendedor|lock financiero" docs/fase-1-analisis-requerimientos
```

Expected: los nuevos archivos aparecen y el `rg` devuelve hits del nuevo slice.

- [ ] **Step 7: Commit de Fase 1**

```bash
git add docs/fase-1-analisis-requerimientos
git commit -m "docs: open vendors commissions phase 1 slice"
```

### Task 2: Abrir Fase 2 y los artefactos UX del slice

**Files:**
- Modify: `docs/fase-2-ux-ui/README.md`
- Create: `docs/fase-2-ux-ui/02.01-vendors-commissions-ux-ui.md`
- Create: `specs/002-vendors-commissions/product-design.md`
- Create: `specs/002-vendors-commissions/spdd-frontend.md`

- [ ] **Step 1: Releer las superficies reales del runtime**

Run:

```bash
sed -n '1,220p' apps/web/components/seller-panel-workspace.tsx
sed -n '1,220p' apps/admin/components/commissions-workspace.tsx
sed -n '1,220p' apps/admin/components/orders-workspace.tsx
```

Expected: contrato visible de `/panel-vendedor`, `/comisiones` y `Pedidos > Operacion`.

- [ ] **Step 2: Actualizar el indice de Fase 2**

Añadir en `docs/fase-2-ux-ui/README.md`:

```md
## Slice 002 - Vendors Commissions
- [02.01-vendors-commissions-ux-ui.md](02.01-vendors-commissions-ux-ui.md)
- [../../specs/002-vendors-commissions/product-design.md](../../specs/002-vendors-commissions/product-design.md)
- [../../specs/002-vendors-commissions/spdd-frontend.md](../../specs/002-vendors-commissions/spdd-frontend.md)
```

- [ ] **Step 3: Crear el documento UX de Fase 2**

Crear `docs/fase-2-ux-ui/02.01-vendors-commissions-ux-ui.md` con este contrato:

```md
# Fase 2 - UX/UI Vendors Commissions

## Objetivo
Formalizar la UX del flujo seller-first vigente sin redisenar las superficies.

## Superficies
- `/trabaja-con-nosotros`: captura de postulacion, no alta directa
- `/panel-vendedor`: metricas, comisiones, payouts y contexto comercial
- `/admin/vendedores`: aprobacion, alta, estado y acceso comercial
- `/admin/comisiones`: reglas, comisiones y payouts
- `Pedidos > Operacion`: punto unico de correccion de atribucion

## Regla UX critica
- la correccion de `vendorCode` no debe parecer una edicion libre
- si el pedido ya cruzo lock financiero, la UI debe bloquear o derivar a ajuste financiero
```

- [ ] **Step 4: Crear `product-design.md`**

Crear `specs/002-vendors-commissions/product-design.md`:

```md
# Product Design - Vendors Commissions

## Experiencia objetivo
- seller-first
- operacion clara
- trazabilidad antes que automatizacion vistosa

## Decisiones
- el panel vendedor es operativo, no decorativo
- `Pedidos > Operacion` es la unica puerta de correccion post-pedido
- `/comisiones` refleja consecuencia financiera, no corrige la atribucion primaria
```

- [ ] **Step 5: Crear `spdd-frontend.md`**

Crear `specs/002-vendors-commissions/spdd-frontend.md`:

```md
# SPDD Frontend - Vendors Commissions

## Superficies cubiertas
- `/trabaja-con-nosotros`
- `/panel-vendedor`
- `/admin/vendedores`
- `/admin/comisiones`
- `Pedidos > Operacion`

## Contratos visibles
- estado del vendedor
- `vendorCode`
- comision y payout
- lock financiero como frontera operativa
```

- [ ] **Step 6: Verificar Fase 2 abierta**

Run:

```bash
find docs/fase-2-ux-ui -maxdepth 1 -type f | sort
find specs/002-vendors-commissions -maxdepth 1 -type f | sort
```

Expected: aparecen `02.01-vendors-commissions-ux-ui.md`, `product-design.md` y `spdd-frontend.md`.

- [ ] **Step 7: Commit de Fase 2**

```bash
git add docs/fase-2-ux-ui specs/002-vendors-commissions
git commit -m "docs: add vendors commissions ux slice"
```

### Task 3: Abrir Fase 3 con ownership y ADR del lock financiero

**Files:**
- Modify: `docs/fase-3-arquitectura/README.md`
- Create: `docs/fase-3-arquitectura/03.04-vendors-commissions.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-002-vendor-attribution-financial-lock.md`

- [ ] **Step 1: Releer ownership real en docs y runtime**

Run:

```bash
sed -n '1,220p' docs/architecture/modules.md
sed -n '2210,2305p' apps/api/src/modules/orders/orders.service.ts
sed -n '730,1015p' apps/api/src/modules/commissions/commissions.service.ts
sed -n '1,120p' apps/api/src/modules/payments/payments.service.ts
```

Expected: ownership actual de `orders`, `commissions`, `payments` y consecuencias de reasignar `vendorCode`.

- [ ] **Step 2: Actualizar el indice de Fase 3**

Añadir en `docs/fase-3-arquitectura/README.md`:

```md
## Slice 002 - Vendors Commissions
- [03.04-vendors-commissions.md](03.04-vendors-commissions.md)
- [adr/ADR-002-vendor-attribution-financial-lock.md](adr/ADR-002-vendor-attribution-financial-lock.md)
```

- [ ] **Step 3: Crear `03.04-vendors-commissions.md`**

Crear `docs/fase-3-arquitectura/03.04-vendors-commissions.md`:

```md
# Fase 3 - Arquitectura Vendors Commissions

## Ownership
- `vendors`: postulacion, perfil, codigo y acceso comercial
- `orders`: `vendorCode` efectivo del pedido y su correccion
- `commissions`: regla, maduracion, payout y reversa
- `payments`: confirmacion de cobro que dispara sync
- `worker`: ejecucion asincrona de payouts

## Invariantes
- un pedido solo tiene un `vendorCode` efectivo
- `orders` es la unica puerta de correccion post-pedido
- la correccion se congela en lock financiero
- el panel vendedor y reportes consumen verdad derivada
```

- [ ] **Step 4: Crear el ADR del lock financiero**

Crear `docs/fase-3-arquitectura/adr/ADR-002-vendor-attribution-financial-lock.md`:

```md
# ADR-002 Vendor Attribution Financial Lock

## Decision
La correccion de atribucion de vendedor se permite solo antes del lock financiero.

## Lock financiero
- `payable`
- `scheduled_for_payout`
- `paid`
- `payoutId` no cancelado
- job de payout pendiente o en ejecucion

## Consecuencia
Despues del lock ya no hay edicion normal de pedido; solo ajuste financiero o reversa compensatoria.
```

- [ ] **Step 5: Verificar Fase 3 abierta**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 2 -type f | sort
rg -n "lock financiero|vendorCode|payoutId|orders es la unica puerta" docs/fase-3-arquitectura
```

Expected: aparecen `03.04-vendors-commissions.md` y `ADR-002-vendor-attribution-financial-lock.md` con hits relevantes.

- [ ] **Step 6: Commit de Fase 3**

```bash
git add docs/fase-3-arquitectura
git commit -m "docs: add vendors commissions architecture slice"
```

### Task 4: Crear el paquete SDD `specs/002-vendors-commissions`

**Files:**
- Create: `specs/002-vendors-commissions/spec-funcional.md`
- Create: `specs/002-vendors-commissions/spec-tecnica.md`
- Create: `specs/002-vendors-commissions/spec-tareas.md`
- Create: `specs/002-vendors-commissions/traceability.md`

- [ ] **Step 1: Reusar el patron de `001-checkout-payments`**

Run:

```bash
find specs/001-checkout-payments -maxdepth 1 -type f | sort
sed -n '1,220p' specs/001-checkout-payments/spec-funcional.md
sed -n '1,240p' specs/001-checkout-payments/spec-tecnica.md
```

Expected: estructura base a replicar sin copiar el dominio de checkout.

- [ ] **Step 2: Crear `spec-funcional.md`**

Crear `specs/002-vendors-commissions/spec-funcional.md`:

```md
# Spec Funcional - Vendors Commissions

## Objetivo
Definir el slice seller-first vigente como paquete SDD canonico.

## Incluye
- postulacion publica
- aprobacion y alta
- `vendorCode`
- atribucion del pedido
- correccion post-pedido antes del lock financiero
- comisiones
- payouts
- panel vendedor

## Regla critica
- la correccion post-pedido es excepcional
- solo `orders` la ejecuta
- se bloquea desde `payable`, `scheduled_for_payout` o `paid`
```

- [ ] **Step 3: Crear `spec-tecnica.md`**

Crear `specs/002-vendors-commissions/spec-tecnica.md`:

```md
# Spec Tecnica - Vendors Commissions

## Baseline real
- `orders.service.ts` ya permite `assignOrderVendor`
- `commissions.service.ts` deriva comision y payout desde pedidos
- `payments.service.ts` solo sincroniza efectos tras cobro
- `seller-panel-workspace.tsx` consume comisiones y payouts

## Reglas tecnicas
1. `orders` es dueno del `vendorCode` efectivo
2. `commissions` no corrige atribucion primaria
3. no se permite `A -> none` con comision materializada
4. no se permite correccion si existe lock financiero
```

- [ ] **Step 4: Crear `spec-tareas.md`**

Crear `specs/002-vendors-commissions/spec-tareas.md`:

```md
# Spec Tareas - Vendors Commissions

- abrir Fase 1 seller-first
- abrir Fase 2 UX/UI del slice
- abrir Fase 3 con lock financiero
- abrir trazabilidad y paquete SDD
- alinear matriz, AI context y mapa brownfield
```

- [ ] **Step 5: Crear `traceability.md`**

Crear `specs/002-vendors-commissions/traceability.md`:

```md
# Traceability - Vendors Commissions

| ID | Regla canonica | Fuente brownfield | Artefacto nuevo | Baseline tecnico actual |
| --- | --- | --- | --- | --- |
| TR-01 | el seller-first es flujo end-to-end | `docs/flows/vendors-and-commissions.md` | `01.01-vendors-commissions.md` | `web`, `admin`, `api`, `worker` |
| TR-02 | `orders` es dueno del `vendorCode` del pedido | `docs/architecture/modules.md` | `03.04-vendors-commissions.md` | `orders.service.ts` |
| TR-03 | existe lock financiero para correccion tardia | lectura brownfield 2026-05-26 | `ADR-002-vendor-attribution-financial-lock.md` | `commissions.service.ts` |
```

- [ ] **Step 6: Verificar el paquete SDD**

Run:

```bash
find specs/002-vendors-commissions -maxdepth 1 -type f | sort
rg -n "lock financiero|vendorCode|seller-first|payout" specs/002-vendors-commissions
```

Expected: los cuatro archivos existen y el `rg` devuelve hits del dominio correcto.

- [ ] **Step 7: Commit del paquete SDD**

```bash
git add specs/002-vendors-commissions
git commit -m "docs: add vendors commissions spec package"
```

### Task 5: Alinear la capa transversal del repo con el nuevo slice

**Files:**
- Modify: `docs/transversal/90.00-mapa-homologacion-brownfield.md`
- Modify: `AI_CONTEXT.md`
- Modify: `TRACEABILITY_MATRIX.md`

- [ ] **Step 1: Actualizar el mapa brownfield**

Añadir filas en `docs/transversal/90.00-mapa-homologacion-brownfield.md`:

```md
| `docs/flows/vendors-and-commissions.md` | `docs/fase-1-analisis-requerimientos/01.01-vendors-commissions.md` y `specs/002-vendors-commissions/` | Migrado | Seller-first canonizado como segundo slice |
| `docs/flows/vendor-application.md` | `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-04-postulacion-vendedor.md` | Migrado | Postulacion y alta consolidadas |
| `docs/flows/commercial-accesses.md` | `docs/fase-1-analisis-requerimientos/01.01-vendors-commissions.md` | Parcial | Acceso comercial usado como soporte del panel vendedor |
```

- [ ] **Step 2: Actualizar `AI_CONTEXT.md`**

Cambiar `Proximos pasos` o `Gates pendientes` para reflejar:

```md
- Slice `001-checkout-payments` ya homologado.
- Slice `002-vendors-commissions` abierto en Fases 1-4.
- Proximo gap metodologico: replicar el patron a mayoristas o catalogo/media.
```

- [ ] **Step 3: Actualizar `TRACEABILITY_MATRIX.md`**

Modificar la matriz macro:

```md
| `REQ-HH-003` | Formalizar el canal seller con atribucion y comisiones | `docs/product/product-vision.md`, `docs/flows/vendors-and-commissions.md` | Fases 1-4 canonicas del slice `002-vendors-commissions` | Backfilled para estado actual + lock financiero |
```

Y añadir el nuevo gap abierto:

```md
- La trazabilidad canonica ya existe para `001-checkout-payments` y `002-vendors-commissions`; falta replicarla a mayoristas y catalogo/media.
```

- [ ] **Step 4: Verificar consistencia global**

Run:

```bash
rg -n "002-vendors-commissions|seller-first|lock financiero|REQ-HH-003" AI_CONTEXT.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md docs/fase-* specs/002-vendors-commissions
git diff --check
```

Expected: hits del nuevo slice en todas las capas y `git diff --check` sin salida.

- [ ] **Step 5: Verificar links markdown locales**

Run:

```bash
while IFS= read -r f; do dir=$(dirname "$f"); while IFS= read -r link; do case "$link" in http*|mailto:*|\#*|'') continue;; esac; test -e "$dir/$link" || echo "$f -> $link"; done < <(perl -ne 'while(/\[[^\]]+\]\(([^)#]+)(?:#[^)]*)?\)/g){print "$1\n"}' "$f"); done < <(rg -l '\[[^]]+\]\([^)]*\)' docs/fase-* specs/002-vendors-commissions AI_CONTEXT.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md)
```

Expected: sin salida.

- [ ] **Step 6: Commit transversal**

```bash
git add AI_CONTEXT.md TRACEABILITY_MATRIX.md docs/transversal/90.00-mapa-homologacion-brownfield.md docs/fase-1-analisis-requerimientos/README.md docs/fase-2-ux-ui/README.md docs/fase-3-arquitectura/README.md
git commit -m "docs: align canonical layer for vendors commissions"
```

## Self-Review

### Spec coverage

- El plan cubre postulacion, onboarding, `vendorCode`, atribucion de pedido, correccion post-pedido, comisiones, payouts y panel vendedor.
- El plan cubre Fases 1-4 y la alineacion transversal del repo.
- El plan no abre implementacion de codigo ni ajustes financieros post-payout, consistente con el spec aprobado.

### Placeholder scan

- No usa `TODO`, `TBD` ni referencias vacias.
- Cada tarea tiene rutas exactas, snippets y comandos de verificacion.

### Type consistency

- Se mantiene el nombre canonico del slice como `002-vendors-commissions`.
- Se usa de forma consistente `vendorCode`, `preferredCode`, `lock financiero`, `Pedidos > Operacion`, `panel-vendedor`.
