# ERP-HUELEHUELE Brownfield Homologation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear una capa canónica intermedia en `ERP-HUELEHUELE` alineada a `project-templatev12.104.0`, sin romper la documentación vigente ni reestructurar todo el monorepo de golpe.

**Architecture:** La homologación se hará como brownfield sobre el repo real. La nueva capa canónica vivirá en rutas `docs/fase-*`, `specs/`, `qa/`, `ops/` y artefactos raíz, mientras que la documentación actual seguirá existiendo como fuente vigente o evidencia histórica según un mapa explícito de homologación. El primer slice homologado será `checkout público + pago manual + frontera canónica de payment gateway idempotente`.

**Tech Stack:** Markdown, git worktree, validación documental local, monorepo Next.js + NestJS + Prisma ya existente.

---

### Task 1: Crear el mapa brownfield y la raíz canónica

**Files:**
- Create: `docs/transversal/90.00-mapa-homologacion-brownfield.md`
- Create: `AGENTS.md`
- Create: `AI_CONTEXT.md`
- Create: `PROJECT_MAP.md`
- Create: `TRACEABILITY_MATRIX.md`
- Create: `GLOSSARY.md`

- [ ] **Step 1: Levantar fuentes vigentes del repo**

Run:

```bash
sed -n '1,220p' docs/README.md
sed -n '1,220p' README.md
find docs -maxdepth 2 -type f | sort
```

Expected: listado de documentos vigentes y estructura documental actual del monorepo.

- [ ] **Step 2: Redactar el mapa de homologación brownfield**

Crear `docs/transversal/90.00-mapa-homologacion-brownfield.md` con:

```md
# Mapa De Homologacion Brownfield

## Objetivo
Definir cómo `ERP-HUELEHUELE` adopta la capa canónica de `project-templatev12.104.0` sin perder la documentación operativa ya vigente.

## Regla de transición
- La documentación actual no se borra en esta fase.
- La nueva capa canónica se convierte en la entrada oficial del proyecto.
- Cada artefacto nuevo debe declarar qué fuente vigente actual consolida.

## Matriz de mapeo
| Fuente vigente actual | Artefacto canónico destino | Estado | Observación |
| --- | --- | --- | --- |
| `docs/product/product-vision.md` | `docs/fase-0-iniciacion/00.01-vision-proyecto.md` | migrado | visión consolidada |
| `docs/product/roadmap.md` | `docs/fase-0-iniciacion/00.02-roadmap.md` | migrado | roadmap base |
| `docs/product/roles-and-permissions.md` | `docs/fase-0-iniciacion/00.04-roles-y-responsabilidades.md` | parcial | separar roles de producto vs. roles de ejecución |
| `docs/flows/checkout-openpay.md` | `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md` | migrado | flujo online actual/futuro |
| `docs/flows/manual-payments.md` | `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md` | migrado | flujo manual vigente |
| `docs/ux/checkout-redesign.md` | `docs/fase-2-ux-ui/02.00-ux-ui.md` | migrado | slice checkout |
| `docs/architecture/overview.md` | `docs/fase-3-arquitectura/03.00-arquitectura.md` | migrado | arquitectura base |
| `docs/infra/deployment-strategy.md` | `docs/fase-3-arquitectura/03.03-plan-despliegue.md` | migrado | despliegue y homologación |
```

- [ ] **Step 3: Crear AGENTS.md local del repo**

Crear `AGENTS.md` con reglas mínimas:

```md
# AGENTS.md

## Proposito
Este repositorio contiene el proyecto real `ERP-HUELEHUELE` homologado de forma brownfield contra `project-templatev12.104.0`.

## Regla base
- La documentación canónica nueva vive en `docs/fase-*`, `specs/`, `qa/`, `ops/` y artefactos raíz.
- La documentación vigente previa sigue existiendo, pero debe mapearse vía `docs/transversal/90.00-mapa-homologacion-brownfield.md`.
- No usar ejemplos de otros dominios.
- El slice inicial de homologación es `checkout público + pago manual + payment gateway boundary`.
```

- [ ] **Step 4: Crear AI_CONTEXT.md, PROJECT_MAP.md, TRACEABILITY_MATRIX.md y GLOSSARY.md**

Crear estos archivos con contenido mínimo real:

```md
# AI_CONTEXT.md
- Proyecto: ERP-HUELEHUELE
- Modo actual: homologación brownfield
- Slice inicial: checkout público + pago manual + frontera gateway idempotente
```

```md
# PROJECT_MAP.md
- `apps/web`: storefront público
- `apps/admin`: backoffice
- `apps/api`: API transaccional
- `apps/worker`: jobs y procesos asíncronos
- `docs/`: documentación vigente e intermedia
```

```md
# TRACEABILITY_MATRIX.md
| Capa | Artefacto |
| --- | --- |
| Visión | `docs/fase-0-iniciacion/00.01-vision-proyecto.md` |
| Requerimientos | `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md` |
| UX | `docs/fase-2-ux-ui/02.00-ux-ui.md` |
| Arquitectura | `docs/fase-3-arquitectura/03.00-arquitectura.md` |
| Feature | `specs/001-checkout-payments/` |
```

```md
# GLOSSARY.md
- `manual payment`: pago con comprobante y revisión operativa
- `payment provider`: proveedor online activo único
- `captured/paid`: condición futura para confirmación automática
```

- [ ] **Step 5: Verificar archivos creados**

Run:

```bash
find . -maxdepth 2 \( -name 'AGENTS.md' -o -name 'AI_CONTEXT.md' -o -name 'PROJECT_MAP.md' -o -name 'TRACEABILITY_MATRIX.md' -o -name 'GLOSSARY.md' \) | sort
test -f docs/transversal/90.00-mapa-homologacion-brownfield.md && echo OK
```

Expected: todos los archivos listados presentes y `OK`.

### Task 2: Instanciar Fase 0 del proyecto homologado

**Files:**
- Create: `docs/fase-0-iniciacion/00.01-vision-proyecto.md`
- Create: `docs/fase-0-iniciacion/00.02-roadmap.md`
- Create: `docs/fase-0-iniciacion/00.03-estimacion-tiempo-costo.md`
- Create: `docs/fase-0-iniciacion/00.04-roles-y-responsabilidades.md`
- Create: `docs/fase-0-iniciacion/00.05-checklist-adopcion.md`
- Create: `docs/fase-0-iniciacion/00.06-estrategia-homologacion-brownfield.md`

- [ ] **Step 1: Leer producto, alcance y roles vigentes**

Run:

```bash
sed -n '1,220p' docs/product/product-vision.md
sed -n '1,220p' docs/product/scope.md
sed -n '1,220p' docs/product/roadmap.md
sed -n '1,220p' docs/product/roles-and-permissions.md
```

Expected: visión, alcance, roadmap y roles actuales del negocio.

- [ ] **Step 2: Redactar visión y roadmap canónicos**

Crear:

```md
# Vision Del Proyecto
ERP-HUELEHUELE es una plataforma operativa que unifica storefront, backoffice, API y workers para ventas, pagos, pedidos, inventario y operación comercial.
```

Y:

```md
# Roadmap
## Corte actual
- homologación brownfield al framework canónico
- slice inicial: checkout y pagos
```

- [ ] **Step 3: Redactar estimación y roles**

Crear `00.03-estimacion-tiempo-costo.md` como estimación de homologación documental/técnica y `00.04-roles-y-responsabilidades.md` con sponsor, operación, arquitectura, backend, frontend, QA y documentación.

- [ ] **Step 4: Redactar checklist y estrategia brownfield**

Crear `00.05-checklist-adopcion.md` y `00.06-estrategia-homologacion-brownfield.md` explicando:

```md
- no es greenfield
- no se borra documentación vigente
- se consolida por capas
- el primer slice homologado es checkout/pagos
```

- [ ] **Step 5: Verificar Fase 0**

Run:

```bash
find docs/fase-0-iniciacion -maxdepth 1 -type f | sort
```

Expected: seis archivos `00.01` a `00.06`.

### Task 3: Instanciar Fases 1 y 2 sobre el slice checkout/pagos

**Files:**
- Create: `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-01-checkout-publico.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-02-pago-manual-con-comprobante.md`
- Create: `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-03-conciliacion-operativa-manual.md`
- Create: `docs/fase-1-analisis-requerimientos/reglas/checkout-y-pagos.md`
- Create: `docs/fase-2-ux-ui/02.00-ux-ui.md`

- [ ] **Step 1: Leer flujos y UX actuales**

Run:

```bash
sed -n '1,260p' docs/flows/checkout-openpay.md
sed -n '1,260p' docs/flows/manual-payments.md
sed -n '1,260p' docs/ux/checkout-redesign.md
```

Expected: flujos vigentes del checkout y del pago manual, más decisiones UX ya implementadas.

- [ ] **Step 2: Consolidar análisis funcional**

Crear `01.00-analisis-requerimientos.md` con:

```md
## Modulos implicados
- storefront checkout
- pagos manuales
- pedidos y operación
- frontera futura de payment provider

## Reglas canónicas
- solo pago manual visible hoy
- un solo proveedor online activo a la vez
- confirmación automática futura solo en `captured/paid`
```

- [ ] **Step 3: Crear casos de uso y reglas**

Crear los tres `UC-*` y `reglas/checkout-y-pagos.md` aterrizando:
- checkout público actual
- manual payment con comprobante
- revisión operativa en `Pagos`
- trazabilidad comercial en `Pedidos > Operación`

- [ ] **Step 4: Crear UX canónica del slice**

Crear `docs/fase-2-ux-ui/02.00-ux-ui.md` con foco solo en checkout:

```md
- wizard de tres pasos
- pago manual visible
- superficie online futura oculta
- backoffice dividido entre `Pagos` y `Pedidos > Operación`
```

- [ ] **Step 5: Verificar Fases 1 y 2**

Run:

```bash
find docs/fase-1-analisis-requerimientos -maxdepth 2 -type f | sort
find docs/fase-2-ux-ui -maxdepth 1 -type f | sort
```

Expected: análisis, casos de uso, reglas y `02.00-ux-ui.md` presentes.

### Task 4: Instanciar Fase 3 y la primera feature SDD

**Files:**
- Create: `docs/fase-3-arquitectura/03.00-arquitectura.md`
- Create: `docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md`
- Create: `docs/fase-3-arquitectura/03.03-plan-despliegue.md`
- Create: `docs/fase-3-arquitectura/adr/ADR-001-payment-provider-gateway-boundary.md`
- Create: `specs/001-checkout-payments/spec-funcional.md`
- Create: `specs/001-checkout-payments/spec-tecnica.md`
- Create: `specs/001-checkout-payments/spec-tareas.md`
- Create: `specs/001-checkout-payments/traceability.md`

- [ ] **Step 1: Leer arquitectura e infraestructura vigentes**

Run:

```bash
sed -n '1,240p' docs/architecture/overview.md
sed -n '1,240p' docs/architecture/modules.md
sed -n '1,240p' docs/infra/deployment-strategy.md
sed -n '1,240p' docs/infra/pm2-services.md
```

Expected: arquitectura real del monorepo y despliegue actual.

- [ ] **Step 2: Redactar arquitectura base y decisiones de tecnología**

Crear `03.00-arquitectura.md`, `03.01-decisiones-tecnologia.md` y `03.03-plan-despliegue.md` consolidando monorepo, apps, workers, PostgreSQL, Redis, PM2 y Hestia/Nginx.

- [ ] **Step 3: Crear ADR de frontera de pagos**

Crear `ADR-001-payment-provider-gateway-boundary.md` con:

```md
- manual payment vigente
- un solo provider online activo
- confirmación automática futura solo con `captured/paid`
- interfaz idempotente para adapters `Culqi/Izipay/Openpay`
- `Pagos` dueño de comprobantes manuales
- `Pedidos > Operación` dueño de trazabilidad comercial y futura conciliación online
```

- [ ] **Step 4: Crear carpeta specs/001-checkout-payments**

Redactar:
- `spec-funcional.md`
- `spec-tecnica.md`
- `spec-tareas.md`
- `traceability.md`

Debe cubrir:
- checkout público actual
- pago manual con comprobante
- conciliación operativa manual
- payment gateway boundary como capacidad futura

- [ ] **Step 5: Verificar Fase 3 y specs**

Run:

```bash
find docs/fase-3-arquitectura -maxdepth 2 -type f | sort
find specs/001-checkout-payments -maxdepth 1 -type f | sort
```

Expected: arquitectura, ADR y cuatro archivos de la feature presentes.

### Task 5: Cerrar fases 5-8 y validar la capa canónica

**Files:**
- Create: `docs/fase-5-construccion/05.00-mapeo-implementacion-checkout-payments.md`
- Create: `docs/fase-6-qa/06.00-plan-qa-checkout-payments.md`
- Create: `docs/fase-7-deploy/07.00-release-y-rollback-checkout-payments.md`
- Create: `docs/fase-8-operacion/08.00-operacion-checkout-payments.md`

- [ ] **Step 1: Mapear construcción, QA, deploy y operación actuales**

Run:

```bash
sed -n '1,240p' docs/06-validacion-y-pruebas.md
sed -n '1,240p' docs/engineering/release-checklist.md
sed -n '1,240p' docs/infra/environments.md
```

Expected: insumos vigentes para pruebas, release y operación del slice.

- [ ] **Step 2: Crear docs 05-08**

Crear archivos con:

```md
- cómo el código actual satisface el slice
- cómo se prueba
- cómo se libera hoy
- cómo se opera y quién aprueba pagos manuales
```

- [ ] **Step 3: Verificar consistencia básica de la capa**

Run:

```bash
find docs/fase-* -maxdepth 2 -type f | sort
find specs -maxdepth 2 -type f | sort | sed -n '1,200p'
```

Expected: rutas canónicas de fases `0-8` y `specs/001-checkout-payments` presentes.

- [ ] **Step 4: Revisar estado git**

Run:

```bash
git status --short --branch
```

Expected: solo cambios de la homologación en la worktree aislada.

- [ ] **Step 5: Commit de la capa canónica inicial**

Run:

```bash
git add AGENTS.md AI_CONTEXT.md PROJECT_MAP.md TRACEABILITY_MATRIX.md GLOSSARY.md docs specs
git commit -m "docs: add brownfield canonical layer for huelehuele"
```

Expected: commit local con la capa canónica intermedia.
