# Spec Tareas - Commercial Opportunities

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Commercial Opportunities](../../docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md),
  [Reglas de commercial opportunities](../../docs/fase-1-analisis-requerimientos/reglas/commercial-opportunities.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.15-commercial-opportunities.md),
  [ADR-013 Customers Commercial Opportunity Boundary](../../docs/fase-3-arquitectura/adr/ADR-013-customers-commercial-opportunity-boundary.md)

## Objetivo

Convertir la frontera canonica de `commercial_opportunity` en un backlog tecnico
ejecutable, preservando la subordinacion al caso comercial del cliente,
manteniendo `/crm` como superficie visible y evitando forecast, probabilidad o
modulos paralelos.

## Reglas De Ejecucion

- no reemplazar `customer_relationship_case`
- no mover el slice fuera de `customers`
- no abrir una app ni ruta nueva fuera de `/crm`
- no permitir multiples oportunidades activas por caso
- no abrir forecast ni probabilidad
- no permitir reapertura de `won`
- no mezclar timeline general del caso con timeline del deal

## Backlog Canonico

### T1. Extender contratos compartidos con `commercial_opportunity`

**Resultado esperado**

El lenguaje compartido del slice queda fijado como extension del caso
transversal, con naming canonico del deal puntual.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/admin-access.ts`

**Checklist**

- [ ] introducir shape compartida para `commercial_opportunity`
- [ ] introducir lifecycle canonico del deal
- [ ] introducir `opportunityType`
- [ ] introducir `lostReason`
- [ ] preservar contratos heredados de `010`, `011` y `012`
- [ ] no abrir contratos de forecast o probabilidad

### T2. Formalizar persistencia y reglas del deal dentro de `customers`

**Resultado esperado**

La API expresa la oportunidad puntual como subentidad del caso comercial del
cliente.

**Rutas candidatas**

- `apps/api/src/modules/customers/customers.controller.ts`
- `apps/api/src/modules/customers/customers.service.ts`

**Checklist**

- [ ] exponer lectura del deal dentro del detalle del cliente
- [ ] sostener una sola oportunidad activa por caso
- [ ] sostener historico de oportunidades cerradas
- [ ] validar `expectedValue`, `currency` y `targetCloseAt` en estados activos
- [ ] permitir apertura manual y conversion explicita
- [ ] no mover ownership a modulo separado

### T3. Modelar lifecycle y cierre estable del deal

**Resultado esperado**

El lifecycle de la oportunidad queda ejecutable y consistente con el canon.

**Rutas candidatas**

- `apps/api/src/modules/customers/customers.service.ts`
- `packages/shared/src/types/api.ts`

**Checklist**

- [ ] sostener `qualified`, `proposal`, `negotiation`, `won` y `lost`
- [ ] exigir `lostReason` al cerrar como `lost`
- [ ] impedir reapertura de `won`
- [ ] permitir reapertura de `lost` a `negotiation`
- [ ] exigir nueva oportunidad historica para nuevo ciclo post-`won`

### T4. Sostener references, timeline y tareas del deal

**Resultado esperado**

La oportunidad tiene su propia traza operativa sin contaminar el caso general.

**Rutas candidatas**

- `apps/api/src/modules/customers/customers.service.ts`
- `apps/admin/components/crm-workspace.tsx`

**Checklist**

- [ ] soportar referencia principal y referencias secundarias
- [ ] soportar timeline propio del deal
- [ ] soportar tareas minimas del deal
- [ ] mantener timeline del caso separado
- [ ] mantener tareas del caso separadas

### T5. Extender `/crm` con bloque de oportunidad y bandeja secundaria

**Resultado esperado**

La UI opera el deal puntual desde el mismo modulo del cliente.

**Rutas candidatas**

- `apps/admin/app/crm/page.tsx`
- `apps/admin/components/crm-workspace.tsx`
- `apps/admin/lib/api.ts`

**Checklist**

- [ ] mostrar bloque resumen del deal dentro del detalle del cliente
- [ ] mostrar etapa, valor esperado, moneda y fecha objetivo
- [ ] mostrar owner, assignee, channel y type
- [ ] mostrar timeline y tareas del deal
- [ ] mostrar bandeja secundaria de oportunidades dentro de `/crm`
- [ ] no abrir una ruta o app nueva

### T6. Blindar la frontera con `011` y `012`

**Resultado esperado**

El deal puntual convive con pipeline y score sin absorberlos ni ser absorbido.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `apps/api/src/modules/customers/customers.service.ts`
- `apps/admin/components/crm-workspace.tsx`

**Checklist**

- [ ] evitar que `commercial_opportunity` reemplace el caso padre
- [ ] evitar que el lifecycle del deal reemplace el `pipelineStage`
- [ ] mantener el impacto sobre el caso como sugerencia suave
- [ ] evitar forecast, probabilidad y automation fuerte del deal
- [ ] evitar multiples activas por caso

### T7. Regression suite y smokes de frontera

**Resultado esperado**

Los contratos criticos del slice quedan defendidos por pruebas y smokes.

**Rutas candidatas**

- pruebas de `customers`
- smokes de `/crm`
- contratos compartidos

**Checklist**

- [ ] probar una sola oportunidad activa por caso
- [ ] probar apertura manual y conversion explicita
- [ ] probar obligatoriedad de `expectedValue`, `currency` y `targetCloseAt`
- [ ] probar `lostReason` al cerrar en `lost`
- [ ] probar reapertura de `lost` a `negotiation`
- [ ] probar imposibilidad de reabrir `won`
- [ ] probar continuidad del caso padre y su pipeline
- [ ] probar consumo visible dentro de `/crm`

## Orden Recomendado

1. `T1`
2. `T2`
3. `T3`
4. `T4`
5. `T5`
6. `T6`
7. `T7`
