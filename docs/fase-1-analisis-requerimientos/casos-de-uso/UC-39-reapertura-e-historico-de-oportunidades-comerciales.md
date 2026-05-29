# UC-39 Reapertura E Historico De Oportunidades Comerciales

## Objetivo

Formalizar como una oportunidad perdida puede reabrirse sin destruir
historial, y como una oportunidad ganada obliga a abrir una nueva oportunidad
si nace otro ciclo comercial posterior.

## Actores

- ventas
- admin

## Precondiciones

- existe una `commercial_opportunity` cerrada
- el caso comercial del cliente conserva historial y contexto del deal
- `/crm` sigue siendo la superficie de operacion y lectura

## Flujo principal

1. Una oportunidad cerrada como `lost` vuelve a ser relevante.
2. `ventas` la reabre manualmente.
3. La reapertura vuelve a `negotiation`.
4. El timeline propio de la oportunidad deja traza del cierre anterior y de la
   reapertura.
5. Si una oportunidad ya cerrada en `won` da paso a un nuevo ciclo comercial,
   `ventas` abre una nueva oportunidad historica.

## Reglas canonicas

- solo `lost` puede reabrirse
- `won` es cierre estable
- el historico de oportunidades no se borra
- el caso padre no pierde su propia historia transversal
- sigue aplicando una sola oportunidad activa por caso

## Resultado esperado

La historia de negociaciones del cliente queda preservada sin convertir una
misma oportunidad en contenedor ambiguo de multiples ciclos comerciales.
