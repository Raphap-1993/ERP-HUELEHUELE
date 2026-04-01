# Diagramas Mermaid de Arquitectura

## Propósito

Documentar en Mermaid la forma actual del monorepo y de los módulos reales de `apps/api/src/modules`, dejando explícitas las brechas pendientes entre la arquitectura objetivo y lo hoy implementado.

## Alcance y convenciones

- Este documento describe la forma actual del código, no una versión idealizada.
- `Prisma -> PostgreSQL` representa persistencia relacional directa.
- `ModuleStateService -> PostgreSQL` representa snapshots operativos persistidos en `module_snapshots`.
- `BullMQ -> Redis -> Worker` representa ejecución asíncrona.
- Las cajas con borde punteado representan capacidades previstas o parciales.

## Monorepo y procesos principales

```mermaid
flowchart LR
  subgraph repo["Monorepo Huelegood"]
    web["apps/web"]
    admin["apps/admin"]
    api["apps/api"]
    worker["apps/worker"]
    shared["packages/shared"]
    ui["packages/ui"]
    prisma["prisma"]
    docs["docs"]
  end

  web --> ui
  web --> shared
  admin --> ui
  admin --> shared
  api --> shared
  api --> prisma
  worker --> shared
  worker --> api

  docs -. fuente de verdad .-> web
  docs -. fuente de verdad .-> admin
  docs -. fuente de verdad .-> api
  docs -. fuente de verdad .-> worker
```

## Runtime general

```mermaid
flowchart TB
  customer["Cliente"] --> web["Next.js web"]
  seller["Vendedor"] --> web
  wholesaler["Mayorista"] --> web
  operator["Operación / Admin"] --> admin["Next.js admin"]

  web --> api["NestJS API"]
  admin --> api

  subgraph backend["Módulos de API"]
    platform["Plataforma y operación"]
    commercial["Comercial"]
    growth["Growth"]
  end

  api --> platform
  api --> commercial
  api --> growth

  api --> prisma["PrismaService"]
  prisma --> pg[("PostgreSQL")]

  api --> bull["BullMqService"]
  bull --> redis[("Redis")]
  redis --> worker["BullMQ worker"]

  api --> r2["Cloudflare R2"]
  api --> fs[("Storage local protegido")]
  api <--> openpay["Openpay"]
  worker --> openpay
```

## Inventario actual de módulos del API

| Módulo | Capa | Estado | Diagrama principal |
| --- | --- | --- | --- |
| `health` | plataforma | implementado | plataforma y operación |
| `observability` | plataforma | implementado | plataforma y operación |
| `auth` | plataforma | implementado | plataforma y operación |
| `security` | plataforma | implementado | plataforma y operación |
| `audit` | plataforma | implementado | plataforma y operación |
| `customers` | plataforma | esqueleto | plataforma y operación |
| `media` | comercial | implementado | comercial |
| `products` | comercial | implementado | comercial |
| `catalog` | comercial | implementado | comercial |
| `cms` | comercial | implementado | comercial |
| `coupons` | comercial | implementado | comercial |
| `inventory` | comercial | implementado | comercial |
| `orders` | comercial | implementado | comercial |
| `payments` | comercial | implementado | comercial |
| `commerce` | comercial | implementado | comercial |
| `vendors` | growth | implementado | growth |
| `commissions` | growth | implementado | growth |
| `loyalty` | growth | implementado | growth |
| `marketing` | growth | implementado | growth |
| `notifications` | growth | implementado | growth |
| `wholesale` | growth | implementado | growth |
| `core` | growth | implementado | growth |

## Plataforma y operación

```mermaid
flowchart LR
  ops["PM2 / probes / operación"] --> health["health"]
  admin["admin"] --> observability["observability"]
  admin --> security["security"]
  admin --> audit["audit"]
  web["web"] --> auth["auth"]
  admin --> auth
  seller["panel vendedor"] --> auth

  health --> prisma["PrismaService"]
  audit --> prisma
  auth --> prisma
  auth --> session["Redis session store o memoria"]
  auth --> audit
  security --> audit
  observability --> bull["BullMqService"]
  bull --> redis[("Redis")]

  customers["customers"] -. módulo reservado .-> customersFuture["self-service de cliente, perfiles y direcciones"]
  prisma --> pg[("PostgreSQL")]
```

## Comercial

```mermaid
flowchart LR
  web["web"] --> catalog["catalog"]
  web --> cms["cms"]
  web --> commerce["commerce"]
  admin["admin"] --> products["products"]
  admin --> cms
  admin --> coupons["coupons"]
  admin --> inventory["inventory"]
  admin --> orders["orders"]
  admin --> payments["payments"]

  catalog --> products
  products --> media["media"]
  products --> prisma["PrismaService"]
  cms --> media
  cms --> state["ModuleStateService"]
  cms --> audit["audit"]

  commerce --> products
  commerce --> cms
  commerce --> coupons
  commerce --> orders
  commerce --> commissions["commissions"]
  commerce --> media

  orders --> inventory
  orders --> loyalty["loyalty"]
  orders --> notifications["notifications"]
  orders --> audit
  orders --> observability["observability"]
  orders --> state

  payments --> orders
  payments --> commissions
  payments --> bull["BullMqService"]

  media --> r2["Cloudflare R2"]
  media --> fs[("Storage local protegido")]
  prisma --> pg[("PostgreSQL")]
  state --> pg
  bull --> redis[("Redis")]
  commerce <--> openpay["Openpay"]
```

## Growth

```mermaid
flowchart LR
  web["web"] --> vendors["vendors"]
  web --> wholesale["wholesale"]
  web --> loyalty["loyalty"]
  admin["admin"] --> vendors
  admin --> commissions["commissions"]
  admin --> wholesale
  admin --> marketing["marketing"]
  admin --> notifications["notifications"]
  admin --> loyalty
  admin --> core["core"]
  seller["panel vendedor"] --> core

  vendors --> audit["audit"]
  vendors --> state["ModuleStateService"]

  commissions --> orders["orders"]
  commissions --> vendors
  commissions --> audit
  commissions --> state
  commissions --> bull["BullMqService"]

  loyalty --> notifications
  loyalty --> audit
  loyalty --> state

  marketing --> audit
  marketing --> state

  notifications --> audit
  notifications --> state
  notifications --> bull
  notifications --> observability["observability"]

  wholesale --> marketing
  wholesale --> audit
  wholesale --> state

  core --> orders
  core --> payments["payments"]
  core --> vendors
  core --> commissions
  core --> wholesale
  core --> marketing
  core --> notifications
  core --> loyalty

  state --> pg[("PostgreSQL")]
  bull --> redis[("Redis")]
  redis --> worker["worker"]
  worker --> resend["Resend / email"]
```

## Colas activas y colas faltantes

```mermaid
flowchart LR
  paymentsSvc["payments"] --> qPayments["Queue: payments"]
  commissionsSvc["commissions"] --> qCommissions["Queue: commissions"]
  notificationsSvc["notifications"] --> qNotifications["Queue: notifications"]

  qPayments --> redis[("Redis")]
  qCommissions --> redis
  qNotifications --> redis
  redis --> worker["worker processors activos"]

  worker --> p1["payment.manual-review"]
  worker --> p2["commission.payout.create"]
  worker --> p3["commission.payout.settle"]
  worker --> p4["notification.dispatch"]

  qOrders["Queue: orders"] -. definida en QueueName, sin processor dedicado .-> redis
  qLoyalty["Queue: loyalty"] -. definida en QueueName, sin processor dedicado .-> redis
  qMarketing["Queue: marketing"] -. definida en QueueName, sin processor dedicado .-> redis
```

## Faltantes para cerrar la arquitectura objetivo

```mermaid
flowchart TB
  promotions["Objetivo: modulo promotions"] --> todayPromotions["Hoy: descuentos resueltos en coupons y commerce"]
  cart["Objetivo: modulo cart"] --> todayCart["Hoy: quote y checkout directo en commerce"]
  customers["Objetivo: dominio customers completo"] --> todayCustomers["Hoy: CustomersModule vacio"]
  webhooks["Objetivo: webhooks Openpay firmados e idempotentes"] --> todayWebhooks["Hoy: flujo documentado, sin controlador dedicado en apps/api/src/modules"]
  growthAsync["Objetivo: jobs de orders, loyalty y marketing"] --> todayAsync["Hoy: solo hay processors activos para payments, commissions y notifications"]
```

## Lectura recomendada junto a este documento

- [modules.md](./modules.md)
- [overview.md](./overview.md)
- [solution-architecture.md](./solution-architecture.md)
- [api-v1-outline.md](../api/api-v1-outline.md)
