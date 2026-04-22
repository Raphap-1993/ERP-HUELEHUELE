# ERP Huele Huele

Monorepo operativo del ERP Huele Huele.

El codigo local es la fuente de verdad de aplicacion. Produccion debe homologarse contra este snapshot de codigo, manteniendo la base de datos productiva.

## Procesos

- `apps/web`: storefront publico Next.js.
- `apps/admin`: backoffice Next.js.
- `apps/api`: API NestJS.
- `apps/worker`: jobs BullMQ.

## Documentacion

La documentacion vigente empieza en:

- [docs/README.md](./docs/README.md)
- [Arquitectura general](./docs/architecture/overview.md)
- [Diagramas del sistema](./docs/architecture/system-diagrams.md)
- [Mapa de modulos](./docs/architecture/modules.md)
- [Modelo de dominio](./docs/data/domain-model.md)
- [API v1](./docs/api/api-v1-outline.md)
- [Despliegue y homologacion](./docs/infra/deployment-strategy.md)

Regla: si un handoff, auditoria fechada o documento antiguo contradice esos archivos, prevalece la documentacion vigente.

## Stack

- Next.js
- NestJS
- PostgreSQL
- Prisma
- Redis + BullMQ
- Tailwind CSS
- PM2
- Hestia + Nginx
- Cloudflare R2 para media publica objetivo

## Arranque Local

```bash
npm install
cp .env.example .env
npm run docker:up
npm run local:demo
```

Procesos de desarrollo:

```bash
npm run dev:api
npm run dev:web
npm run dev:admin
npm run dev:worker
```

URLs locales:

- Web: `http://localhost:3000`
- Admin: `http://localhost:3001`
- API: `http://localhost:4000/api/v1`
- PostgreSQL Docker: `localhost:55436`
- Redis Docker: `localhost:6380`

## Validacion

```bash
npm run typecheck
npm run test:erp-sales
npm run build
```

## Produccion

- Web: `https://huelegood.com`
- Admin: `https://admin.huelegood.com`
- API: `https://api.huelegood.com/api/v1`

Release productivo:

```bash
npm run deploy:release
```

Backup productivo:

```bash
npm run deploy:backup
```

Smoke checks:

```bash
npm run deploy:smoke
```

## Seguridad De Repo

No versionar:

- `.env`
- `.env.production`
- dumps SQL
- backups
- `outputs/`
- `storage/`
- evidencias privadas
- builds generados

La BD productiva no se reemplaza con datos locales.
