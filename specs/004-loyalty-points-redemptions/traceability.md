# Traceability - Loyalty Points Redemptions

Fecha: 2026-05-26.

## Objetivo

Trazar las reglas canonicas del slice loyalty contra sus fuentes brownfield,
los artefactos canonicos abiertos en Fases 1-3 y el baseline tecnico real del
monorepo.

## Matriz

| ID | Regla canonica | Fuentes brownfield | Artefactos nuevos | Baseline tecnico actual | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- |
| TR-01 | los puntos pertenecen a una cuenta cliente autenticada | `docs/flows/loyalty-flow.md`, `docs/product/scope.md` | `docs/fase-1-analisis-requerimientos/01.03-loyalty-points-redemptions.md`, `spec-funcional.md` | `apps/api/src/modules/loyalty/loyalty.service.ts`, `apps/web/components/account-workspace.tsx` | smoke de cuenta autenticada con resumen loyalty |
| TR-02 | existe una sola `loyalty_rule` activa de acumulacion | `docs/flows/loyalty-flow.md`, `docs/product/backlog-mvp.md` | `reglas/loyalty-y-canjes.md`, `spec-funcional.md`, `spec-tecnica.md` | `apps/api/src/modules/loyalty/loyalty.service.ts`, `apps/admin/components/loyalty-workspace.tsx` | revision de reglas y visibilidad operativa |
| TR-03 | earn depende del hito elegible del pedido | `docs/flows/loyalty-flow.md`, `docs/flows/checkout-openpay.md` | `UC-10-acumulacion-y-liberacion-de-puntos.md`, `03.06-loyalty-points-redemptions.md`, `spec-tecnica.md` | `apps/api/src/modules/orders/orders.service.ts`, `apps/api/src/modules/loyalty/loyalty.service.ts` | prueba de earn `pending` y `available` |
| TR-04 | un movimiento `pending` puede liberarse a `available` | `docs/flows/loyalty-flow.md` | `01.03-loyalty-points-redemptions.md`, `spec-funcional.md`, `spec-tareas.md` | `apps/api/src/modules/loyalty/loyalty.service.ts::settleOrderPoints` | prueba de settlement sin doble liberacion |
| TR-05 | un canje `pending` reserva puntos de inmediato | `docs/flows/loyalty-flow.md`, `docs/superpowers/specs/2026-05-26-huelehuele-loyalty-points-redemptions-design.md` | `UC-11-canje-pendiente-y-reserva.md`, `ADR-004-loyalty-redemption-reservation-boundary.md`, `spec-funcional.md` | `apps/api/src/modules/loyalty/loyalty.service.ts::createRedemption` | prueba de reserva y bloqueo de doble gasto |
| TR-06 | `applied` consume y `cancelled` devuelve la reserva | `docs/flows/loyalty-flow.md` | `01.03-loyalty-points-redemptions.md`, `03.06-loyalty-points-redemptions.md`, `spec-tecnica.md` | `apps/api/src/modules/loyalty/loyalty.service.ts::updateRedemptionStatus`, `apps/admin/components/loyalty-workspace.tsx` | pruebas de resolucion del canje |
| TR-07 | los ajustes manuales son auditables | `docs/flows/loyalty-flow.md`, `docs/product/roles-and-permissions.md` | `UC-12-ajustes-manuales-y-reversa-automatica.md`, `spec-funcional.md`, `spec-tareas.md` | `apps/api/src/modules/loyalty/loyalty.service.ts::assignPoints`, `apps/admin/components/loyalty-workspace.tsx` | revision de actor, motivo y estado |
| TR-08 | la reversa por invalidez del pedido es automatica | `docs/flows/loyalty-flow.md`, `docs/flows/checkout-openpay.md` | `UC-12-ajustes-manuales-y-reversa-automatica.md`, `03.06-loyalty-points-redemptions.md`, `spec-tecnica.md` | `apps/api/src/modules/orders/orders.service.ts::reverseOrderPoints`, `apps/api/src/modules/loyalty/loyalty.service.ts::reverseOrderPoints` | smoke de pedido invalidado y reversal |
| TR-09 | `/cuenta` expone visibilidad del programa y no autoservicio | `docs/product/roles-and-permissions.md`, `docs/flows/loyalty-flow.md` | `02.03-loyalty-points-redemptions-ux-ui.md`, `spdd-frontend.md`, `spec-funcional.md` | `apps/web/components/account-workspace.tsx` | smoke de lectura en cuenta sin accion de canje |
| TR-10 | `marketing` es dueno operativo principal del slice | `docs/product/roles-and-permissions.md`, `docs/product/scope.md` | `01.03-loyalty-points-redemptions.md`, `03.06-loyalty-points-redemptions.md`, `spec-tecnica.md` | `apps/admin/app/loyalty/page.tsx`, `apps/admin/components/loyalty-workspace.tsx` | contraste entre permisos y superficie real |

## Dependencias Fuera De Este Ownership

- la futura expiracion fuerte requiere un corte o ADR adicional
- un catalogo formal de recompensas queda fuera de este slice
- campañas, segmentos y CRM avanzados pertenecen a slices posteriores

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- conectado con las fuentes loyalty del brownfield
- alineado con Fases 1, 2 y 3 ya abiertas
- listo para integrarse a una implementacion futura sin abrir un motor de
  fidelizacion mas complejo ni mezclarlo con promociones o checkout
