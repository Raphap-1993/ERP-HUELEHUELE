# Spec Tecnica - Commercial Opportunities

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Commercial Opportunities](../../docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md),
  [Reglas de commercial opportunities](../../docs/fase-1-analisis-requerimientos/reglas/commercial-opportunities.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.15-commercial-opportunities.md),
  [ADR-013 Customers Commercial Opportunity Boundary](../../docs/fase-3-arquitectura/adr/ADR-013-customers-commercial-opportunity-boundary.md)

## Objetivo Tecnico

Formalizar la frontera tecnica de `commercial_opportunity` como extension
aditiva de `customer_relationship_case`, manteniendo `customers` y `/crm` como
dominio y superficie naturales del slice, dejando explicito que el deal puntual
no reemplaza el caso comercial general ni abre forecast, probabilidad o modulo
separado.

## Baseline Real Del Repo

### Contratos compartidos y acceso

- `packages/shared/src/types/api.ts`
  - hoy ya expresa clientes, conflictos y workbench comercial
  - todavia no expresa un shape canonico de oportunidad puntual subordinada al
    caso
- `packages/shared/src/domain/admin-access.ts`
  - mantiene `adminAccessRoles.crm`
  - es el ancla natural para sostener el mismo acceso que `010`, `011` y `012`

### API y modulo backend

- `apps/api/src/modules/customers/customers.controller.ts`
  - hoy publica detalle administrativo del cliente y trabajo comercial base
  - no existe todavia contrato API explicito para `commercial_opportunity`
- `apps/api/src/modules/customers/customers.service.ts`
  - hoy gobierna clientes, identidad y caso comercial base
  - es el hueco natural para extender el caso con deal puntual

### Workbench admin y cliente HTTP

- `apps/admin/app/crm/page.tsx`
  - hoy mantiene `/crm` como entrada visible del modulo
  - no existe ruta nueva para deals
- `apps/admin/components/crm-workspace.tsx`
  - hoy concentra listado, metricas, detalle y operacion del caso comercial
  - es el hueco natural para extender el detalle con bloque de oportunidad y
    bandeja secundaria
- `apps/admin/lib/api.ts`
  - hoy transporta lectura y escritura del modulo `crm`
  - todavia no ofrece metodos canonicos de deal puntual

## Frontera Tecnica Objetivo

### 1. `customers` sigue siendo el master del caso y del deal

- `customers` conserva ownership de `customer_relationship_case`
- `013` agrega `commercial_opportunity` subordinada al mismo caso
- el slice no mueve ownership a un modulo comercial nuevo

### 2. `011` sigue gobernando pipeline y `013` modela deal puntual

- `011` sigue gobernando `pipelineStage`, `priority`, `commercialChannel`,
  `status`, `won` y `lost` del caso general
- `013` agrega lifecycle puntual del deal
- `013` no reescribe el pipeline amplio del caso padre

### 3. `/crm` sigue siendo la unica superficie del slice

- el detalle del cliente sigue siendo la superficie principal
- la bandeja secundaria de oportunidades sigue dentro del mismo modulo
- el slice no abre ruta o app separada

## Ajustes Minimos Recomendados

### Contratos shared

Rutas candidatas:

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/admin-access.ts`

Ajustes recomendados:

- introducir shape compartida para `commercial_opportunity`
- introducir unions canonicas para lifecycle del deal
- introducir unions canonicas para `opportunityType`
- introducir unions canonicas para `lostReason`
- mantener `adminAccessRoles.crm` sin set de acceso nuevo

### API y modulo `customers`

Rutas candidatas:

- `apps/api/src/modules/customers/customers.controller.ts`
- `apps/api/src/modules/customers/customers.service.ts`

Ajustes recomendados:

- exponer lectura del deal puntual dentro del detalle del cliente
- sostener una sola oportunidad activa por caso
- sostener historico de oportunidades cerradas
- validar obligatoriedad de `expectedValue`, `currency` y `targetCloseAt`
- sostener reapertura de `lost` a `negotiation`
- impedir reapertura de `won`

### Admin y cliente HTTP

Rutas candidatas:

- `apps/admin/app/crm/page.tsx`
- `apps/admin/components/crm-workspace.tsx`
- `apps/admin/lib/api.ts`

Ajustes recomendados:

- extender el detalle del cliente con resumen del deal
- extender el detalle con timeline y tareas puntuales del deal
- sostener bandeja secundaria de oportunidades dentro de `/crm`
- mantener separacion visible entre timeline del caso y timeline del deal
- no abrir modulo separado

## Reglas Tecnicas Del Slice

1. `customer_relationship_case` sigue siendo unico por cliente canonico.
2. `commercial_opportunity` vive subordinada al caso.
3. solo puede existir una oportunidad activa por caso.
4. el historico de oportunidades cerradas se conserva.
5. el lifecycle del deal usa `qualified`, `proposal`, `negotiation`, `won` y
   `lost`.
6. `expectedValue`, `currency` y `targetCloseAt` son obligatorios mientras el
   deal este activo.
7. `commercialOwner`, `assignee` y `commercialChannel` pueden heredarse del
   caso y corregirse en el deal.
8. `opportunityType` es sugerido por contexto y confirmado por `ventas`.
9. la oportunidad puede abrirse sin artefacto fuente obligatorio.
10. existe una referencia principal y referencias secundarias opcionales.
11. el deal tiene timeline propio y tareas propias.
12. `lost` puede reabrirse y vuelve a `negotiation`.
13. `won` queda estable y no se reabre.
14. un nuevo ciclo posterior a `won` obliga a crear nueva oportunidad
    historica.
15. el slice no abre forecast, probabilidad ni modulo separado.

## Riesgos Tecnicos Y Mitigaciones

| Riesgo | Mitigacion canonica |
| --- | --- |
| convertir el deal en agregado raiz y partir el dominio | mantener `commercial_opportunity` subordinada al caso |
| abrir varias oportunidades activas por caso | validar unicidad activa en la API |
| mezclar timeline del caso y del deal | separar contratos y superficies visibles |
| permitir `won` reversible | tratar `won` como cierre estable |
| bloquear apertura por falta de quote u order | permitir referencias opcionales |
| abrir un modulo separado antes de tiempo | extender solo `/crm` |

## Definition Of Done Tecnica Del Slice

- el repo expresa `013` como extension controlada de `customer_relationship_case`
- `commercial_opportunity` queda identificada como deal puntual y no como
  agregado raiz
- lifecycle, tipos, referencias y reglas de cierre/reapertura quedan fijados
- `/crm` queda defendido como unica superficie principal del slice
- el slice deja explicito que forecast, probabilidad y expansion fuerte de
  opportunities quedan fuera de este corte
