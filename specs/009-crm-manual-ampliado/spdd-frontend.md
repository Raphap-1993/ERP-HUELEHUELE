# SPDD Frontend - CRM Manual Ampliado

Fecha: 2026-05-28.

## Superficies cubiertas

- `Pedidos > Operacion`
- bandeja filtrada de seguimiento manual dentro de `Pedidos`

## Contratos visibles

- un caso manual por pedido
- `assignee`
- `status`
- `nextStep`
- `followUpAt`
- timeline manual
- tareas opcionales

## Reglas visibles

- el caso manual solo se abre sobre pedidos elegibles
- `nextStep` y `followUpAt` son obligatorios mientras el caso este abierto
- el timeline manual registra actividad, pero no envia mensajes
- el slice no se presenta como CRM por cliente ni como mensajeria
- la bandeja secundaria no compite con el detalle operativo del pedido

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md`
- `docs/fase-1-analisis-requerimientos/reglas/crm-manual-ampliado.md`

## Dependencias de Fase 3

- el ownership de `orders`
- la ADR que mantiene el follow-up manual dentro de `orders`
- las reglas de cierre automatico y reapertura por lifecycle del pedido
