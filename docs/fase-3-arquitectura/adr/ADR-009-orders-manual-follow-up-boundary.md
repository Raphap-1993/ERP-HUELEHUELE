# ADR-009 Orders Manual Follow-Up Boundary

Fecha: 2026-05-28.

## Estado

Aprobado para la fase 3 canonica brownfield del slice
`009-crm-manual-ampliado`.

## Contexto

El runtime vigente ya soporta seguimiento derivado del pedido dentro de
`orders`, pero todavia no canoniza un workbench manual explicito con
responsable, siguiente paso, fecha objetivo, timeline humano y tareas
opcionales sobre el pedido ya elegible.

El problema de este corte no es inventar un CRM transversal, sino fijar la
frontera canonica que evite mezclar:

- el pedido y su seguimiento derivado ya homologado en `008`;
- el nuevo seguimiento manual ampliado sobre el mismo pedido;
- y dominios externos como `customers`, campaigns, fulfillment o
  notifications.

Ademas, el repo ya separa responsabilidades tecnicas en modulos distintos:

- `orders` gobierna el pedido y su lifecycle;
- `crmStage` ya decide si el pedido es elegible para seguimiento;
- `Pedidos > Operacion` ya es la superficie visible del seguimiento del
  pedido;
- `notifications` solo aparece como capacidad secundaria alrededor del flujo.

## Decision

El slice brownfield de CRM manual ampliado se canoniza dentro de `orders`,
usando `order_follow_up_case` como agregado de trabajo humano sobre pedidos
ya elegibles.

La decision incluye estas reglas:

1. `orders` es el agregado principal y sigue bajo ownership del slice.
2. existe un solo `order_follow_up_case` por pedido.
3. el caso solo puede abrirse sobre pedidos con `crmStage` relevante.
4. `Ventas` es owner operativo principal del caso.
5. `Marketing` tiene acceso operativo secundario.
6. `nextStep` y `followUpAt` son obligatorios mientras el caso este en
   `open` o `waiting_customer`.
7. las entradas del timeline son inmutables.
8. las tareas son opcionales y editables.
9. `Delivered` y `Completed` resuelven automaticamente el caso.
10. una caida comercial del pedido cancela automaticamente el caso.
11. la reapertura solo procede si el pedido sigue elegible.

## Guardrails Derivados

1. El slice no debe moverse hacia `customers`.
2. El slice no debe abrir CRM transversal por cliente.
3. El slice no debe abrir multi-caso por pedido.
4. El slice no debe absorber campaigns, fulfillment ni mensajeria real.
5. La bandeja secundaria debe seguir dentro de `Pedidos`, no convertirse en
   dashboard o modulo aparte.

## Alternativas Rechazadas

### 1. Mover el seguimiento manual a `customers`

Rechazada porque:

- contradice el ancla real del seguimiento, que es el pedido;
- mezcla identidad de cliente con operacion del caso;
- rompe la continuidad con `008`.

### 2. Permitir varios casos por pedido

Rechazada porque:

- complica demasiado el corte brownfield;
- vuelve ambiguo el ownership operativo;
- dificulta la lectura de la bandeja de ventas.

### 3. Abrir un CRM manual transversal separado

Rechazada porque:

- ensancha artificialmente el dominio;
- rompe la primacia de `Pedidos > Operacion`;
- mezcla workbench manual con pipeline comercial general.

## Consecuencias

### Positivas

- separa con claridad seguimiento derivado y seguimiento manual;
- fija un workbench manual acotado y serio dentro del pedido;
- mantiene la lectura operativa de `Ventas` sin crear otra app;
- deja listo un punto estable para evolucion futura si luego se aprueba CRM
  transversal.

### Negativas aceptadas

- el slice sigue embebido dentro de `orders`;
- el seguimiento manual no vive todavia en una bandeja comercial transversal;
- la mensajeria y automatizacion quedan fuera del ownership principal.

## Regla De Reevaluacion

Esta ADR solo debe reabrirse si:

- producto aprueba CRM manual transversal por cliente;
- el workbench deja de estar anclado al pedido;
- aparece necesidad real de multi-caso por pedido;
- `Pedidos > Operacion` deja de ser la superficie visible principal del
  seguimiento manual.
