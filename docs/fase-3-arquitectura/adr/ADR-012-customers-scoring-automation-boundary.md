# ADR-012 Customers Scoring Automation Boundary

Fecha: 2026-05-29.

## Estado

Aprobado para la fase 3 canonica brownfield del slice
`012-scoring-y-automatizaciones-comerciales`.

## Contexto

El runtime vigente ya soporta el `customer_relationship_case` transversal en
`010`, el pipeline amplio manual en `011` y la frontera de campaigns y dispatch
documentada en `006`, pero todavia no canoniza una capa derivada de scoring
comercial ni un catalogo cerrado de automatizaciones simples sobre el mismo
caso.

El problema de este corte no es abrir un journey builder, IA comercial ni
oportunidades complejas, sino fijar la frontera que permita:

- derivar un `scoreTier` visible y auditable sobre el caso;
- reaccionar a eventos comerciales y transaccionales finitos;
- disparar side effects simples, seguros e idempotentes;
- y mantener intacta la frontera donde `customers` gobierna el caso,
  `marketing` gobierna las reglas y `notifications/worker` solo hacen dispatch
  real cuando corresponde.

Ademas, el repo ya deja visibles varias fronteras que deben conservarse:

- `customers` gobierna el cliente canonico y su caso comercial;
- `/crm` ya es la superficie principal del workbench comercial;
- `011` ya fijo que `pipelineStage` y `status` no deben mutarse
  automaticamente;
- `006` ya fijo la frontera de campaigns, notifications y worker;
- scoring y automation amplia siguen como gap futuro del brownfield.

## Decision

El slice brownfield de scoring y automatizaciones comerciales simples se
canoniza dentro de `customers`, extendiendo `customer_relationship_case` con
score derivado, razon visible, reglas cerradas y side effects simples auditados.

La decision incluye estas reglas:

1. `customers` sigue siendo el dominio ancla del slice.
2. `customer_relationship_case` sigue siendo el unico agregado comercial activo
   por cliente canonico.
3. el score es determinista, auditable y read-only.
4. la UI principal solo expone `scoreTier` y una razon corta del score.
5. el puntaje interno no se muestra en `/crm`.
6. el score no admite override manual en este corte.
7. el catalogo de reglas es cerrado y predefinido.
8. cada regla usa `active/inactive`, `order`, `cooldown`, trigger, filtros y
   accion.
9. los triggers fuente canonicos del slice son:
   `pipeline_stage_changed`, `followup_due`, `followup_overdue`,
   `order_confirmed`, `payment_confirmed` y `case_reopened`.
10. los eventos derivados canonicos del slice son:
    `score_changed` y `followup_candidate_detected`.
11. las acciones permitidas son solo:
    `recalculate_score`, `suggest_priority`, `create_followup_task` y
    `enqueue_existing_campaign`.
12. `suggest_priority` no puede escribir `priority` automaticamente.
13. `create_followup_task` opera sobre el caso transversal del cliente.
14. `enqueue_existing_campaign` solo reutiliza campaigns existentes del slice
    `006`.
15. la deduplicacion base usa
    `ruleId + customerRelationshipCaseId + actionType`.
16. cada regla puede bloquear repeticion con su propio `cooldown`.
17. bloquear un side effect no impide recalcular score cuando corresponde.
18. las automatizaciones simples no cambian `pipelineStage`.
19. las automatizaciones simples no cambian `status`.
20. las automatizaciones simples no cambian `commercialOwner` ni `assignee`.
21. el dispatch real de campañas o side effects asincronos sigue viviendo en
    `notifications/worker`.
22. este corte no abre `commercial_opportunity`, journeys, builder libre ni IA
    opaca.

## Guardrails Derivados

1. `010` sigue gobernando el workbench base del caso transversal.
2. `011` sigue gobernando `pipelineStage`, `priority`, `commercialChannel`,
   `status`, `won` y `lost`.
3. `012` no debe mover ni reescribir decisiones manuales del pipeline.
4. el score no debe convertirse en explicacion numerica compleja dentro de la
   UI principal.
5. el catalogo de reglas no debe convertirse en builder libre sin una ADR
   nueva.
6. cualquier automatizacion multi-step o journey requiere un slice futuro.
7. cualquier apertura de opportunities, forecast o IA comercial requiere un
   corte nuevo.

## Alternativas Rechazadas

### 1. Hacer el score manual o editable

Rechazada porque:

- destruye auditabilidad y reproducibilidad;
- mezcla juicio humano con lectura derivada del sistema;
- vuelve inconsistente la explicacion del score.

### 2. Permitir que las automatizaciones muevan `pipelineStage` o `status`

Rechazada porque:

- invade el ownership ya fijado en `011`;
- vuelve opaca la traza comercial del caso;
- ensancha el alcance mucho mas alla de automatizaciones simples.

### 3. Abrir un builder libre de reglas desde este corte

Rechazada porque:

- convierte un slice brownfield acotado en un engine de automatizacion;
- complica validacion, soporte e idempotencia demasiado pronto;
- rompe el principio de catalogo cerrado aprobado en el diseno.

### 4. Mezclar campaigns authoring dentro de `/crm`

Rechazada porque:

- contradice la frontera ya aprobada en `006`;
- mezcla consumo comercial con authoring de marketing;
- rompe el ownership de `notifications/worker` como dispatch real.

## Consecuencias

### Positivas

- agrega una capa determinista y auditable de priorizacion comercial;
- conserva un solo caso comercial por cliente canonico;
- habilita side effects utiles sin abrir journeys ni opportunities;
- mantiene intactas las fronteras de `010`, `011` y `006`;
- deja base estable para slices futuros de automation mas amplia.

### Negativas aceptadas

- el score visible sigue embebido dentro de `/crm`;
- el catalogo de reglas queda deliberadamente cerrado;
- no existe override manual del score;
- las automatizaciones siguen limitadas a efectos simples y seguros.

## Regla De Reevaluacion

Esta ADR solo debe reabrirse si:

- producto aprueba opportunities comerciales separadas;
- se necesita mover `pipelineStage` o `status` automaticamente;
- se aprueba un builder libre de reglas;
- se aprueban journeys multi-step o IA comercial opaca;
- el consumo del score deja de vivir dentro del mismo `/crm`.
