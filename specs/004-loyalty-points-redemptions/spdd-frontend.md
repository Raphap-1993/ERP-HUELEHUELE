# SPDD Frontend - Loyalty Points Redemptions

Fecha: 2026-05-26.

## Superficies cubiertas

- `/cuenta`
- `/admin/loyalty`

## Contratos visibles

- saldo `available`
- saldo `pending`
- saldo `redeemed`
- movimiento reciente
- canjes y su estado
- regla activa visible para operacion cuando aplique

## Reglas visibles

- el cliente no inicia canjes
- el canje `pending` ya implica reserva
- `applied` y `cancelled` cambian el saldo retenido
- `/cuenta` no debe sugerir recompensas catalogadas ni descuento directo en
  checkout

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.03-loyalty-points-redemptions.md`
- `docs/fase-1-analisis-requerimientos/reglas/loyalty-y-canjes.md`

## Dependencias de Fase 3

- el ownership entre `loyalty`, `orders`, `marketing`, `auth` y `customers`
- la ADR de reserva y resolucion del canje del slice
