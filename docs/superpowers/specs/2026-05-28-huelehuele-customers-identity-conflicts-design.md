# Huele Huele Customers Identity Conflicts Brownfield Design

Fecha: 2026-05-28.

## Objetivo

Definir el diseno del siguiente slice brownfield a homologar en
`ERP-HUELEHUELE`: `007-customers-identity-conflicts`.

El slice debe consolidar en la capa canonica intermedia el modulo vigente de
`customers` y la superficie `/crm`, cubriendo maestro de clientes,
conflictos de identidad, merge operativo, resolucion manual y lectura de
pedidos recientes, sin absorber `crmStage`, sin mezclar el seguimiento
comercial de pedidos y sin convertir el modulo en un CRM amplio o pipeline
comercial generico.

## Contexto

La branch `codex/homologacion-capa-canonica` ya dejo homologados:

- `001-checkout-payments` como base transaccional;
- `002-vendors-commissions` como canal seller-first;
- `003-wholesale-leads-quotes` como funnel B2B asistido;
- `004-loyalty-points-redemptions` como programa de puntos y canjes;
- `005-cms-content-blocks-marketing-surfaces` como CMS/editorial `as-is`;
- `006-campaigns-marketing-automation` como bounded context operativo de
  campanas.

Dentro de `REQ-HH-005` sigue quedando un frente vivo que todavia no tiene
slice propio y no debe quedarse difuso:

- maestro de clientes del backoffice;
- conflictos de identidad originados por pedidos;
- resolucion operativa y merge;
- lectura de pedidos recientes para contexto de perfil;
- ownership del perfil canonico del cliente frente a `orders`.

El repo ya demuestra runtime real para este dominio:

- `apps/admin/app/crm/page.tsx`;
- `apps/admin/components/crm-workspace.tsx`;
- `apps/api/src/modules/customers/customers.controller.ts`;
- `apps/api/src/modules/customers/customers.service.ts`;
- `packages/shared/src/types/api.ts`;
- `packages/shared/src/domain/enums.ts`;
- `apps/api/src/modules/orders/orders.service.ts`.

El objetivo no es abrir un CRM enterprise nuevo, sino formalizar el bounded
context real que ya existe hoy:

- `customers` mantiene el perfil canonico;
- `/crm` permite crear, editar, fusionar y resolver conflictos;
- `orders` aporta snapshots historicos y referencias;
- la identidad del cliente puede materializarse o regularizarse desde pedidos;
- `crmStage` y el seguimiento comercial por pedido siguen perteneciendo a
  `orders`.

## Fuentes brownfield

- `docs/product/scope.md`
- `docs/product/roadmap.md`
- `docs/product/roles-and-permissions.md`
- `docs/product/requirements-impact-plan-2026-03.md`
- `docs/architecture/modules.md`

Fuentes de contraste tecnico y de superficie real del repo:

- `apps/admin/app/crm/page.tsx`
- `apps/admin/components/crm-workspace.tsx`
- `apps/api/src/modules/customers/customers.controller.ts`
- `apps/api/src/modules/customers/customers.service.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/mock-data.ts`

## Alcance del slice

### Dentro de alcance

- `customers` como agregado operativo principal;
- `/crm` como superficie visible del slice;
- alta manual de cliente;
- edicion de perfil;
- estado del cliente;
- direcciones;
- contrasena temporal al crear;
- lectura de pedidos recientes dentro del detalle del cliente;
- deteccion de conflictos de identidad;
- resolucion operativa de conflictos;
- acciones de resolucion:
  - `assign_existing`
  - `merge`
  - `ignore`
- merge de clientes con destino canonico;
- clientes sinteticos o regularizados desde pedidos;
- eliminacion operativa existente como capacidad excepcional;
- ownership operativo principal en `ventas`, con acceso adicional para
  `marketing`.

### Fuera de alcance

- `crmStage` del pedido;
- seguimiento comercial de pedidos;
- pipeline comercial amplio;
- campaigns;
- wholesale;
- loyalty;
- scoring comercial avanzado;
- timeline comercial transversal;
- portal cliente;
- reescritura arbitraria de snapshots historicos de `orders`;
- fusionar clientes con documentos canonicos distintos.

## Estrategia recomendada

La homologacion debe hacerse `as-is`, usando el comportamiento real del
runtime como verdad operativa y dejando explicitas las fronteras del dominio.

Eso implica:

- tratar `customers` como agregado principal;
- fijar `/crm` como owner del perfil vivo del cliente;
- dejar `orders` como duenio de snapshots historicos y `crmStage`;
- incluir clientes normales y clientes sinteticos/regularizados como parte
  valida del runtime;
- fijar prioridad de identidad:
  - `documento` como senal principal;
  - `email` y `telefono` como senales secundarias;
  - `nombre + direccion` como senal debil auxiliar;
- formalizar conflictos con acciones `assign_existing`, `merge` e `ignore`;
- fijar que el merge conserva un cliente destino canonico y marca el otro
  como fusionado, sin borrar historia;
- dejar `deleteCustomer` como capacidad excepcional, no como flujo central.

No conviene abrir ahora `crmStage`, seguimiento comercial de pedidos,
automatizaciones de lifecycle ni campanas dentro de este corte. Este slice
primero necesita fijar el maestro canonico de clientes y la higiene de
identidad que el repo ya opera hoy.

## Approaches evaluados

### 1. Maestro de clientes + conflictos de identidad + merge operativo

Incluye `/crm`, perfil canonico, conflictos, resolucion, merge, clientes
sinteticos y lectura de pedidos recientes.

Ventajas:

- calza con el runtime real;
- cierra ownership entre `customers` y `orders`;
- deja util el modulo sin inflarlo a CRM amplio.

Costo:

- no resuelve seguimiento comercial por pedido;
- no abre pipeline comercial ni lifecycle automation.

### 2. Clientes + conflictos + `crmStage`

Incluye el maestro de clientes y ademas absorbe la senal comercial del pedido.

Ventaja:

- parece mas completo a primera vista.

Costo:

- mezcla `customers` con `orders`;
- ensucia ownership;
- reabre un slice comercial que todavia no esta acotado.

### 3. CRM amplio end-to-end

Incluye clientes, conflictos, seguimiento comercial, campanas, notas,
timeline y automatizaciones.

Ventaja:

- vision mas poderosa a futuro.

Costo:

- ya no seria homologacion `as-is`;
- abriria demasiado alcance;
- mezclaria varios dominios ya separados en el runtime.

### Opcion elegida

Se elige la opcion `1`: maestro de clientes + conflictos de identidad + merge
operativo.

## Ownership canonico

### `customers`

Dueno de:

- perfil canonico del cliente;
- estado del cliente;
- direcciones;
- merge y resolucion de conflictos;
- materializacion o regularizacion del cliente desde pedidos;
- lectura consolidada de pedidos recientes dentro del detalle.

No decide:

- `crmStage` del pedido;
- seguimiento comercial de pedidos;
- campanas;
- mayoristas;
- loyalty;
- timeline comercial transversal.

### `/crm`

Dueno de:

- operar el perfil vivo del cliente;
- crear clientes manualmente;
- editar clientes;
- abrir detalle y leer pedidos recientes;
- resolver conflictos;
- fusionar clientes;
- eliminar de forma excepcional cuando el runtime lo permite.

No decide:

- reescritura del pasado operativo de `orders`;
- seguimiento comercial del pedido;
- scoring o pipeline comercial amplio.

### `orders`

Dueno de:

- snapshots historicos;
- referencias a `customerId` y `customerConflictId`;
- `crmStage`;
- `commercialTrace`;
- historia transaccional del pedido.

No decide:

- perfil vivo del cliente;
- merge canonico;
- reglas de identidad del CRM.

### Roles operativos

- `ventas` como owner operativo principal;
- `marketing` con acceso por necesidad operativa;
- `admin` y `super_admin` como override;
- el slice no se modela como ownership de `operador_pagos` ni de `seller`.

## Reglas canonicas del slice

- `customers` es el agregado principal.
- `/crm` es la superficie visible del slice.
- el perfil canonico vive en `customers`; `orders` conserva snapshots.
- la prioridad de identidad es:
  1. `documento`
  2. `email` y `telefono`
  3. `nombre + direccion`
- los conflictos usan `open`, `resolved`, `ignored` y `merged`.
- la resolucion operativa usa `assign_existing`, `merge` e `ignore`.
- un merge deja un cliente destino canonico activo y un cliente fuente
  fusionado.
- no se borra historia operativa ni se reescriben snapshots historicos
  arbitrariamente.
- no se puede fusionar si ambos clientes ya tienen documentos canonicos
  distintos.
- `deleteCustomer` existe, pero es excepcional y debe respetar restricciones
  del runtime.
- clientes sinteticos o regularizados desde pedidos forman parte valida del
  dominio actual.

## Superficies reales

### Admin

- `/crm`
- tabla de clientes
- metricas operativas del modulo
- tabla de conflictos de identidad
- dialogo de detalle
- dialogo de alta y edicion
- dialogo de resolucion de conflicto
- dialogo de merge manual

### API

- `GET /admin/customers`
- `GET /admin/customers/:id`
- `POST /admin/customers`
- `PATCH /admin/customers/:id`
- `DELETE /admin/customers/:id`
- `GET /admin/customers/conflicts`
- `POST /admin/customers/merge`
- `POST /admin/customers/conflicts/:id/resolve`

## Resultado esperado

El slice `007-customers-identity-conflicts` debe dejar canonizado que el
backoffice de Huele Huele ya tiene un maestro operativo de clientes con
conflictos y merge reales, y que su frontera correcta no es "CRM ampliado",
sino identidad canonica del cliente con historia transaccional preservada en
`orders`.
