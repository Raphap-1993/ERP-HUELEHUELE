# Traceability - Wholesale Leads Quotes

Fecha: 2026-05-26.

## Objetivo

Trazar las reglas canonicas del slice mayorista contra sus fuentes brownfield,
los artefactos canonicos abiertos en Fases 1-3 y el baseline tecnico real del
monorepo.

## Matriz

| ID | Regla canonica | Fuentes brownfield | Artefactos nuevos | Baseline tecnico actual | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- |
| TR-01 | `wholesale` y `distributor` comparten modulo y funnel | `docs/flows/wholesale-flow.md`, `docs/product/scope.md` | `docs/fase-1-analisis-requerimientos/01.02-wholesale-leads-quotes.md`, `spec-funcional.md` | `apps/api/src/modules/wholesale/wholesale.service.ts`, `apps/web/components/wholesale-workspace.tsx`, `packages/shared/src/types/api.ts` | smoke de captura `wholesale` y `distributor` con el mismo flujo |
| TR-02 | la captura publica no crea cuenta ni credenciales comerciales | `docs/flows/wholesale-flow.md`, `docs/flows/commercial-accesses.md` | `UC-07-captura-y-calificacion-mayorista.md`, `spec-funcional.md` | `apps/web/components/wholesale-workspace.tsx`, `apps/web/lib/api.ts`, `apps/api/src/modules/wholesale/wholesale.controller.ts` | revisiones del formulario y prueba negativa de auto-registro comercial |
| TR-03 | `Ventas` es dueno operativo de calificacion, deduplicacion y cierre | `docs/flows/wholesale-flow.md`, `docs/product/roles-and-permissions.md` | `01.02-wholesale-leads-quotes.md`, `02.02-wholesale-leads-quotes-ux-ui.md`, `spec-tecnica.md` | `apps/api/src/modules/wholesale/wholesale.service.ts`, `apps/admin/lib/api.ts` | smoke de lifecycle `new -> qualified -> quoted -> won/lost` |
| TR-04 | los duplicados se marcan para revision y no se fusionan automaticamente | `docs/flows/wholesale-flow.md` | `reglas/mayoristas-y-cotizaciones.md`, `spec-funcional.md`, `spec-tareas.md` | `apps/api/src/modules/wholesale/wholesale.service.ts` | prueba de lead duplicado y revision operativa |
| TR-05 | la cotizacion parte del catalogo real y `tier` es editable | `docs/flows/wholesale-flow.md`, `docs/product/scope.md` | `UC-08-cotizacion-y-cierre-comercial.md`, `product-design.md`, `spec-tecnica.md` | `apps/api/src/modules/wholesale/wholesale.service.ts`, `apps/admin/lib/api.ts` | prueba de creacion de quote con items validos y `tier` editable |
| TR-06 | `accepted` no crea pedido ni acceso | `docs/flows/wholesale-flow.md`, `docs/flows/commercial-accesses.md` | `01.02-wholesale-leads-quotes.md`, `03.05-wholesale-leads-quotes.md`, `ADR-003-wholesale-entitlement-boundary.md`, `spec-funcional.md` | `apps/api/src/modules/wholesale/wholesale.service.ts`, `apps/api/src/modules/auth/auth.service.ts` | regresion de quote `accepted` sin `order` ni `commercial_access` |
| TR-07 | solo `won` habilita entitlement mayorista | `docs/flows/wholesale-flow.md`, `docs/flows/commercial-accesses.md`, `docs/superpowers/specs/2026-05-26-huelehuele-wholesale-leads-quotes-design.md` | `UC-09-entitlement-mayorista-y-resumen-en-cuenta.md`, `ADR-003-wholesale-entitlement-boundary.md`, `spec-tecnica.md` | `apps/api/src/modules/auth/auth.service.ts`, `apps/admin/components/commercial-accesses-workspace.tsx` | prueba de bloqueo para lead no `won` y alta correcta sobre `won` |
| TR-08 | el acceso mayorista se crea o vincula sobre cuenta existente o reutilizada por email | `docs/flows/commercial-accesses.md` | `01.02-wholesale-leads-quotes.md`, `spec-funcional.md`, `spec-tareas.md` | `apps/api/src/modules/auth/auth.service.ts`, `apps/api/test/commercial-accesses.test.ts` | prueba de reuse de email sin duplicar identidad |
| TR-09 | `/cuenta` expone resumen mayorista basico y no portal B2B operativo | `docs/flows/commercial-accesses.md`, `docs/flows/wholesale-flow.md` | `02.02-wholesale-leads-quotes-ux-ui.md`, `spdd-frontend.md`, `spec-funcional.md` | `apps/web/components/account-workspace.tsx` | smoke de cuenta autenticada con mayorista activo y suspendido |
| TR-10 | un mayorista no gana `vendorCode`, comisiones ni acceso a `/panel-vendedor` por este slice | `docs/flows/commercial-accesses.md`, `docs/product/roles-and-permissions.md` | `03.05-wholesale-leads-quotes.md`, `ADR-003-wholesale-entitlement-boundary.md`, `spec-tecnica.md` | `apps/web/components/account-workspace.tsx`, `apps/api/src/modules/auth/auth.service.ts` | contraste entre cuenta wholesale y seller panel |
| TR-11 | la suspension del entitlement conserva historia y cuenta | `docs/flows/commercial-accesses.md` | `spec-funcional.md`, `spec-tecnica.md`, `spec-tareas.md` | `apps/api/src/modules/auth/auth.service.ts`, `apps/admin/components/commercial-accesses-workspace.tsx` | prueba de suspension/reactivacion sin perdida de trazabilidad |

## Dependencias Fuera De Este Ownership

- la futura evolucion a portal B2B completo requiere un slice o ADR separado
- el order flow mayorista queda fuera de este corte
- el seller-first y sus comisiones permanecen en `002-vendors-commissions`

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- conectado con las fuentes mayoristas del brownfield
- alineado con Fases 1, 2 y 3 ya abiertas
- listo para integrarse a una implementacion futura sin abrir un portal B2B
  prematuro ni mezclar ownership con seller-first
