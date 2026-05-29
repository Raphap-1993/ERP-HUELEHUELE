# SPDD Frontend - CRM Transversal Por Cliente

Fecha: 2026-05-28.

## Superficies cubiertas

- `/crm`
- detalle del cliente
- bandeja filtrada de clientes con seguimiento activo dentro de `/crm`

## Contratos visibles

- un `customer_relationship_case` por cliente canonico
- `commercialOwner`
- `assignee`
- `status`
- `classification`
- `origin`
- `nextStep`
- `followUpAt`
- timeline transversal
- tareas opcionales
- referencias read-only a pedidos y a `009`

## Reglas visibles

- el caso transversal solo existe cuando hay trabajo comercial activo
- `nextStep` y `followUpAt` son obligatorios mientras el caso este activo
- el timeline transversal registra actividad manual y referencias, pero no
  envia mensajes
- la clasificacion comercial vive en este slice y no en `007`
- el slice no se presenta como campaigns, scoring ni pipeline amplio

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md`
- `docs/fase-1-analisis-requerimientos/reglas/crm-transversal-por-cliente.md`

## Dependencias de Fase 3

- el ownership de `customers`
- la ADR que mantiene el caso transversal sobre cliente canonico
- las reglas de merge desde `007`
- las referencias read-only a `orders` y `009`
