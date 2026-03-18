# Flujo: Compra con Código de Vendedor y Liquidación de Comisiones

## Objetivo

Formalizar cómo se atribuye una venta a un vendedor y cómo esa atribución evoluciona hasta una comisión pagable y eventualmente liquidada.

## Actores

- cliente
- vendedor
- web pública
- API Huelegood
- seller_manager
- admin
- worker

## Precondiciones

- el vendedor existe y tiene código activo
- el carrito acepta código de vendedor
- existe al menos una regla de comisión aplicable
- el pedido y el pago siguen su flujo normal

## Subflujo A: compra con código de vendedor

### Pasos

1. El cliente ingresa un `vendor_code` en la web o llega mediante un enlace que ya lo contiene.
2. La API valida que el código esté activo y vigente.
3. El carrito guarda la atribución comercial preliminar.
4. Al crear el pedido, el código se persiste en snapshot.
5. Tras pago confirmado, la API crea `commission_attribution`.
6. El motor de comisiones resuelve la regla aplicable.
7. Se crea un registro `commission` en estado inicial.

### Estados involucrados

- código: `active` o `inactive`
- atribución: `pending`, `confirmed`, `reversed`
- comisión: `pending_attribution`, `attributed`

### Reglas de negocio

- Un pedido solo admite un código de vendedor efectivo.
- El código debe persistir en el pedido aunque luego el carrito cambie.
- La atribución puede convivir con promociones solo si la regla comercial lo permite.
- El vendedor no controla el precio final del pedido.

## Subflujo B: maduración y liquidación de comisión

### Pasos

1. La comisión queda `attributed` cuando el pedido es pagado y la regla se resolvió.
2. Si el pedido entra en ventana de riesgo o revisión, la comisión puede quedar `approved` o `blocked` según política.
3. Cuando el pedido alcanza estado elegible final, la comisión pasa a `payable`.
4. El `seller_manager` arma una corrida de liquidación.
5. La API crea `commission_payout` y sus `payout_items`.
6. Las comisiones incluidas pasan a `scheduled_for_payout`.
7. Una vez pagado al vendedor, se marca `commission_payout` como ejecutado y las comisiones pasan a `paid`.
8. Si hay devolución, fraude o anulación posterior, se crea reversa o ajuste según aplique.

### Estados involucrados

- comisión: `attributed`, `approved`, `blocked`, `payable`, `scheduled_for_payout`, `paid`, `reversed`, `cancelled`
- payout: `draft`, `approved`, `paid`, `cancelled`

## Errores posibles

| Error | Resultado esperado |
| --- | --- |
| código inválido o vencido | no se atribuye venta |
| pedido cancelado o refundado | comisión se bloquea o revierte |
| conflicto entre promociones y vendedor | la API aplica política definida y deja trazabilidad |
| regla de comisión ambigua | se rechaza atribución automática y requiere revisión |
| payout duplicado | se previene por estado y llave de negocio |

## Eventos disparados

- `vendor.code.applied`
- `order.attributed_to_vendor`
- `commission.attributed`
- `commission.approved`
- `commission.payable`
- `commission.payout.created`
- `commission.paid`
- `commission.reversed`

## Procesos asíncronos involucrados

- recálculo de comisión tras confirmación de pago
- consolidación de saldos por vendedor
- generación de payout items
- notificaciones a vendedor por nuevos movimientos

## Observaciones de implementación

- La liquidación debe trabajar sobre snapshots y no recalcular montos históricos sin razón explícita.
- Las reversas deben registrar causa, actor y referencia al evento que las originó.
