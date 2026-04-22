# Documentacion Canonica ERP Huele Huele

Fecha de corte: 2026-04-22.

Este indice reemplaza la lectura anterior dispersa. Para evitar confusiones, la fuente de verdad operativa queda acotada a los documentos marcados como **vigentes** en esta pagina. Cualquier otro archivo historico del repo se conserva solo como evidencia de decisiones o trabajo anterior; no debe usarse para planificar, presupuestar, desplegar ni explicar arquitectura actual.

## Estado Ejecutivo

El ERP Huele Huele ya opera como una plataforma propia con cuatro procesos:

- `huelegood-web`: storefront publico en Next.js.
- `huelegood-admin`: backoffice operativo en Next.js.
- `huelegood-api`: API transaccional en NestJS.
- `huelegood-worker`: jobs asincronos sobre BullMQ.

La base productiva es PostgreSQL en el VPS. Redis se usa para colas y coordinacion transitoria. La media publica usa Cloudflare R2 como destino objetivo y los uploads privados pueden seguir en el VPS mientras no exista una decision distinta.

El codigo local es la fuente de verdad de aplicacion; produccion debe homologarse contra ese snapshot sin reemplazar la base de datos productiva.

## Documentos Vigentes

### Lectura rapida

1. [Arquitectura general](./architecture/overview.md)
2. [Diagramas del sistema](./architecture/system-diagrams.md)
3. [Mapa de modulos](./architecture/modules.md)
4. [Modelo de dominio](./data/domain-model.md)
5. [Contratos API v1](./api/api-v1-outline.md)
6. [Despliegue y homologacion](./infra/deployment-strategy.md)
7. [Validacion y pruebas](./06-validacion-y-pruebas.md)

### Producto y operacion

- [Vision de producto](./product/product-vision.md)
- [Alcance vigente](./product/scope.md)
- [Roadmap](./product/roadmap.md)
- [Roles y permisos](./product/roles-and-permissions.md)
- [Plan de implementacion](./05-plan-de-implementacion.md)

### Flujos operativos

- [Checkout y Openpay](./flows/checkout-openpay.md)
- [Pagos manuales](./flows/manual-payments.md)
- [Etiquetas de despacho](./flows/order-dispatch-labels.md)
- [Fulfillment por almacenes](./flows/warehouse-fulfillment-triangulation.md)
- [Transferencias, GRE y stickers](./flows/warehouse-transfers-sunat-guides-and-package-labels.md)
- [Vendedores y comisiones](./flows/vendors-and-commissions.md)
- [Postulación de vendedores](./flows/vendor-application.md)
- [Mayoristas](./flows/wholesale-flow.md)
- [Accesos comerciales por cuenta](./flows/commercial-accesses.md)

### Datos

- [Modelo de dominio](./data/domain-model.md)
- [Entidades](./data/entities.md)
- [Control de inventario por almacen](./data/inventory-control-by-warehouse.md)
- [Estados de pedido](./data/order-states.md)
- [Estados de comision](./data/commission-states.md)

### UX

- [Sistema visual](./ux/design-system.md)
- [Backoffice UX](./ux/backoffice-ux-redesign-v2.md)
- [Checkout UX](./ux/checkout-redesign.md)

## Documentacion Historica

Los handoffs fechados, auditorias de worktree y documentos de fases antiguas sirven como bitacora, no como arquitectura vigente. Si contradicen este indice, prevalece este indice.

No usar como fuente principal:

- handoffs de `docs/product/*handoff*.md`
- auditorias fechadas de worktree
- documentos de redisenos antiguos de storefront
- notas de impacto creadas para cortes ya cerrados

Si una decision historica sigue aplicando, debe estar reflejada en los documentos vigentes listados arriba.

## Mapa Del Monorepo

| Ruta | Responsabilidad |
| --- | --- |
| `apps/web` | Storefront publico: home, catalogo, PDP, checkout, cuenta, mayoristas y panel vendedor. |
| `apps/admin` | Backoffice: pedidos, pagos, productos, inventario, almacenes, transferencias, reportes y operacion. |
| `apps/api` | Backend NestJS: modulos de dominio, API admin/store, auth, seguridad, Prisma y orquestacion. |
| `apps/worker` | Jobs BullMQ para pagos, comisiones y notificaciones. |
| `packages/shared` | Tipos, contratos, enums, navegacion y helpers compartidos. |
| `packages/ui` | Componentes base reutilizables. |
| `prisma` | Schema, seed local/demo y modelo persistente. |
| `scripts` | Operacion local, despliegue, backups, smoke checks y backfills. |
| `ops/nginx` | Snippets Nginx para Hestia/VPS. |

## Superficies Activas

### Publico

- `/`
- `/catalogo`
- `/producto/[slug]`
- `/checkout`
- `/cuenta`
- `/mayoristas`
- `/trabaja-con-nosotros`
- `/panel-vendedor`

### Admin

- `/pedidos`
- `/pagos`
- `/despachos`
- `/productos`
- `/inventario`
- `/almacenes`
- `/transferencias`
- `/reportes`
- `/vendedores`
- `/comisiones`
- `/accesos`
- `/crm`
- `/cms`
- `/auditoria`
- `/observabilidad`

## Reglas Para Mantener La Documentacion

- Si se agrega un modulo, primero actualizar [modules.md](./architecture/modules.md) y [system-diagrams.md](./architecture/system-diagrams.md).
- Si cambia una tabla o agregado, actualizar [domain-model.md](./data/domain-model.md) y `prisma/schema.prisma` en el mismo corte.
- Si cambia un endpoint, actualizar [api-v1-outline.md](./api/api-v1-outline.md).
- Si cambia despliegue, puertos o `.env`, actualizar [deployment-strategy.md](./infra/deployment-strategy.md) y [environments.md](./infra/environments.md).
- No crear handoffs nuevos como fuente permanente; los handoffs deben cerrarse integrando su contenido en la documentacion vigente.

## Arranque Local

```bash
npm install
cp .env.example .env
npm run docker:up
npm run local:demo
npm run dev:api
npm run dev:web
npm run dev:admin
npm run dev:worker
```

URLs locales:

- Web: `http://localhost:3000`
- Admin: `http://localhost:3001`
- API: `http://localhost:4000/api/v1`
- PostgreSQL local: `localhost:55436`
- Redis local: `localhost:6380`

Produccion:

- Web: `https://huelegood.com`
- Admin: `https://admin.huelegood.com`
- API: `https://api.huelegood.com/api/v1`
