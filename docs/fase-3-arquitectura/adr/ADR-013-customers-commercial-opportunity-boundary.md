# ADR-013 Customers Commercial Opportunity Boundary

Fecha: 2026-05-29.

## Estado

Aprobado para la fase 3 canonica brownfield del slice
`013-commercial-opportunities`.

## Contexto

El runtime vigente ya soporta el cliente canonico en `/crm`, el
`customer_relationship_case` transversal en `010`, el pipeline amplio manual en
`011` y el score derivado con automatizaciones simples en `012`, pero todavia
no canoniza una unidad puntual de deal para separar la negociacion concreta del
caso comercial general del cliente.

El problema de este corte no es abrir una suite pesada de opportunities,
forecast o probabilidad, sino fijar la frontera que permita:

- modelar un deal concreto con valor esperado;
- darle lifecycle propio y trazabilidad propia;
- mantenerlo subordinado al caso comercial del cliente;
- y evitar que `won` o `lost` del deal rompan el caso general o el pipeline
  amplio ya aprobados.

Ademas, el repo ya deja visibles varias fronteras que deben conservarse:

- `customers` gobierna el cliente canonico y su caso comercial;
- `/crm` ya es la superficie principal del workbench comercial;
- `011` ya fijo el pipeline amplio del caso;
- `012` ya fijo score y automatizaciones simples sin deals separados;
- opportunities mas complejas, forecast y probabilidad siguen como gap futuro.

## Decision

El slice brownfield de `commercial_opportunity` se canoniza dentro de
`customers`, subordinado a `customer_relationship_case` y visible dentro del
mismo `/crm`.

La decision incluye estas reglas:

1. `customers` sigue siendo el dominio ancla del slice.
2. `customer_relationship_case` sigue siendo el agregado comercial principal
   por cliente canonico.
3. `commercial_opportunity` vive subordinada al caso y no como agregado raiz.
4. solo puede existir una oportunidad activa por caso.
5. puede existir historico de oportunidades cerradas.
6. la oportunidad solo se abre si existe negociacion concreta con valor
   esperado.
7. la apertura es manual o por conversion explicita desde el pipeline del
   caso.
8. no existe apertura automatica por scoring ni por eventos.
9. el lifecycle del deal usa `qualified`, `proposal`, `negotiation`, `won` y
   `lost`.
10. el lifecycle es manual por `ventas`.
11. `expectedValue`, `currency` y `targetCloseAt` son obligatorios mientras la
    oportunidad este activa.
12. `commercialOwner`, `assignee` y `commercialChannel` se heredan por
    defecto del caso y pueden ajustarse en la oportunidad.
13. `opportunityType` usa `storefront_recovery`, `wholesale_deal`,
    `vendor_activation` y `reactivation`.
14. la oportunidad puede abrirse sin artefacto fuente obligatorio.
15. la oportunidad puede tener una referencia principal y referencias
    secundarias opcionales.
16. el deal tiene timeline propio y tareas propias minimas.
17. `lost` puede reabrirse y vuelve a `negotiation`.
18. `won` es cierre estable y no se reabre.
19. un nuevo ciclo posterior a `won` requiere una nueva oportunidad
    historica.
20. abrir una oportunidad solo sugiere que el caso padre este al menos en
    `engaged`; no lo mueve automaticamente.
21. este corte no abre probabilidad de cierre, forecast ni modulo separado.

## Guardrails Derivados

1. `010` sigue gobernando la relacion comercial general del cliente.
2. `011` sigue gobernando el pipeline amplio del caso padre.
3. `012` sigue gobernando score y automatizaciones simples del caso.
4. la oportunidad no debe absorber el timeline general del cliente.
5. el caso general no debe absorber la timeline puntual del deal.
6. `won` no debe reutilizarse como contenedor ambiguo de ciclos sucesivos.
7. cualquier apertura futura de multiples oportunidades activas requiere otra
   ADR.

## Alternativas Rechazadas

### 1. Reemplazar `customer_relationship_case` por oportunidad

Rechazada porque:

- rompe la continuidad incremental de `010`, `011` y `012`;
- convierte toda relacion comercial en deal, incluso cuando no lo es;
- hace colapsar relationship management y negotiation execution.

### 2. Permitir multiples oportunidades activas por caso desde este corte

Rechazada porque:

- sobredimensiona el brownfield antes de estabilizar el primer modelo de deal;
- complica ownership, UX y trazabilidad demasiado pronto;
- ensancha el runtime mas alla del gap actual del repo.

### 3. Exigir quote, order o lead formal al abrir

Rechazada porque:

- bloquea deals tempranos o reactivaciones todavia no documentadas;
- fuerza una rigidez artificial en un brownfield que aun no la sostiene;
- reduce utilidad operativa del slice.

### 4. Agregar probabilidad o forecast desde este corte

Rechazada porque:

- adelanta semanticas que el brownfield todavia no demuestra;
- mezcla deal tracking con revenue planning;
- amplifica el alcance mucho mas alla del objetivo actual.

## Consecuencias

### Positivas

- separa claramente caso comercial general y deal puntual;
- permite negociar con valor esperado sin romper el workbench del cliente;
- mantiene una sola oportunidad activa por caso para operacion sobria;
- deja base estable para expansion futura de opportunities.

### Negativas aceptadas

- el deal sigue embebido dentro de `/crm`;
- no existe probabilidad de cierre ni forecast;
- la regla de una activa por caso limita escenarios mas complejos;
- la apertura sigue siendo manual y sin automation fuerte.

## Regla De Reevaluacion

Esta ADR solo debe reabrirse si:

- producto aprueba multiples oportunidades activas por caso;
- se requiere forecast o probabilidad de cierre;
- la oportunidad deja de vivir subordinada al caso comercial del cliente;
- `/crm` deja de ser la superficie principal del deal;
- automatizacion o scoring pasan a controlar el lifecycle del deal.
