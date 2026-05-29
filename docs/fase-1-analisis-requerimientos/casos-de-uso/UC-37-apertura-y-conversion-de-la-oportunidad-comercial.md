# UC-37 Apertura Y Conversion De La Oportunidad Comercial

## Objetivo

Formalizar como `ventas` abre una `commercial_opportunity` sobre un
`customer_relationship_case` ya existente, ya sea manualmente o por
conversion explicita desde el pipeline del caso, sin crear un agregado
separado ni mover automaticamente el pipeline del cliente.

## Actores

- ventas
- marketing
- customers

## Precondiciones

- existe un cliente canonico valido en `customers`
- existe un `customer_relationship_case` comercialmente activo
- ya hay contexto real de negociacion concreta con valor esperado
- `/crm` es la superficie principal del trabajo comercial

## Flujo principal

1. `ventas` revisa el `customer_relationship_case` dentro de `/crm`.
2. Detecta que el caso ya no es solo relacion comercial general, sino una
   negociacion puntual con valor esperado.
3. Abre una `commercial_opportunity` manualmente o convierte explicitamente el
   caso desde el pipeline.
4. La oportunidad hereda por defecto `commercialOwner`, `assignee` y
   `commercialChannel`.
5. `ventas` confirma el `opportunityType`.
6. La oportunidad nace en `qualified`.
7. El sistema puede sugerir que el caso padre este al menos en `engaged`,
   pero no lo mueve automaticamente.

## Reglas canonicas

- la oportunidad vive dentro de `customer_relationship_case`
- no se abre automaticamente por scoring ni por eventos
- no puede abrirse una segunda oportunidad activa si ya existe una activa
- la apertura puede ocurrir sin `quote` u `order` formal
- la oportunidad puede enlazar referencia principal despues

## Resultado esperado

El caso comercial general del cliente queda extendido con una oportunidad
concreta y operable, preservando continuidad de ownership y sin romper la
frontera del workbench transversal.
