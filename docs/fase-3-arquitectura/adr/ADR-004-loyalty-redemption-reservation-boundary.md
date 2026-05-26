# ADR-004 Loyalty Redemption Reservation Boundary

Fecha: 2026-05-26.

## Estado

Aprobado para la capa canonica brownfield.

## Contexto

El runtime loyalty vigente ya distingue movimientos, saldos y canjes, pero
necesita una regla canonica clara para evitar doble gasto y separar el order
flow del redemption flow.

## Decision

- al crear un canje `pending`, los puntos se reservan de inmediato
- `applied` consume definitivamente la reserva
- `cancelled` libera la reserva y devuelve el saldo a `available`
- el cliente no inicia el canje desde `/cuenta`
- `marketing` es el dueno operativo principal del canje
- `orders` conserva earn, settlement y reversal, pero no resuelve canjes

## Consecuencias

### Positivas

- evita sobregiro del saldo
- separa con claridad transaccion y beneficio
- preserva el modelo operativo real del brownfield

### Negativas

- el cliente no tiene autoservicio de canje
- `reward` sigue siendo libre/manual y no catalogado

## Fuera de alcance

- catalogo formal de recompensas
- canje inline en checkout
- multiples reglas activas de acumulacion
