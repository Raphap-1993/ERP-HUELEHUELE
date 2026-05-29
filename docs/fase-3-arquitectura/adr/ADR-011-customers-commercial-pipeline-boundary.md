# ADR-011 Customers Commercial Pipeline Boundary

Fecha: 2026-05-29.

## Estado

Aprobado para la fase 3 canonica brownfield del slice
`011-pipeline-comercial-amplio`.

## Contexto

El runtime vigente ya soporta el cliente canonico en `/crm`, el merge de
identidad en `007`, el seguimiento manual por pedido en `009` y el
`customer_relationship_case` transversal fijado en `010`, pero todavia no
canoniza un pipeline comercial amplio sobre ese mismo caso.

El problema de este corte no es abrir oportunidades complejas, forecast,
scoring ni automatizaciones, sino fijar la frontera que permita ordenar la
operacion comercial del cliente con etapa, prioridad, canal principal y
criterios de cierre sin romper la base ya aprobada en `010`.

Ademas, el repo ya deja visibles varias fronteras que deben conservarse:

- `customers` gobierna el cliente canonico y su caso transversal;
- `/crm` ya es la superficie principal del workbench comercial;
- `orders` solo aporta contexto read-only cuando aplica;
- `010` ya fijo que el workbench transversal no abre pipeline amplio;
- pipeline complejo, scoring y automatizaciones siguen como gaps futuros.

## Decision

El slice brownfield de pipeline comercial amplio se canoniza dentro de
`customers`, extendiendo `customer_relationship_case` como capa manual de
pipeline visible y operable solo dentro de `/crm`.

La decision incluye estas reglas:

1. `customers` sigue siendo el dominio ancla del slice.
2. `customer_relationship_case` sigue siendo el unico agregado comercial
   activo por cliente canonico.
3. `pipelineStage` vive sobre el mismo caso, es manual y se mantiene
   separado de `status`.
4. `priority`, `commercialChannel`, `lostReason` y
   `lastPipelineActivityAt` extienden el mismo caso; no abren un agregado
   nuevo.
5. `commercialOwner` sigue siendo el owner estable heredado de `010`.
6. `assignee` sigue siendo el responsable operativo del siguiente
   movimiento.
7. `commercialChannel` agrega el canal principal del caso y no reemplaza
   `origin`.
8. `followUpAt` sigue siendo la unica fecha objetivo operativa del caso.
9. `won` y `lost` son cierres manuales del pipeline sobre el mismo caso.
10. pasar a `lost` exige `lostReason`.
11. pasar a `won` exige nota de cierre y evidencia o referencia.
12. todo cambio de `pipelineStage` deja trazabilidad obligatoria en el
    timeline del caso.
13. la superficie del slice sigue siendo detalle y bandeja filtrable dentro
    de `/crm`.
14. este corte no abre `commercial_opportunity`, forecast, probabilidad,
    scoring, automatizaciones ni kanban complejo.

## Guardrails Derivados

1. `010` sigue gobernando la existencia del caso, `commercialOwner`,
   `assignee`, `nextStep`, `followUpAt`, `origin`, clasificacion y
   timeline base.
2. `011` solo agrega la capa de pipeline amplio sobre el mismo
   `customer_relationship_case`.
3. `status` y `pipelineStage` no deben fusionarse en un solo campo.
4. `lastPipelineActivityAt` no debe competir con `followUpAt`.
5. `commercialChannel` no debe convertirse en subpipeline separado por
   canal.
6. cualquier apertura futura de `commercial_opportunity`, scoring o
   automatizaciones requiere ADR y slice propios.

## Alternativas Rechazadas

### 1. Abrir `commercial_opportunity` desde este corte

Rechazada porque:

- rompe la frontera incremental aprobada entre `010` y `011`;
- introduce multi-entidad comercial antes de estabilizar el caso
  transversal;
- mezcla pipeline amplio con forecast, monto o probabilidad demasiado
  pronto.

### 2. Colapsar `status` y `pipelineStage` en un solo eje

Rechazada porque:

- borra la separacion entre estado operativo y etapa comercial;
- vuelve ambiguos los cierres `won` y `lost`;
- debilita la compatibilidad con el caso transversal ya fijado en `010`.

### 3. Abrir una bandeja o modulo nuevo fuera de `/crm`

Rechazada porque:

- rompe la continuidad del workbench comercial ya homologado;
- sobredimensiona el corte brownfield con una UI paralela;
- empuja prematuramente un kanban complejo o una app separada.

### 4. Mezclar scoring o automatizaciones en la misma frontera

Rechazada porque:

- acopla decisiones futuras a un slice que todavia es manual;
- complica la traza del pipeline antes de tener semantica estable;
- ensancha el alcance mucho mas alla del gap actual del repo.

## Consecuencias

### Positivas

- consolida el pipeline amplio sobre el mismo `customer_relationship_case`;
- deja explicita la separacion entre `status` y `pipelineStage`;
- habilita cola comercial seria dentro de `/crm` sin crear otra entidad;
- deja una base estable para futuros slices de oportunidades, scoring o
  automatizaciones.

### Negativas aceptadas

- el pipeline sigue embebido dentro de `customers` y `/crm`;
- el corte no abre `commercial_opportunity` ni forecast;
- la operacion sigue siendo manual y sin kanban complejo;
- scoring y automatizaciones quedan deliberadamente fuera.

## Regla De Reevaluacion

Esta ADR solo debe reabrirse si:

- producto aprueba multiples oportunidades activas por cliente canonico;
- se necesita modelar forecast, monto esperado o probabilidad;
- scoring o automatizaciones comerciales pasan a ser parte del alcance
  canonico;
- el pipeline amplio deja de vivir dentro de `/crm`;
- `status` y `pipelineStage` dejan de poder sostenerse como ejes
  separados.
