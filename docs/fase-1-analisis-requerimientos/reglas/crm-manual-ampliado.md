# Reglas De CRM Manual Ampliado

- `orders` es el agregado principal
- `order_follow_up_case` vive dentro de `orders`
- solo existe un caso por pedido
- `ventas` es owner operativo principal
- `marketing` tiene acceso operativo secundario
- el caso usa `open`, `waiting_customer`, `resolved` y `cancelled`
- `nextStep` y `followUpAt` son obligatorios mientras el caso este abierto
- el timeline manual usa `note`, `call`, `whatsapp`, `email` y
  `status_change`
- toda transicion de estado deja `status_change`
- las entradas del timeline son inmutables
- las tareas son opcionales, editables y usan `pending` y `done`
- el cierre por lifecycle del pedido es automatico
- la reapertura vuelve a exigir `nextStep` y `followUpAt`
- el slice no abre CRM por cliente ni mensajeria real
