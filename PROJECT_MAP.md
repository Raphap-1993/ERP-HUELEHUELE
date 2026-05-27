# PROJECT_MAP

> Mapa rapido del repositorio. Responde donde vive cada cosa sin obligar a
> explorar todo el monorepo.

## Arbol principal
| Ruta | Proposito |
|---|---|
| `apps/web/` | Storefront publico de Huelegood: home, catalogo, checkout, cuenta, mayoristas y panel vendedor. |
| `apps/admin/` | Backoffice operativo para pedidos, pagos, catalogo, inventario, CRM, CMS y observabilidad. |
| `apps/api/` | API `NestJS` con reglas de negocio, modulos de dominio, auth y persistencia. |
| `apps/worker/` | Jobs `BullMQ` para notificaciones, conciliaciones y tareas asincronas. |
| `packages/shared/` | Tipos, enums, contratos y helpers compartidos. |
| `packages/ui/` | Componentes UI reutilizables. |
| `prisma/` | Schema, seeds y modelo persistente del producto. |
| `docs/product/` | Vision, alcance, roadmap, handoffs de producto y permisos vigentes del negocio. |
| `docs/architecture/` | Arquitectura operativa, modulos, ADRs, diagramas y riesgos vigentes. |
| `docs/flows/` | Flujos comerciales y operativos detallados del producto vivo. |
| `docs/infra/` | Deploy, entornos, PM2 y servicios locales. |
| `docs/fase-0-iniciacion/` | Capa canonica Fase 0 creada para el brownfield. |
| `docs/fase-1-analisis-requerimientos/` | RF, casos de uso y reglas canonicas de los slices brownfield homologados `001` a `005`. |
| `docs/fase-2-ux-ui/` | UX canonica de las superficies brownfield homologadas `001` a `005`. |
| `docs/fase-3-arquitectura/` | Arquitectura, decisiones y ADRs canonicos de los slices abiertos `001` a `005`. |
| `docs/fase-4-sdd/` | Puente metodologico hacia `specs/` por feature brownfield homologada `001` a `005`. |
| `docs/fase-5-construccion/` a `docs/fase-8-operacion/` | Backfill canonico de construccion, QA, deploy y operacion para el slice `001` y base metodologica reutilizable. |
| `specs/` | Features canonicas por slice brownfield homologado (`001` a `005` en este corte). |
| `docs/transversal/90.00-mapa-homologacion-brownfield.md` | Puente entre documentacion vigente y capa canonica. |
| `docs/00-auditoria-inicial.md` a `docs/06-validacion-y-pruebas.md` | Artefactos previos que siguen como evidencia mientras se formalizan sus equivalentes canonicos. |
| `scripts/` | Soporte local, release, homologacion y automatizaciones del repo. |
| `ops/nginx/` | Snippets Nginx para publicacion en VPS/Hestia. |
| `ecosystem.config.cjs` | Definicion de procesos `PM2` para el runtime del monorepo. |

## Rutas canonicas por necesidad
| Necesito... | Esta en... |
|---|---|
| Estado real del brownfield | `AI_CONTEXT.md` |
| Entender la transicion canonica | `docs/transversal/90.00-mapa-homologacion-brownfield.md` |
| Vision, roadmap y responsables canonicos | `docs/fase-0-iniciacion/` |
| Slices canonicos brownfield ya homologados | `docs/fase-1-analisis-requerimientos/`, `docs/fase-2-ux-ui/`, `docs/fase-3-arquitectura/`, `docs/fase-4-sdd/`, `specs/` (`001` a `005`) |
| Vision y alcance vigentes del negocio | `docs/product/product-vision.md`, `docs/product/scope.md` |
| Arquitectura vigente del sistema | `docs/architecture/overview.md`, `docs/architecture/modules.md` |
| Flujos operativos reales | `docs/flows/` |
| Datos y persistencia | `prisma/`, `docs/data/` |
| Deploy y release | `docs/infra/`, `docs/engineering/release-checklist.md`, `ecosystem.config.cjs` |
| Codigo vivo del producto | `apps/` y `packages/` |

## Punto de entrada para agente
1. `AI_CONTEXT.md`
2. `AGENTS.md`
3. `PROJECT_MAP.md`
4. `TRACEABILITY_MATRIX.md`
5. `docs/README.md`

## Regla de mantenimiento
- Si aparece una nueva carpeta canonica o una carpeta vigente deja de ser fuente de verdad, actualiza este mapa en el mismo corte.
