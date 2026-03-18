# Flujo: Asignación y Uso de Puntos

## Objetivo

Permitir que Huelegood acumule puntos por compra y habilite canjes controlados sin comprometer integridad comercial.

## Actores

- cliente
- API Huelegood
- worker
- admin
- notificaciones

## Precondiciones

- existe una `loyalty_rule` activa
- el cliente tiene `loyalty_account`
- el pedido alcanzó estado evaluable para puntos

## Subflujo A: asignación de puntos

### Pasos

1. Un pedido se confirma y llega al estado elegible para otorgar puntos.
2. La API o el worker resuelven la regla vigente.
3. Se crea `loyalty_movement` positivo.
4. El saldo de `loyalty_account` se actualiza.
5. Se notifica al cliente.

### Estados y conceptos

- movimiento: `pending`, `available`, `reversed`, `expired`
- cuenta: saldo `available`, saldo `pending`, saldo `redeemed`

## Subflujo B: canje de puntos

### Pasos

1. El cliente consulta su saldo disponible.
2. Elige un mecanismo de canje definido por la regla.
3. La API valida elegibilidad y saldo.
4. Se crea `redemption`.
5. Se genera un movimiento negativo o un artefacto comercial asociado.
6. El beneficio se aplica al pedido o queda disponible para uso posterior según política.

## Reglas de negocio

- Los puntos no deben quedar disponibles antes del estado elegible del pedido.
- Toda reversa de pedido elegible debe generar reversa de puntos.
- No se permite sobregiro del saldo.
- El canje debe quedar acotado por reglas de monto mínimo, vigencia y compatibilidad.

## Errores posibles

| Error | Resultado esperado |
| --- | --- |
| pedido no elegible | no se asignan puntos |
| doble procesamiento del mismo pedido | idempotencia por clave de negocio |
| saldo insuficiente | canje rechazado |
| cancelación posterior de pedido | reversa automática o manual |
| regla vencida | no se crean nuevos movimientos bajo esa regla |

## Eventos disparados

- `loyalty.points.pending`
- `loyalty.points.available`
- `loyalty.points.reversed`
- `loyalty.redemption.created`
- `loyalty.redemption.applied`

## Procesos asíncronos involucrados

- asignación diferida tras cumplimiento de estado
- expiración programada de puntos
- notificación de nuevos puntos y canjes

## Observaciones de implementación

- El sistema debe diferenciar claramente puntos pendientes de puntos disponibles.
- En MVP conviene que el cálculo sea simple y transparente para operaciones.
