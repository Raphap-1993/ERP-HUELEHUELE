# ADR-008 Orders CRM Follow-Up Boundary

Fecha: 2026-05-28.

## Estado

Aprobado para la fase 3 canonica brownfield del slice
`008-crm-stage-order-follow-up`.

## Contexto

El runtime vigente ya soporta seguimiento comercial derivado dentro de
`orders`: `crmStage` se calcula desde estados del pedido y del pago,
`commercialTrace` conserva la ruta comercial visible y `Pedidos > Operacion`
expone la lectura operativa en backoffice. El problema de este corte no es
inventar un CRM nuevo, sino fijar la frontera canonica que evite mezclar:

- la etapa derivada del pedido;
- la ruta comercial que lo confirma o rechaza;
- y los side effects tecnicos que ocurren alrededor de ese flujo.

Ademas, el repo ya separa responsabilidades tecnicas en modulos distintos:

- `orders` gobierna el pedido, `crmStage` y `commercialTrace`;
- `payments` dispara confirmacion, aprobacion o rechazo por rutas distintas;
- `Pedidos > Operacion` expone la lectura visible del seguimiento;
- `notifications` solo participa cuando una confirmacion o rechazo deja un
  side effect tecnico.

Lo que no debe sobreleerse del runtime visible hoy es un ownership compartido
entre `orders` y un supuesto CRM manual: que exista una card o una guia
operativa no convierte este slice en timeline comercial amplio.

## Decision

El slice brownfield de seguimiento derivado del pedido se canoniza dentro de
`orders`, usando `crmStage` como estado derivado y `commercialTrace` como
puente comercial de confirmacion.

La decision incluye estas reglas:

1. `orders` es el agregado principal y sigue bajo ownership del slice.
2. `Ventas` es owner operativo principal del seguimiento del pedido.
3. `OperadorPagos` solo empuja transiciones de cobro y conciliacion.
4. `crmStage` es estado derivado y no se edita manualmente.
5. `crmStage` usa `ready_for_followup`, `followup` y `closed`.
6. `commercialTrace` usa `manual_direct`, `manual_request`,
   `openpay_backoffice` y `openpay_provider`.
7. `commercialTrace` usa `pending`, `confirmed` y `rejected`.
8. `commercialTrace.pending` forma parte del runtime canonico.
9. Si el pedido cae, el pago falla o se rechaza, `crmStage` se limpia y
   `commercialTrace` conserva la evidencia comercial del cierre negativo.
10. `notifications` solo entra como side effect secundario.

## Guardrails Derivados

1. El slice no debe venderse como CRM manual de notas, tareas o timeline.
2. El slice no debe absorber customers ni conflictos de identidad.
3. El slice no debe absorber fulfillment, dispatch ni vendor assignment.
4. `CommercialTraceCard` debe leerse como resumen de ruta comercial, no como
   bitacora completa.
5. Las acciones de cobro actualizan el pedido, no un pipeline comercial
   paralelo.

## Alternativas Rechazadas

### 1. Convertir `crmStage` en workflow manual editable

Rechazada porque:

- contradice el runtime actual;
- difumina la frontera entre pedido y CRM;
- abre un dominio de notas y tareas que este corte no aprobo.

### 2. Mover el ownership del slice hacia `payments`

Rechazada porque:

- pagos solo dispara confirmacion o rechazo;
- el seguimiento posterior sigue perteneciendo al pedido;
- `Ventas` es el owner operativo natural de la lectura visible.

### 3. Tratar `notifications` como parte central del dominio

Rechazada porque:

- la entrega tecnica no es el problema central del slice;
- ensancha artificialmente el ownership;
- contradice la lectura actual del runtime.

## Consecuencias

### Positivas

- separa con claridad pedido, seguimiento derivado y side effects tecnicos;
- fija `crmStage` y `commercialTrace` como lenguaje comun entre API y admin;
- deja explicito el papel de `Ventas` y `OperadorPagos`;
- preserva la evidencia de rechazo sin dejar una etapa CRM falsa activa.

### Negativas aceptadas

- el slice sigue sin notas manuales, tareas o timeline comercial;
- parte del lenguaje de seguimiento vive embebido dentro de `orders`;
- algunos side effects tecnicos siguen desacoplados del core del slice.

## Regla De Reevaluacion

Esta ADR solo debe reabrirse si:

- producto aprueba un slice propio de CRM manual o timeline comercial;
- `crmStage` deja de derivarse desde `orders`;
- cambia el ownership visible de `Pedidos > Operacion`;
- `notifications` deja de ser side effect y pasa a gobernar parte del flujo.
