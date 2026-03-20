# Entornos y Variables de Entorno

## Entornos previstos

| Entorno | Objetivo | Notas |
| --- | --- | --- |
| `local` | desarrollo y pruebas funcionales | puede usar servicios locales o túneles según necesidad |
| `staging` o `preprod` | validación previa a producción | recomendado aunque se monte en el mismo VPS con aislamiento lógico |
| `production` | operación real | usa dominios públicos y datos reales |

## Recomendación para el VPS actual

Si solo existe un VPS:

- mantener `production` como principal
- habilitar `staging` solo cuando el proyecto ya tenga una primera línea estable
- aislar `staging` con puertos, procesos y base de datos propios dentro de la misma instancia PostgreSQL

## Variables comunes

| Variable | Uso |
| --- | --- |
| `NODE_ENV` | modo de ejecución |
| `APP_NAME` | nombre lógico del servicio |
| `APP_RELEASE_SHA` | versión o commit desplegado |
| `APP_BASE_DIR` | directorio base del release en el VPS |
| `NEXT_PUBLIC_APP_URL` | URL pública del storefront |
| `NEXT_PUBLIC_ADMIN_URL` | URL pública del admin |
| `NEXT_PUBLIC_API_URL` | URL pública de la API |
| `LOG_LEVEL` | nivel de logging |

## Base de datos y cache

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | conexión Prisma/PostgreSQL |
| `REDIS_URL` | conexión Redis |

## Auth y seguridad

| Variable | Uso |
| --- | --- |
| `JWT_SECRET` | firma de tokens de acceso |
| `SESSION_SECRET` | secreto de sesión o cookies firmadas |
| `COOKIE_DOMAIN` | dominio compartido de cookies si aplica |
| `HEALTHCHECK_TOKEN` | protección opcional de endpoints internos |

## Openpay

| Variable | Uso |
| --- | --- |
| `OPENPAY_MERCHANT_ID` | merchant id |
| `OPENPAY_PRIVATE_KEY` | integración backend |
| `OPENPAY_PUBLIC_KEY` | integración frontend si aplica |
| `OPENPAY_WEBHOOK_SECRET` | validación del webhook |
| `OPENPAY_SANDBOX` | sandbox o producción |

## Storage y uploads

| Variable | Uso |
| --- | --- |
| `R2_ACCOUNT_ID` | cuenta de Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | access key para API S3-compatible |
| `R2_SECRET_ACCESS_KEY` | secret key para API S3-compatible |
| `R2_BUCKET_PUBLIC` | bucket público para media del storefront |
| `R2_BUCKET_PRIVATE` | bucket privado opcional para archivos no públicos |
| `R2_ENDPOINT` | endpoint S3-compatible de R2 |
| `R2_REGION` | región lógica, normalmente `auto` |
| `R2_PUBLIC_BASE_URL` | URL pública o custom domain para servir assets públicos |
| `UPLOADS_PUBLIC_DIR` | activos públicos legacy o fallback local |
| `UPLOADS_PRIVATE_DIR` | evidencias y archivos sensibles |
| `UPLOADS_BASE_URL` | URL pública fallback si todavía existen assets servidos por Nginx |

## Correo y notificaciones

| Variable | Uso |
| --- | --- |
| `MAIL_FROM` | remitente por defecto |
| `SMTP_HOST` | servidor SMTP |
| `SMTP_PORT` | puerto SMTP |
| `SMTP_USER` | usuario SMTP |
| `SMTP_PASS` | contraseña SMTP |

## Runtime por servicio

| Variable | Uso |
| --- | --- |
| `WEB_PORT` | puerto local del storefront |
| `ADMIN_PORT` | puerto local del admin |
| `API_PORT` | puerto local de la API |
| `WORKER_CONCURRENCY` | concurrencia de jobs |

No definir `PORT` como variable global en `.env.production`. En este monolito modular cada proceso recibe su puerto por `PM2` usando `WEB_PORT`, `ADMIN_PORT` y `API_PORT`.

Compatibilidad de despliegue:

- `scripts/release-production.sh` acepta `APP_URL`, `ADMIN_URL` y `API_URL` como aliases y los normaliza a `NEXT_PUBLIC_*` antes de construir.
- `scripts/release-production.sh` también acepta `ADMIN_LOGIN_*`, `SELLER_LOGIN_*`, `PAYMENTS_LOGIN_*` y `CUSTOMER_LOGIN_*` como aliases legados y los normaliza a `BOOTSTRAP_*`.
- El código de `auth` consume `BOOTSTRAP_*` como convención preferida.
- `AUTH_BOOTSTRAP_DEFAULT_USERS` no está consumida por `apps/api/src/modules/auth/auth.service.ts`; hoy es una variable muerta y conviene eliminarla o reemplazarla por `BOOTSTRAP_*`.

Ubicación efectiva en producción actual:

- en el VPS activo, la fuente operativa de entorno vive en `/home/huelehuele/apps/huelegood.com/shared/.env.production`
- `scripts/release-production.sh` intenta primero `.env.production` dentro del repo y luego `../shared/.env.production`
- `PM2` debe recargarse con `--update-env` para que las variables nuevas entren realmente al proceso

## Operación y backups

| Variable | Uso |
| --- | --- |
| `BACKUP_DIR` | directorio base de respaldos |
| `BACKUP_RETENTION_DAYS` | retención de carpetas de backup |
| `WEB_HEALTH_URL` | endpoint de smoke check para storefront |
| `ADMIN_HEALTH_URL` | endpoint de smoke check para admin |
| `API_HEALTH_URL` | endpoint de smoke check para liveness |
| `API_READINESS_URL` | endpoint de smoke check para readiness |
| `API_OPERATIONAL_URL` | endpoint de smoke check para salud operativa |
| `WEB_MAINTENANCE_MODE` | activa una pantalla pública de mantenimiento en `web` sin tocar `admin` ni `api` |
| `WEB_MAINTENANCE_BYPASS_TOKEN` | token opcional para permitir revisión privada del storefront durante mantenimiento |

## Reglas de manejo de secretos

- nunca versionar `.env` reales
- mantener archivos de ejemplo por entorno cuando se implemente código
- usar `.env.production` en el VPS a partir de `.env.production.example`
- rotar secretos de Openpay y auth ante incidente o cambio operativo

## Separación por entorno

### local

- credenciales sandbox
- uploads locales
- base local o copia de desarrollo

### staging

- dominios o subdominios separados
- base y Redis separados lógicamente
- Openpay sandbox

### production

- Openpay productivo
- base `huelegood` productiva
- logs, backups y uploads con retención formal
- `Cloudflare R2` para media pública del storefront
- puertos operativos actuales: `3000` para `web`, `3005` para `admin`, `4000` para `api`

## Variables mínimas por aplicación

### web

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `OPENPAY_PUBLIC_KEY` si el frontend participa en tokenización
- `WEB_MAINTENANCE_MODE`
- `WEB_MAINTENANCE_BYPASS_TOKEN` si se necesita preview privada

### admin

- `NEXT_PUBLIC_ADMIN_URL`
- `NEXT_PUBLIC_API_URL`

### api

- todas las variables de negocio e integración

### worker

- `DATABASE_URL`
- `REDIS_URL`
- credenciales de notificación y pagos requeridas para jobs

## Observación

La elección exacta de proveedor de correo puede variar. Para media pública del storefront, la decisión vigente queda fijada en `Cloudflare R2`. Los uploads privados pueden seguir resolviéndose localmente mientras no exista una decisión distinta.
