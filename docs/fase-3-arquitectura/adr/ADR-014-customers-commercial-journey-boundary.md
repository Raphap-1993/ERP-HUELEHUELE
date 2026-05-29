# ADR-014 Customers Commercial Journey Boundary

Fecha: 2026-05-29.

## Estado

Aprobado para la fase 3 canonica brownfield del slice
`014-automatizacion-comercial-amplia`.

## Contexto

El runtime vigente ya soporta el cliente canonico y su caso comercial en
`010`, el pipeline amplio manual en `011`, las automatizaciones simples de
`012` y la oportunidad puntual de `013`, pero todavia no canoniza una capa
de journeys multi-step para orquestar esperas, hitos y pasos humanos sobre el
mismo workbench comercial del cliente.

El problema de este corte no es abrir un workflow engine libre, inbox
comercial ni chaining entre journeys, sino fijar la frontera que permita:

- anclar el journey al caso comercial del cliente;
- usar la oportunidad activa solo como contexto ligado cuando aplique;
- ejecutar waits y reanudaciones diferidas sin perder control humano;
- y mantener intactas las fronteras ya fijadas para pipeline, scoring,
  campaigns y deal puntual.

Ademas, el repo ya deja visibles varias fronteras que deben conservarse:

- `customers` gobierna el cliente canonico y su caso comercial;
- `/crm` ya es la superficie principal del workbench comercial;
- `012` ya fijo side effects simples y seguros;
- `013` ya fijo el deal puntual, pero no como raiz del engine;
- `worker` y campaigns ya existen como soporte tecnico reutilizable.

## Decision

El slice brownfield de automation comercial amplia se canoniza dentro de
`customers`, anclado a `customer_relationship_case`, con `journey_template`
cerrado y `journey_instance` subordinada al caso.

La decision incluye estas reglas:

1. `customers` sigue siendo el dominio ancla del slice.
2. `customer_relationship_case` sigue siendo el agregado comercial principal
   por cliente canonico.
3. `journey_instance` vive sobre el caso y no sobre la oportunidad como
   agregado raiz.
4. solo puede existir una instancia no terminal por `template + case`.
5. un caso puede tener varias instancias activas si son de templates
   distintos.
6. `paused` no libera la unicidad del `template + case`.
7. los templates se gobiernan como catalogo cerrado por `marketing`.
8. cada instancia toma snapshot del template al arrancar.
9. el lifecycle de instancia usa `active`, `paused`, `completed` y
   `cancelled`.
10. los tipos de paso permitidos son `wait`, `condition`,
    `create_followup_task`, `manual_review`, `suggest_priority`,
    `enqueue_existing_campaign` y `mark_journey_milestone`.
11. los pasos `manual_review` bloquean hasta resolverse dentro de `/crm`.
12. la reanudacion tras `manual_review` o `wait` ocurre automaticamente
    cuando corresponde.
13. `worker/BullMQ` solo procesa waits, timers y continuaciones diferidas.
14. la oportunidad activa puede ligarse como contexto estable, pero no puede
    convertirse en ancla del engine.
15. el engine no puede disparar otro journey template.
16. el engine no puede mutar automaticamente `pipelineStage`, `status` ni
    `opportunityStage`.
17. el engine no puede crear `commercial_opportunity` automaticamente.
18. el engine puede crear tareas, sugerir prioridad, marcar hitos y encolar
    campañas ya existentes.
19. incompatibilidad fuerte cancela; incompatibilidad blanda pausa o desvia.
20. toda transicion y todo paso dejan traza obligatoria en `/crm`.

## Guardrails Derivados

1. `010` sigue gobernando la relacion comercial general del cliente.
2. `011` sigue gobernando `pipelineStage`, `priority` y `status` del caso.
3. `012` sigue gobernando el scoring y las reglas simples del caso.
4. `013` sigue gobernando el deal puntual y su lifecycle propio.
5. el journey no debe absorber el timeline general del cliente.
6. el journey no debe absorber ni mutar automaticamente el lifecycle del
   deal.
7. cualquier chaining entre journeys requiere otra ADR.

## Alternativas Rechazadas

### 1. Anclar el engine en `commercial_opportunity`

Rechazada porque:

- deja mal cubiertos los casos donde aun no existe deal activo;
- haria colapsar relation workflow y deal workflow;
- rompería la continuidad incremental de `010`, `011` y `012`.

### 2. Abrir un builder libre de journeys desde este corte

Rechazada porque:

- convierte un slice brownfield acotado en un workflow platform;
- complica validacion, soporte e idempotencia demasiado pronto;
- rompe el principio de catalogo cerrado ya aprobado.

### 3. Permitir chaining entre journeys

Rechazada porque:

- multiplica el riesgo de loops y carreras;
- vuelve opaca la trazabilidad del caso;
- ensancha mucho mas el engine de lo que exige este corte.

### 4. Permitir mutaciones automaticas de pipeline o deal

Rechazada porque:

- invade ownership ya fijado en `011` y `013`;
- vuelve opaca la lectura del estado comercial;
- adelanta automatizacion fuerte sin base suficiente.

## Consecuencias

### Positivas

- agrega una capa real de secuencias multi-step sobre el caso comercial;
- conserva al cliente y a su caso como columna vertebral del CRM;
- reutiliza `worker` y campaigns sin absorber el dominio comercial;
- deja base estable para expansiones futuras de automation.

### Negativas aceptadas

- el engine sigue embebido dentro de `/crm`;
- no existe builder libre;
- no existe chaining entre journeys;
- el control humano sigue siendo fuerte en pasos manuales y aperturas
  excepcionales.

## Regla De Reevaluacion

Esta ADR solo debe reabrirse si:

- producto aprueba chaining entre journeys;
- se aprueba builder libre de templates o de pasos;
- la oportunidad pasa a ser ancla del engine;
- se aprueba inbox o mensajeria bidireccional real;
- se permite mutar automaticamente `pipelineStage`, `status` u
  `opportunityStage`.
