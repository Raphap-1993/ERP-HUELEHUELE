# UC-23 Confirmacion Comercial Y Traza Operativa Del Pedido

## Objetivo

Formalizar como una decision de cobro o confirmacion operativa deja
evidencia comercial del pedido en `commercialTrace`.

## Actores

- ventas
- operador_pagos
- orders

## Precondiciones

- existe un pedido pendiente de confirmacion o con ruta comercial activa
- el runtime conoce la ruta de cobro aplicable al pedido
- `orders` puede persistir `commercialTrace`

## Flujo principal

1. Una ruta de cobro o una decision operativa confirma o rechaza
   comercialmente el pedido.
2. `orders` registra o recalcula `commercialTrace`.
3. La ruta queda como `manual_direct`, `manual_request`,
   `openpay_backoffice` u `openpay_provider`.
4. La traza conserva `status`, `actor`, `reference`, `note` y evidencia
   cuando aplica.
5. `Pedidos > Operacion` presenta la traza en `CommercialTraceCard`.

## Reglas canonicas

- `commercialTrace` es puente comercial de confirmacion, no bitacora completa
  de CRM
- `manual_direct`, `manual_request`, `openpay_backoffice` y
  `openpay_provider` forman parte del runtime canonico
- `pending`, `confirmed` y `rejected` forman parte del runtime canonico
- la traza conserva referencia, actor y respaldo aunque `crmStage` luego
  cambie

## Resultado esperado

Cada pedido conserva una traza comercial coherente con la ruta real que lo
confirmo, lo dejo pendiente o lo cerro negativamente.
