# Storefront Game Temporal Indirect Alignment

**Goal:** Alinear `checkout`, `mayoristas`, `cuenta` y `panel-vendedor` al shell `game-temporal` sin reescribir sus flujos internos ni tocar contratos de compra, auth o overview comercial.

## Tareas

### Task 1: Shell compartido para superficies indirectas

**Files:**
- Modify: `apps/web/components/storefront-game-temporal.tsx`

- [ ] Crear un shell reusable con intro, badges, stat cards y callout operacional
- [ ] Mantener tipografía legible para formularios, tablas y lectura larga

### Task 2: Montar `checkout` sobre el shell

**Files:**
- Modify: `apps/web/components/checkout-workspace.tsx`

- [ ] Envolver el flujo real con el shell `game-temporal`
- [ ] Mantener wizard, quote, documento, entrega y pago intactos

### Task 3: Montar `mayoristas`, `cuenta` y `panel-vendedor`

**Files:**
- Modify: `apps/web/components/wholesale-workspace.tsx`
- Modify: `apps/web/components/account-workspace.tsx`
- Modify: `apps/web/components/seller-panel-workspace.tsx`

- [ ] Reinterpretar cada superficie con framing, intro y continuidad visual compartida
- [ ] No mover ownership de lead, sesion, loyalty ni seller overview

### Task 4: Verificación

**Files:**
- No doc changes required beyond this plan unless contracts change

- [ ] Ejecutar `npm run typecheck -w @huelegood/web`
- [ ] Ejecutar `npm run build -w @huelegood/web`
- [ ] Revisar localmente `/checkout`, `/mayoristas`, `/cuenta` y `/panel-vendedor`
