# Spec Tecnica - Pipeline Comercial Amplio

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Pipeline Comercial Amplio](../../docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md),
  [Reglas de pipeline comercial amplio](../../docs/fase-1-analisis-requerimientos/reglas/pipeline-comercial-amplio.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md),
  [ADR-011 Customers Commercial Pipeline Boundary](../../docs/fase-3-arquitectura/adr/ADR-011-customers-commercial-pipeline-boundary.md)

## Objetivo Tecnico

Formalizar la frontera tecnica del pipeline comercial amplio como una
extension aditiva de `010-crm-transversal-por-cliente`, manteniendo
`customer_relationship_case` dentro de `customers` y `/crm`, agregando
`pipelineStage`, `priority`, `commercialChannel`, `lostReason` y
`lastPipelineActivityAt`, y dejando explicito que el slice no abre
`commercial_opportunity`, scoring, automatizaciones ni una nueva
superficie comercial.

## Baseline Real Del Repo

### Contratos compartidos y acceso

- `packages/shared/src/types/api.ts`
  - hoy expone `CustomerSummary`, `CustomerDetail` y contratos de
    conflictos de identidad
  - todavia no expresa una proyeccion canonica de
    `customer_relationship_case` con `pipelineStage`, `priority`,
    `commercialChannel`, `lostReason` o `lastPipelineActivityAt`
- `packages/shared/src/domain/admin-access.ts`
  - sigue fijando `adminAccessRoles.crm`
  - es el ancla natural para mantener los mismos roles de `010`

### API y modulo `customers`

- `apps/api/src/modules/customers/customers.controller.ts`
  - hoy publica `GET /admin/customers`, `GET /admin/customers/conflicts`,
    `GET /admin/customers/:id`, `POST`, `PATCH`, `POST /merge`,
    `POST /conflicts/:id/resolve` y `DELETE`
  - no existe todavia un contrato API explicito para pipeline comercial
    amplio
- `apps/api/src/modules/customers/customers.service.ts`
  - hoy gobierna clientes, conflictos y merge
  - todavia no expresa `customer_relationship_case` ni las transiciones de
    `pipelineStage`

### Workbench admin y cliente HTTP

- `apps/admin/app/crm/page.tsx`
  - hoy mantiene `/crm` como entrada visible del modulo
  - no existe ruta nueva para abrir `011`
- `apps/admin/components/crm-workspace.tsx`
  - hoy concentra listado, metricas, detalle y resolucion de conflictos
  - es el hueco natural para extender el mismo workbench con el pipeline
    amplio
- `apps/admin/lib/api.ts`
  - hoy transporta lectura y escritura de clientes y conflictos
  - todavia no ofrece metodos de pipeline comercial amplio

### Lectura tecnica del baseline

El baseline confirma que `011` no parte de un dominio comercial nuevo.
Parte de un brownfield donde `/crm` y `customers` ya existen, pero donde
el contrato comercial amplio todavia no esta formalizado. El ajuste
correcto es aditivo sobre `010`, no una rama nueva del runtime.

## Frontera Tecnica Objetivo

### 1. `customers` sigue siendo el master del caso

- `customers` conserva el ownership de `customer_relationship_case`
- `011` agrega campos y reglas sobre el mismo caso
- el slice no desplaza ownership a `orders`, campaigns ni otro modulo

### 2. `010` sigue siendo la base y `011` la extension

- `010` sigue gobernando `commercialOwner`, `assignee`, `nextStep`,
  `followUpAt`, `origin`, clasificacion y timeline base
- `011` agrega `pipelineStage`, `priority`, `commercialChannel`,
  `lostReason` y `lastPipelineActivityAt`
- `011` no reescribe ni duplica la frontera ya aprobada en `010`

### 3. `/crm` sigue siendo la unica superficie del slice

- el detalle del cliente sigue siendo la superficie principal
- la bandeja comercial sigue dentro del mismo modulo `/crm`
- el slice no abre ruta nueva, dashboard paralelo ni CRM separado

### 4. El cierre comercial vive sobre el mismo timeline

- los cambios de `pipelineStage` se trazan sobre el timeline del mismo
  caso
- `won` y `lost` cierran ciclos comerciales, no crean otra entidad
- la reapertura desde `lost` conserva historia y reusa el mismo caso

## Ajustes Minimos Recomendados

Este slice debe cerrarse con cambios minimos y aditivos sobre el runtime
existente.

### Contratos shared

Rutas candidatas:

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/admin-access.ts`

Ajustes recomendados:

- ampliar la proyeccion compartida de `customer_relationship_case`
- introducir enums o unions canonicas para `pipelineStage`, `priority`,
  `commercialChannel` y `lostReason`
- mantener `commercialOwner`, `assignee`, `nextStep` y `followUpAt`
  intactos como contrato heredado de `010`
- sostener `adminAccessRoles.crm` sin abrir un set de acceso nuevo

### API y modulo `customers`

Rutas candidatas:

- `apps/api/src/modules/customers/customers.controller.ts`
- `apps/api/src/modules/customers/customers.service.ts`

Ajustes recomendados:

- formalizar la extension del mismo `customer_relationship_case`
- exponer lectura y escritura de `pipelineStage`, `priority`,
  `commercialChannel`, `lostReason` y `lastPipelineActivityAt`
- validar cierres `won` y `lost` sobre el mismo caso
- sostener la reapertura desde `lost` hacia `contacted`
- mantener trazabilidad obligatoria sobre el mismo timeline
- no abrir un modulo `commercial_opportunity`

### Admin y cliente HTTP

Rutas candidatas:

- `apps/admin/app/crm/page.tsx`
- `apps/admin/components/crm-workspace.tsx`
- `apps/admin/lib/api.ts`

Ajustes recomendados:

- extender el detalle del cliente con resumen de pipeline amplio
- sostener bandeja filtrable por `commercialOwner`, `assignee`,
  `pipelineStage`, `priority`, `commercialChannel` y `status`
- mostrar `lastPipelineActivityAt` como lectura secundaria
- sostener cierres `won` y `lost` dentro del mismo workbench
- no abrir una ruta nueva para la cola comercial

## Reglas Tecnicas Del Slice

1. `customer_relationship_case` sigue siendo unico por cliente canonico.
2. `011` solo agrega lenguaje de pipeline al mismo caso de `010`.
3. `commercialOwner` y `assignee` se preservan con el mismo naming y rol.
4. `nextStep` y `followUpAt` siguen rigiendo la disciplina activa del
   caso.
5. `followUpAt` sigue siendo la unica fecha objetivo operativa.
6. `lastPipelineActivityAt` solo resume actividad comercial reciente.
7. `pipelineStage` es manual, no nulo y separado de `status`.
8. la reapertura desde `lost` devuelve `pipelineStage` a `contacted`.
9. `lostReason` es obligatorio en `lost` y deja de aplicar al estado
   activo cuando el caso se reabre.
10. `commercialChannel` convive con `origin` y no lo reemplaza.
11. los cambios de `pipelineStage` se trazan en el mismo timeline append
    only del caso.
12. `/crm` sigue siendo la unica superficie del slice.
13. el slice no abre `commercial_opportunity`, scoring, forecast ni
    automatizaciones comerciales.

## Riesgos Tecnicos Y Mitigaciones

| Riesgo | Mitigacion canonica |
| --- | --- |
| duplicar el agregado y abrir `commercial_opportunity` antes de tiempo | mantener el pipeline sobre `customer_relationship_case` |
| mezclar `origin` con `commercialChannel` | conservar ambos campos con semanticas distintas |
| acoplar `status` y `pipelineStage` como si fueran el mismo eje | preservar validaciones y guardrails sin colapsar ambos conceptos |
| abrir una segunda fecha comercial paralela | mantener `followUpAt` como unica fecha objetivo y usar `lastPipelineActivityAt` solo para orden |
| perder la historia de un cierre `lost` al reabrir | limpiar `lostReason` del estado activo pero conservarlo en la traza historica |
| sacar la cola comercial de `/crm` | extender `crm-workspace.tsx` y la misma entrada `/crm` |
| contaminar el slice con scoring o automatizaciones | dejar esas capacidades fuera del backlog de `011` |

## Definition Of Done Tecnica Del Slice

- el repo expresa `011` como extension controlada de `010`
- `customer_relationship_case` queda identificado como unico agregado del
  pipeline amplio
- `pipelineStage`, `priority`, `commercialChannel`, `lostReason` y
  `lastPipelineActivityAt` quedan fijados como lenguaje tecnico canonico
- `/crm` queda defendido como unica superficie visible del slice
- el cierre `won` y `lost` queda ligado al mismo timeline del caso
- el slice deja explicito que `commercial_opportunity`, scoring y
  automatizaciones quedan fuera de este corte
