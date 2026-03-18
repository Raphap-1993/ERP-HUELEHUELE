# Estados de Comisión

## Objetivo

Definir el ciclo de vida de una comisión desde su atribución hasta su pago o reversa.

## Estados propuestos

| Estado | Significado | Siguientes estados válidos |
| --- | --- | --- |
| `pending_attribution` | el pedido tiene potencial de comisión pero aún no se resolvió la regla | `attributed`, `cancelled` |
| `attributed` | la venta quedó vinculada a vendedor y regla | `approved`, `blocked`, `cancelled` |
| `approved` | la comisión pasó validaciones iniciales | `payable`, `blocked`, `reversed` |
| `blocked` | quedó retenida por revisión, fraude, devolución o inconsistencia | `approved`, `reversed`, `cancelled` |
| `payable` | está habilitada para entrar a una liquidación | `scheduled_for_payout`, `reversed` |
| `scheduled_for_payout` | fue incluida en una corrida de pago | `paid`, `reversed` |
| `paid` | ya fue liquidada al vendedor | `reversed` excepcional |
| `reversed` | monto revertido por devolución, error o fraude | terminal |
| `cancelled` | nunca generará pago | terminal |

## Transiciones recomendadas

- `pending_attribution` -> `attributed` cuando el pedido se paga y existe código/rule match.
- `attributed` -> `approved` cuando pasa la validación automática o manual.
- `approved` -> `payable` cuando el pedido alcanza estado elegible final.
- `payable` -> `scheduled_for_payout` al crear el payout.
- `scheduled_for_payout` -> `paid` al ejecutar transferencia o pago real.

## Reglas de negocio

- No pagar comisiones antes de que el pedido esté fuera de la zona de riesgo definida.
- Las reversas deben mantener referencia al pedido, payout y causa.
- Un `payout_item` no debe incluir una comisión en estado no elegible.
- La UI de vendedor debe mostrar claramente saldo pendiente, pagable y pagado.

## Causas típicas de bloqueo o reversa

- pedido cancelado
- refund confirmado
- fraude o chargeback
- atribución inválida
- error operativo de regla o duplicidad

## Consideraciones operativas

- `blocked` es preferible a borrar la comisión, porque preserva trazabilidad.
- Si el negocio requiere ajuste parcial, puede modelarse como reversa parcial en iteraciones posteriores sin romper esta máquina base.
