# Huelegood

Monorepo de implementación para la plataforma comercial modular Huelegood.

## Fuente de verdad

- documentación: [`docs/`](/Users/rapha/Projects/ERP-HUELEHUELE/docs/README.md)
- sistema de agentes: [`.agents/`](/Users/rapha/Projects/ERP-HUELEHUELE/.agents/AGENTS.md)

## Estructura

- `apps/web`: storefront público en Next.js
- `apps/admin`: backoffice administrable en Next.js
- `apps/api`: API transaccional en NestJS
- `apps/worker`: workers y colas asíncronas con BullMQ
- `packages/shared`: tipos, enums y datos compartidos
- `packages/ui`: base de componentes y sistema visual
- `prisma`: esquema y seed inicial de datos

## Arranque

1. instalar dependencias
2. configurar variables de entorno desde `.env.example`
3. generar Prisma
4. levantar `web`, `admin`, `api` y `worker`

### Scripts

- `npm run dev:web`
- `npm run dev:admin`
- `npm run dev:api`
- `npm run dev:worker`
- `npm run deploy:release`
- `npm run deploy:smoke`
- `npm run deploy:backup`

## Estado

La rama `main` ya contiene una base funcional del MVP con despliegue reproducible sobre `PM2` y verificación operativa vía healthchecks y smoke checks. La documentación de infraestructura vive en [`docs/infra/`](/Users/rapha/Projects/ERP-HUELEHUELE/docs/infra/deployment-strategy.md).
