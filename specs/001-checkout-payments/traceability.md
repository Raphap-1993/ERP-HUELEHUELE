# Traceability - Checkout Payments

Fecha: 2026-05-26.

## Objetivo

Trazar cada regla canonica del slice contra sus fuentes brownfield, la nueva documentacion de arquitectura y la implementacion real que hoy existe en el monorepo.

## Matriz

| ID | Regla canonica | Fuentes brownfield | Artefactos nuevos | Baseline tecnico actual | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- |
| TR-01 | el sistema sigue siendo un monolito modular en cuatro procesos | `docs/architecture/overview.md`, `docs/architecture/system-diagrams.md`, `docs/infra/pm2-services.md` | `docs/fase-3-arquitectura/03.00-arquitectura.md`, `03.03-plan-despliegue.md` | `apps/web`, `apps/admin`, `apps/api`, `apps/worker` | smoke checks de salud y PM2 |
| TR-02 | `orders` es dueno del estado comercial del pedido | `docs/architecture/modules.md`, `docs/flows/checkout-openpay.md` | `03.00-arquitectura.md`, `spec-tecnica.md` | `apps/api/src/modules/orders/orders.service.ts` | tests de confirmacion y stock |
| TR-03 | `payments` es dueno de comprobantes manuales | `docs/architecture/modules.md`, `docs/flows/manual-payments.md` | `03.00-arquitectura.md`, `spec-funcional.md` | `apps/api/src/modules/payments/payments.service.ts`, `apps/admin/components/payments-workspace.tsx` | revision UI `/pagos` + tests manual review |
| TR-04 | `Pedidos > Operacion` es la vista canonica para trazabilidad y conciliacion online | `docs/flows/checkout-openpay.md`, `docs/flows/manual-payments.md` | `03.00-arquitectura.md`, `ADR-001-payment-provider-gateway-boundary.md`, `spec-funcional.md` | `apps/admin/components/orders-workspace.tsx` | smoke en `/pedidos` |
| TR-05 | solo puede haber un provider online activo | solicitud del slice 2026-05-26, `docs/flows/checkout-openpay.md` | `03.00-arquitectura.md`, `03.01-decisiones-tecnologia.md`, `spec-funcional.md` | `apps/api/src/modules/commerce/commerce.service.ts` hoy hardcodea Openpay | test/config de `PAYMENT_ONLINE_PROVIDER_ACTIVE` |
| TR-06 | `manual payment` debe seguir visible hoy | `docs/flows/manual-payments.md`, `docs/ux/checkout-redesign.md` | `03.00-arquitectura.md`, `spec-funcional.md`, `spec-tareas.md` | `apps/web/components/checkout-workspace.tsx` | smoke en `/checkout` |
| TR-07 | la auto confirmacion futura solo corre en `captured/paid` | solicitud del slice 2026-05-26, brecha declarada en `docs/architecture/modules.md` | `ADR-001-payment-provider-gateway-boundary.md`, `spec-funcional.md`, `spec-tecnica.md` | no existe boundary canonico aun | tests webhook `authorized` vs `captured` |
| TR-08 | la idempotencia del checkout es obligatoria | `docs/flows/checkout-openpay.md` | `03.00-arquitectura.md`, `spec-funcional.md`, `spec-tecnica.md` | `apps/api/src/modules/orders/orders.service.ts`, `apps/api/test/erp-sales-flow.test.ts` | tests por `clientRequestId` |
| TR-09 | la idempotencia externa del provider necesita persistencia propia | brecha declarada en `docs/architecture/modules.md` | `03.00-arquitectura.md`, `03.01-decisiones-tecnologia.md`, `spec-tecnica.md` | hoy no existe `payment_gateway_events` | test de duplicate webhook |
| TR-10 | `delivery` Lima/Callao y `Shalom` provincia se mantienen | `docs/flows/checkout-openpay.md`, `docs/ux/checkout-redesign.md` | `spec-funcional.md` | `apps/api/src/modules/commerce/commerce.service.ts`, `apps/web/components/checkout-workspace.tsx` | tests de validacion de envio |
| TR-11 | el registro manual directo solo aplica a pedidos manuales | `docs/flows/manual-payments.md` | `spec-funcional.md`, `spec-tecnica.md`, `spec-tareas.md` | `apps/api/src/modules/orders/orders.service.ts`, `apps/admin/components/orders-workspace.tsx` | test de bloqueo sobre pedido online |
| TR-12 | no se crean procesos PM2 nuevos | `docs/infra/deployment-strategy.md`, `docs/infra/pm2-services.md` | `03.03-plan-despliegue.md` | `ecosystem.config.cjs`, servicios PM2 vigentes | despliegue con mismos cuatro procesos |

## Dependencias Fuera De Este Ownership

- las fases 1 y 2 del canon brownfield deben referenciar este slice cuando sus archivos vecinos queden materializados;
- la implementacion real del gateway, Prisma y tests pertenece a los agentes de codigo, no a este paquete documental;
- cualquier cambio de ruta productiva o `.env` debe volver a trazarse contra `docs/infra/deployment-strategy.md`.

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- conectado a la arquitectura brownfield vigente;
- conectado a la futura implementacion por rutas reales del repo;
- protegido contra mezcla de ownership entre `payments`, `orders` y `payment-gateway`.
