# Spec Tareas - CRM Transversal Por Cliente

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - CRM Transversal Por Cliente](../../docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md),
  [Reglas de crm transversal por cliente](../../docs/fase-1-analisis-requerimientos/reglas/crm-transversal-por-cliente.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.09-crm-transversal-por-cliente-ux-ui.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.12-crm-transversal-por-cliente.md),
  [ADR-010 Customers CRM Transversal Boundary](../../docs/fase-3-arquitectura/adr/ADR-010-customers-crm-transversal-boundary.md)

## Objetivo

Convertir la arquitectura canonica brownfield del CRM transversal por
cliente en un backlog tecnico ejecutable, cerrando ownership de `customers`,
formalizacion de `customer_relationship_case`, timeline transversal,
clasificacion, origen, referencias read-only, defensa de `/crm` y
regression del merge y la reapertura del caso.

## Reglas De Ejecucion

- no mover el slice fuera de `customers`
- no mover la clasificacion comercial a `007`
- no mover el timeline transversal a `orders`
- no abrir una app separada de CRM comercial
- no permitir multi-caso activo por cliente
- no permitir timeline editable
- no mezclar el slice con campaigns, scoring o mensajeria real como
  dominios principales

## Backlog Canonico

### T1. Consolidar contratos compartidos del caso transversal

**Resultado esperado**

El repo expresa con claridad el lenguaje compartido del caso transversal, su
estado, timeline, clasificacion, origen y tareas.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/admin-access.ts`

**Checklist**

- [ ] introducir contrato compartido de `customer_relationship_case`
- [ ] introducir enums de estado del caso transversal
- [ ] introducir enums de tipos de timeline, clasificacion, origen y estado
  de tareas
- [ ] sostener `adminAccessRoles.crm`
- [ ] no desplazar el ownership hacia `orders`

### T2. Formalizar `customer_relationship_case` dentro de `customers`

**Resultado esperado**

La API canoniza el caso transversal como agregado subordinado al cliente
canonico.

**Rutas candidatas**

- `apps/api/src/modules/customers/customers.service.ts`
- `apps/api/src/modules/customers/customers.controller.ts`

**Checklist**

- [ ] crear el contrato de un solo caso por cliente canonico
- [ ] defender apertura manual del caso
- [ ] formalizar `commercialOwner`, `assignee`, `classification`,
  `origin`, `nextStep` y `followUpAt`
- [ ] no abrir ownership en `orders`

### T3. Blindar timeline transversal y tareas opcionales

**Resultado esperado**

El caso transversal conserva actividad comercial estructurada sin
convertirse en timeline transaccional duplicado ni task manager global.

**Rutas candidatas**

- `apps/api/src/modules/customers/customers.service.ts`
- `packages/shared/src/types/api.ts`

**Checklist**

- [ ] sostener `note`, `call`, `whatsapp`, `email` y `status_change`
- [ ] sostener `order_reference` y `follow_up_reference` read-only
- [ ] mantener timeline inmutable
- [ ] sostener evidencia opcional por entrada
- [ ] sostener tareas con `pending` y `done`
- [ ] permitir edicion de tareas, no del timeline

### T4. Defender `/crm` y la bandeja secundaria

**Resultado esperado**

La UI queda canonizada como workbench transversal dentro de `/crm`, no como
CRM separado.

**Rutas candidatas**

- `apps/admin/app/crm/page.tsx`
- `apps/admin/components/crm-workspace.tsx`
- `apps/admin/lib/api.ts`

**Checklist**

- [ ] montar resumen comercial del caso en el detalle del cliente
- [ ] mostrar `commercialOwner`, `assignee`, `classification`,
  `origin`, `nextStep` y `followUpAt`
- [ ] montar timeline y tareas opcionales
- [ ] sostener bandeja filtrada dentro de `/crm`
- [ ] no abrir pantalla separada ni dashboard global

### T5. Blindar merge, cierre y reapertura

**Resultado esperado**

El caso transversal se mantiene coherente con merge de clientes y con
reapertura manual del caso.

**Rutas candidatas**

- `apps/api/src/modules/customers/customers.service.ts`
- `packages/shared/src/types/api.ts`

**Checklist**

- [ ] reanclar el caso al cliente destino tras merge de `007`
- [ ] impedir dos casos activos para un mismo cliente canonico
- [ ] exigir `nextStep` y `followUpAt` al reabrir
- [ ] crear `status_change` en toda transicion
- [ ] permitir `dormant` y `resolved` sin proximo paso pendiente

### T6. Regression suite del slice

**Resultado esperado**

Los contratos criticos del slice quedan defendidos por pruebas y smokes de
frontera.

**Rutas candidatas**

- pruebas de `customers`
- smokes de `/crm`
- contratos compartidos

**Checklist**

- [ ] probar apertura del caso transversal
- [ ] probar unicidad de caso por cliente canonico
- [ ] probar merge con reanclaje del caso
- [ ] probar `status_change` en cambios de estado
- [ ] probar reapertura con nueva disciplina de `nextStep` y `followUpAt`
- [ ] probar referencias read-only a pedidos y a `009`
- [ ] probar que la UI no vende el slice como campaigns o pipeline amplio

## Orden Recomendado

1. `T1`
2. `T2`
3. `T3`
4. `T4`
5. `T5`
6. `T6`
