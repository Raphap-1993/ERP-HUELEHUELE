# Spec Tareas - CRM Stage Order Follow-Up

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - CRM Stage Order Follow-Up](../../docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md),
  [Reglas de crm stage y order follow-up](../../docs/fase-1-analisis-requerimientos/reglas/crm-stage-y-order-follow-up.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.07-crm-stage-order-follow-up-ux-ui.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.10-crm-stage-order-follow-up.md),
  [ADR-008 Orders CRM Follow-Up Boundary](../../docs/fase-3-arquitectura/adr/ADR-008-orders-crm-follow-up-boundary.md)

## Objetivo

Convertir la arquitectura canonica brownfield del seguimiento derivado del
pedido en un backlog tecnico ejecutable, cerrando ownership de `orders`,
derivacion de `crmStage`, consolidacion de `commercialTrace`, defensa de
`Pedidos > Operacion` y regression de rutas comerciales, sin abrir CRM manual
ni absorber customers, fulfillment o notifications como dominio principal.

## Reglas De Ejecucion

- no convertir `crmStage` en workflow editable manualmente
- no usar `commercialTrace` como timeline CRM completo
- no mover el ownership del slice fuera de `orders`
- no tratar notifications como owner del flujo
- no mezclar el slice con customers, fulfillment, dispatch o vendedor
- no ocultar escenarios negativos donde `crmStage` se limpia

## Backlog Canonico

### T1. Consolidar contratos compartidos del slice

**Resultado esperado**

El repo expresa con claridad el lenguaje compartido de etapa CRM, traza
comercial, rutas, estados y acceso admin del modulo.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/domain/admin-access.ts`

**Checklist**

- [ ] sostener `OrderCommercialTraceRoute`
- [ ] sostener `OrderCommercialTraceStatus`
- [ ] sostener `OrderCommercialTraceSummary`
- [ ] mantener `CrmStage` como enum canonico
- [ ] preservar `AdminOrderSummary` y `AdminOrderDetail` con `crmStage` y
      `commercialTrace`
- [ ] sostener `adminAccessRoles.orders`

### T2. Defender `orders` como owner del seguimiento derivado

**Resultado esperado**

La API sigue canonizada con `orders` como duenio de `crmStage`,
`commercialTrace` y la relacion entre estado operativo y hito comercial.

**Rutas candidatas**

- `apps/api/src/modules/orders/orders.service.ts`

**Checklist**

- [ ] sostener `resolveInitialCrmStage()`
- [ ] sostener `resolveOperationalCrmStage()`
- [ ] sostener `resolveCommercialTrace()` y `syncCommercialTrace()`
- [ ] no introducir write model paralelo para CRM manual
- [ ] no mover ownership del slice a `payments` ni a `notifications`

### T3. Blindar rutas comerciales canonicas

**Resultado esperado**

La traza comercial conserva la ruta real que confirmo, dejo pendiente o cerro
negativamente el pedido.

**Rutas candidatas**

- `apps/api/src/modules/orders/orders.service.ts`
- `packages/shared/src/types/api.ts`

**Checklist**

- [ ] mantener `manual_direct`
- [ ] mantener `manual_request`
- [ ] mantener `openpay_backoffice`
- [ ] mantener `openpay_provider`
- [ ] sostener estados `pending`, `confirmed` y `rejected`
- [ ] preservar actor, referencia, nota y evidencia cuando aplica

### T4. Defender `Pedidos > Operacion` como superficie principal

**Resultado esperado**

La UI vigente queda canonizada como superficie de lectura y accion derivada
del pedido, no como CRM manual ni dashboard global.

**Rutas candidatas**

- `apps/admin/app/pedidos/page.tsx`
- `apps/admin/components/orders-workspace.tsx`
- `apps/admin/lib/api.ts`

**Checklist**

- [ ] mantener `SummaryTile` de `Etapa CRM`
- [ ] mantener `SummaryTile` de `Seguimiento`
- [ ] mantener `OperationGuideCard`
- [ ] mantener `CommercialTraceCard`
- [ ] no abrir timeline CRM, tareas o notas manuales
- [ ] no desplazar el foco hacia fulfillment, dispatch o vendedor

### T5. Formalizar cierre positivo y cierre negativo

**Resultado esperado**

El slice deja claro cuando el pedido queda cerrado y como se conserva la
evidencia comercial si el flujo cae.

**Rutas candidatas**

- `apps/api/src/modules/orders/orders.service.ts`
- `packages/shared/src/domain/enums.ts`

**Checklist**

- [ ] derivar `closed` en `Delivered` y `Completed`
- [ ] limpiar `crmStage` si el pedido cae, se cancela o el pago falla
- [ ] conservar `commercialTrace.rejected`
- [ ] no dejar etapa CRM falsa activa en cierres negativos

### T6. Mantener notifications como side effect secundario

**Resultado esperado**

Los side effects tecnicos permanecen visibles y trazables sin redefinir el
ownership funcional del slice.

**Rutas candidatas**

- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/notifications/notifications.service.ts`

**Checklist**

- [ ] sostener cola o registro tecnico de emails cuando aplica
- [ ] no tratar notifications como agregado principal del slice
- [ ] preservar trazabilidad de eventos disparados por confirmacion o rechazo

### T7. Regression suite del slice

**Resultado esperado**

Los contratos criticos del slice quedan defendidos por pruebas y smokes de
frontera.

**Rutas candidatas**

- `apps/api/test/erp-sales-flow.test.ts`
- pruebas de `orders`
- smokes de `Pedidos > Operacion`

**Checklist**

- [ ] probar `manual_direct / confirmed`
- [ ] probar `manual_request / pending`
- [ ] probar `manual_request / confirmed`
- [ ] probar `manual_request / rejected`
- [ ] probar `openpay_backoffice / confirmed`
- [ ] agregar o sostener prueba explicita para `openpay_provider`
- [ ] probar derivacion de `ready_for_followup`, `followup` y `closed`
- [ ] probar que la UI no vende el slice como CRM manual

## Orden Recomendado

1. `T1`
2. `T2`
3. `T3`
4. `T4`
5. `T5`
6. `T6`
7. `T7`
