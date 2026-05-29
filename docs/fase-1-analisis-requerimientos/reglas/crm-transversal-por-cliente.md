# Reglas De CRM Transversal Por Cliente

- `customers` es el dominio ancla del slice
- `customer_relationship_case` vive sobre el cliente canonico
- solo existe un caso por cliente
- `ventas` es owner operativo principal
- `marketing` tiene acceso operativo secundario
- el caso usa `open`, `waiting_customer`, `dormant` y `resolved`
- `commercialOwner` y `assignee` son distintos
- `nextStep` y `followUpAt` son obligatorios en estados activos
- el timeline usa `note`, `call`, `whatsapp`, `email`, `status_change`,
  `order_reference` y `follow_up_reference`
- las entradas del timeline son inmutables
- `order_reference` y `follow_up_reference` son automaticas y read-only
- las tareas son opcionales, editables y usan `pending` y `done`
- `classification` vive en `010`, no en `007`
- `origin` explica por que existe el caso transversal
- el merge de `007` reancla el caso al cliente canonico destino
- el slice no abre pipeline amplio, scoring ni mensajeria real
