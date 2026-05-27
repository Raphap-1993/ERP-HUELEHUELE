# Fase 3 - Arquitectura

[README principal](../../README.md) | [Indice docs](../README.md)

## Objetivo
Fijar la arquitectura brownfield de los slices homologados y sus fronteras criticas sin romper el monorepo actual.

## Documentos
- [03.00-arquitectura.md](03.00-arquitectura.md)
- [03.01-decisiones-tecnologia.md](03.01-decisiones-tecnologia.md)
- [03.03-plan-despliegue.md](03.03-plan-despliegue.md)
- [adr/ADR-001-payment-provider-gateway-boundary.md](adr/ADR-001-payment-provider-gateway-boundary.md)

## Slice 002 - Vendors Commissions
- [03.04-vendors-commissions.md](03.04-vendors-commissions.md)
- [adr/ADR-002-vendor-attribution-financial-lock.md](adr/ADR-002-vendor-attribution-financial-lock.md)

## Slice 003 - Wholesale Leads Quotes
- [03.05-wholesale-leads-quotes.md](03.05-wholesale-leads-quotes.md)
- [adr/ADR-003-wholesale-entitlement-boundary.md](adr/ADR-003-wholesale-entitlement-boundary.md)

## Slice 004 - Loyalty Points Redemptions
- [03.06-loyalty-points-redemptions.md](03.06-loyalty-points-redemptions.md)
- [adr/ADR-004-loyalty-redemption-reservation-boundary.md](adr/ADR-004-loyalty-redemption-reservation-boundary.md)

## Slice 005 - CMS Content Blocks Marketing Surfaces
- [03.07-cms-content-blocks-marketing-surfaces.md](03.07-cms-content-blocks-marketing-surfaces.md)
- [adr/ADR-005-cms-known-routes-fallback-boundary.md](adr/ADR-005-cms-known-routes-fallback-boundary.md)

## Criterio de cierre
- El ownership y las fronteras criticas de cada slice abierto quedan explícitos.
- El deploy vigente y la arquitectura base del monorepo quedan conectados a la capa canónica.
