# Traceability - Pipeline Comercial Amplio

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Pipeline Comercial Amplio](../../docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md),
  [Reglas de pipeline comercial amplio](../../docs/fase-1-analisis-requerimientos/reglas/pipeline-comercial-amplio.md),
  [UC-31 Apertura y etapado del caso comercial](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-31-apertura-y-etapado-del-caso-comercial.md),
  [UC-32 Bandeja y priorizacion del pipeline comercial](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-32-bandeja-y-priorizacion-del-pipeline-comercial.md),
  [UC-33 Cierre comercial won lost y reapertura](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-33-cierre-comercial-won-lost-y-reapertura.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md),
  [ADR-011 Customers Commercial Pipeline Boundary](../../docs/fase-3-arquitectura/adr/ADR-011-customers-commercial-pipeline-boundary.md)

## Objetivo

Trazar el slice `011-pipeline-comercial-amplio` desde Fase 1, Fase 2 y
Fase 3 hasta su paquete SDD y el runtime esperado, fijando que el pipeline
amplio vive sobre `customer_relationship_case`, preserva `010` y opera
dentro de `/crm`.

## Matriz

| ID | Regla canonica | Fase 1 | Fase 2 | Fase 3 | Paquete SDD | Runtime esperado | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TR-01 | `011` extiende `010` sobre el mismo `customer_relationship_case` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md), [UC-31](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-31-apertura-y-etapado-del-caso-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md), [ADR-011](../../docs/fase-3-arquitectura/adr/ADR-011-customers-commercial-pipeline-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T1`, `T2` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [types/api.ts](../../packages/shared/src/types/api.ts) deben expresar una extension aditiva del mismo caso | revisar que no aparezca una entidad paralela |
| TR-02 | `commercialOwner`, `assignee`, `nextStep` y `followUpAt` se preservan como base operativa de `010` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md), [UC-31](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-31-apertura-y-etapado-del-caso-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md) | [spec-funcional.md](spec-funcional.md), [spec-tareas.md](spec-tareas.md) :: `T2`, `T4`, `T5` | [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx), [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) deben seguir mostrando y validando esos campos | probar que el pipeline amplio no rompe la disciplina activa del caso |
| TR-03 | `pipelineStage` es manual, no nulo y separado de `status` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md), [UC-31](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-31-apertura-y-etapado-del-caso-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md) | [types/api.ts](../../packages/shared/src/types/api.ts), [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben expresar ambos ejes por separado | probar alta del caso, cambios de etapa y guardrails de convivencia |
| TR-04 | `priority` y `commercialChannel` amplian la lectura del caso sin abrir subpipelines | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md), [UC-32](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-32-bandeja-y-priorizacion-del-pipeline-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md) | [spec-funcional.md](spec-funcional.md), [spec-tareas.md](spec-tareas.md) :: `T1`, `T4` | [types/api.ts](../../packages/shared/src/types/api.ts), [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben mostrar los valores canonicos sin renombrar `origin` | revisar que el canal principal y el origen del caso no colapsen |
| TR-05 | `lostReason` es obligatorio en `lost` y `won` exige nota con evidencia o referencia | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md), [UC-33](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-33-cierre-comercial-won-lost-y-reapertura.md) | [Fase 2](../../docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md), [ADR-011](../../docs/fase-3-arquitectura/adr/ADR-011-customers-commercial-pipeline-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tareas.md](spec-tareas.md) :: `T3` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben validar ambos cierres sobre el mismo caso | probar ambos caminos de cierre y sus validaciones |
| TR-06 | la reapertura desde `lost` vuelve a `contacted` y revalida disciplina activa | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md), [UC-33](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-33-cierre-comercial-won-lost-y-reapertura.md) | [Fase 2](../../docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md) | [spec-funcional.md](spec-funcional.md), [spec-tareas.md](spec-tareas.md) :: `T3` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben limpiar `lostReason` del estado activo y pedir revalidacion | probar reapertura sin perder la traza historica |
| TR-07 | `lastPipelineActivityAt` resume actividad reciente y no abre otra agenda | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md), [UC-32](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-32-bandeja-y-priorizacion-del-pipeline-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T3`, `T4` | [types/api.ts](../../packages/shared/src/types/api.ts), [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben separar `lastPipelineActivityAt` de `followUpAt` | revisar orden de cola sin introducir una segunda fecha operativa |
| TR-08 | la bandeja comercial vive dentro de `/crm` con filtros y vistas operativas | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md), [UC-32](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-32-bandeja-y-priorizacion-del-pipeline-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md) | [spec-funcional.md](spec-funcional.md), [spec-tareas.md](spec-tareas.md) :: `T4` | [page.tsx](../../apps/admin/app/crm/page.tsx), [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx), [api.ts](../../apps/admin/lib/api.ts) deben sostener la misma ruta y la bandeja filtrable | smoke de `/crm` con filtros por owner, etapa, prioridad y canal |
| TR-09 | los cambios de `pipelineStage` se trazan sobre el mismo timeline del caso | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md), [UC-31](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-31-apertura-y-etapado-del-caso-comercial.md), [UC-33](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-33-cierre-comercial-won-lost-y-reapertura.md) | [Fase 2](../../docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md) | [Fase 3](../../docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T3` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) y la proyeccion en [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben reflejar la traza del mismo caso | revisar append only y visibilidad de cambios de etapa |
| TR-10 | `011` no abre `commercial_opportunity`, scoring ni automatizaciones comerciales | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md) | [Fase 2](../../docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md), [ADR-011](../../docs/fase-3-arquitectura/adr/ADR-011-customers-commercial-pipeline-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T5`, `T6` | el runtime esperado se limita a [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [types/api.ts](../../packages/shared/src/types/api.ts), [page.tsx](../../apps/admin/app/crm/page.tsx) y [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) sin abrir nuevos modulos | revisar ausencia de entidad paralela, ruta nueva o automatizaciones |

## Dependencias Fuera De Este Ownership

- `007-customers-identity-conflicts` sigue gobernando identidad y merge del
  cliente canonico
- `009-crm-manual-ampliado` sigue gobernando seguimiento manual detallado
  por pedido
- `010-crm-transversal-por-cliente` sigue gobernando la base del
  `customer_relationship_case`
- slices futuros deberan abrir `commercial_opportunity`, scoring o
  automatizaciones solo con corte y ADR propios

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- alineado con Fase 1, Fase 2 y Fase 3 ya aprobadas
- conectado con `product-design.md` y `spdd-frontend.md`
- amarrado a un runtime esperado que extiende `customers` y `/crm`
- listo para implementarse sin romper la frontera con `010`
- cerrado contra aperturas informales de `commercial_opportunity`,
  scoring o automatizaciones comerciales
