# Contributing

[README principal](./README.md) | [Indice docs](./docs/README.md) | [Estandar de desarrollo](./docs/engineering/development-standard.md)

## Objetivo

Definir la forma minima y esperada de cambiar `ERP-HUELEHUELE` sin romper trazabilidad, validacion ni seguridad operativa.

## Fuente De Verdad

Antes de tocar codigo o documentacion, leer:

1. [README.md](./README.md)
2. [docs/README.md](./docs/README.md)
3. [docs/product/roadmap.md](./docs/product/roadmap.md)
4. [docs/product/fase-2-execution-plan.md](./docs/product/fase-2-execution-plan.md)
5. [docs/infra/deployment-strategy.md](./docs/infra/deployment-strategy.md)

Si un handoff viejo, una nota suelta o una memoria local contradice esos documentos, prevalecen los documentos vigentes del repo.

## Reglas De Trabajo

- `main` es la rama deployable.
- Si trabajas directo sobre `main`, igual debes validar antes de desplegar.
- Si usas rama o PR para un corte sensible, manten el diff pequeno y trazable.
- No mezcles cambios de negocio, infraestructura y limpieza sin necesidad real.
- No subas `.env`, dumps SQL, backups, evidencias privadas ni builds generados.
- No reemplaces la base de datos productiva con datos locales.
- No hagas cambios destructivos en Git sobre trabajo ajeno sin coordinacion explicita.

## Arranque Local

Instalacion base:

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

## Validacion Minima

Antes de merge, release o deploy controlado, correr:

```bash
npm run typecheck
npm run test:erp-sales
npm run build
```

Si el cambio es muy acotado, puedes usar verificaciones mas pequenas durante desarrollo, pero el corte final no se considera listo sin esos gates.

## Reglas De Documentacion

Cuando cambies comportamiento real, actualiza la documentacion vigente en el mismo corte.

- Si cambias modulos o arquitectura, actualiza `docs/architecture/`.
- Si cambias tablas, agregados o persistencia, actualiza `docs/data/` y `prisma/schema.prisma`.
- Si cambias endpoints o contratos, actualiza `docs/api/api-v1-outline.md`.
- Si cambias release, puertos, variables o runtime, actualiza `docs/infra/`.
- Si cambias flujos operativos, actualiza `docs/flows/`.
- Si cambias patrones visuales o UX aceptada, actualiza `docs/ux/`.

No dejes comportamiento critico explicado solo en mensajes, handoffs temporales u Obsidian.

## Reglas De Deploy

Para cualquier corte productivo:

1. valida el snapshot local
2. deja el cambio en Git
3. ejecuta backup si aplica
4. despliega la release
5. corre smoke tecnico y smoke funcional
6. documenta el corte

Documento canonico:

- [docs/infra/deployment-strategy.md](./docs/infra/deployment-strategy.md)

## Pull Requests

Si usas PR, completa la plantilla en `.github/pull_request_template.md`.

Si trabajas directo sobre `main`, usa esa misma checklist antes de desplegar.

## Estilo De Cambios

- Prefiere cambios pequenos, reversibles y verificables.
- Reutiliza patrones existentes antes de introducir nuevas abstracciones.
- No abras frentes visuales grandes si el roadmap marca otro bloque como prioritario.
- Cuando el cambio toque produccion, piensa primero en rollback y evidencia.
