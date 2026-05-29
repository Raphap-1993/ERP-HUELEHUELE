# Spec Tecnica - CRM Transversal Por Cliente

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - CRM Transversal Por Cliente](../../docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md),
  [Reglas de crm transversal por cliente](../../docs/fase-1-analisis-requerimientos/reglas/crm-transversal-por-cliente.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.09-crm-transversal-por-cliente-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.12-crm-transversal-por-cliente.md),
  [ADR-010 Customers CRM Transversal Boundary](../../docs/fase-3-arquitectura/adr/ADR-010-customers-crm-transversal-boundary.md)

## Objetivo Tecnico

Formalizar y endurecer las fronteras tecnicas del slice brownfield del CRM
transversal por cliente. El slice debe preservar la separacion entre
identidad canonica, seguimiento manual por pedido y workbench comercial
transversal, dejando explicito que `customers` es owner de
`customer_relationship_case`, que `/crm` sigue siendo la superficie visible
principal y que `orders`, `007`, `009`, campaigns o mensajeria no absorben
ownership del dominio.

## Baseline Real Del Repo

### Contratos compartidos y acceso

- `packages/shared/src/types/api.ts`
  - hoy ya expresa `CustomerSummary`, `CustomerDetail`,
    `CustomerIdentityConflictSummary` y merge inputs
  - es la base natural para agregar el contrato compartido del caso
    transversal
- `packages/shared/src/domain/admin-access.ts`
  - fija `adminAccessRoles.crm`
  - es el punto natural para sostener ownership visible de ventas y marketing

### API y modulo `customers`

- `apps/api/src/modules/customers/customers.service.ts`
  - ya gobierna detalle de cliente, merge y conflictos
  - es la frontera natural para un `customer_relationship_case`
- `apps/api/src/modules/customers/customers.controller.ts`
  - ya publica `/admin/customers`
  - es la puerta natural para transportar el caso transversal

### Workbench admin y cliente HTTP

- `apps/admin/app/crm/page.tsx`
  - publica la superficie visible `/crm`
- `apps/admin/components/crm-workspace.tsx`
  - ya expone detalle del cliente, perfil, direcciones y pedidos recientes
  - contiene el hueco natural para montar el resumen comercial y el timeline
    transversal
- `apps/admin/lib/api.ts`
  - transporta detalle y conflictos de clientes
  - seria la puerta natural del caso

## Frontera Tecnica Objetivo

### 1. `customers` sigue siendo el master del cliente canonico

- concentra identidad viva, merge y el futuro `customer_relationship_case`
- decide la unicidad del caso por cliente
- no delega ese ownership a `orders` ni a campaigns

### 2. `/crm` sigue siendo la superficie visible del slice

- muestra el detalle del cliente ya resuelto por backend
- no crea un segundo write model comercial fuera de `customers`
- no se convierte en pipeline separado ni en dashboard global

### 3. `orders` y `009` siguen como fronteras de contexto

- `orders` no gobierna el caso transversal
- `009` no absorbe al cliente transversal
- ambos solo aportan referencias read-only dentro del timeline

## Boundary De Caso, Timeline Y Bandeja

El boundary tecnico del slice queda dividido en tres capas complementarias.

### Caso transversal

- vive en `customers`
- pertenece al cliente canonico
- soporta `status`, `commercialOwner`, `assignee`, `classification`,
  `origin`, `nextStep` y `followUpAt`
- responde al merge de `007`

### Timeline transversal

- vive dentro del caso
- soporta `note`, `call`, `whatsapp`, `email`, `status_change`,
  `order_reference` y `follow_up_reference`
- registra evidencia opcional
- es append-only en terminos funcionales

### Bandeja secundaria

- se deriva del mismo dominio `customers`
- lista casos `open` y `waiting_customer` por defecto
- no necesita un modulo o bounded context separado

## Ajustes Minimos Recomendados

Este slice no exige abrir un servicio nuevo. Cierra contratos y fronteras
vivas del brownfield.

### Shared contracts

Rutas candidatas:

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/admin-access.ts`

Ajustes recomendados:

- introducir contrato compartido de `customer_relationship_case`
- introducir enums de estado del caso, tipos de timeline, clasificacion,
  origen y estado de tareas
- preservar `adminAccessRoles.crm`
- no desplazar el ownership hacia `orders`

### API y modulo `customers`

Rutas candidatas:

- `apps/api/src/modules/customers/customers.service.ts`
- `apps/api/src/modules/customers/customers.controller.ts`

Ajustes recomendados:

- sostener unicidad de caso por cliente canonico
- formalizar apertura del caso dentro de `customers`
- formalizar `commercialOwner`, `assignee`, `classification`, `origin`,
  `nextStep` y `followUpAt`
- sostener timeline append-only
- sostener referencias read-only a `orders` y a `009`
- no abrir ownership en campaigns o en otros dominios

### Admin y cliente HTTP

Rutas candidatas:

- `apps/admin/app/crm/page.tsx`
- `apps/admin/components/crm-workspace.tsx`
- `apps/admin/lib/api.ts`

Ajustes recomendados:

- montar el resumen comercial del caso dentro del detalle de cliente
- montar timeline y tareas opcionales
- montar bandeja filtrada dentro de `/crm`
- no abrir una app aparte de CRM comercial
- no prometer mensajeria real desde la UI

## Reglas Tecnicas Del Slice

1. `customers` sigue siendo el dominio ancla del slice.
2. solo existe un `customer_relationship_case` por cliente canonico.
3. `commercialOwner` y `assignee` son distintos.
4. `nextStep` y `followUpAt` son obligatorios en estados activos.
5. las entradas del timeline son inmutables.
6. las tareas son opcionales y editables.
7. `classification` y `origin` viven en este slice.
8. `order_reference` y `follow_up_reference` son automaticos y read-only.
9. el merge de `007` reancla el caso al cliente canonico destino.
10. `/crm` sigue siendo la superficie principal.
11. el slice no introduce campaigns, scoring ni mensajeria real.

## Riesgos Tecnicos Y Mitigaciones

| Riesgo | Mitigacion canonica |
| --- | --- |
| mover el caso transversal a `orders` | mantener el agregado en `customers` |
| dejar dos casos activos tras un merge | sostener contrato de unicidad por cliente canonico |
| degradar el caso a notas sueltas | exigir `nextStep` y `followUpAt` en estados activos |
| permitir historia mutable del seguimiento | mantener timeline append-only |
| abrir una UI paralela de CRM comercial | fijar `/crm` como superficie principal |
| mezclar este slice con campaigns o scoring | mantenerlos fuera del ownership principal |

## Definition Of Done Tecnica Del Slice

- el repo expresa con claridad que `customers` gobierna
  `customer_relationship_case`
- el contrato compartido del caso transversal queda identificable
- `/crm` queda defendido como superficie principal del slice
- timeline, tareas, clasificacion y origen quedan explicitados
- el merge queda ligado al reanclaje del caso sobre cliente canonico
- el slice deja explicito que `orders`, campaigns y scoring no son owners
  funcionales del dominio
