# UC-24 Cierre Derivado Del Seguimiento Del Pedido

## Objetivo

Formalizar el cierre del seguimiento operativo cuando el pedido completa su
lifecycle o cuando cae por rechazo o falla de pago.

## Actores

- ventas
- orders

## Precondiciones

- existe un pedido ya confirmado comercialmente o en revision operativa
- `orders` puede recalcular `crmStage` y mantener `commercialTrace`
- `Pedidos > Operacion` puede reflejar el estado derivado del cierre

## Flujo principal

1. El pedido avanza a `Delivered` o `Completed`.
2. `orders` deriva `crmStage = closed`.
3. `Pedidos > Operacion` muestra el cierre del seguimiento.
4. Si el pedido cae o el pago falla, `crmStage` se limpia y
   `commercialTrace` conserva el cierre rechazado.

## Reglas canonicas

- el cierre positivo vive en `crmStage = closed`
- el cierre negativo no deja una etapa CRM activa
- la evidencia comercial del rechazo o cierre negativo vive en
  `commercialTrace`
- el slice no abre una segunda bitacora manual para cerrar el seguimiento

## Resultado esperado

El seguimiento del pedido se cierra de forma coherente tanto en escenarios
positivos como negativos sin romper la trazabilidad comercial.
