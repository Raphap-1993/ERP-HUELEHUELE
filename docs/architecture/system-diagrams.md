# Diagramas Del Sistema

Fecha de corte: 2026-04-22.

Estos diagramas son la referencia visual vigente. Si otro documento contiene diagramas anteriores y contradice esta pagina, prevalece esta pagina.

## 1. Contexto Comercial

```mermaid
flowchart TB
  clientes["Clientes finales"] --> storefront["Storefront Huele Huele"]
  vendedores["Vendedores / afiliados"] --> storefront
  mayoristas["Mayoristas"] --> storefront
  operadores["Operadores internos"] --> admin["Backoffice"]
  gerencia["Gerencia"] --> admin

  storefront --> api["API ERP"]
  admin --> api

  api --> pagos["Openpay / pagos manuales"]
  api --> logistica["Inventario, almacenes y despachos"]
  api --> comercial["Pedidos, vendedores, comisiones y reportes"]
  api --> contenido["CMS, media y storefront"]
```

## 2. Contenedores Tecnicos

```mermaid
flowchart LR
  subgraph internet["Internet"]
    www["huelegood.com"]
    adm["admin.huelegood.com"]
    apiDomain["api.huelegood.com"]
  end

  subgraph vps["VPS"]
    nginx["Nginx / Hestia"]
    web["Next web :3000"]
    admin["Next admin :3005"]
    api["Nest API :4000"]
    worker["Worker BullMQ"]
    pg[("PostgreSQL")]
    redis[("Redis")]
  end

  www --> nginx --> web
  adm --> nginx --> admin
  apiDomain --> nginx --> api
  web --> api
  admin --> api
  api --> pg
  api --> redis
  redis --> worker
  worker --> pg
```

## 3. Modulos Backend

```mermaid
flowchart TB
  subgraph platform["Plataforma"]
    auth["auth"]
    security["security"]
    audit["audit"]
    health["health"]
    observability["observability"]
    customers["customers"]
  end

  subgraph commerce["Comercial"]
    products["products"]
    catalog["catalog"]
    cms["cms"]
    media["media"]
    coupons["coupons"]
    commerceApi["commerce"]
    orders["orders"]
    payments["payments"]
  end

  subgraph operations["Operacion"]
    warehouses["warehouses"]
    inventory["inventory"]
    transfers["transfers"]
    dispatches["dispatch labels"]
    reports["core/reports"]
  end

  subgraph growth["Growth"]
    vendors["vendors"]
    commissions["commissions"]
    wholesale["wholesale"]
    loyalty["loyalty"]
    marketing["marketing"]
    notifications["notifications"]
  end

  catalog --> products
  commerceApi --> products
  commerceApi --> cms
  commerceApi --> coupons
  commerceApi --> orders
  orders --> inventory
  orders --> payments
  orders --> customers
  orders --> commissions
  orders --> loyalty
  orders --> notifications
  products --> media
  products --> warehouses
  inventory --> warehouses
  transfers --> inventory
  dispatches --> orders
  reports --> orders
  reports --> inventory
  payments --> commissions
  notifications --> marketing
  auth --> audit
  security --> audit
```

## 4. Datos Principales

```mermaid
erDiagram
  USERS ||--o{ USER_ROLES : has
  ROLES ||--o{ ROLE_PERMISSIONS : grants
  CUSTOMERS ||--o{ ORDERS : places
  PRODUCTS ||--o{ PRODUCT_VARIANTS : has
  PRODUCTS ||--o{ PRODUCT_IMAGES : has
  PRODUCT_VARIANTS ||--o{ WAREHOUSE_INVENTORY_BALANCES : balances
  WAREHOUSES ||--o{ WAREHOUSE_INVENTORY_BALANCES : stores
  ORDERS ||--o{ ORDER_ITEMS : contains
  ORDERS ||--o{ ORDER_STATUS_HISTORY : traces
  ORDERS ||--o| ORDER_FULFILLMENT_ASSIGNMENTS : ships_from
  VENDORS ||--o{ VENDOR_CODES : owns
  VENDORS ||--o{ COMMISSIONS : earns
  WAREHOUSE_TRANSFERS ||--o{ WAREHOUSE_TRANSFER_LINES : contains
  WAREHOUSE_TRANSFERS ||--o{ WAREHOUSE_TRANSFER_DOCUMENTS : documents
  WAREHOUSE_TRANSFERS ||--o| WAREHOUSE_TRANSFER_INCIDENTS : incident
```

## 5. Checkout Y Pago

```mermaid
sequenceDiagram
  participant Cliente
  participant Web
  participant Commerce
  participant Customers
  participant Orders
  participant Inventory
  participant Payments

  Cliente->>Web: completa checkout
  Web->>Commerce: quote + documento + direccion
  Commerce->>Customers: busca o crea cliente canonico
  Commerce->>Orders: crea pedido idempotente
  Orders->>Inventory: reserva stock
  Orders->>Payments: registra ruta de pago
  Payments-->>Orders: pago aprobado, rechazado o en revision
  Orders->>Inventory: confirma/libera/revierte
  Orders-->>Web: estado final operable
```

## 6. Inventario Por Almacen

```mermaid
stateDiagram-v2
  [*] --> Disponible
  Disponible --> Reservado: pedido pendiente / transferencia creada
  Reservado --> Comprometido: pago confirmado
  Reservado --> Disponible: cancelacion / rechazo
  Reservado --> EnTransito: transferencia despachada
  EnTransito --> Disponible: recepcion en destino
  EnTransito --> Incidencia: recepcion parcial
  Incidencia --> Cerrado: reconciliacion
  Comprometido --> Revertido: reembolso / anulacion
```

## 7. Transferencias

```mermaid
stateDiagram-v2
  [*] --> reserved
  reserved --> in_transit: dispatch
  reserved --> cancelled: cancel
  in_transit --> received: receive total
  in_transit --> partial_received: receive parcial
  partial_received --> received: reconcile
  received --> [*]
  cancelled --> [*]
```

## 8. Release Y Homologacion

```mermaid
flowchart TB
  local["LOCAL codigo fuente"] --> checks["typecheck + tests + build"]
  checks --> git["commit snapshot homologado"]
  git --> github["GitHub remoto"]
  local --> package["release timestamp"]
  package --> vps["VPS releases/<timestamp>"]
  vps --> current["symlink current"]
  current --> pm2["PM2 reload"]
  pm2 --> smoke["smoke checks"]
  prodDb[("BD productiva")] --> api["API productiva"]
  current --> api

  local -. no reemplaza .-> prodDb
```
