# ADR-007 Customers Orders Identity Boundary

Fecha: 2026-05-28.

## Estado

Aprobado para la fase 3 canonica brownfield del slice
`007-customers-identity-conflicts`.

## Contexto

El runtime vigente ya soporta un maestro de clientes en `customers`, una
superficie admin `/crm`, conflictos de identidad originados por pedidos y
fusiones manuales con regularizacion operativa de referencias. El problema de
este corte no es inventar un CRM nuevo, sino fijar la frontera canonica que
evite mezclar:

- el perfil vivo del cliente;
- la identidad nacida de pedidos;
- y el seguimiento comercial que sigue viviendo en `orders`.

Ademas, el repo ya separa responsabilidades tecnicas en modulos distintos:

- `customers` persiste el perfil canonico y resuelve conflictos;
- `/crm` expone la operacion visible de clientes, conflictos y merge;
- `orders` conserva snapshots historicos, `customerId`,
  `customerConflictId`, `crmStage` y `commercialTrace`;
- `orders` solo regulariza referencias canonicas cuando una resolucion o
  fusion ya fue decidida por `customers`.

Lo que no debe sobreleerse del runtime visible hoy es un ownership compartido
entre `customers` y `orders`: que `orders` ajuste un `customerId` no lo
convierte en duenio del perfil vivo del cliente.

## Decision

El slice brownfield de customers se canoniza con una frontera funcional
partida entre `customers` y `orders`, tratada como boundary arquitectonico y
separacion de ownership, no como dominio comun.

La decision incluye estas reglas:

1. `customers` es el agregado principal y sigue bajo ownership del slice.
2. `/crm` es la superficie visible para operar el perfil vivo, conflictos y
   merge.
3. La prioridad de identidad es `documento`, luego `email/telefono`, luego
   `nombre + direccion`.
4. Los conflictos usan `open`, `resolved`, `ignored` y `merged`.
5. La resolucion operativa admite `assign_existing`, `merge` e `ignore`.
6. El merge deja un destino activo y una fuente fusionada.
7. No se puede fusionar si ambos clientes ya tienen documentos canonicos
   distintos.
8. `orders` conserva snapshots historicos, `customerId`,
   `customerConflictId`, `crmStage` y `commercialTrace`.
9. `orders` puede regularizar referencias por `applyCustomerResolution()` o
   `reassignMergedCustomer()`, pero no gobierna el perfil vivo del cliente.
10. Clientes sinteticos o regularizados desde pedidos siguen siendo validos
    dentro del dominio actual.

## Guardrails Derivados

1. `/crm` no debe venderse como pipeline comercial amplio.
2. `customers` no debe absorber `crmStage` ni seguimiento comercial de
   pedidos.
3. Regularizar referencias canonicas en `orders` no equivale a reescribir
   arbitrariamente la historia.
4. `deleteCustomer` no debe describirse como flujo normal del modulo.
5. El slice no debe tratar clientes sinteticos como una anomalia fuera del
   dominio.

## Alternativas Rechazadas

### 1. Hacer que `orders` gobierne la identidad canonica

Rechazada porque:

- mezcla historia transaccional con perfil vivo del cliente;
- vuelve difusa la propiedad del dominio;
- dificulta merge, conflicto y correccion de perfil desde `/crm`.

### 2. Absorber `crmStage` dentro de `customers`

Rechazada porque:

- mezcla identidad con seguimiento comercial del pedido;
- contradice el runtime actual donde `crmStage` vive en `orders`;
- ensancha el slice hacia CRM ampliado sin aprobacion.

### 3. Ignorar clientes sinteticos o regularizados

Rechazada porque:

- contradice el runtime real del monorepo;
- oculta un comportamiento central del dominio actual;
- debilita la explicacion de conflictos y merges.

## Consecuencias

### Positivas

- separa con claridad perfil canonico y historia transaccional;
- fija merge y resolucion como decisiones del dominio `customers`;
- permite documentar clientes sinteticos sin tratarlos como excepcion ajena;
- deja claro que `/crm` resuelve identidad, no pipeline comercial.

### Negativas aceptadas

- el slice sigue sin `crmStage` editable desde `/crm`;
- el seguimiento comercial por pedido sigue viviendo fuera de este modulo;
- la regularizacion de referencias en `orders` puede seguir siendo progresiva,
  pero el ownership queda canonizado desde ahora.

## Regla De Reevaluacion

Esta ADR solo debe reabrirse si:

- producto aprueba un slice propio de CRM ampliado que absorba mas lifecycle
  comercial;
- `crmStage` deja de vivir en `orders`;
- cambia el ownership del perfil canonico y deja de pertenecer a `customers`.
