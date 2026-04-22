# Arquitectura General Vigente

Fecha de corte: 2026-04-22.

Este documento describe la arquitectura real del ERP Huele Huele despues de la homologacion local-produccion. Reemplaza el enfoque anterior de "arquitectura objetivo" por una fotografia operativa: lo que existe, como se despliega y que modulo es responsable de cada decision.

## Resumen

Huele Huele opera como un monolito modular distribuido en cuatro procesos:

- `huelegood-web`: experiencia publica.
- `huelegood-admin`: backoffice operativo.
- `huelegood-api`: API transaccional y reglas de negocio.
- `huelegood-worker`: jobs asincronos.

La separacion es por proceso de ejecucion, no por microservicio. Los modulos de dominio viven en la API y comparten PostgreSQL como fuente de verdad. Redis solo coordina colas y trabajos temporales.

## Vista De Contexto

```mermaid
flowchart LR
  customer["Cliente"] --> web["Storefront publico"]
  seller["Vendedor"] --> web
  adminUser["Operador/Admin"] --> admin["Backoffice"]

  web --> api["API NestJS /api/v1"]
  admin --> api

  api --> pg[("PostgreSQL productivo")]
  api --> redis[("Redis")]
  redis --> worker["Worker BullMQ"]

  api --> r2["Cloudflare R2"]
  api --> openpay["Openpay"]
  api --> apiperu["ApiPeru"]

  worker --> resend["Resend"]
  worker --> pg
```

## Contenedores

```mermaid
flowchart TB
  subgraph vps["VPS Hestia/Nginx"]
    nginx["Nginx TLS + reverse proxy"]

    subgraph pm2["PM2"]
      web["huelegood-web :3000"]
      admin["huelegood-admin :3005"]
      api["huelegood-api :4000"]
      worker["huelegood-worker"]
    end

    pg[("PostgreSQL huelegood_db")]
    redis[("Redis")]
    shared["shared/.env.production"]
    releases["releases/<timestamp>"]
    current["current -> release activa"]
  end

  nginx --> web
  nginx --> admin
  nginx --> api
  api --> pg
  api --> redis
  worker --> redis
  worker --> pg
  current --> releases
  pm2 --> shared
```

## Principios Vigentes

- LOCAL es la fuente de verdad del codigo.
- Produccion debe homologarse contra LOCAL sin reemplazar la BD productiva.
- PostgreSQL productivo nunca se sustituye por dumps locales.
- `orders` es el agregado comercial central.
- `inventory` es el unico modulo que muta stock operativo.
- `transfers` mueve stock fisico entre almacenes y no debe resolverse con edicion manual de saldos.
- `payments` orquesta revision manual, pero las transiciones comerciales finales pasan por `orders`.
- `core/reports` agrega lectura; no debe duplicar reglas de negocio.
- Los handoffs fechados son historicos, no fuente de verdad vigente.

## Flujo Comercial Principal

```mermaid
sequenceDiagram
  participant C as Cliente
  participant Web as Web
  participant Api as API Commerce
  participant Orders as Orders
  participant Inventory as Inventory
  participant Payments as Payments
  participant Pg as PostgreSQL

  C->>Web: selecciona producto y checkout
  Web->>Api: quote/documento/checkout
  Api->>Orders: crea pedido idempotente
  Orders->>Inventory: reserva stock por variante + almacen
  Inventory->>Pg: persiste balance/reserva
  Orders->>Payments: registra ruta de pago
  Payments->>Orders: aprueba, rechaza o deja en revision
  Orders->>Inventory: confirma, libera o revierte stock
  Orders->>Pg: actualiza snapshot comercial
```

## Flujo Logistico Principal

```mermaid
sequenceDiagram
  participant Admin as Admin
  participant Transfers as Transfers
  participant Inventory as Inventory
  participant Pg as PostgreSQL

  Admin->>Transfers: crea transferencia
  Transfers->>Inventory: reserva en almacen origen
  Transfers->>Pg: warehouse_transfers + lines
  Admin->>Transfers: despacha
  Transfers->>Inventory: descuenta stock fisico origen
  Admin->>Transfers: recibe total/parcial
  Transfers->>Inventory: ingresa stock destino
  Transfers->>Pg: documentos e incidencia si hay diferencia
  Admin->>Transfers: reconcilia incidencia
  Transfers->>Pg: cierre auditado
```

## Datos Y Persistencia

```mermaid
erDiagram
  WAREHOUSES ||--o{ WAREHOUSE_INVENTORY_BALANCES : has
  PRODUCT_VARIANTS ||--o{ WAREHOUSE_INVENTORY_BALANCES : has
  WAREHOUSES ||--o{ WAREHOUSE_TRANSFERS : origin
  WAREHOUSES ||--o{ WAREHOUSE_TRANSFERS : destination
  WAREHOUSE_TRANSFERS ||--o{ WAREHOUSE_TRANSFER_LINES : contains
  WAREHOUSE_TRANSFERS ||--o{ WAREHOUSE_TRANSFER_DOCUMENTS : emits
  WAREHOUSE_TRANSFERS ||--o| WAREHOUSE_TRANSFER_INCIDENTS : opens
  PRODUCT_VARIANTS ||--o{ WAREHOUSE_TRANSFER_LINES : moved
  ORDERS ||--o{ ORDER_ITEMS : contains
  ORDERS ||--o| ORDER_FULFILLMENT_ASSIGNMENTS : assigned
  CUSTOMERS ||--o{ ORDERS : places
  VENDORS ||--o{ COMMISSIONS : earns
```

Persistencia actual:

- Prisma/PostgreSQL: productos, variantes, almacenes, balances, transferencias, usuarios, media, auditoria, customer normalization y tablas operativas nuevas.
- `module_snapshots`: runtime heredado para algunos modulos comerciales que aun no terminaron migracion completa a tablas normalizadas.
- Redis/BullMQ: colas, no fuente de verdad.
- R2/storage local: archivos publicos y privados.

## Superficies De Riesgo

- La historia de Git local y `origin/main` estuvo divergida; la homologacion debe registrar el snapshot local actual en una rama/commit trazable.
- No versionar `outputs/`, dumps, `.env`, backups ni evidencia privada.
- Cualquier cambio de schema requiere backup productivo y `HUELEGOOD_RUN_DB_PUSH=1` solo durante ventana controlada.
- Las validaciones browser de admin siguen siendo el cierre operativo que complementa typecheck/build/tests.

## Lecturas Relacionadas

- [Diagramas del sistema](./system-diagrams.md)
- [Mapa de modulos](./modules.md)
- [Modelo de dominio](../data/domain-model.md)
- [API v1](../api/api-v1-outline.md)
- [Despliegue](../infra/deployment-strategy.md)
