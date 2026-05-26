# Huele Huele Wholesale Leads Quotes Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir el slice canonico `003-wholesale-leads-quotes` en `ERP-HUELEHUELE` como homologacion brownfield `as-is`, dejando Fases 1-4 y specs listos para el funnel comercial mayorista sin abrir un portal B2B autoservicio.

**Architecture:** La homologacion aterriza sobre el producto vivo existente. Se crean artefactos canonicos de requerimientos, UX, arquitectura y specs para el flujo real `lead -> calificacion -> cotizacion -> cierre -> entitlement mayorista basico en /cuenta`. La regla critica del slice es separar el historico del funnel del estado actual de la relacion comercial aprobada.

**Tech Stack:** Markdown, git worktree, monorepo `Next.js` + `NestJS` + `Prisma`, docs brownfield existentes, verificacion documental con `git diff --check`, `rg`, `find` y chequeo local de links markdown.

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

- `docs/fase-1-analisis-requerimientos/01.02-wholesale-leads-quotes.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-07-captura-y-calificacion-mayorista.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-08-cotizacion-y-cierre-comercial.md`
- `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-09-entitlement-mayorista-y-resumen-en-cuenta.md`
- `docs/fase-1-analisis-requerimientos/reglas/mayoristas-y-cotizaciones.md`

### New Phase 2 files

- `docs/fase-2-ux-ui/02.02-wholesale-leads-quotes-ux-ui.md`
- `specs/003-wholesale-leads-quotes/product-design.md`
- `specs/003-wholesale-leads-quotes/spdd-frontend.md`

### New Phase 3 files

- `docs/fase-3-arquitectura/03.05-wholesale-leads-quotes.md`
- `docs/fase-3-arquitectura/adr/ADR-003-wholesale-entitlement-boundary.md`

### New Phase 4 files

- `specs/003-wholesale-leads-quotes/spec-funcional.md`
- `specs/003-wholesale-leads-quotes/spec-tecnica.md`
- `specs/003-wholesale-leads-quotes/spec-tareas.md`
- `specs/003-wholesale-leads-quotes/traceability.md`

### Responsibilities

- Fase 1 fija alcance funcional, actores, estados y la regla canonica del entitlement mayorista.
- Fase 2 fija el contrato UX del runtime vigente sin abrir diseno de portal B2B.
- Fase 3 fija ownership entre `ventas`, `wholesale`, `commercial-access` y `auth`.
- Fase 4 convierte el slice en paquete SDD trazable para ejecucion futura.
- La capa transversal actualiza el mapa brownfield y el estado metodologico del repo.

### Task 1: Abrir Fase 1 del slice `003-wholesale-leads-quotes`

**Files:**
- Modify: `docs/fase-1-analisis-requerimientos/README.md`
- Create: `docs/fase-1-analisis-requerimientos/01.02-wholesale-leads-quotes.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-07-captura-y-calificacion-mayorista.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-08-cotizacion-y-cierre-comercial.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-09-entitlement-mayorista-y-resumen-en-cuenta.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/mayoristas-y-cotizaciones.md`

- [ ] **Step 1: Releer fuentes mayoristas y el contrato actual del slice**

Run:

```bash
sed -n '1,240p' docs/flows/wholesale-flow.md
sed -n '1,240p' docs/flows/commercial-accesses.md
sed -n '1,240p' docs/product/scope.md
sed -n '1,240p' docs/product/roles-and-permissions.md
sed -n '1,240p' docs/architecture/modules.md
```

Expected: reglas actuales de captura de lead, cotizacion, cierre comercial y acceso autenticado mayorista.

- [ ] **Step 2: Actualizar el indice de Fase 1 para incluir el nuevo slice**

Añadir en `docs/fase-1-analisis-requerimientos/README.md`:

```md
## Slice 003 - Wholesale Leads Quotes
- [01.02-wholesale-leads-quotes.md](01.02-wholesale-leads-quotes.md)
- [casos-de-uso/UC-07-captura-y-calificacion-mayorista.md](casos-de-uso/UC-07-captura-y-calificacion-mayorista.md)
- [casos-de-uso/UC-08-cotizacion-y-cierre-comercial.md](casos-de-uso/UC-08-cotizacion-y-cierre-comercial.md)
- [casos-de-uso/UC-09-entitlement-mayorista-y-resumen-en-cuenta.md](casos-de-uso/UC-09-entitlement-mayorista-y-resumen-en-cuenta.md)
- [reglas/mayoristas-y-cotizaciones.md](reglas/mayoristas-y-cotizaciones.md)
```

- [ ] **Step 3: Crear el documento rector de Fase 1**

Crear `docs/fase-1-analisis-requerimientos/01.02-wholesale-leads-quotes.md` con esta estructura base:

```md
# Fase 1 - Wholesale Leads Quotes

## Objetivo
Homologar el funnel comercial mayorista vigente de Huele Huele sin redisenar el runtime ni abrir portal B2B autoservicio.

## Dentro de alcance
- captura publica mayorista/distribuidores
- `interestType = wholesale | distributor`
- calificacion y deduplicacion operativa
- cotizacion basada en catalogo
- `tier` como referencia editable
- cierre `won/lost`
- entitlement mayorista basico sobre `/cuenta`

## Fuera de alcance
- pedido automatico
- portal B2B completo
- pricing rigido por tier
- aceptacion desde `/cuenta`

## Regla critica
- una cotizacion `accepted` no crea acceso
- el entitlement mayorista se gana solo en `won`
- se suspende por accion comercial explicita o inactividad marcada
- se reutiliza la misma cuenta por email si ya existe
```

- [ ] **Step 4: Crear los tres casos de uso canonicos**

Crear `UC-07-captura-y-calificacion-mayorista.md`:

```md
# UC-07 Captura Y Calificacion Mayorista

## Actores
- prospecto mayorista
- ventas
- admin

## Flujo principal
1. el prospecto completa el formulario mayorista
2. la API crea `wholesale_lead`
3. ventas revisa, deduplica y asigna estado
4. el lead avanza a `qualified` o se descarta
```

Crear `UC-08-cotizacion-y-cierre-comercial.md`:

```md
# UC-08 Cotizacion Y Cierre Comercial

## Actores
- ventas
- admin

## Flujo principal
1. ventas crea `wholesale_quote`
2. agrega referencias reales del catalogo y condiciones editables
3. envia la cotizacion
4. actualiza avance hasta `won` o `lost`
5. `accepted` no crea pedido automatico
```

Crear `UC-09-entitlement-mayorista-y-resumen-en-cuenta.md`:

```md
# UC-09 Entitlement Mayorista Y Resumen En Cuenta

## Actores
- ventas
- admin
- usuario autenticado

## Flujo principal
1. el lead queda `won`
2. backoffice crea o vincula acceso comercial sobre la cuenta existente
3. `/cuenta` muestra resumen mayorista basico
4. si la relacion se suspende, se conserva historial y solo se apaga el entitlement
```

- [ ] **Step 5: Crear la hoja de reglas funcionales**

Crear `docs/fase-1-analisis-requerimientos/reglas/mayoristas-y-cotizaciones.md`:

```md
# Reglas De Mayoristas Y Cotizaciones

- `wholesale` y `distributor` comparten modulo y funnel
- los duplicados se marcan para revision; no se fusionan automaticamente
- la cotizacion parte del catalogo real
- el `tier` orienta, pero no bloquea la edicion comercial
- `accepted` no crea pedido
- el entitlement mayorista se gana solo en `won`
- el entitlement se suspende sin borrar historial
- `/cuenta` solo muestra resumen comercial basico
```

- [ ] **Step 6: Verificar Fase 1 abierta**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort
rg -n "wholesale|mayorista|distributor|entitlement|won" docs/fase-1-analisis-requerimientos
```

Expected: aparecen los nuevos archivos y el `rg` devuelve hits del slice `003`.

- [ ] **Step 7: Commit de Fase 1**

```bash
git add docs/fase-1-analisis-requerimientos
git commit -m "docs: open wholesale leads quotes phase 1 slice"
```

### Task 2: Abrir Fase 2 y los artefactos UX del slice

**Files:**
- Modify: `docs/fase-2-ux-ui/README.md`
- Create: `docs/fase-2-ux-ui/02.02-wholesale-leads-quotes-ux-ui.md`
- Create: `specs/003-wholesale-leads-quotes/product-design.md`
- Create: `specs/003-wholesale-leads-quotes/spdd-frontend.md`

- [ ] **Step 1: Releer superficies reales del runtime comercial**

Run:

```bash
sed -n '1,220p' apps/web/components/account-workspace.tsx
sed -n '1,240p' apps/admin/lib/api.ts
sed -n '1,240p' docs/flows/wholesale-flow.md
```

Expected: contrato visible de `/cuenta`, leads mayoristas y cotizaciones.

- [ ] **Step 2: Actualizar el indice de Fase 2**

Añadir en `docs/fase-2-ux-ui/README.md`:

```md
## Slice 003 - Wholesale Leads Quotes
- [02.02-wholesale-leads-quotes-ux-ui.md](02.02-wholesale-leads-quotes-ux-ui.md)
- [../../specs/003-wholesale-leads-quotes/product-design.md](../../specs/003-wholesale-leads-quotes/product-design.md)
- [../../specs/003-wholesale-leads-quotes/spdd-frontend.md](../../specs/003-wholesale-leads-quotes/spdd-frontend.md)
```

- [ ] **Step 3: Crear el documento UX de Fase 2**

Crear `docs/fase-2-ux-ui/02.02-wholesale-leads-quotes-ux-ui.md`:

```md
# Fase 2 - UX/UI Wholesale Leads Quotes

## Objetivo
Formalizar la UX del funnel mayorista vigente sin convertirlo en portal B2B autoservicio.

## Superficies
- formulario publico mayorista/distribuidores
- admin de leads y cotizaciones
- `/cuenta` con resumen mayorista basico

## Regla UX critica
- `accepted` no debe sentirse como pedido
- `/cuenta` no debe parecer portal mayorista operativo
- el acceso mayorista solo se habilita cuando el lead queda `won`
```

- [ ] **Step 4: Crear `product-design.md`**

Crear `specs/003-wholesale-leads-quotes/product-design.md`:

```md
# Product Design - Wholesale Leads Quotes

## Experiencia objetivo
- comercial B2B clara
- seguimiento serio sin autoservicio prematuro
- continuidad entre lead, cotizacion y relacion comercial aprobada

## Decisiones
- ventas es dueno operativo principal
- `/cuenta` refleja estado comercial, no self-service B2B
- `won` habilita acceso; `accepted` no
```

- [ ] **Step 5: Crear `spdd-frontend.md`**

Crear `specs/003-wholesale-leads-quotes/spdd-frontend.md`:

```md
# SPDD Frontend - Wholesale Leads Quotes

## Superficies cubiertas
- formulario mayorista/distribuidores
- admin de leads y cotizaciones
- `/cuenta` con resumen mayorista

## Contratos visibles
- `interestType`
- estado del lead
- estado de cotizacion
- `tier` asignado
- responsable comercial
- entitlement activo o suspendido
```

- [ ] **Step 6: Verificar Fase 2 abierta**

Run:

```bash
find docs/fase-2-ux-ui -maxdepth 1 -type f | sort
find specs/003-wholesale-leads-quotes -maxdepth 1 -type f | sort
```

Expected: el slice `003` queda visible en Fase 2 y en `specs/003-wholesale-leads-quotes`.

- [ ] **Step 7: Commit de Fase 2**

```bash
git add docs/fase-2-ux-ui specs/003-wholesale-leads-quotes
git commit -m "docs: add wholesale leads quotes ux slice"
```

### Task 3: Abrir Fase 3 del slice y fijar la frontera del entitlement

**Files:**
- Modify: `docs/fase-3-arquitectura/README.md`
- Create: `docs/fase-3-arquitectura/03.05-wholesale-leads-quotes.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-003-wholesale-entitlement-boundary.md`

- [ ] **Step 1: Releer fuentes tecnicas y fronteras actuales**

Run:

```bash
sed -n '1,240p' docs/flows/wholesale-flow.md
sed -n '1,240p' docs/architecture/modules.md
sed -n '1,240p' docs/flows/commercial-accesses.md
sed -n '1,240p' docs/api/api-v1-outline.md
```

Expected: ownership actual entre lead, quote, auth y acceso comercial.

- [ ] **Step 2: Actualizar el indice de Fase 3**

Añadir en `docs/fase-3-arquitectura/README.md`:

```md
## Slice 003 - Wholesale Leads Quotes
- [03.05-wholesale-leads-quotes.md](03.05-wholesale-leads-quotes.md)
- [adr/ADR-003-wholesale-entitlement-boundary.md](adr/ADR-003-wholesale-entitlement-boundary.md)
```

- [ ] **Step 3: Crear el documento de arquitectura del slice**

Crear `docs/fase-3-arquitectura/03.05-wholesale-leads-quotes.md` con este contenido base:

```md
# 03.05 Arquitectura Canonica Brownfield Wholesale Leads Quotes

## Objetivo
Fijar ownership entre `ventas`, `wholesale`, `commercial-access` y `auth`.

## Fronteras
- `ventas`: califica, cotiza y cierra
- `wholesale`: lead, quote, items y estados
- `commercial-access`: entitlement sobre cuenta
- `auth`: identidad y sesion

## Regla critica
- `accepted` no crea pedido
- `won` habilita acceso comercial aprobado
- el entitlement puede suspenderse sin borrar cuenta ni historial
```

- [ ] **Step 4: Crear la ADR del entitlement mayorista**

Crear `docs/fase-3-arquitectura/adr/ADR-003-wholesale-entitlement-boundary.md`:

```md
# ADR-003: Wholesale Entitlement Boundary

## Decision
- una cotizacion `accepted` no habilita acceso por si sola
- solo `won` puede abrir entitlement mayorista
- el entitlement se monta sobre cuenta existente si el email ya existe
- la suspension conserva historial y solo apaga acceso mayorista activo
```

- [ ] **Step 5: Verificar Fase 3 abierta**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 2 -type f | sort
rg -n "wholesale|entitlement|accepted|won|commercial-access" docs/fase-3-arquitectura
```

Expected: el slice `003` aparece en arquitectura y la ADR queda enlazada.

- [ ] **Step 6: Commit de Fase 3**

```bash
git add docs/fase-3-arquitectura
git commit -m "docs: add wholesale leads quotes architecture slice"
```

### Task 4: Abrir Fase 4 y el paquete `specs/003-wholesale-leads-quotes`

**Files:**
- Modify: `docs/fase-4-sdd/README.md`
- Create: `specs/003-wholesale-leads-quotes/spec-funcional.md`
- Create: `specs/003-wholesale-leads-quotes/spec-tecnica.md`
- Create: `specs/003-wholesale-leads-quotes/spec-tareas.md`
- Create: `specs/003-wholesale-leads-quotes/traceability.md`

- [ ] **Step 1: Releer el spec aprobado y el patron del slice `002`**

Run:

```bash
sed -n '1,260p' docs/superpowers/specs/2026-05-26-huelehuele-wholesale-leads-quotes-design.md
sed -n '1,260p' specs/002-vendors-commissions/spec-funcional.md
sed -n '1,280p' specs/002-vendors-commissions/spec-tecnica.md
sed -n '1,260p' specs/002-vendors-commissions/spec-tareas.md
sed -n '1,240p' specs/002-vendors-commissions/traceability.md
```

Expected: patrón canónico de Fase 4 y decisiones aprobadas del slice `003`.

- [ ] **Step 2: Actualizar el indice de Fase 4**

Añadir en `docs/fase-4-sdd/README.md`:

```md
## Slice 003 - Wholesale Leads Quotes
- [../../specs/003-wholesale-leads-quotes/spec-funcional.md](../../specs/003-wholesale-leads-quotes/spec-funcional.md)
- [../../specs/003-wholesale-leads-quotes/spec-tecnica.md](../../specs/003-wholesale-leads-quotes/spec-tecnica.md)
- [../../specs/003-wholesale-leads-quotes/spec-tareas.md](../../specs/003-wholesale-leads-quotes/spec-tareas.md)
- [../../specs/003-wholesale-leads-quotes/traceability.md](../../specs/003-wholesale-leads-quotes/traceability.md)
```

- [ ] **Step 3: Crear `spec-funcional.md`**

Crear `specs/003-wholesale-leads-quotes/spec-funcional.md` con este esqueleto:

```md
# Spec Funcional - Wholesale Leads Quotes

## Objetivo
Formalizar el funnel comercial mayorista y su relacion con `/cuenta`.

## Reglas canonicas
- `wholesale` y `distributor` comparten modulo
- `accepted` no crea pedido
- `won` habilita acceso mayorista
- el entitlement se suspende sin borrar historial
```

- [ ] **Step 4: Crear `spec-tecnica.md`**

Crear `specs/003-wholesale-leads-quotes/spec-tecnica.md` con este esqueleto:

```md
# Spec Tecnica - Wholesale Leads Quotes

## Baseline
- endpoints store y admin mayoristas
- cuenta autenticada con entitlement comercial

## Ownership
- `ventas`
- `wholesale`
- `commercial-access`
- `auth`
```

- [ ] **Step 5: Crear `spec-tareas.md`**

Crear `specs/003-wholesale-leads-quotes/spec-tareas.md` con backlog de:

```md
- captura y deduplicacion
- quotes y tiers
- cierre comercial
- entitlement mayorista
- resumen en `/cuenta`
- pruebas del funnel y suspension
```

- [ ] **Step 6: Crear `traceability.md`**

Crear `specs/003-wholesale-leads-quotes/traceability.md`:

```md
# Traceability - Wholesale Leads Quotes

## Matriz
- lead capture
- deduplicacion
- quote states
- accepted vs won
- entitlement mayorista
- `/cuenta` resumen basico
```

- [ ] **Step 7: Verificar Fase 4 abierta**

Run:

```bash
find specs/003-wholesale-leads-quotes -maxdepth 1 -type f | sort
rg -n "accepted|won|entitlement|wholesale|distributor" specs/003-wholesale-leads-quotes
```

Expected: aparecen los cuatro archivos y los contratos críticos quedan visibles.

- [ ] **Step 8: Commit de Fase 4**

```bash
git add docs/fase-4-sdd specs/003-wholesale-leads-quotes
git commit -m "docs: add wholesale leads quotes canonical specs"
```

### Task 5: Alinear la capa transversal del repo con el slice `003`

**Files:**
- Modify: `docs/transversal/90.00-mapa-homologacion-brownfield.md`
- Modify: `AI_CONTEXT.md`
- Modify: `TRACEABILITY_MATRIX.md`

- [ ] **Step 1: Releer la capa transversal vigente**

Run:

```bash
sed -n '1,260p' docs/transversal/90.00-mapa-homologacion-brownfield.md
sed -n '1,240p' AI_CONTEXT.md
sed -n '1,260p' TRACEABILITY_MATRIX.md
```

Expected: estado actual del repo tras slices `001` y `002`.

- [ ] **Step 2: Actualizar el mapa brownfield**

Agregar en `docs/transversal/90.00-mapa-homologacion-brownfield.md` el mapeo de:

```md
| `docs/flows/wholesale-flow.md` | `docs/fase-1-analisis-requerimientos/01.02-wholesale-leads-quotes.md`, `docs/fase-3-arquitectura/03.05-wholesale-leads-quotes.md`, `specs/003-wholesale-leads-quotes/` | Migrado | El funnel comercial mayorista ya tiene capa canonica propia. |
```

- [ ] **Step 3: Actualizar `AI_CONTEXT.md`**

Reflejar:

```md
- Fase activa: extension de la capa canonica al slice `003-wholesale-leads-quotes`
| Fase 1 | Backfilled para slices `001`, `002` y `003` | ...
| Fase 2 | Backfilled para slices `001`, `002` y `003` | ...
| Fase 3 | Backfilled para slices `001`, `002` y `003` | ...
| Fase 4 | Instanciada para features `001`, `002` y `003` | ...
```

- [ ] **Step 4: Actualizar `TRACEABILITY_MATRIX.md`**

Marcar:

```md
| `REQ-HH-004` | Atender leads mayoristas y distribuidores desde operacion | ... | Fases 1-4 canonicas del slice `003-wholesale-leads-quotes` | Backfilled para estado actual mayorista |
```

- [ ] **Step 5: Verificar alineacion transversal**

Run:

```bash
rg -n "003-wholesale-leads-quotes|REQ-HH-004|wholesale-flow|mayorista" docs/transversal/90.00-mapa-homologacion-brownfield.md AI_CONTEXT.md TRACEABILITY_MATRIX.md docs/fase-1-analisis-requerimientos/README.md docs/fase-2-ux-ui/README.md docs/fase-3-arquitectura/README.md docs/fase-4-sdd/README.md
git diff --check
```

Expected: el slice `003` aparece en índices y capa transversal sin diffs rotos.

- [ ] **Step 6: Commit de alineacion transversal**

```bash
git add docs/transversal/90.00-mapa-homologacion-brownfield.md AI_CONTEXT.md TRACEABILITY_MATRIX.md
git commit -m "docs: align canonical layer for wholesale leads quotes"
```

## Self-Review

- El plan cubre Fases 1-4 y la capa transversal del slice `003`.
- No hay marcadores de relleno; cada tarea apunta a archivos concretos.
- Los nombres de archivo y numeración siguen el patrón ya usado en `001` y `002`.
- El requisito crítico `accepted != won != order` aparece en Fase 1, Fase 3, Fase 4 y trazabilidad.

## Expected Outcome

Al ejecutar este plan, `ERP-HUELEHUELE` quedará con su tercer slice brownfield homologado:

- `001-checkout-payments`
- `002-vendors-commissions`
- `003-wholesale-leads-quotes`

y el repo tendrá una capa canónica más completa para seguir bajando el resto del roadmap vivo.
