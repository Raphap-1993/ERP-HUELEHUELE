# Huele Huele Stock Fix Prod Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** llevar a producción el fix que convierte `Inventario` en la única fuente operativa de stock y evita que `Productos` rompa la venta pública al editar `stockOnHand`.

**Architecture:** el release se arma en una rama limpia desde `origin/main`, aplicando solo el patch del fix de inventario y dejando fuera cambios ajenos del worktree actual y de `main-release`. El despliegue productivo se hace como release de código sobre la VPS sin cambios de schema, con smoke checks y validación funcional posterior.

**Tech Stack:** Git worktrees, npm workspaces, NestJS, Next.js, Prisma, PM2, SSH a Hestia VPS.

---

### Task 1: Aislar El Fix En Una Base Limpia

**Files:**
- Read: `apps/api/src/modules/products/products.service.ts`
- Read: `apps/admin/components/products-workspace.tsx`
- Read: `apps/api/test/erp-sales-flow.test.ts`
- Read: `packages/shared/src/types/api.ts`
- Create: `docs/superpowers/plans/2026-06-06-huelehuele-stock-fix-prod-release.md`

- [ ] **Step 1: Exportar un patch solo con el fix de inventario**

Run:

```bash
git -C /Users/rapha/Projects/ERP-HUELEHUELE diff -- \
  apps/api/src/modules/products/products.service.ts \
  apps/api/test/erp-sales-flow.test.ts \
  apps/admin/components/products-workspace.tsx \
  packages/shared/src/types/api.ts \
  > /private/tmp/huelehuele-stock-fix.patch
```

Expected: se crea `/private/tmp/huelehuele-stock-fix.patch` sin incluir archivos web ajenos.

- [ ] **Step 2: Crear un worktree limpio desde `origin/main`**

Run:

```bash
git -C /Users/rapha/Projects/ERP-HUELEHUELE worktree add \
  /Users/rapha/.config/superpowers/worktrees/ERP-HUELEHUELE/ERP-HUELEHUELE-prod-stock-fix \
  -b codex/prod-stock-fix origin/main
```

Expected: worktree nuevo, limpio y basado en `526e25b` o el HEAD vigente de `origin/main`.

- [ ] **Step 3: Aplicar el patch al worktree limpio**

Run:

```bash
git -C /Users/rapha/.config/superpowers/worktrees/ERP-HUELEHUELE/ERP-HUELEHUELE-prod-stock-fix apply /private/tmp/huelehuele-stock-fix.patch
```

Expected: patch aplicado sin conflictos.

### Task 2: Verificar La Rama De Release

**Files:**
- Modify: `apps/api/src/modules/products/products.service.ts`
- Modify: `apps/api/test/erp-sales-flow.test.ts`
- Modify: `apps/admin/components/products-workspace.tsx`
- Modify: `packages/shared/src/types/api.ts`

- [ ] **Step 1: Instalar dependencias del worktree limpio**

Run:

```bash
npm ci
```

Workdir:

```bash
/Users/rapha/.config/superpowers/worktrees/ERP-HUELEHUELE/ERP-HUELEHUELE-prod-stock-fix
```

Expected: dependencias listas para typecheck y build.

- [ ] **Step 2: Verificar typecheck del admin**

Run:

```bash
npm run typecheck -w @huelegood/admin
```

Expected: exit 0.

- [ ] **Step 3: Verificar typecheck del api**

Run:

```bash
npm run typecheck -w @huelegood/api
```

Expected: exit 0.

- [ ] **Step 4: Verificar la regresión crítica**

Run:

```bash
npm run test:erp-sales -w @huelegood/api -- --test-name-pattern="productos rechaza cambios de stock cuando la variante ya se gobierna por inventario por almacen"
```

Expected: el test pasa y la protección queda trazable.

- [ ] **Step 5: Verificar build de release**

Run:

```bash
npm run build
```

Expected: build completa de shared, web, admin, api y worker.

### Task 3: Publicar Y Desplegar El Release

**Files:**
- Modify: `apps/api/src/modules/products/products.service.ts`
- Modify: `apps/api/test/erp-sales-flow.test.ts`
- Modify: `apps/admin/components/products-workspace.tsx`
- Modify: `packages/shared/src/types/api.ts`

- [ ] **Step 1: Commit del snapshot limpio**

Run:

```bash
git add \
  apps/api/src/modules/products/products.service.ts \
  apps/api/test/erp-sales-flow.test.ts \
  apps/admin/components/products-workspace.tsx \
  packages/shared/src/types/api.ts
git commit -m "fix: lock product stock edits behind warehouse inventory"
```

Expected: commit único y trazable del fix.

- [ ] **Step 2: Empujar rama de release**

Run:

```bash
git push -u origin codex/prod-stock-fix
```

Expected: rama publicada en GitHub.

- [ ] **Step 3: Preparar release timestamp en VPS**

Run:

```bash
ssh hestia-vps
```

Then create a new release under:

```bash
/home/huelehuele/apps/huelegood.com/releases/<timestamp>-main-<shortsha>-stock-fix
```

Expected: release dir limpio apuntando al commit publicado.

- [ ] **Step 4: Ejecutar backup y release en VPS**

Run on VPS:

```bash
npm run deploy:backup
APP_RELEASE_SHA=<shortsha> npm run deploy:release
```

Expected: backup exitoso, build productivo exitosa, PM2 recargado, smoke checks OK.

### Task 4: Validar Producción Y Cerrar

**Files:**
- Read: `docs/infra/deployment-strategy.md`

- [ ] **Step 1: Validar salud pública**

Run:

```bash
curl -fsS https://huelegood.com/health
curl -fsS https://admin.huelegood.com/health
curl -fsS https://api.huelegood.com/api/v1/health/operational
```

Expected: respuestas `ok`/`healthy`.

- [ ] **Step 2: Validar comportamiento de stock**

Checks:

```text
- el storefront sigue cotizando variantes comprables;
- Productos ya no debe permitir cambiar stock de variantes con warehouse balances;
- Inventario sigue siendo la ruta válida para aumentar stock.
```

- [ ] **Step 3: Registrar release exacta**

Capture:

```text
- commit desplegado
- release path activo
- resultado de smoke checks
- validación funcional final
```
