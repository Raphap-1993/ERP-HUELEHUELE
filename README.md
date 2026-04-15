# Huelegood

Monorepo de implementación para la plataforma comercial modular de Huelegood.

Este `README.md` es un mapa del repositorio: sirve para ubicar rápido código, documentación, flujos y scripts. La fuente de verdad funcional y arquitectónica sigue estando en [`docs/`](./docs/README.md).

## Qué es este proyecto

Huelegood se documenta y se implementa como una plataforma propia para operar:

- storefront público en `Next.js`
- backoffice administrativo en `Next.js`
- API transaccional en `NestJS`
- worker asíncrono con `BullMQ`
- pagos online y manuales
- seller channel con códigos y comisiones
- mayoristas, campañas, loyalty, CMS, auditoría y observabilidad

La arquitectura objetivo es un monolito modular con cuatro procesos principales:

- `huelegood-web`
- `huelegood-admin`
- `huelegood-api`
- `huelegood-worker`

Referencias base:

- documentación principal: [`docs/README.md`](./docs/README.md)
- arquitectura general: [`docs/architecture/overview.md`](./docs/architecture/overview.md)
- despliegue: [`docs/infra/deployment-strategy.md`](./docs/infra/deployment-strategy.md)

## Si Necesitas Encontrar Algo Rápido

| Si buscas... | Revisa documentación | Revisa código |
| --- | --- | --- |
| visión y alcance del producto | [`docs/product/product-vision.md`](./docs/product/product-vision.md), [`docs/product/scope.md`](./docs/product/scope.md) | [`apps/web`](./apps/web), [`apps/admin`](./apps/admin), [`apps/api`](./apps/api) |
| arquitectura del sistema | [`docs/architecture/overview.md`](./docs/architecture/overview.md), [`docs/architecture/modules.md`](./docs/architecture/modules.md) | [`apps/api/src/app.module.ts`](./apps/api/src/app.module.ts), [`apps/api/src/modules`](./apps/api/src/modules) |
| storefront público actual | [`docs/storefront-v2-premium-landing.md`](./docs/storefront-v2-premium-landing.md) | [`apps/web/app`](./apps/web/app), [`apps/web/features/storefront-v2-premium`](./apps/web/features/storefront-v2-premium) |
| checkout y pagos | [`docs/flows/checkout-openpay.md`](./docs/flows/checkout-openpay.md), [`docs/flows/manual-payments.md`](./docs/flows/manual-payments.md) | [`apps/web/app/checkout`](./apps/web/app/checkout), [`apps/api/src/modules/orders`](./apps/api/src/modules/orders), [`apps/api/src/modules/payments`](./apps/api/src/modules/payments), [`apps/api/src/modules/commerce`](./apps/api/src/modules/commerce) |
| vendedores, postulaciones y comisiones | [`docs/flows/vendor-application.md`](./docs/flows/vendor-application.md), [`docs/flows/vendors-and-commissions.md`](./docs/flows/vendors-and-commissions.md) | [`apps/web/app/trabaja-con-nosotros`](./apps/web/app/trabaja-con-nosotros), [`apps/web/app/panel-vendedor`](./apps/web/app/panel-vendedor), [`apps/api/src/modules/vendors`](./apps/api/src/modules/vendors), [`apps/api/src/modules/commissions`](./apps/api/src/modules/commissions) |
| mayoristas | [`docs/flows/wholesale-flow.md`](./docs/flows/wholesale-flow.md) | [`apps/web/app/mayoristas`](./apps/web/app/mayoristas), [`apps/api/src/modules/wholesale`](./apps/api/src/modules/wholesale) |
| loyalty, campañas y notificaciones | [`docs/flows/loyalty-flow.md`](./docs/flows/loyalty-flow.md), [`docs/flows/campaigns-and-notifications.md`](./docs/flows/campaigns-and-notifications.md) | [`apps/admin/app/loyalty`](./apps/admin/app/loyalty), [`apps/admin/app/marketing`](./apps/admin/app/marketing), [`apps/admin/app/notificaciones`](./apps/admin/app/notificaciones), [`apps/api/src/modules/loyalty`](./apps/api/src/modules/loyalty), [`apps/api/src/modules/marketing`](./apps/api/src/modules/marketing), [`apps/api/src/modules/notifications`](./apps/api/src/modules/notifications) |
| CMS, branding y media | [`docs/architecture/modules.md`](./docs/architecture/modules.md), [`docs/ux/design-system.md`](./docs/ux/design-system.md) | [`apps/admin/app/cms`](./apps/admin/app/cms), [`apps/api/src/modules/cms`](./apps/api/src/modules/cms), [`apps/api/src/modules/media`](./apps/api/src/modules/media), [`apps/web/public/brand`](./apps/web/public/brand) |
| estados, entidades y modelo de dominio | [`docs/data/domain-model.md`](./docs/data/domain-model.md), [`docs/data/entities.md`](./docs/data/entities.md), [`docs/data/order-states.md`](./docs/data/order-states.md), [`docs/data/commission-states.md`](./docs/data/commission-states.md) | [`prisma/schema.prisma`](./prisma/schema.prisma), [`packages/shared/src/domain`](./packages/shared/src/domain) |
| API pública y administrativa | [`docs/api/api-v1-outline.md`](./docs/api/api-v1-outline.md) | [`apps/api/src/modules`](./apps/api/src/modules) |
| entorno, PM2 y despliegue | [`docs/infra/environments.md`](./docs/infra/environments.md), [`docs/infra/deployment-strategy.md`](./docs/infra/deployment-strategy.md), [`docs/infra/pm2-services.md`](./docs/infra/pm2-services.md) | [`ecosystem.config.cjs`](./ecosystem.config.cjs), [`scripts`](./scripts), [`ops/nginx`](./ops/nginx) |

## Mapa Del Monorepo

| Ruta | Qué vive ahí | Qué deberías encontrar |
| --- | --- | --- |
| [`apps/web`](./apps/web) | storefront público | home, catálogo, checkout, cuenta, mayoristas, seller panel, layouts y features públicas |
| [`apps/admin`](./apps/admin) | backoffice | dashboard, pedidos, pagos, vendedores, comisiones, CMS, CRM, auditoría, observabilidad |
| [`apps/api`](./apps/api) | backend `NestJS` | módulos de negocio, guards, auth, health, observabilidad, persistencia y contratos HTTP |
| [`apps/worker`](./apps/worker) | procesamiento asíncrono | jobs BullMQ, tareas diferidas y conciliaciones operativas |
| [`packages/shared`](./packages/shared) | contratos compartidos | tipos API, enums, modelos, navegación, datos comunes |
| [`packages/ui`](./packages/ui) | base visual compartida | componentes reutilizables y primitivas UI |
| [`prisma`](./prisma) | modelo de datos | `schema.prisma`, seed local/demo y contenido inicial |
| [`docs`](./docs) | fuente de verdad documental | producto, arquitectura, flujos, datos, UX, API, storefront e infraestructura |
| [`scripts`](./scripts) | operación y despliegue | release, backup, smoke checks, migraciones bootstrap |
| [`ops/nginx`](./ops/nginx) | infraestructura publicada | snippets de reverse proxy para `web`, `admin` y `api` |

## Superficies Principales

### Web pública

La experiencia pública vigente, según la documentación, vive en:

- `/`
- `/catalogo`
- `/checkout`
- `/cuenta`
- `/mayoristas`
- `/trabaja-con-nosotros`
- `/panel-vendedor`

Rutas útiles en código:

- [`apps/web/app/page.tsx`](./apps/web/app/page.tsx)
- [`apps/web/app/catalogo/page.tsx`](./apps/web/app/catalogo/page.tsx)
- [`apps/web/app/checkout/page.tsx`](./apps/web/app/checkout/page.tsx)
- [`apps/web/app/cuenta/page.tsx`](./apps/web/app/cuenta/page.tsx)
- [`apps/web/app/mayoristas/page.tsx`](./apps/web/app/mayoristas/page.tsx)
- [`apps/web/app/trabaja-con-nosotros/page.tsx`](./apps/web/app/trabaja-con-nosotros/page.tsx)
- [`apps/web/app/panel-vendedor/page.tsx`](./apps/web/app/panel-vendedor/page.tsx)

Notas:

- [`apps/web/app/storefront-v2/page.tsx`](./apps/web/app/storefront-v2/page.tsx) y [`apps/web/app/storefront-v2-premium/page.tsx`](./apps/web/app/storefront-v2-premium/page.tsx) siguen existiendo como superficies de implementación y referencia.
- La landing pública oficial está consolidada en `/` y la documentación vigente del lenguaje visual está en [`docs/storefront-v2-premium-landing.md`](./docs/storefront-v2-premium-landing.md).

### Admin

Rutas principales del backoffice:

- [`apps/admin/app/page.tsx`](./apps/admin/app/page.tsx)
- [`apps/admin/app/pedidos/page.tsx`](./apps/admin/app/pedidos/page.tsx)
- [`apps/admin/app/pagos/page.tsx`](./apps/admin/app/pagos/page.tsx)
- [`apps/admin/app/vendedores/page.tsx`](./apps/admin/app/vendedores/page.tsx)
- [`apps/admin/app/comisiones/page.tsx`](./apps/admin/app/comisiones/page.tsx)
- [`apps/admin/app/mayoristas/page.tsx`](./apps/admin/app/mayoristas/page.tsx)
- [`apps/admin/app/marketing/page.tsx`](./apps/admin/app/marketing/page.tsx)
- [`apps/admin/app/loyalty/page.tsx`](./apps/admin/app/loyalty/page.tsx)
- [`apps/admin/app/cms/page.tsx`](./apps/admin/app/cms/page.tsx)
- [`apps/admin/app/auditoria/page.tsx`](./apps/admin/app/auditoria/page.tsx)
- [`apps/admin/app/observabilidad/page.tsx`](./apps/admin/app/observabilidad/page.tsx)

### API

Módulos activos y/o estructurados en el backend:

- `auth`
- `catalog`
- `products`
- `commerce`
- `orders`
- `payments`
- `vendors`
- `commissions`
- `wholesale`
- `loyalty`
- `marketing`
- `notifications`
- `cms`
- `media`
- `audit`
- `security`
- `observability`
- `health`
- `core`
- `customers`
- `coupons`

Entrada principal:

- [`apps/api/src/app.module.ts`](./apps/api/src/app.module.ts)

Detalle de endpoints esperados:

- [`docs/api/api-v1-outline.md`](./docs/api/api-v1-outline.md)

## Estado Actual Según La Documentación

La carpeta [`docs/`](./docs) describe un proyecto que ya tiene base funcional real para:

- `web`, `admin`, `api` y `worker`
- auth y RBAC
- catálogo, checkout y pedidos
- pagos Openpay y pagos manuales
- vendedores, comisiones y seller panel
- mayoristas, campañas, loyalty y notificaciones
- CMS interno, auditoría, seguridad y healthchecks
- despliegue productivo con `PM2`, `Hestia` y `Nginx`

Pendientes estructurales señalados en la propia documentación:

- conectar catálogo, checkout y superficies públicas a productos persistidos reales
- habilitar gestión real de productos desde backoffice
- habilitar media pública administrable
- consolidar `Cloudflare R2` como storage vigente de media pública

## Arranque Local

### Requisitos

- `Node.js` y `npm`
- un daemon Docker operativo (`Docker Desktop` o equivalente)

### Setup básico

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear entorno local a partir de [`.env.example`](./.env.example):

   ```bash
   cp .env.example .env
   ```

3. Levantar dependencias locales con Docker:

   ```bash
   npm run docker:up
   ```

   Este flujo usa [`docker-compose.local.yml`](./docker-compose.local.yml) y expone:

   - `PostgreSQL` en `localhost:55436`
   - `Redis` en `localhost:6380`

   La elección de puertos evita chocar con servicios nativos ya instalados en la máquina.

4. Con Docker arriba, preparar base de datos y seed demo:

   ```bash
   npm run local:demo
   ```

   Este script ejecuta:

   - `npm run prisma:push`
   - `npm run prisma:seed`

   El seed carga un baseline demo para que `localhost` se parezca a la operación documentada sin depender de datos vivos.

5. Levantar cada proceso en terminales separadas:

   ```bash
   npm run dev:web
   npm run dev:admin
   npm run dev:api
   npm run dev:worker
   ```

Referencia operativa:

- guía detallada de dependencias Docker locales: [`docs/infra/local-docker-services.md`](./docs/infra/local-docker-services.md)
- si ya tienes un `.env` viejo apuntando a `5432`, `5433`, `6379` o a sockets locales, alinéalos con [`.env.example`](./.env.example) antes de correr `npm run local:demo`

### URLs locales esperadas

- web: `http://localhost:3000`
- admin: `http://localhost:3001`
- api: `http://localhost:4000/api/v1`

Nota:

- en desarrollo el admin corre en `3001`
- en producción, `PM2` usa `3005` para `admin`

Healthchecks locales:

- web: `http://localhost:3000/health`
- admin: `http://localhost:3001/health`
- api liveness: `http://localhost:4000/api/v1/health/liveness`

## Scripts Útiles

Scripts raíz del monorepo:

- `npm run dev:web`
- `npm run dev:admin`
- `npm run dev:api`
- `npm run dev:worker`
- `npm run docker:up`
- `npm run docker:down`
- `npm run docker:ps`
- `npm run docker:logs`
- `npm run build`
- `npm run typecheck`
- `npm run prisma:generate`
- `npm run prisma:push`
- `npm run prisma:seed`
- `npm run local:demo`
- `npm run deploy:release`
- `npm run deploy:smoke`
- `npm run deploy:backup`

## Dónde Leer Primero Si Eres Nuevo

Orden recomendado:

1. [`docs/product/product-vision.md`](./docs/product/product-vision.md)
2. [`docs/product/scope.md`](./docs/product/scope.md)
3. [`docs/architecture/overview.md`](./docs/architecture/overview.md)
4. [`docs/architecture/solution-architecture.md`](./docs/architecture/solution-architecture.md)
5. [`docs/architecture/modules.md`](./docs/architecture/modules.md)
6. [`docs/data/domain-model.md`](./docs/data/domain-model.md)
7. [`docs/data/entities.md`](./docs/data/entities.md)
8. [`docs/flows/checkout-openpay.md`](./docs/flows/checkout-openpay.md)
9. [`docs/api/api-v1-outline.md`](./docs/api/api-v1-outline.md)
10. [`docs/ux/design-system.md`](./docs/ux/design-system.md)
11. [`docs/infra/deployment-strategy.md`](./docs/infra/deployment-strategy.md)

Si prefieres entrar por tema, usa:

- arquitectura: [`docs/architecture`](./docs/architecture)
- producto: [`docs/product`](./docs/product)
- flujos: [`docs/flows`](./docs/flows)
- datos: [`docs/data`](./docs/data)
- UX: [`docs/ux`](./docs/ux)
- infraestructura: [`docs/infra`](./docs/infra)

## Entorno Y Producción

Archivos y puntos de entrada relevantes:

- entorno local: [`.env.example`](./.env.example)
- entorno productivo de referencia: [`.env.production.example`](./.env.production.example)
- procesos PM2: [`ecosystem.config.cjs`](./ecosystem.config.cjs)
- release: [`scripts/release-production.sh`](./scripts/release-production.sh)
- smoke checks: [`scripts/smoke-check.mjs`](./scripts/smoke-check.mjs)
- backups: [`scripts/backup-production.sh`](./scripts/backup-production.sh)
- configuración Nginx: [`ops/nginx`](./ops/nginx)

Puertos operativos documentados para producción:

- `3000` para `web`
- `3005` para `admin`
- `4000` para `api`

## Nota Final

Este `README.md` está pensado como guía de localización. Para decisiones de negocio, reglas de flujo, límites de arquitectura y operación productiva, la referencia canónica es [`docs/README.md`](./docs/README.md) y los documentos enlazados desde ahí.
