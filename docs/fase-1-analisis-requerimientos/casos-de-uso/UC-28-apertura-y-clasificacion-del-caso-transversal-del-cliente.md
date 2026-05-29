# UC-28 Apertura Y Clasificacion Del Caso Transversal Del Cliente

## Actores

- ventas
- marketing
- customers

## Precondiciones

- existe un cliente canonico valido en `customers`
- el cliente entra a trabajo comercial activo
- no existe ya otro `customer_relationship_case` activo para el mismo
  cliente

## Flujo principal

1. `ventas` o `marketing` abren el caso transversal del cliente.
2. El sistema ancla el caso al cliente canonico.
3. El operador registra `commercialOwner` y `assignee`.
4. El operador registra `classification` y `origin`.
5. El operador registra `nextStep` y `followUpAt`.
6. El cliente queda con un solo `customer_relationship_case` activo.

## Resultado esperado

- el cliente queda incorporado al workbench comercial transversal
- la relacion comercial ya tiene owner estable y responsable operativo
- la bandeja de `/crm` puede mostrar este cliente como caso activo
