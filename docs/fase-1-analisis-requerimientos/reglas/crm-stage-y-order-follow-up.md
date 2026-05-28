# Reglas De CRM Stage Y Order Follow-Up

- `orders` es el agregado principal
- `Pedidos > Operacion` es la superficie visible principal
- `ventas` es owner operativo principal
- `operador_pagos` solo empuja transiciones de cobro
- `crmStage` es estado derivado `as-is`, no workflow editable manualmente
- `crmStage` usa `ready_for_followup`, `followup` y `closed`
- `commercialTrace` es puente comercial de confirmacion, no bitacora completa
  de CRM
- `commercialTrace` usa `manual_direct`, `manual_request`,
  `openpay_backoffice` y `openpay_provider`
- `commercialTrace` usa `pending`, `confirmed` y `rejected`
- `commercialTrace.pending` forma parte del runtime canonico
- `commercialTrace` explica la ruta y el hito comercial del pedido
- `crmStage` resume el punto operativo/comercial derivado del pedido
- si el pedido cae, el pago falla o se rechaza, `crmStage` se limpia
- el cierre negativo conserva `commercialTrace.rejected` como evidencia
- `CommercialTraceCard` forma parte del contrato visible `as-is`
- notifications solo entra como side effect secundario
