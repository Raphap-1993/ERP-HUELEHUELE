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

## Configuración conceptual

```js
module.exports = {
  apps: [
    {
      name: "huelegood-web",
      script: "npm",
      args: "run start:web",
      env: {
        NODE_ENV: "production",
        WEB_PORT: 3000
      }
    },
    {
      name: "huelegood-admin",
      script: "npm",
      args: "run start:admin",
      env: {
        NODE_ENV: "production",
        ADMIN_PORT: 3001
      }
    },
    {
      name: "huelegood-api",
      script: "npm",
      args: "run start:api",
      env: {
        NODE_ENV: "production",
        API_PORT: 4000
      }
    },
    {
      name: "huelegood-worker",
      script: "npm",
      args: "run start:worker",
      env: {
        NODE_ENV: "production",
        WORKER_CONCURRENCY: 5
      }
    }
  ]
};
```

Nota:

Los scripts exactos se ajustarán a la estructura real del repositorio, pero los nombres de proceso deben mantenerse estables para operación y monitoreo.

## Lineamientos operativos

- usar `pm2 save` después de cambios estables
- separar logs por proceso
- configurar reinicio automático
- no ejecutar el worker en modo cluster si la idempotencia de jobs no está garantizada

## Observabilidad mínima

- revisar `pm2 status`
- revisar `pm2 logs huelegood-api`
- monitorear reinicios frecuentes o memory restarts

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
