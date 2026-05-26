# SPDD Frontend - Wholesale Leads Quotes

Fecha: 2026-05-26.

## Superficies cubiertas

- formulario publico mayorista / distribuidores
- admin de leads y cotizaciones
- `/cuenta` con resumen mayorista basico

## Contratos visibles

- `interestType`
- estado del lead
- estado de cotizacion
- `tier` asignado
- responsable comercial
- entitlement mayorista activo o suspendido

## Reglas visibles

- la captura publica no crea acceso comercial
- `accepted` no crea pedido ni acceso
- `won` si puede habilitar resumen mayorista en `/cuenta`
- `/cuenta` no debe sugerir portal B2B operativo

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.02-wholesale-leads-quotes.md`
- `docs/fase-1-analisis-requerimientos/reglas/mayoristas-y-cotizaciones.md`

## Dependencias de Fase 3

- el ownership entre `ventas`, `wholesale`, `commercial-access` y `auth`
- la ADR del entitlement mayorista del slice
