# UC-30 Merge Cierre Y Reapertura Del Caso Transversal Del Cliente

## Actores

- ventas
- customers

## Precondiciones

- el `customer_relationship_case` ya existe
- el cliente puede tener contexto de pedidos o de casos `009`

## Flujo principal

1. `ventas` puede mover el caso a `resolved` o `dormant`.
2. Todo cambio de estado deja una entrada `status_change`.
3. Si el caso se reabre, vuelven a exigirse `nextStep` y `followUpAt`.
4. Si `007` fusiona clientes, el caso se reancla al cliente canonico destino.
5. El sistema evita que queden dos casos activos para el mismo cliente
   canonico.

## Resultado esperado

- la historia comercial transversal se conserva con trazabilidad
- el merge de clientes no rompe el workbench comercial
- reapertura y cierre siguen un contrato consistente con el estado del caso
