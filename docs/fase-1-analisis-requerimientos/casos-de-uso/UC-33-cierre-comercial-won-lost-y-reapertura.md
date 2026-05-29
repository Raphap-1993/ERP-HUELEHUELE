# UC-33 Cierre Comercial Won Lost Y Reapertura

## Objetivo

Formalizar el cierre comercial manual del pipeline como `won` o `lost`, asi
como la reapertura controlada de un caso perdido sin destruir el caso
transversal del cliente.

## Actores

- ventas

## Precondiciones

- el `customer_relationship_case` ya existe
- el pipeline comercial ya tiene una etapa activa o un cierre previo
- el timeline del caso conserva trazabilidad comercial

## Flujo principal

1. El operador decide cerrar el pipeline como `won` o `lost`.
2. Si marca `lost`, registra `lostReason`.
3. Si marca `won`, registra nota de cierre y evidencia o referencia.
4. El timeline guarda el cambio de etapa comercial.
5. Si el caso estaba `lost`, puede reabrirse comercialmente con
   trazabilidad.

## Reglas canonicas

- `lost` exige `lostReason`
- `won` exige nota de cierre y evidencia o referencia
- todo cierre comercial deja trazabilidad en el timeline
- `won` y `lost` son cierres comerciales, no cierres tecnicos del caso
- un caso perdido puede reabrirse sin crear otro `customer_relationship_case`

## Resultado esperado

El pipeline comercial queda cerrado o reabierto con disciplina operativa,
sin perder historia y sin romper el contrato transversal del caso definido
por `010`.
