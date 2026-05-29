# Traceability - Commercial Opportunities

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Commercial Opportunities](../../docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md),
  [Reglas de commercial opportunities](../../docs/fase-1-analisis-requerimientos/reglas/commercial-opportunities.md),
  [UC-37 Apertura y conversion de la oportunidad comercial](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-37-apertura-y-conversion-de-la-oportunidad-comercial.md),
  [UC-38 Negociacion y cierre de la oportunidad comercial](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-38-negociacion-y-cierre-de-la-oportunidad-comercial.md),
  [UC-39 Reapertura e historico de oportunidades comerciales](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-39-reapertura-e-historico-de-oportunidades-comerciales.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.15-commercial-opportunities.md),
  [ADR-013 Customers Commercial Opportunity Boundary](../../docs/fase-3-arquitectura/adr/ADR-013-customers-commercial-opportunity-boundary.md)

## Objetivo

Trazar el slice `013-commercial-opportunities` desde Fase 1, Fase 2 y Fase 3
hasta su paquete SDD y runtime esperado, fijando que el deal puntual vive
subordinado a `customer_relationship_case`, convive con `011` y `012`, y se
consume dentro de `/crm`.

## Matriz

| ID | Regla canonica | Fase 1 | Fase 2 | Fase 3 | Paquete SDD | Runtime esperado | Verificacion sugerida |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TR-01 | `013` extiende `customer_relationship_case` y no lo reemplaza | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md), [UC-37](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-37-apertura-y-conversion-de-la-oportunidad-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.15-commercial-opportunities.md), [ADR-013](../../docs/fase-3-arquitectura/adr/ADR-013-customers-commercial-opportunity-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T1`, `T2` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [types/api.ts](../../packages/shared/src/types/api.ts) deben expresar `commercial_opportunity` como subentidad y no como agregado raiz | revisar que no aparezca un modulo separado ni replacement del caso |
| TR-02 | solo existe una oportunidad activa por caso y se conserva historico cerrado | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md), [UC-39](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-39-reapertura-e-historico-de-oportunidades-comerciales.md) | [Fase 2](../../docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.15-commercial-opportunities.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2`, `T7` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) debe sostener unicidad activa e historico | probar que no se creen dos activas simultaneas |
| TR-03 | la apertura es manual o por conversion explicita, nunca automatica | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md), [UC-37](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-37-apertura-y-conversion-de-la-oportunidad-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md) | [Fase 3](../../docs/fase-3-arquitectura/03.15-commercial-opportunities.md), [ADR-013](../../docs/fase-3-arquitectura/adr/ADR-013-customers-commercial-opportunity-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2`, `T6`, `T7` | [customers.controller.ts](../../apps/api/src/modules/customers/customers.controller.ts), [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) y [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben sostener apertura manual o conversion | revisar ausencia de apertura automatica por score o eventos |
| TR-04 | el lifecycle puntual usa `qualified`, `proposal`, `negotiation`, `won` y `lost` | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md), [UC-38](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-38-negociacion-y-cierre-de-la-oportunidad-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.15-commercial-opportunities.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T1`, `T3`, `T7` | [types/api.ts](../../packages/shared/src/types/api.ts), [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) y [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben expresar esas etapas canonicas | probar transiciones validas e invalidas |
| TR-05 | `expectedValue`, `currency` y `targetCloseAt` son obligatorios en estados activos | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md), [UC-38](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-38-negociacion-y-cierre-de-la-oportunidad-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.15-commercial-opportunities.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2`, `T3`, `T7` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [api.ts](../../apps/admin/lib/api.ts) y [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben validar y mostrar los campos minimos | probar bloqueo de cierre/avance sin campos obligatorios |
| TR-06 | `commercialOwner`, `assignee` y `commercialChannel` se heredan por defecto y pueden corregirse en el deal | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md), [UC-37](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-37-apertura-y-conversion-de-la-oportunidad-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.15-commercial-opportunities.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T2`, `T5` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) y [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben sostener herencia con override acotado | probar herencia por defecto y ajuste puntual |
| TR-07 | la oportunidad tiene timeline y tareas propias separadas del caso general | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md), [UC-38](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-38-negociacion-y-cierre-de-la-oportunidad-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md), [SPDD Frontend](spdd-frontend.md) | [Fase 3](../../docs/fase-3-arquitectura/03.15-commercial-opportunities.md), [ADR-013](../../docs/fase-3-arquitectura/adr/ADR-013-customers-commercial-opportunity-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T4`, `T5` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) y [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben separar traza y tareas del deal respecto al caso | revisar que no se mezcle una sola timeline |
| TR-08 | `lost` puede reabrirse a `negotiation`, pero `won` no se reabre | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md), [UC-39](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-39-reapertura-e-historico-de-oportunidades-comerciales.md) | [Fase 2](../../docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md) | [Fase 3](../../docs/fase-3-arquitectura/03.15-commercial-opportunities.md), [ADR-013](../../docs/fase-3-arquitectura/adr/ADR-013-customers-commercial-opportunity-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T3`, `T7` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts) y [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben sostener la reapertura solo desde `lost` | probar reapertura permitida y rechazada |
| TR-09 | la oportunidad puede abrirse sin artefacto obligatorio y guardar referencias principal/secundarias | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md), [UC-37](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-37-apertura-y-conversion-de-la-oportunidad-comercial.md) | [Fase 2](../../docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.15-commercial-opportunities.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T4`, `T5` | [customers.service.ts](../../apps/api/src/modules/customers/customers.service.ts), [api.ts](../../apps/admin/lib/api.ts) y [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) deben aceptar referencias flexibles | probar apertura sin quote/order y posterior enlace de referencia |
| TR-10 | `/crm` sigue siendo la unica superficie principal del slice y no se abre modulo nuevo | [Fase 1](../../docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md) | [Fase 2](../../docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md), [Product Design](product-design.md) | [Fase 3](../../docs/fase-3-arquitectura/03.15-commercial-opportunities.md), [ADR-013](../../docs/fase-3-arquitectura/adr/ADR-013-customers-commercial-opportunity-boundary.md) | [spec-funcional.md](spec-funcional.md), [spec-tecnica.md](spec-tecnica.md), [spec-tareas.md](spec-tareas.md) :: `T5`, `T6` | [page.tsx](../../apps/admin/app/crm/page.tsx), [crm-workspace.tsx](../../apps/admin/components/crm-workspace.tsx) y [api.ts](../../apps/admin/lib/api.ts) deben sostener la misma entrada `/crm` | smoke de `/crm` sin rutas ni modulos nuevos |

## Dependencias Fuera De Este Ownership

- `010-crm-transversal-por-cliente` sigue gobernando el caso general del
  cliente
- `011-pipeline-comercial-amplio` sigue gobernando el pipeline amplio del caso
- `012-scoring-y-automatizaciones-comerciales` sigue gobernando score y reglas
  simples del caso
- expansiones futuras de opportunities, forecast o probabilidad requeriran un
  corte propio

## Estado Esperado De Trazabilidad

Si esta matriz se cumple, el slice queda:

- alineado con Fase 1, Fase 2 y Fase 3 ya aprobadas
- conectado con `product-design.md` y `spdd-frontend.md`
- amarrado a un runtime esperado que extiende `customers` y `/crm`
- listo para implementarse sin romper la frontera con `010`, `011` y `012`
- cerrado contra aperturas informales de forecast, probabilidad o modulo
  separado de opportunities
