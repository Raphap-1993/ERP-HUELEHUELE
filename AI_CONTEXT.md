# AI_CONTEXT.md - ERP-HUELEHUELE

## Qué es este repo

`ERP-HUELEHUELE` es un monorepo del stack operativo de Huele Huele. Combina
storefront, backoffice, API y worker dentro de un mismo workspace.

## Estado actual

- El proyecto opera en `Fase 2`.
- El frente prioritario vigente es `catalogo y media administrable`.
- Luego siguen automatización comercial, reporting y homologación visual fina.

Fuentes vigentes para entender prioridades y restricciones:

- `README.md`
- `CONTRIBUTING.md`
- `docs/README.md`
- `docs/product/roadmap.md`
- `docs/product/fase-2-execution-plan.md`
- `docs/infra/deployment-strategy.md`
- `docs/engineering/development-standard.md`

## Stack principal

- Monorepo con `npm workspaces`
- `Next.js` + `React` para `web` y `admin`
- `NestJS` para `api`
- `Prisma` para acceso a datos
- `BullMQ` / worker para procesos asíncronos
- Docker local para runtime dependiente

## Comandos útiles

Bootstrap local:

```bash
npm install
cp .env.example .env
npm run docker:up
npm run local:demo
```

Desarrollo por app:

```bash
npm run dev:web
npm run dev:admin
npm run dev:api
npm run dev:worker
```

Validación mínima:

```bash
npm run typecheck
npm run test:erp-sales
npm run build
```

## Criterios de trabajo

- Preferir cambios pequeños, reversibles y trazables.
- No mezclar limpieza incidental con cambios de negocio o release si no aporta.
- Reutilizar patrones existentes antes de introducir nuevas abstracciones.
- Si cambias comportamiento real, actualiza `docs/` correspondiente.
- Si el cambio toca producción, pensar primero en rollout, rollback y smoke.

## Qué no asumir

- No asumir que un handoff viejo o una nota local sigue vigente.
- No asumir que un cambio visual puede ignorar `admin`, mobile o reduced motion.
- No asumir que infraestructura o deploy se resuelven fuera del repo.

## Regla de verdad

Si algo contradice mensajes viejos, memoria local o notas sueltas:

1. prevalece el código actual
2. luego prevalecen los documentos vigentes del repo
3. Obsidian sirve como memoria curada, no como contrato técnico primario
