# Spec Tecnica - Customers Identity Conflicts

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Customers Identity Conflicts](../../docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md),
  [Reglas de customers e identity conflicts](../../docs/fase-1-analisis-requerimientos/reglas/customers-e-identity-conflicts.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.06-customers-identity-conflicts-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.09-customers-identity-conflicts.md),
  [ADR-007 Customers Orders Identity Boundary](../../docs/fase-3-arquitectura/adr/ADR-007-customers-orders-identity-boundary.md)

## Objetivo Tecnico

Formalizar y endurecer las fronteras tecnicas del slice brownfield de
customers sin convertirlo en CRM ampliado. El slice debe preservar la
separacion entre `customers`, `/crm` y `orders`, dejando explicito que
`customers` es el owner del perfil canonico, que los conflictos y merges se
resuelven desde este dominio, y que `orders` solo conserva snapshots y
regulariza referencias operativas cuando la identidad viva cambia.

## Baseline Real Del Repo

### Contratos compartidos y enums

- `packages/shared/src/types/api.ts`
  - define `CustomerSummary`, `CustomerDetail`,
    `CustomerIdentityConflictSummary`, `CustomerConflictResolveInput` y
    `CustomerMergeInput`
  - fija `CustomerIdentityConflictStatus` en `open`, `resolved`, `ignored` y
    `merged`
  - expone `customerConflictId`, `crmStage` y `commercialTrace` dentro de los
    contratos de pedido
- `packages/shared/src/domain/enums.ts`
  - define `CrmStage`
- `packages/shared/src/domain/admin-access.ts`
  - fija `adminAccessRoles.crm` para la superficie `/crm`

### API y modulo `customers`

- `apps/api/src/modules/customers/customers.controller.ts`
  - expone `GET /admin/customers`
  - expone `GET /admin/customers/conflicts`
  - expone `GET /admin/customers/:id`
  - expone `POST /admin/customers`
  - expone `PATCH /admin/customers/:id`
  - expone `POST /admin/customers/merge`
  - expone `POST /admin/customers/conflicts/:id/resolve`
  - expone `DELETE /admin/customers/:id`
- `apps/api/src/modules/customers/customers.service.ts`
  - `resolveCustomerConflict()` soporta `assign_existing`, `merge` e `ignore`
  - `resolveCustomerFromOrderSnapshot()` materializa o regulariza identidades
    desde pedidos
  - `mergeCustomersInternal()` rechaza documentos canonicos distintos
  - `deleteCustomer()` bloquea casos incompatibles con pedidos operativos,
    roles compartidos o uso como destino canonico
  - `buildSyntheticCustomerEmail()` sostiene la materializacion de clientes
    sinteticos

### Frontera con `orders`

- `apps/api/src/modules/orders/orders.service.ts`
  - `applyCustomerResolution()` ajusta referencias operativas del pedido tras
    una resolucion
  - `reassignMergedCustomer()` regulariza referencias cuando una fusion deja
    un nuevo cliente canonico
  - `orders` mantiene `customerId`, `customerConflictId`, `crmStage` y
    `commercialTrace`

### Workbench admin y cliente HTTP

- `apps/admin/app/crm/page.tsx`
  - publica la superficie visible `/crm` con `AdminAuthGate`
  - usa `allowedRoles={adminAccessRoles.crm}`
  - describe el modulo como `CRUD operativo de clientes, direcciones y lectura reciente de pedidos`
- `apps/admin/components/crm-workspace.tsx`
  - carga clientes y conflictos en paralelo
  - muestra metricas: clientes, activos, con pedidos, conflictos y opt-in
  - opera detalle, create/edit, delete, merge y resolucion de conflictos
  - muestra pedidos recientes solo como contexto
- `apps/admin/lib/api.ts`
  - define `fetchCustomers()`, `fetchCustomerConflicts()`, `fetchCustomer()`,
    `createCustomer()`, `updateCustomer()`, `mergeCustomers()`,
    `resolveCustomerConflict()` y `deleteCustomer()`

## Frontera Tecnica Objetivo

### 1. `customers` sigue siendo el master del perfil canonico

- concentra perfil vivo, estado, direcciones, opt-in y reglas de identidad
- decide conflictos, merge y materializacion/regularizacion de clientes
- no absorbe `crmStage` ni seguimiento comercial de pedidos

### 2. `/crm` sigue siendo el workbench visible del slice

- opera clientes, conflictos, detalle, merge y create/edit
- expone pedidos recientes como contexto
- no se convierte en pipeline comercial ni CRM ampliado

### 3. `orders` sigue siendo owner de historia y referencias de pedido

- conserva snapshots y senales comerciales del pedido
- mantiene `customerId`, `customerConflictId`, `crmStage` y
  `commercialTrace`
- regulariza referencias solo cuando `customers` ya resolvio identidad o
  fusion

## Boundary De Identidad Y Referencias

El boundary tecnico del slice queda dividido en dos capas complementarias.

### Perfil vivo del cliente

- vive en `customers`
- se corrige desde `/crm`
- incluye documento, contacto, estado, direcciones y opt-in

### Referencias operativas del pedido

- viven en `orders`
- incluyen `customerId`, `customerConflictId`, `crmStage` y
  `commercialTrace`
- se ajustan por `applyCustomerResolution()` o
  `reassignMergedCustomer()` cuando la identidad canonica cambia

### No cruza a `customers`

- ownership de `crmStage`
- timeline o seguimiento comercial del pedido
- campaigns, wholesale y loyalty
- reescritura arbitraria del pasado transaccional

## Ajustes Minimos Recomendados

Este slice no abre un modulo nuevo. Solo cierra contratos y fronteras vivas
del brownfield.

### Shared contracts

Rutas candidatas:

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/domain/admin-access.ts`

Ajustes recomendados:

- mantener `CustomerSummary` y `CustomerDetail` como lecturas canonicas del
  slice
- sostener `CustomerConflictResolveInput` y `CustomerMergeInput` como
  contratos vivos de la API
- preservar `CustomerIdentityConflictStatus`
- conservar `crmStage` y `commercialTrace` en tipos de `orders`, no en
  `customers`
- mantener `adminAccessRoles.crm` alineado con ventas, marketing y overrides

### API y modulo `customers`

Rutas candidatas:

- `apps/api/src/modules/customers/customers.controller.ts`
- `apps/api/src/modules/customers/customers.service.ts`

Ajustes recomendados:

- sostener CRUD operativo del cliente canonico
- mantener `resolveCustomerConflict()` como puerta canonica de resolucion
- mantener `mergeCustomersInternal()` como puerta canonica de fusion
- conservar bloqueo de merge por documentos canonicos distintos
- sostener `deleteCustomer()` como capacidad excepcional con guardrails
- no introducir ownership de `crmStage` dentro de `customers`

### Frontera con `orders`

Rutas candidatas:

- `apps/api/src/modules/orders/orders.service.ts`

Ajustes recomendados:

- mantener `applyCustomerResolution()` para regularizacion operativa de
  referencias tras un conflicto
- mantener `reassignMergedCustomer()` para regularizacion controlada tras un
  merge
- no describir estas operaciones como ownership del perfil vivo
- no reescribir snapshots historicos arbitrariamente

### Admin y cliente HTTP

Rutas candidatas:

- `apps/admin/app/crm/page.tsx`
- `apps/admin/components/crm-workspace.tsx`
- `apps/admin/lib/api.ts`

Ajustes recomendados:

- mantener `/crm` como superficie visible principal
- sostener metricas y tablas separadas de clientes y conflictos
- mantener detalle con pedidos recientes como contexto
- no prometer `crmStage`, pipeline comercial ni timeline transversal desde la
  UI

## Reglas Tecnicas Del Slice

1. `customers` sigue siendo el agregado principal del slice.
2. `/crm` sigue siendo la superficie visible principal.
3. `resolveCustomerConflict()` soporta `assign_existing`, `merge` e `ignore`.
4. `mergeCustomersInternal()` bloquea documentos canonicos distintos.
5. `orders` mantiene `customerId`, `customerConflictId`, `crmStage` y
   `commercialTrace`.
6. `applyCustomerResolution()` y `reassignMergedCustomer()` regularizan
   referencias sin absorber ownership del perfil vivo.
7. `resolveCustomerFromOrderSnapshot()` y `buildSyntheticCustomerEmail()`
   hacen explicita la validez de clientes sinteticos dentro del runtime.
8. `deleteCustomer()` debe seguir tratandose como capacidad excepcional.
9. Pedidos recientes dentro del detalle del cliente permanecen como lectura
   contextual.
10. El slice no introduce CRM ampliado, pipeline comercial ni campanas.

## Riesgos Tecnicos Y Mitigaciones

| Riesgo | Mitigacion canonica |
| --- | --- |
| absorber `crmStage` en `customers` | mantener `crmStage` solo en contratos y servicios de `orders` |
| interpretar regularizacion de referencias como ownership compartido | documentar `applyCustomerResolution()` y `reassignMergedCustomer()` como boundary de integracion |
| tratar clientes sinteticos como dato sucio ajeno al dominio | canonizarlos como identidad valida del runtime actual |
| usar `deleteCustomer()` como limpieza normal del modulo | sostener bloqueos y semantica de capacidad excepcional |
| vender `/crm` como CRM ampliado | limitar UI, contratos y trazabilidad al maestro de clientes e identidad |

## Definition Of Done Tecnica Del Slice

- el repo expresa con claridad que `customers` gobierna perfil e identidad
- `orders` conserva historia y referencias comerciales del pedido
- la resolucion de conflictos y el merge quedan conectados con la
  regularizacion operativa de pedidos sin mover ownership
- la UI `/crm` queda defendida como workbench de clientes, no como CRM amplio
- clientes sinteticos, merge y borrado excepcional quedan documentados con el
  mismo nivel de precision que el resto del slice
