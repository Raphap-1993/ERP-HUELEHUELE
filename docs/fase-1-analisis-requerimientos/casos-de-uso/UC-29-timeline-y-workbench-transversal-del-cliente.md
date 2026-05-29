# UC-29 Timeline Y Workbench Transversal Del Cliente

## Actores

- ventas
- marketing
- customers

## Precondiciones

- el `customer_relationship_case` ya existe
- el cliente puede o no tener pedidos previos

## Flujo principal

1. El operador entra al detalle del cliente en `/crm`.
2. El sistema muestra resumen comercial corto del caso.
3. El operador agrega una entrada manual al timeline con `type` y `note`.
4. El timeline tambien muestra `order_reference` y
   `follow_up_reference` read-only.
5. El caso mantiene `commercialOwner`, `assignee`, `nextStep` y
   `followUpAt`.
6. Las tareas opcionales pueden crearse, editarse y marcarse `done`.

## Resultado esperado

- el detalle del cliente concentra la lectura comercial activa
- el timeline conserva historia manual sin duplicar toda la historia de
  pedidos
- el caso transversal queda listo para siguiente movimiento comercial
