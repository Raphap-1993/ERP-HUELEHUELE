# Checklist De Release

[README principal](../../README.md) | [Indice docs](../README.md) | [Estandar de desarrollo](./development-standard.md)

## Objetivo

Definir el flujo minimo para publicar un corte seguro en `ERP-HUELEHUELE` sin dejar decisiones criticas implicitas.

## Fuente Canonica

Este checklist no reemplaza la estrategia productiva. La fuente de verdad sigue siendo:

- [Despliegue y homologacion](../infra/deployment-strategy.md)

## Pre-Release

Antes de pensar en deploy:

- [ ] el alcance del corte esta claro
- [ ] el diff no mezcla cambios no relacionados
- [ ] la documentacion vigente fue actualizada o se confirmo que no aplica
- [ ] el rollback de codigo es conocido
- [ ] si hubo cambio de schema, se planifico ventana y backup

## Gates Tecnicos

Estos comandos deben pasar en el snapshot que se quiere publicar:

```bash
npm run typecheck
npm run test:erp-sales
npm run build
```

Checklist:

- [ ] `npm run typecheck`
- [ ] `npm run test:erp-sales`
- [ ] `npm run build`

## Git Y Snapshot

- [ ] el corte quedo en Git
- [ ] el commit o tag a desplegar esta identificado
- [ ] si hubo PR, la plantilla de PR esta completa
- [ ] el snapshot local no arrastra cambios ajenos al corte

## Backup Y Base De Datos

- [ ] se corrio backup productivo si el corte lo requiere
- [ ] no se va a restaurar ni reemplazar la BD productiva con datos locales
- [ ] si hay cambio de schema, `HUELEGOOD_RUN_DB_PUSH=1` solo se usara en ventana controlada

## Smoke Tecnico

El smoke tecnico confirma que el runtime quedo vivo y respondiendo.

Automatizado:

```bash
npm run deploy:smoke
```

Endpoints minimos:

- [ ] `web /health`
- [ ] `admin /health`
- [ ] `api /health/liveness`
- [ ] `api /health/readiness`
- [ ] `api /health/operational`

## Smoke Funcional

El smoke funcional confirma que la operacion real del negocio no se rompio.

Elegir segun el corte:

- [ ] pedido manual individual
- [ ] carga masiva de pedidos
- [ ] checkout publico
- [ ] pago manual y bandeja de conciliacion
- [ ] reporte comercial o export CSV
- [ ] flujo de inventario o almacenes si el corte lo toca
- [ ] login y acceso por rol en admin si el corte toca auth/RBAC

## Cierre Del Corte

- [ ] release desplegada y `current` validado
- [ ] procesos PM2 corriendo contra la release correcta
- [ ] evidencia del smoke tecnico guardada
- [ ] evidencia del smoke funcional guardada
- [ ] corte documentado en Obsidian

## Regla Operativa

Un corte no esta realmente cerrado si solo paso el smoke tecnico. Para negocio, el cierre minimo requiere al menos un smoke funcional sobre la superficie afectada.
