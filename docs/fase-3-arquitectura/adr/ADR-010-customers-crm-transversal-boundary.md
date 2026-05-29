# ADR-010 Customers CRM Transversal Boundary

Fecha: 2026-05-28.

## Estado

Aprobado para la fase 3 canonica brownfield del slice
`010-crm-transversal-por-cliente`.

## Contexto

El runtime vigente ya soporta el cliente canonico en `/crm`, conflictos de
identidad y merge operativo en `007`, y seguimiento manual por pedido en
`009`, pero todavia no canoniza una capa de relacion comercial activa sobre
el cliente como cuenta.

El problema de este corte no es abrir pipeline comercial amplio, sino fijar
la frontera canonica que evite mezclar:

- el maestro de identidad de `007`;
- el seguimiento manual sobre pedido de `009`;
- y el nuevo workbench transversal sobre cliente canonico.

Ademas, el repo ya separa responsabilidades tecnicas en modulos distintos:

- `customers` gobierna el cliente canonico;
- `orders` gobierna el pedido y sus casos manuales;
- `/crm` ya es la superficie visible del cliente;
- campaigns y notifications viven en fronteras separadas.

## Decision

El slice brownfield de CRM transversal por cliente se canoniza dentro de
`customers`, usando `customer_relationship_case` como agregado de relacion
comercial activa sobre el cliente canonico.

La decision incluye estas reglas:

1. `customers` es el dominio ancla y sigue bajo ownership del slice.
2. existe un solo `customer_relationship_case` por cliente canonico.
3. el caso solo vive cuando hay trabajo comercial activo.
4. el caso puede existir aunque el cliente todavia no tenga pedidos.
5. `Ventas` es owner operativo principal del caso.
6. `Marketing` tiene acceso operativo secundario.
7. `commercialOwner` y `assignee` son distintos.
8. `nextStep` y `followUpAt` son obligatorios mientras el caso este en
   `open` o `waiting_customer`.
9. las entradas del timeline son inmutables.
10. `order_reference` y `follow_up_reference` son automaticos y read-only.
11. el merge de `007` reancla el caso al cliente canonico destino.
12. no pueden quedar dos casos activos para el mismo cliente canonico.

## Guardrails Derivados

1. La clasificacion comercial no debe moverse a `007`.
2. El timeline transversal no debe moverse a `orders`.
3. El slice no debe abrir pipeline comercial amplio.
4. El slice no debe absorber campaigns, scoring ni mensajeria real.
5. La bandeja secundaria debe seguir dentro de `/crm`, no convertirse en
   dashboard o app aparte.

## Alternativas Rechazadas

### 1. Mantener todo el CRM manual dentro de `orders`

Rechazada porque:

- mezcla seguimiento de pedido con relacion comercial transversal;
- vuelve ambiguo quien es el owner estable del cliente;
- impide leer el contexto comercial consolidado del cliente.

### 2. Mover la clasificacion y el owner comercial al maestro de `007`

Rechazada porque:

- contamina identidad canonica con senales comerciales cambiantes;
- debilita la frontera entre perfil estable y relacion comercial activa;
- hace mas riesgoso el merge operativo.

### 3. Abrir un CRM comercial amplio desde este corte

Rechazada porque:

- ensancha artificialmente el dominio;
- mezcla workbench transversal con pipeline y oportunidades;
- rompe el enfoque brownfield `as-is`.

## Consecuencias

### Positivas

- separa con claridad identidad, seguimiento por pedido y relacion por
  cliente;
- fija un workbench comercial serio dentro de `/crm`;
- mantiene contexto de pedidos y de `009` sin duplicarlos;
- deja listo un punto estable para evolucion futura si luego se aprueba
  pipeline o scoring.

### Negativas aceptadas

- el slice sigue embebido dentro de `customers` y `/crm`;
- el workbench transversal no abre todavia pipeline comercial amplio;
- campaigns, scoring y mensajeria real quedan fuera del ownership
  principal.

## Regla De Reevaluacion

Esta ADR solo debe reabrirse si:

- producto aprueba pipeline comercial amplio u oportunidades complejas;
- la clasificacion comercial deja de ser manual;
- el workbench deja de vivir en `/crm`;
- se necesita mas de un caso activo por cliente canonico.
