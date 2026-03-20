# Estrategia de Despliegue

## Objetivo

Definir cómo publicar Huelegood en el VPS actual usando Hestia, Nginx, PM2, PostgreSQL existente y Redis.

## Estrategia base

Huelegood se despliega como cuatro procesos de aplicación supervisados por PM2 detrás de Nginx:

- `huelegood-web`
- `huelegood-admin`
- `huelegood-api`
- `huelegood-worker`

## Topología de producción

| Dominio | Destino | Puerto local sugerido |
| --- | --- | --- |
| `huelegood.com` | Next.js web | `3000` |
| `admin.huelegood.com` | Next.js admin | `3001` |
| `api.huelegood.com` | NestJS API | `4000` |
| sin dominio público | worker BullMQ | `4100` lógico o sin puerto expuesto |

Notas:

- El worker no requiere exposición pública.
- Los puertos son sugeridos y pueden ajustarse si el VPS ya tiene ocupación previa.
- Hestia gestiona los virtual hosts y Nginx hace reverse proxy a cada proceso PM2.

## Artefactos operativos versionados

- `ecosystem.config.cjs`: definición operativa de `PM2`
- `.env.production.example`: plantilla de variables para el VPS
- `scripts/release-production.sh`: release reproducible con build, recarga PM2 y smoke checks
- `scripts/backup-production.sh`: backup de PostgreSQL y uploads
- `scripts/smoke-check.mjs`: verificación post-deploy
- `ops/nginx/*.conf`: snippets de reverse proxy para Hestia/Nginx

## Flujo de despliegue recomendado

1. Actualizar código desde Git y preparar `.env.production`.
2. Ejecutar `npm run deploy:release`.
3. Si la release incluye cambios de esquema, activar `HUELEGOOD_RUN_DB_PUSH=1` antes de lanzar el script.
4. Validar `pm2 status`, logs y smoke checks.
5. Ejecutar `npm run deploy:backup` o dejarlo programado por `cron`.

## Base de datos

- Se reutiliza la instancia PostgreSQL existente del VPS.
- Recomendación: crear una base dedicada `huelegood` dentro de esa misma instancia para aislar tablas del proyecto.
- No se introduce una base de datos externa gestionada.

## Redis y colas

- Redis corre en el mismo VPS o en la instancia Redis ya disponible.
- BullMQ usa Redis para jobs y reintentos.
- Redis no se considera fuente de verdad.

## Reverse proxy con Hestia/Nginx

### Responsabilidades de Nginx

- terminación TLS
- proxy pass por subdominio
- compresión y headers seguros
- logs de acceso y error
- limitación básica de tamaño de upload para evidencias
- exposición de `/health` en `web` y `admin`

### Recomendaciones

- habilitar `client_max_body_size` acorde al tamaño máximo de comprobantes
- propagar headers `X-Forwarded-*`
- restringir rutas sensibles de admin si se requiere endurecimiento adicional
- usar los snippets de `ops/nginx/` como base de la configuración gestionada por Hestia

## Healthchecks

### API

- `GET /health/liveness`
- `GET /health/readiness`
- `GET /health/operational`

### Web y admin

- `GET /health` con payload JSON simple y `release`

## Modo mantenimiento para storefront

- La web pública soporta un modo mantenimiento controlado por `WEB_MAINTENANCE_MODE=true`.
- Cuando está activo, cualquier ruta pública del storefront se reescribe a una pantalla estática propia.
- No afecta:
  - `GET /health`
  - assets de `/_next/`
  - assets públicos como `/brand/*`
  - `admin`
  - `api`
- Si se define `WEB_MAINTENANCE_BYPASS_TOKEN`, un reviewer puede entrar al storefront real con `?maintenance_bypass=<token>`.
- El bypass se guarda en cookie segura para revisar varias páginas sin desactivar el mantenimiento global.

## Logs

- PM2: logs por proceso
- Nginx: access/error logs por dominio
- aplicación: logs estructurados por servicio y nivel

## Backups

### Obligatorios

- dump nocturno de PostgreSQL
- copia de uploads públicos y privados
- resguardo de archivos de configuración de despliegue

### Recomendados

- retención de al menos 7 a 14 días
- verificación periódica de restauración
- automatizar con `scripts/backup-production.sh` y `cron`

## Estrategia de releases

- despliegues pequeños y frecuentes
- migraciones compatibles hacia adelante
- rollback por versión previa de aplicación y restauración controlada de datos si fuera necesario

## Riesgos operativos del despliegue

- single point of failure del VPS
- saturación de CPU/RAM si web, admin, api y worker compiten sin límites
- crecimiento de logs y uploads sin política de limpieza

## Mitigaciones

- definir límites de concurrencia de PM2 y worker
- rotación de logs
- monitoreo básico de disco, memoria y colas
- revisar tamaño de backups y uploads desde el inicio
- smoke checks post-deploy sobre `web`, `admin` y `api`
