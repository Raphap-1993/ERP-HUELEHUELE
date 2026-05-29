# UC-36 Idempotencia Y Cooldown De Automatizaciones

## Objetivo

Formalizar la deduplicacion y la ventana de `cooldown` que protegen los side
effects del slice `012` sin frenar el recalculo legitimo del score.

## Actores

- marketing
- worker

## Precondiciones

- existe un `customer_relationship_case` operativo
- una regla activa ya resolvio trigger, filtros y accion
- el sistema puede evaluar la deduplicacion base por regla, caso y tipo de
  accion
- la regla puede tener una ventana `cooldown` vigente

## Flujo principal

1. Una regla intenta ejecutar una accion sobre un caso.
2. El sistema deduplica por
   `ruleId + customerRelationshipCaseId + actionType`.
3. Si la ventana `cooldown` sigue activa, no repite el side effect.
4. El bloqueo queda trazado como decision operativa de la regla.
5. El score puede recalcularse aunque la tarea o la campaign no se repita.
6. El worker procesa solo los side effects que superan deduplicacion y
   `cooldown`.

## Reglas canonicas

- la deduplicacion base es obligatoria para side effects repetibles
- cada regla define su propia ventana `cooldown`
- no deben crearse tareas duplicadas para la misma regla y el mismo caso
- no deben encolarse campaigns repetidas para la misma regla y el mismo caso
- bloquear un side effect no impide recalcular el score cuando toca

## Resultado esperado

El slice puede automatizar acciones simples sin ruido operativo, sin
duplicados y sin perder la capacidad de mantener el score comercial
actualizado.
