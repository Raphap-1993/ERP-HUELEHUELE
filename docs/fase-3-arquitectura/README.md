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

## Slice 006 - Campaigns Marketing Automation
- [03.08-campaigns-marketing-automation.md](03.08-campaigns-marketing-automation.md)
- [adr/ADR-006-campaigns-dispatch-boundary.md](adr/ADR-006-campaigns-dispatch-boundary.md)

## Slice 007 - Customers Identity Conflicts
- [03.09-customers-identity-conflicts.md](03.09-customers-identity-conflicts.md)
- [adr/ADR-007-customers-orders-identity-boundary.md](adr/ADR-007-customers-orders-identity-boundary.md)

## Slice 008 - CRM Stage Order Follow-Up
- [03.10-crm-stage-order-follow-up.md](03.10-crm-stage-order-follow-up.md)
- [adr/ADR-008-orders-crm-follow-up-boundary.md](adr/ADR-008-orders-crm-follow-up-boundary.md)

## Slice 009 - CRM Manual Ampliado
- [03.11-crm-manual-ampliado.md](03.11-crm-manual-ampliado.md)
- [adr/ADR-009-orders-manual-follow-up-boundary.md](adr/ADR-009-orders-manual-follow-up-boundary.md)

## Slice 010 - CRM Transversal Por Cliente
- [03.12-crm-transversal-por-cliente.md](03.12-crm-transversal-por-cliente.md)
- [adr/ADR-010-customers-crm-transversal-boundary.md](adr/ADR-010-customers-crm-transversal-boundary.md)

## Criterio de cierre
- El ownership y las fronteras criticas de cada slice abierto quedan explícitos.
- El deploy vigente y la arquitectura base del monorepo quedan conectados a la capa canónica.
