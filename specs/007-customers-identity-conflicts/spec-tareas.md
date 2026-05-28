# Spec Tareas - Customers Identity Conflicts

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec funcional](spec-funcional.md) | [Spec tecnica](spec-tecnica.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Customers Identity Conflicts](../../docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md),
  [Reglas de customers e identity conflicts](../../docs/fase-1-analisis-requerimientos/reglas/customers-e-identity-conflicts.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.06-customers-identity-conflicts-ux-ui.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.09-customers-identity-conflicts.md),
  [ADR-007 Customers Orders Identity Boundary](../../docs/fase-3-arquitectura/adr/ADR-007-customers-orders-identity-boundary.md)

## Objetivo

Convertir la arquitectura canonica brownfield del slice customers en un
backlog tecnico ejecutable, cerrando maestro de clientes, resolucion de
conflictos, merge con destino canonico, clientes sinteticos, lectura de
pedidos recientes y frontera con `orders`, sin abrir CRM ampliado ni absorber
`crmStage` o seguimiento comercial del pedido.

## Reglas De Ejecucion

- no convertir `/crm` en pipeline comercial ni CRM ampliado
- no mover `crmStage` ni `commercialTrace` dentro de `customers`
- no fusionar clientes con documentos canonicos distintos
- no tratar `deleteCustomer()` como flujo principal del modulo
- no vender pedidos recientes como transferencia de ownership desde `orders`
- no ocultar la existencia de clientes sinteticos o regularizados

## Backlog Canonico

### T1. Consolidar contratos compartidos del slice

**Resultado esperado**

El repo expresa con claridad el lenguaje compartido de cliente canonico,
conflicto de identidad, merge, referencias de pedido y acceso admin del
modulo.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/domain/admin-access.ts`

**Checklist**

- [ ] mantener `CustomerSummary` y `CustomerDetail` como lectura canonica del
      slice
- [ ] sostener `CustomerIdentityConflictSummary` y
      `CustomerIdentityConflictStatus`
- [ ] mantener `CustomerConflictResolveInput` y `CustomerMergeInput`
- [ ] conservar `crmStage` y `commercialTrace` en tipos de `orders`
- [ ] sostener `adminAccessRoles.crm` para ventas, marketing y overrides

### T2. Defender `/crm` como workbench principal `as-is`

**Resultado esperado**

La UI vigente queda canonizada como workbench de clientes y conflictos con
detalle, create/edit, merge y lectura contextual de pedidos.

**Rutas candidatas**

- `apps/admin/app/crm/page.tsx`
- `apps/admin/components/crm-workspace.tsx`
- `apps/admin/lib/api.ts`

**Checklist**

- [ ] mantener acceso protegido por `adminAccessRoles.crm`
- [ ] mantener metricas de clientes, activos, con pedidos, conflictos y
      opt-in
- [ ] mantener tablas separadas de clientes y conflictos
- [ ] mantener detalle con perfil, direcciones y pedidos recientes
- [ ] mantener create/edit, merge, resolve y delete
- [ ] no abrir `crmStage`, pipeline comercial ni timeline transversal en la UI

### T3. Endurecer resolucion de conflictos de identidad

**Resultado esperado**

La resolucion operativa del conflicto queda fijada con un contrato vivo,
acciones permitidas y trazabilidad consistente.

**Rutas candidatas**

- `apps/api/src/modules/customers/customers.service.ts`
- `apps/api/src/modules/customers/customers.controller.ts`
- `packages/shared/src/types/api.ts`

**Checklist**

- [ ] sostener acciones `assign_existing`, `merge` e `ignore`
- [ ] mantener estados `open`, `resolved`, `ignored` y `merged`
- [ ] dejar actor y notas trazables en la resolucion
- [ ] no reabrir como pendiente un conflicto ya resuelto
- [ ] mantener prioridad de identidad `documento`, luego `email/telefono`,
      luego `nombre + direccion`

### T4. Blindar merge con destino canonico y guardrails

**Resultado esperado**

La fusion manual mantiene un destino activo, una fuente fusionada y
restricciones explicitas para no corromper identidad ni historia operativa.

**Rutas candidatas**

- `apps/api/src/modules/customers/customers.service.ts`
- `packages/shared/src/types/api.ts`

**Checklist**

- [ ] mantener `mergeCustomersInternal()` como puerta canonica de fusion
- [ ] bloquear merge si ambos clientes tienen documentos canonicos distintos
- [ ] marcar la fuente como fusionada y conservar destino activo
- [ ] no borrar historia operativa
- [ ] documentar que la regularizacion de referencias no equivale a
      reescritura arbitraria de snapshots

### T5. Formalizar frontera con `orders`

**Resultado esperado**

La integracion con `orders` queda clara como boundary de referencias y no como
ownership compartido del perfil vivo.

**Rutas candidatas**

- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/customers/customers.service.ts`

**Checklist**

- [ ] mantener `applyCustomerResolution()` para regularizar referencias tras
      un conflicto
- [ ] mantener `reassignMergedCustomer()` para regularizar referencias tras un
      merge
- [ ] sostener `customerId`, `customerConflictId`, `crmStage` y
      `commercialTrace` dentro de `orders`
- [ ] dejar explicito que pedidos recientes en `/crm` son solo contexto
- [ ] no transferir ownership de `crmStage` ni de la historia del pedido a
      `customers`

### T6. Tratar clientes sinteticos como parte valida del runtime

**Resultado esperado**

Los clientes materializados o regularizados desde pedidos quedan cerrados como
comportamiento canonico del brownfield y no como anomalia documental.

**Rutas candidatas**

- `apps/api/src/modules/customers/customers.service.ts`
- `apps/api/src/modules/orders/orders.service.ts`

**Checklist**

- [ ] sostener `resolveCustomerFromOrderSnapshot()` como puerta de
      regularizacion desde pedidos
- [ ] sostener `buildSyntheticCustomerEmail()` para identidades sinteticas
- [ ] dejar explicita la validez de clientes sinteticos dentro del dominio
- [ ] permitir evolucion posterior a merge o asignacion a cliente canonico

### T7. Mantener `deleteCustomer()` como capacidad excepcional

**Resultado esperado**

La eliminacion sigue existiendo, pero documentada y probada como capacidad de
excepcion con bloqueos operativos duros.

**Rutas candidatas**

- `apps/api/src/modules/customers/customers.service.ts`
- `apps/api/src/modules/customers/customers.controller.ts`
- `apps/admin/components/crm-workspace.tsx`

**Checklist**

- [ ] mantener bloqueo si el cliente ya fue fusionado
- [ ] mantener bloqueo si el cliente es destino canonico de merge
- [ ] mantener bloqueo por rol compartido sensible
- [ ] mantener bloqueo por pedidos operativos
- [ ] no presentar `Eliminar` como foco del modulo en la UI

### T8. Regression suite del slice

**Resultado esperado**

Los contratos criticos del slice quedan defendidos por pruebas y smokes de
frontera.

**Rutas candidatas**

- pruebas del modulo `customers`
- pruebas de integracion con `orders`
- smokes del workbench `/crm`

**Checklist**

- [ ] probar alta y edicion de cliente
- [ ] probar resolucion con `assign_existing`
- [ ] probar resolucion con `merge`
- [ ] probar rechazo de merge por documentos canonicos distintos
- [ ] probar regularizacion de referencias via `applyCustomerResolution()`
- [ ] probar regularizacion de referencias via `reassignMergedCustomer()`
- [ ] probar bloqueo de `deleteCustomer()` en casos incompatibles
- [ ] probar que la UI no muestra `crmStage` ni pipeline comercial

## Orden Recomendado

1. `T1`
2. `T2`
3. `T3`
4. `T4`
5. `T5`
6. `T6`
7. `T7`
8. `T8`

## Definition Of Done Del Slice

- `customers` queda fijado como agregado principal del maestro canonico
- `/crm` queda defendido como workbench de clientes y conflictos
- la resolucion operativa de conflictos queda formalizada con sus tres
  acciones canonicas
- el merge queda protegido por guardrails de documento y trazabilidad
- `orders` conserva ownership de snapshots, `crmStage` y
  `commercialTrace`
- clientes sinteticos quedan reconocidos como parte valida del runtime
- `deleteCustomer()` queda documentado y defendido como capacidad excepcional
- el slice no abre CRM ampliado ni seguimiento comercial del pedido
