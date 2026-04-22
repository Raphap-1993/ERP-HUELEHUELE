# Diseno Tecnico Vigente

Fecha de corte: 2026-04-22.

Este documento queda como puente ejecutivo. El detalle tecnico canonico vive en:

- [Arquitectura general](./architecture/overview.md)
- [Diagramas del sistema](./architecture/system-diagrams.md)
- [Mapa de modulos](./architecture/modules.md)
- [Modelo de dominio](./data/domain-model.md)
- [API v1](./api/api-v1-outline.md)
- [Despliegue y homologacion](./infra/deployment-strategy.md)

## Decision Principal

El ERP Huele Huele se mantiene como monolito modular con cuatro procesos:

- `web`
- `admin`
- `api`
- `worker`

La API concentra reglas transaccionales. PostgreSQL productivo conserva datos. Redis se usa para colas. Git debe reflejar el snapshot local homologado, pero no debe versionar BD, backups, outputs ni secretos.

## Frentes Cerrados En El Corte Actual

- inventario por `variante + almacen`;
- transferencias multi-almacen con reserva, despacho, recepcion, incidencia y reconciliacion;
- documentos logisticos por transferencia: package snapshot, GRE y sticker;
- reportes con scope server-side consistente;
- checkout con stock disponible y robustez en DNI/evidencia;
- despliegue productivo por releases y PM2;
- documentacion canonica rehecha para reducir ruido historico.

## Pendientes Tecnicos Declarados

- completar migracion gradual de snapshots heredados a tablas normalizadas;
- webhook Openpay productivo con firma e idempotencia final;
- E2E browser automatizado para admin;
- print-ready dedicado para GRE/sticker si Operacion lo prioriza;
- merge/PR final para que `origin/main` refleje sin ambiguedad el snapshot ya homologado.
