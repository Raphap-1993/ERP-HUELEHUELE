# Spec Tareas - CRM Manual Ampliado

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - CRM Manual Ampliado](../../docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md),
  [Reglas de crm manual ampliado](../../docs/fase-1-analisis-requerimientos/reglas/crm-manual-ampliado.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.08-crm-manual-ampliado-ux-ui.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.11-crm-manual-ampliado.md),
  [ADR-009 Orders Manual Follow-Up Boundary](../../docs/fase-3-arquitectura/adr/ADR-009-orders-manual-follow-up-boundary.md)

## Objetivo

Convertir la arquitectura canonica brownfield del CRM manual ampliado sobre
pedidos en un backlog tecnico ejecutable, cerrando ownership de `orders`,
formalizacion de `order_follow_up_case`, timeline manual, tareas, disciplina
de `nextStep` y `followUpAt`, defensa de `Pedidos > Operacion` y regression
del lifecycle automatico del caso.

## Reglas De Ejecucion

- no mover el slice fuera de `orders`
- no abrir CRM por cliente
- no abrir una app separada de CRM manual
- no permitir multi-caso por pedido
- no permitir timeline editable
- no mezclar el slice con campaigns, notifications o fulfillment como
  dominios principales

## Backlog Canonico

### T1. Consolidar contratos compartidos del caso manual

**Resultado esperado**

El repo expresa con claridad el lenguaje compartido del caso manual, su
estado, timeline y tareas.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/domain/admin-access.ts`

**Checklist**

- [ ] introducir contrato compartido de `order_follow_up_case`
- [ ] introducir enums de estado del caso manual
- [ ] introducir enums de tipos de timeline y estado de tareas
- [ ] sostener `adminAccessRoles.orders`
- [ ] no desplazar el ownership hacia `crm`

### T2. Formalizar `order_follow_up_case` dentro de `orders`

**Resultado esperado**

La API canoniza el caso manual como agregado subordinado al pedido.

**Rutas candidatas**

- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/orders/orders.controller.ts`

**Checklist**

- [ ] crear el contrato de un solo caso por pedido
- [ ] defender elegibilidad por `crmStage`
- [ ] formalizar apertura explicita por `ventas`
- [ ] formalizar `assignee`, `nextStep` y `followUpAt`
- [ ] no abrir ownership en `customers`

### T3. Blindar timeline manual y tareas opcionales

**Resultado esperado**

El caso manual conserva actividad humana estructurada sin convertirse en
chat ni task manager transversal.

**Rutas candidatas**

- `apps/api/src/modules/orders/orders.service.ts`
- `packages/shared/src/types/api.ts`

**Checklist**

- [ ] sostener `note`, `call`, `whatsapp`, `email` y `status_change`
- [ ] mantener timeline inmutable
- [ ] sostener evidencia opcional por entrada
- [ ] sostener tareas con `pending` y `done`
- [ ] permitir edicion de tareas, no del timeline

### T4. Defender `Pedidos > Operacion` y la bandeja secundaria

**Resultado esperado**

La UI queda canonizada como workbench manual dentro de `Pedidos`, no como
CRM separado.

**Rutas candidatas**

- `apps/admin/app/pedidos/page.tsx`
- `apps/admin/components/orders-workspace.tsx`
- `apps/admin/lib/api.ts`

**Checklist**

- [ ] montar el bloque principal del caso manual en `Operacion`
- [ ] mostrar `assignee`, `nextStep` y `followUpAt`
- [ ] montar timeline y tareas opcionales
- [ ] sostener bandeja filtrada dentro de `Pedidos`
- [ ] no abrir pantalla separada ni dashboard global

### T5. Blindar cierres automaticos y reapertura

**Resultado esperado**

El caso manual se mantiene coherente con el lifecycle del pedido.

**Rutas candidatas**

- `apps/api/src/modules/orders/orders.service.ts`
- `packages/shared/src/domain/enums.ts`

**Checklist**

- [ ] resolver automaticamente en `Delivered` y `Completed`
- [ ] cancelar automaticamente si el pedido cae o falla comercialmente
- [ ] exigir `nextStep` y `followUpAt` al reabrir
- [ ] crear `status_change` en toda transicion
- [ ] no dejar casos abiertos sobre pedidos no elegibles

### T6. Regression suite del slice

**Resultado esperado**

Los contratos criticos del slice quedan defendidos por pruebas y smokes de
frontera.

**Rutas candidatas**

- pruebas de `orders`
- smokes de `Pedidos > Operacion`
- contratos compartidos

**Checklist**

- [ ] probar apertura sobre pedido elegible
- [ ] probar rechazo de apertura sobre pedido no elegible
- [ ] probar unicidad de caso por pedido
- [ ] probar `status_change` en cambios de estado
- [ ] probar cierre automatico y cancelacion automatica
- [ ] probar reapertura con nueva disciplina de `nextStep` y `followUpAt`
- [ ] probar que la UI no vende el slice como CRM por cliente

## Orden Recomendado

1. `T1`
2. `T2`
3. `T3`
4. `T4`
5. `T5`
6. `T6`
