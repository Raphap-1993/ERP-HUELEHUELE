# PROJECT_MAP.md - ERP-HUELEHUELE

## Root

- `README.md`: entrada general del proyecto
- `CONTRIBUTING.md`: reglas de cambio, validación y release
- `package.json`: workspaces y comandos operativos
- `docker-compose.local.yml`: runtime local compartido
- `docs/`: documentación versionada y fuente de verdad operativa

## Apps

- `apps/web`
  - storefront y experiencia pública
- `apps/admin`
  - backoffice, operación y gestión interna
- `apps/api`
  - dominio, endpoints, persistencia, integraciones
- `apps/worker`
  - jobs, colas y tareas background

## Packages

- `packages/*`
  - contratos y código compartido entre apps

## Docs

- `docs/api`
  - outline y contratos de API
- `docs/architecture`
  - decisiones y explicaciones técnicas
- `docs/data`
  - modelo de datos, persistencia y tablas
- `docs/engineering`
  - estándares, release checklist y playbooks operativos
- `docs/flows`
  - workflows funcionales y operativos
- `docs/infra`
  - entornos, deploy, runtime y estrategia de release
- `docs/product`
  - roadmap, fases y prioridades
- `docs/ux`
  - criterios visuales, UX y validación de interfaces

## Runtime local

- `npm run docker:up`
  - levanta servicios locales base
- `npm run dev:web`
  - desarrollo storefront
- `npm run dev:admin`
  - desarrollo backoffice
- `npm run dev:api`
  - desarrollo API
- `npm run dev:worker`
  - desarrollo worker

## Gates

- `npm run typecheck`
- `npm run test:erp-sales`
- `npm run build`

## Orden recomendado para orientarse

1. `README.md`
2. `CONTRIBUTING.md`
3. `docs/README.md`
4. `docs/product/roadmap.md`
5. `docs/product/fase-2-execution-plan.md`
6. `docs/infra/deployment-strategy.md`
7. el app o módulo específico que vayas a tocar
