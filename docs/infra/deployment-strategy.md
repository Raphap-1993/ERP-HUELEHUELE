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

## Flujo de despliegue recomendado

1. Actualizar código desde Git.
2. Instalar dependencias de producción.
3. Ejecutar build de `web`, `admin` y `api`.
4. Ejecutar migraciones Prisma contra la base PostgreSQL ya existente.
5. Reiniciar o recargar procesos PM2.
6. Validar healthchecks y logs.

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

### Recomendaciones

- habilitar `client_max_body_size` acorde al tamaño máximo de comprobantes
- propagar headers `X-Forwarded-*`
- restringir rutas sensibles de admin si se requiere endurecimiento adicional

## Healthchecks

### API

- `GET /health/liveness`
- `GET /health/readiness`
- `GET /health/queues`

### Web y admin

- ruta simple de disponibilidad o verificación por respuesta HTTP `200`

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
