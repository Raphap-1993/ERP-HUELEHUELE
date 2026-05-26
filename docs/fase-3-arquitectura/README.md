# Fase 3 - Arquitectura

[README principal](../../README.md) | [Indice docs](../README.md)

## Objetivo
Fijar la arquitectura brownfield del slice inicial y la frontera del `payment-gateway` sin romper el monorepo actual.

## Documentos
- [03.00-arquitectura.md](03.00-arquitectura.md)
- [03.01-decisiones-tecnologia.md](03.01-decisiones-tecnologia.md)
- [03.03-plan-despliegue.md](03.03-plan-despliegue.md)
- [adr/ADR-001-payment-provider-gateway-boundary.md](adr/ADR-001-payment-provider-gateway-boundary.md)

## Slice 002 - Vendors Commissions
- [03.04-vendors-commissions.md](03.04-vendors-commissions.md)
- [adr/ADR-002-vendor-attribution-financial-lock.md](adr/ADR-002-vendor-attribution-financial-lock.md)

## Criterio de cierre
- El ownership entre `orders`, `payments` y `payment-gateway` queda explícito.
- El deploy vigente queda conectado a la capa canónica.
