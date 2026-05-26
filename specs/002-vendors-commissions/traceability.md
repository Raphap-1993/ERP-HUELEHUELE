# Traceability - Vendors Commissions

Fecha: 2026-05-26.

## Objetivo

Trazar las reglas canonicas del slice seller-first contra sus fuentes
brownfield, los artefactos canonicos ya abiertos en Fases 1-3 y el baseline
tecnico real del monorepo.

## Matriz

| ID | Regla canonica | Fuentes brownfield | Artefactos nuevos | Baseline tecnico actual | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- |
| TR-01 | el seller-first es un flujo end-to-end desde postulacion hasta payout | `docs/flows/vendors-and-commissions.md`, `docs/product/scope.md` | `docs/fase-1-analisis-requerimientos/01.01-vendors-commissions.md`, `spec-funcional.md` | `apps/api/src/modules/vendors/vendors.service.ts`, `apps/api/src/modules/commissions/commissions.service.ts`, `apps/web/components/seller-panel-workspace.tsx` | smoke funcional del flujo seller-first y revision cruzada de docs |
| TR-02 | la postulacion publica no crea acceso comercial por si sola | `docs/flows/vendor-application.md`, `docs/flows/commercial-accesses.md` | `docs/fase-1-analisis-requerimientos/casos-de-uso/UC-04-postulacion-vendedor.md`, `spec-funcional.md` | `apps/api/src/modules/vendors/vendors.service.ts::submitApplication`, `apps/api/src/modules/auth/auth.service.ts::createCommercialAccess` | `commercial-accesses.test.ts` y revision del formulario `/trabaja-con-nosotros` |
| TR-03 | la aprobacion resuelve `collaborationType`, `preferredCode` y `vendorCode` | `docs/flows/vendor-application.md`, `docs/flows/vendors-and-commissions.md` | `01.01-vendors-commissions.md`, `UC-04-postulacion-vendedor.md`, `spec-tecnica.md` | `apps/api/src/modules/vendors/vendors.service.ts::approveApplication`, `createManualVendor`, `updateVendor` | pruebas de aprobacion y unicidad de codigo |
| TR-04 | `/cuenta` y `/panel-vendedor` requieren acceso comercial y vendedor activo | `docs/flows/commercial-accesses.md`, `docs/product/roles-and-permissions.md` | `docs/fase-2-ux-ui/02.01-vendors-commissions-ux-ui.md`, `spec-funcional.md` | `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/modules/core/seller-panel.controller.ts`, `apps/api/src/modules/core/core.service.ts` | login smoke con vendedor activo, suspendido y sin vinculo |
| TR-05 | un pedido solo tiene un `vendorCode` efectivo y `orders` es su dueno | `docs/flows/vendors-and-commissions.md`, `docs/architecture/modules.md` | `UC-05-atribucion-vendedor-en-pedido.md`, `docs/fase-3-arquitectura/03.04-vendors-commissions.md`, `spec-tecnica.md` | `apps/api/src/modules/orders/orders.controller.ts`, `apps/api/src/modules/orders/orders.service.ts::assignOrderVendor` | pruebas API de `POST /admin/orders/:orderNumber/vendor` |
| TR-06 | la correccion post-pedido solo se permite antes del lock financiero | `docs/fase-1-analisis-requerimientos/reglas/vendedores-y-comisiones.md`, `docs/fase-3-arquitectura/adr/ADR-002-vendor-attribution-financial-lock.md`, `docs/superpowers/specs/2026-05-26-huelehuele-vendors-commissions-design.md` | `03.04-vendors-commissions.md`, `ADR-002-vendor-attribution-financial-lock.md`, `spec-funcional.md`, `spec-tareas.md` | `apps/api/src/modules/orders/orders.service.ts`, `apps/api/src/modules/commissions/commissions.service.ts` | regresion pre-lock vs post-lock |
| TR-07 | no se permite `A -> none` si ya hubo comision materializada | `docs/flows/vendors-and-commissions.md`, `docs/fase-1-analisis-requerimientos/reglas/vendedores-y-comisiones.md` | `spec-funcional.md`, `spec-tecnica.md`, `spec-tareas.md` | `apps/admin/components/orders-workspace.tsx` hoy ofrece `Sin vendedor asociado`; `apps/api/src/modules/orders/orders.service.ts::assignOrderVendor` hoy permite vaciar vendedor | prueba de bloqueo y ajuste de copy/UI operativa |
| TR-08 | `commissions` deriva comisiones desde pedidos y recompone consecuencia financiera | `docs/flows/vendors-and-commissions.md`, `docs/architecture/modules.md`, `ADR-002-vendor-attribution-financial-lock.md` | `UC-06-comisiones-payouts-y-panel-vendedor.md`, `03.04-vendors-commissions.md`, `spec-tecnica.md` | `apps/api/src/modules/commissions/commissions.service.ts::syncFromOrders`, `syncOrderCommission`, `reconcilePayouts` | prueba de correccion `A -> B` con recomposicion consistente |
| TR-09 | `payments` no corrige atribucion comercial | `docs/architecture/modules.md`, `docs/superpowers/specs/2026-05-26-huelehuele-vendors-commissions-design.md` | `03.04-vendors-commissions.md`, `spec-funcional.md`, `spec-tecnica.md` | `apps/api/src/modules/payments/payments.service.ts`, `apps/admin/components/payments-workspace.tsx` | revisiones de ownership y ausencia de endpoint/accion de vendedor en pagos |
| TR-10 | `worker` solo ejecuta procesos asincronos del slice | `docs/flows/vendors-and-commissions.md`, `docs/architecture/modules.md` | `03.04-vendors-commissions.md`, `spec-tecnica.md`, `spec-tareas.md` | `apps/api/src/persistence/bullmq.service.ts`, `apps/worker/src/main.ts`, `apps/api/src/modules/commissions/commissions.service.ts::queueCreatePayout/queueSettlePayout` | smoke de colas e inspeccion de ownership de jobs |
| TR-11 | los payouts viven por `vendorCode` y periodo | `docs/flows/vendors-and-commissions.md`, `docs/fase-1-analisis-requerimientos/reglas/vendedores-y-comisiones.md` | `UC-06-comisiones-payouts-y-panel-vendedor.md`, `spec-funcional.md`, `spec-tecnica.md` | `apps/api/src/modules/commissions/commissions.service.ts::createPayout`, `findPayoutByVendorAndPeriod` | pruebas de duplicado y unicidad por vendedor/periodo |
| TR-12 | el seller panel consume verdad derivada y no recalcula negocio | `docs/fase-2-ux-ui/02.01-vendors-commissions-ux-ui.md`, `specs/002-vendors-commissions/product-design.md`, `specs/002-vendors-commissions/spdd-frontend.md` | `spec-funcional.md`, `spec-tecnica.md` | `apps/api/src/modules/core/core.service.ts::getSellerPanelOverview`, `apps/web/components/seller-panel-workspace.tsx` | smoke del panel y contraste con `/admin/comisiones` |

## Dependencias Fuera De Este Ownership

- la arquitectura de Fase 3 y la ADR del lock financiero siguen siendo la fuente formal de ownership y guardrails
- la implementacion de hardening tecnico pertenece a los futuros cortes de codigo, no a este paquete documental
- cualquier flujo post-payout o ajuste financiero posterior requiere un slice o ADR separado

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- conectado con las fuentes seller-first del brownfield
- alineado con Fases 1, 2 y 3 ya abiertas
- listo para integrarse a una implementacion futura sin reabrir el runtime ni mezclar ownership entre modulos
