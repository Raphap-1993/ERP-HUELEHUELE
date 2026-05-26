# ADR-002: Vendor Attribution Financial Lock

Fecha: 2026-05-26.

## Estado

Aprobado para la fase 3 canonica brownfield del slice
`002-vendors-commissions`.

## Contexto

El repo ya permite corregir el `vendorCode` efectivo de un pedido desde
`orders`, pero `commissions` deriva comisiones y payouts a partir del pedido
y puede arrastrar estado, `payoutId` y snapshots historicos. Sin una frontera
explicita, una correccion tardia puede reescribir historia comercial y
financiera de manera insegura.

## Decision

La correccion de atribucion de vendedor se permite solo antes del lock
financiero del slice.

### El lock financiero se considera cruzado cuando

- la comision esta en `payable`;
- la comision esta en `scheduled_for_payout`;
- la comision esta en `paid`;
- existe `payoutId` no cancelado para la comision vigente;
- existe job de payout pendiente o en ejecucion para el vendor/periodo afectado;
- el pedido ya entro en reversa o cancelacion con impacto financiero cerrado.

## Guardrails Derivados

1. `orders` sigue siendo la unica puerta de correccion post-pedido.
2. `commissions` recompone la consecuencia financiera, pero no corrige la atribucion primaria.
3. No se permite `A -> none` si ya hubo comision materializada.
4. No se permite correccion hacia vendedor inexistente, inactivo o sin regla aplicable.
5. Despues del lock ya no hay edicion normal de pedido dentro de este slice.
6. Este slice no define un escape hatch canonico post-lock; cualquier ajuste financiero posterior requiere otro slice o ADR.

## Alternativas Rechazadas

### 1. Permitir correccion libre en cualquier momento

Rechazada porque:

- mezcla regularizacion comercial con payout;
- puede mover historia financiera entre vendedores;
- degrada reportes, panel vendedor y auditoria.

### 2. Congelar el `vendorCode` desde la creacion del pedido

Rechazada porque:

- contradice el brownfield actual;
- bloquea regularizaciones operativas reales del seller channel.

### 3. Resolver la correccion desde `commissions`

Rechazada porque:

- desplaza el ownership fuera de `orders`;
- mezcla atribucion primaria con consecuencia financiera.

## Consecuencias

### Positivas

- separa claramente regularizacion comercial de cualquier futuro ajuste financiero;
- protege payouts y reportes de mutaciones tardias inseguras;
- deja una regla facil de propagar a Fase 1, specs y QA.

### Negativas aceptadas

- algunas excepciones reales del negocio ya no se resolveran con una sola
  edicion de pedido;
- si el negocio quiere corregir historia despues del payout, tendra que abrir
  un slice o ADR especifico para ese flujo.

## Regla De Reevaluacion

Esta ADR solo debe reabrirse si:

- el negocio aprueba un flujo explicito de ajuste financiero post-payout;
- el runtime deja de derivar comisiones y payouts desde pedidos;
- el seller channel cambia de modelo comercial y deja de ser seller-first.
