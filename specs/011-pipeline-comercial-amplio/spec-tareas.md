# Spec Tareas - Pipeline Comercial Amplio

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Pipeline Comercial Amplio](../../docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md),
  [Reglas de pipeline comercial amplio](../../docs/fase-1-analisis-requerimientos/reglas/pipeline-comercial-amplio.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md),
  [ADR-011 Customers Commercial Pipeline Boundary](../../docs/fase-3-arquitectura/adr/ADR-011-customers-commercial-pipeline-boundary.md)

## Objetivo

Convertir la frontera canonica del pipeline comercial amplio en un backlog
tecnico ejecutable, preservando el boundary con `010`, extendiendo el
mismo `customer_relationship_case`, manteniendo `/crm` como superficie
visible y evitando abrir `commercial_opportunity`, scoring o
automatizaciones comerciales dentro del corte.

## Reglas De Ejecucion

- no abrir un agregado nuevo fuera de `customer_relationship_case`
- no reescribir `010`; extenderlo de forma aditiva
- no mover el slice fuera de `customers`
- no abrir una ruta, app o dashboard nuevo fuera de `/crm`
- no reemplazar `origin` por `commercialChannel`
- no abrir una segunda fecha operativa paralela a `followUpAt`
- no introducir scoring, forecast, probabilidad ni automatizaciones
- no introducir `commercial_opportunity`

## Backlog Canonico

### T1. Extender contratos compartidos sobre la base de `010`

**Resultado esperado**

El lenguaje compartido del pipeline amplio queda fijado como extension del
mismo caso transversal, con naming canonico y sin romper los contratos de
`010`.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/admin-access.ts`

**Checklist**

- [ ] ampliar la proyeccion compartida de `customer_relationship_case`
- [ ] introducir valores canonicos para `pipelineStage`
- [ ] introducir valores canonicos para `priority`
- [ ] introducir valores canonicos para `commercialChannel`
- [ ] introducir valores canonicos para `lostReason`
- [ ] preservar `commercialOwner`, `assignee`, `nextStep` y `followUpAt`
- [ ] no abrir contratos de `commercial_opportunity`

### T2. Formalizar la extension del caso en `customers`

**Resultado esperado**

La API expresa el pipeline amplio como parte del mismo
`customer_relationship_case` y no como dominio comercial separado.

**Rutas candidatas**

- `apps/api/src/modules/customers/customers.controller.ts`
- `apps/api/src/modules/customers/customers.service.ts`

**Checklist**

- [ ] exponer lectura del pipeline amplio dentro del mismo caso
- [ ] sostener apertura por defecto en `new` con override manual permitido
  a `contacted`, `engaged` o `nurturing` si ya existe contexto comercial
  suficiente
- [ ] exponer escritura de `pipelineStage`, `priority`,
  `commercialChannel` y `lostReason`
- [ ] exponer `lastPipelineActivityAt` como lectura visible derivada
- [ ] derivar `lastPipelineActivityAt` por cambios de `pipelineStage`,
  entradas `note`, `call`, `whatsapp` y `email`, cierres `won` o `lost` y
  reapertura desde `lost`
- [ ] mantener un solo `customer_relationship_case` por cliente canonico
- [ ] preservar `commercialOwner`, `assignee`, `nextStep` y `followUpAt`
- [ ] no mover ownership a `orders` ni a otro modulo

### T3. Blindar lifecycle, cierres y trazabilidad del pipeline

**Resultado esperado**

Los cierres `won` y `lost`, la reapertura desde `lost` y la actividad
reciente quedan modelados sobre el mismo timeline del caso.

**Rutas candidatas**

- `apps/api/src/modules/customers/customers.service.ts`
- `packages/shared/src/types/api.ts`

**Checklist**

- [ ] sostener `pipelineStage = new` por defecto al abrir el caso y
  permitir override manual a `contacted`, `engaged` o `nurturing` si ya
  existe contexto comercial suficiente
- [ ] sostener cierre `lost` con `lostReason` obligatorio
- [ ] sostener cierre `won` con nota y evidencia o referencia
- [ ] persistir cierre `won` en la misma entrada append only del timeline
  con `note` y `reference` o `evidence` obligatorias
- [ ] sostener `won` como cierre comercial estable sin reversion manual por
  omision
- [ ] sostener reapertura desde `lost` hacia `contacted` como unico camino
  canonico de reapertura
- [ ] revalidar `commercialOwner`, `assignee`, `nextStep`, `followUpAt` y
  `priority` al reabrir desde `lost`
- [ ] limpiar `lostReason` del estado activo al reabrir y conservar su
  traza historica
- [ ] actualizar `lastPipelineActivityAt` con cambios de etapa, entradas
  `note`, `call`, `whatsapp` y `email`, cierres `won` o `lost` y
  reapertura desde `lost`
- [ ] mantener cambios de `pipelineStage` sobre el mismo timeline

### T4. Sostener `/crm` como superficie del slice

**Resultado esperado**

La UI opera el pipeline amplio desde el detalle del cliente y desde una
bandeja filtrable dentro del mismo `/crm`.

**Rutas candidatas**

- `apps/admin/app/crm/page.tsx`
- `apps/admin/components/crm-workspace.tsx`
- `apps/admin/lib/api.ts`

**Checklist**

- [ ] extender el detalle del cliente con `pipelineStage`, `priority`,
  `commercialChannel`, `lostReason` y `lastPipelineActivityAt`
- [ ] seguir mostrando `commercialOwner`, `assignee`, `nextStep` y
  `followUpAt`
- [ ] mostrar en detalle y timeline la nota y `reference` o `evidence`
  del cierre `won`
- [ ] sostener filtros por `commercialOwner`, `assignee`, `pipelineStage`,
  `priority`, `commercialChannel` y `status`
- [ ] sostener vistas de pendientes de hoy y vencidos usando `followUpAt`
- [ ] sostener cierres `won` y `lost` sin abrir una ruta nueva
- [ ] no convertir la bandeja en kanban complejo

### T5. Blindar la frontera con `010` y con slices futuros

**Resultado esperado**

El corte deja explicito que `011` es una capa adicional del mismo caso y
que el resto de capacidades comerciales quedan fuera de alcance.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `apps/api/src/modules/customers/customers.service.ts`
- `apps/admin/components/crm-workspace.tsx`

**Checklist**

- [ ] preservar `origin` y su semantica heredada de `010`
- [ ] preservar la disciplina activa de `nextStep` y `followUpAt`
- [ ] evitar que `pipelineStage` absorba `status`
- [ ] evitar `commercial_opportunity`, forecast, probabilidad y scoring
- [ ] evitar automatizaciones comerciales dentro del corte
- [ ] evitar una superficie paralela fuera de `/crm`

### T6. Regression suite y smokes de frontera

**Resultado esperado**

Los contratos criticos del slice quedan defendidos por pruebas y smokes que
protejan la extension controlada de `010`.

**Rutas candidatas**

- pruebas de `customers`
- smokes de `/crm`
- contratos compartidos

**Checklist**

- [ ] probar que `011` reutiliza el mismo `customer_relationship_case`
- [ ] probar que `pipelineStage` es manual y no nulo en casos activos
- [ ] probar que la apertura usa `new` por defecto y permite override
  manual a `contacted`, `engaged` o `nurturing` con contexto suficiente
- [ ] probar cierre `lost` con `lostReason` obligatorio
- [ ] probar cierre `won` con nota y evidencia o referencia
- [ ] probar que `won` persiste `note` y `reference` o `evidence` en la
  misma entrada append only del timeline
- [ ] probar que `won` queda como cierre comercial estable sin reversion
  manual por omision
- [ ] probar reapertura desde `lost` hacia `contacted` como unico camino
  canonico
- [ ] probar revalidacion de `commercialOwner`, `assignee`, `nextStep`,
  `followUpAt` y `priority` al reabrir desde `lost`
- [ ] probar actualizacion de `lastPipelineActivityAt` por cambios de
  etapa, `note`, `call`, `whatsapp`, `email`, cierres `won` o `lost` y
  reapertura comercial
- [ ] probar filtros y vistas dentro de `/crm`
- [ ] probar ausencia de `commercial_opportunity`, scoring y ruta nueva

## Orden Recomendado

1. `T1`
2. `T2`
3. `T3`
4. `T4`
5. `T5`
6. `T6`
