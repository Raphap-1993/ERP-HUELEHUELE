# SPDD Frontend - Customers Identity Conflicts

Fecha: 2026-05-28.

## Superficies cubiertas

- `/crm`

## Contratos visibles

- metricas de clientes, activos, con pedidos, conflictos y opt-in
- tabla de conflictos con pedido, senales, candidatos y accion `Resolver`
- tabla de clientes con `Ver`, `Editar`, `Fusionar` y `Eliminar`
- dialogo de detalle con perfil, direcciones y pedidos recientes
- formulario de alta/edicion con estado, direccion y password temporal al
  crear
- dialogo de resolucion de conflicto con `assign_existing`, `merge` e
  `ignore`
- dialogo de merge manual con cliente destino y notas
- mensajes inline de `loading`, `error` y `notice`

## Reglas visibles

- no hay `crmStage`, timeline comercial ni seguimiento comercial del pedido
  dentro de `/crm`
- la UI trata los pedidos recientes como lectura contextual
- la UI presenta conflictos y clientes como tablas separadas
- la UI permite merge y resolucion con trazabilidad operativa, no como borrado
  duro
- la accion `Eliminar` existe, pero no redefine el foco del modulo

## Dependencias de Fase 1

- `docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md`
- `docs/fase-1-analisis-requerimientos/reglas/customers-e-identity-conflicts.md`

## Dependencias de Fase 3

- el ownership entre `customers` y `orders`
- la ADR de frontera entre perfil canonico, conflictos y snapshots
