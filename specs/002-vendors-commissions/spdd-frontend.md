# SPDD Frontend - Vendors Commissions

Fecha: 2026-05-26.

## Superficies cubiertas

- `/trabaja-con-nosotros`
- `/panel-vendedor`
- `/admin/vendedores`
- `/admin/comisiones`
- `Pedidos > Operacion`

## Contratos visibles

- estado del vendedor
- `vendorCode`
- comision y payout
- lock financiero como frontera operativa
- acceso comercial ligado a `/cuenta`

## Reglas visibles

- la postulacion publica no crea acceso comercial por si sola
- el panel vendedor consume datos ya derivados
- la reasignacion de vendedor en pedidos es una accion excepcional
- la UI no debe sugerir que una comision ya en payout puede moverse como una edicion comun

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.01-vendors-commissions.md`
- `docs/fase-1-analisis-requerimientos/reglas/vendedores-y-comisiones.md`

## Dependencias de Fase 3

- el ownership entre `orders`, `vendors`, `commissions`, `payments` y `worker`
- el ADR del lock financiero del slice
