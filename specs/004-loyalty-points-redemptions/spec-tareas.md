# Spec Tareas - Loyalty Points Redemptions

Fecha: 2026-05-26.

## Objetivo

Convertir la arquitectura canonica del programa de puntos en un backlog tecnico
ejecutable, cerrando earn, settlement, reversal, canje con reserva inmediata,
ajustes manuales y lectura en cuenta sin abrir autoservicio ni un motor loyalty
avanzado.

## Reglas De Ejecucion

- no abrir multiples reglas activas de acumulacion
- no convertir `/cuenta` en autoservicio de canje
- no mezclar canje con descuento inline de checkout
- no modelar catalogo formal de recompensas en este slice
- no mover el hito elegible fuera de `orders`

## Backlog Canonico

### T1. Contratos compartidos de cuenta y ledger

**Resultado esperado**

El repo tiene vocabulario consistente para cuenta, movimientos, canjes y regla
activa del programa.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/models.ts`

**Checklist**

- [ ] exponer saldo `available`, `pending` y `redeemed`
- [ ] mantener estados canonicos del movimiento
- [ ] mantener estados canonicos del canje

### T2. Earn sobre pedidos elegibles

**Resultado esperado**

`orders` y `loyalty` conservan una frontera clara para registrar earn segun el
hito correcto del dominio.

**Rutas candidatas**

- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/loyalty/loyalty.service.ts`

**Checklist**

- [ ] registrar earn sobre pedido elegible
- [ ] permitir `pending` o `available` segun el estado real
- [ ] conservar trazabilidad por `orderNumber`

### T3. Settlement de puntos

**Resultado esperado**

Un movimiento `pending` puede pasar a `available` sin romper la cuenta ni el
ledger.

**Rutas candidatas**

- `apps/api/src/modules/loyalty/loyalty.service.ts`

**Checklist**

- [ ] liberar saldo pendiente al hito correcto
- [ ] actualizar movimiento, cuenta y auditoria
- [ ] evitar doble liberacion

### T4. Reversa automatica

**Resultado esperado**

Cuando el pedido deja de sostener el earn, loyalty revierte el saldo de forma
automatica y consistente.

**Rutas candidatas**

- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/loyalty/loyalty.service.ts`

**Checklist**

- [ ] disparar reversal desde el flujo del pedido invalidado
- [ ] descontar correctamente desde `pending` o `available`
- [ ] evitar doble reversal

### T5. Canje con reserva inmediata

**Resultado esperado**

Un `redemption` `pending` reserva puntos de inmediato y bloquea doble gasto.

**Rutas candidatas**

- `apps/api/src/modules/loyalty/loyalty.service.ts`

**Checklist**

- [ ] validar saldo suficiente
- [ ] reservar puntos al crear `redemption`
- [ ] mover saldo de `available` a retenido/pending
- [ ] registrar movimiento y auditoria del canje

### T6. Resolucion operativa del canje

**Resultado esperado**

`marketing` y admin pueden resolver `applied` o `cancelled` sin ambigüedad
contable.

**Rutas candidatas**

- `apps/api/src/modules/loyalty/loyalty.service.ts`
- `apps/admin/components/loyalty-workspace.tsx`

**Checklist**

- [ ] `applied` consume definitivamente la reserva
- [ ] `cancelled` devuelve la reserva a `available`
- [ ] dejar actor, nota y decision auditables

### T7. Ajustes manuales auditables

**Resultado esperado**

Los ajustes manuales siguen siendo capacidad operativa normal, pero excepcional
y auditada.

**Rutas candidatas**

- `apps/api/src/modules/loyalty/loyalty.service.ts`
- `apps/admin/components/loyalty-workspace.tsx`

**Checklist**

- [ ] registrar motivo y revisor
- [ ] conservar tipos `adjustment` o `bonus` segun corresponda
- [ ] no romper la lectura de la cuenta ni del ledger

### T8. `/cuenta` como lectura del programa

**Resultado esperado**

El cliente ve saldo, movimientos y estado de canjes sin obtener acciones de
autoservicio.

**Rutas candidatas**

- `apps/web/components/account-workspace.tsx`

**Checklist**

- [ ] mostrar saldo `available`, `pending` y `redeemed`
- [ ] mostrar movimiento y estado reciente
- [ ] no mostrar acciones de crear canje

### T9. Regression suite del slice

**Resultado esperado**

El comportamiento critico del ledger y del canje queda defendido por pruebas y
smokes de ownership.

**Rutas candidatas**

- pruebas del flujo `orders` + `loyalty`
- pruebas del modulo loyalty

**Checklist**

- [ ] probar earn `pending`
- [ ] probar settlement
- [ ] probar reversal
- [ ] probar canje con reserva inmediata
- [ ] probar `applied`
- [ ] probar `cancelled`
- [ ] probar saldo insuficiente

## Orden Recomendado

1. `T1`
2. `T2`
3. `T3`
4. `T4`
5. `T5`
6. `T6`
7. `T7`
8. `T8`
9. `T9`

## Definition Of Done Del Slice

- una sola `loyalty_rule` activa gobierna la acumulacion
- earn, settlement y reversal conservan ownership claro
- el canje `pending` reserva puntos de inmediato
- `applied` y `cancelled` resuelven correctamente la reserva
- `/cuenta` permanece como lectura del programa
- el slice no abre autoservicio ni catalogo formal de recompensas
