# Servicios PM2

## Objetivo

Definir los procesos PM2 mínimos necesarios para ejecutar Huelegood en producción.

## Servicios requeridos

| Servicio PM2 | Responsabilidad | Público |
| --- | --- | --- |
| `huelegood-web` | storefront Next.js | Sí |
| `huelegood-admin` | backoffice Next.js | Sí |
| `huelegood-api` | API NestJS | Sí |
| `huelegood-worker` | jobs BullMQ y procesos asíncronos | No |

## Responsabilidades por proceso

### `huelegood-web`

- render de la experiencia pública
- catálogo, contenido, carrito y checkout

### `huelegood-admin`

- panel administrativo
- operación de pagos, pedidos, catálogo, CMS y campañas

### `huelegood-api`

- lógica transaccional
- auth
- endpoints admin/store/vendor/webhooks

### `huelegood-worker`

- procesamiento de colas
- reintentos
- campañas
- notificaciones
- reconciliaciones

## Configuración operativa

```js
module.exports = {
  apps: [
    {
      name: "huelegood-web",
      script: "npm",
      args: "run start",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "huelegood-admin",
      script: "npm",
      args: "run start",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3005
      }
    },
    {
      name: "huelegood-api",
      script: "npm",
      args: "run start",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "768M",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    },
    {
      name: "huelegood-worker",
      script: "npm",
      args: "run start",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        WORKER_CONCURRENCY: 5
      }
    }
  ]
};
```

El archivo versionado real es `ecosystem.config.cjs`. Los nombres de proceso deben mantenerse estables para operación, monitoreo y smoke checks.
En producción, `cwd` y rutas de log deben resolverse contra `APP_BASE_DIR` y `APP_LOG_DIR` para que `PM2` quede ligado al release activo y no a un checkout mutable.

## Lineamientos operativos

- usar `pm2 save` después de cambios estables
- separar logs por proceso
- configurar reinicio automático
- no ejecutar el worker en modo cluster si la idempotencia de jobs no está garantizada
- usar `startOrReload` con `--update-env` para no perder secretos ni variables del release

## Observabilidad mínima

- revisar `pm2 status`
- revisar `pm2 logs huelegood-api`
- monitorear reinicios frecuentes o memory restarts
- correr `npm run deploy:smoke` después de cada release

## Política de reinicios

- reinicio controlado tras despliegue
- restart automático por fallo
- evitar `watch` en producción

## Riesgos y controles

| Riesgo | Control |
| --- | --- |
| web/admin caídos por build defectuoso | validación post-deploy y healthchecks |
| api reiniciando por memoria | límites de proceso y profiling de endpoints críticos |
| worker duplicando jobs | idempotencia y control de concurrencia |
| logs creciendo sin límite | rotación y limpieza programada |
