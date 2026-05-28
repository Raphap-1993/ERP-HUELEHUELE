# Spec Funcional - CRM Stage Order Follow-Up

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - CRM Stage Order Follow-Up](../../docs/fase-1-analisis-requerimientos/01.07-crm-stage-order-follow-up.md),
  [Reglas de crm stage y order follow-up](../../docs/fase-1-analisis-requerimientos/reglas/crm-stage-y-order-follow-up.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.07-crm-stage-order-follow-up-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.10-crm-stage-order-follow-up.md),
  [ADR-008 Orders CRM Follow-Up Boundary](../../docs/fase-3-arquitectura/adr/ADR-008-orders-crm-follow-up-boundary.md)

## Objetivo

Definir el slice canonico vigente del seguimiento operativo derivado del
pedido como paquete SDD, fijando a `orders` como agregado principal,
formalizando `crmStage` como estado derivado, `commercialTrace` como puente
comercial visible y `Pedidos > Operacion` como superficie principal del
slice, sin convertirlo en CRM manual ni absorber customers, fulfillment,
dispatch o notifications como ownership principal.

## Alcance

Incluye:

- `orders` como agregado operativo principal
- `crmStage` derivado desde `orderStatus` y `paymentStatus`
- `commercialTrace` como puente comercial de confirmacion
- rutas `manual_direct`, `manual_request`, `openpay_backoffice` y
  `openpay_provider`
- estados `pending`, `confirmed` y `rejected`
- `Pedidos > Operacion`
- `SummaryTile` de `Etapa CRM`
- `SummaryTile` de `Seguimiento`
- `OperationGuideCard`
- `CommercialTraceCard`
- acciones que disparan confirmacion o rechazo comercial del pedido
- cierre positivo hacia `closed`
- cierre negativo que limpia `crmStage` y conserva la traza rechazada
- side effects secundarios de notificacion

No incluye:

- clientes o conflictos de identidad
- CRM manual con notas, tareas o timeline
- fulfillment
- dispatch
- vendor assignment
- dashboards
- notifications como agregado principal

## Actores

- `ventas`
- `operador_pagos`
- `admin`
- `super_admin`
- `orders`
- `notifications`

## Reglas Funcionales Canonicas

### RF-01. Ownership operativo del slice

- `ventas` es el dueno operativo principal del seguimiento del pedido
- `operador_pagos` solo empuja transiciones de cobro y conciliacion
- `admin` y `super_admin` conservan soporte y override
- el ownership funcional del slice permanece en `orders`

### RF-02. `orders` es el agregado principal

- la unidad operativa central del slice es el pedido
- `crmStage` y `commercialTrace` viven dentro del pedido
- el slice no introduce un agregado CRM paralelo

### RF-03. `crmStage` es estado derivado `as-is`

- `crmStage` se calcula desde `orderStatus` y `paymentStatus`
- `crmStage` no se edita manualmente
- `crmStage` usa `ready_for_followup`, `followup` y `closed`

### RF-04. `commercialTrace` es puente comercial canonico

- `commercialTrace` explica la ruta y el hito comercial del pedido
- `commercialTrace` no es una bitacora completa de CRM
- `commercialTrace` usa `pending`, `confirmed` y `rejected`

### RF-05. Rutas comerciales canonicas

- el slice conserva `manual_direct`
- el slice conserva `manual_request`
- el slice conserva `openpay_backoffice`
- el slice conserva `openpay_provider`

### RF-06. Relacion explicita entre etapa y traza

- `commercialTrace` explica la ruta comercial del pedido
- `crmStage` resume el punto operativo/comercial derivado en que queda el
  pedido
- ambas senales se leen juntas en `Pedidos > Operacion`

### RF-07. `Pedidos > Operacion` es la superficie visible del slice

- la vista expone `Etapa CRM`, `Seguimiento`, `OperationGuideCard` y
  `CommercialTraceCard`
- la vista concentra las acciones de confirmacion o rechazo comercial
- la vista no se convierte en CRM manual ni tablero global de operaciones

### RF-08. Cierre positivo y negativo

- `Delivered` y `Completed` derivan `crmStage = closed`
- si el pedido cae, se cancela o el pago falla/rechaza, `crmStage` se limpia
- `commercialTrace` conserva la evidencia del cierre negativo

### RF-09. Notifications como side effect secundario

- ciertas acciones de confirmacion o rechazo pueden disparar email o eventos
- esos side effects no cambian el ownership principal del slice
- el slice no se redefine alrededor de `notifications`

### RF-10. Sin CRM manual, customers ni fulfillment

- el slice no abre notas ni tareas manuales de seguimiento
- el slice no abre customers ni conflictos de identidad
- el slice no absorbe fulfillment, dispatch ni vendor assignment

## Escenarios Principales

### Escenario A. Confirmacion manual directa

1. `operador_pagos` registra un pago manual directo.
2. `orders` confirma comercialmente el pedido.
3. `commercialTrace` queda en `manual_direct / confirmed`.
4. `crmStage` queda listo para seguimiento derivado.
5. `Pedidos > Operacion` refleja la nueva lectura del pedido.

### Escenario B. Solicitud manual bajo revision y aprobacion

1. El pedido entra por ruta de comprobante manual.
2. `commercialTrace` queda en `manual_request / pending`.
3. `operador_pagos` aprueba la solicitud.
4. `orders` confirma el pedido y recalcula etapa y traza.
5. El pedido queda listo para seguimiento con evidencia conservada.

### Escenario C. Solicitud manual rechazada

1. El pedido entra por ruta de comprobante manual.
2. `operador_pagos` rechaza la solicitud.
3. `orders` limpia `crmStage`.
4. `commercialTrace` conserva `manual_request / rejected`.
5. La vista muestra cierre negativo sin etapa activa.

### Escenario D. Conciliacion Openpay

1. El pedido web usa `openpay`.
2. La confirmacion puede venir desde backoffice o desde el provider.
3. `orders` deriva `openpay_backoffice` u `openpay_provider`.
4. `commercialTrace` queda confirmado por la ruta real.
5. El pedido pasa a seguimiento derivado segun su estado.

### Escenario E. Cierre operativo del seguimiento

1. El pedido ya confirmado avanza a `Preparing` o `Shipped`.
2. `orders` deriva `crmStage = followup`.
3. El pedido avanza a `Delivered` o `Completed`.
4. `orders` deriva `crmStage = closed`.
5. `Pedidos > Operacion` muestra el cierre del seguimiento.

## Criterios De Aceptacion

| ID | Criterio |
| --- | --- |
| CA-01 | `orders` queda fijado como agregado principal del slice |
| CA-02 | `ventas` queda fijado como owner operativo principal |
| CA-03 | `operador_pagos` queda acotado a transiciones de cobro y conciliacion |
| CA-04 | `crmStage` queda formalizado como estado derivado no editable |
| CA-05 | `crmStage` queda limitado a `ready_for_followup`, `followup` y `closed` |
| CA-06 | `commercialTrace` queda formalizado como puente comercial y no como timeline CRM |
| CA-07 | las rutas `manual_direct`, `manual_request`, `openpay_backoffice` y `openpay_provider` quedan canonizadas |
| CA-08 | los estados `pending`, `confirmed` y `rejected` quedan canonizados |
| CA-09 | `Pedidos > Operacion` queda fijado como superficie visible principal del slice |
| CA-10 | el cierre negativo limpia `crmStage` y conserva `commercialTrace.rejected` |
| CA-11 | notifications queda solo como side effect secundario |
| CA-12 | el slice no abre customers, CRM manual, fulfillment ni dispatch |

## Casos Negativos Relevantes

- intentar tratar `crmStage` como workflow editable manualmente: incorrecto
- intentar usar `commercialTrace` como timeline comercial completo: incorrecto
- perder la evidencia de rechazo al limpiar `crmStage`: incorrecto
- vender `Pedidos > Operacion` como dashboard global del negocio: incorrecto
- absorber customers o fulfillment dentro del slice: incorrecto
