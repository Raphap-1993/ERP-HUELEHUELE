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

## Estado

Esta rama contiene el esqueleto inicial para empezar implementación real del MVP según los documentos de producto, arquitectura y flujos.

