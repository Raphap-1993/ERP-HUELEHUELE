# Huele Huele CRM Stage Order Follow-Up Brownfield Design

Fecha: 2026-05-28.

## Objetivo

Definir el diseno del siguiente slice brownfield a homologar en
`ERP-HUELEHUELE`: `008-crm-stage-order-follow-up`.

El slice debe consolidar en la capa canonica intermedia el seguimiento
operativo derivado del pedido que hoy vive en `orders`, formalizando
`crmStage`, `commercialTrace` y la superficie visible de `Pedidos > Operacion`
sin absorber el maestro de clientes ya canonizado en `007`, sin convertir el
modulo en CRM manual de notas o tareas y sin mezclar fulfillment, dispatch,
vendor assignment ni notifications como dominios principales.

## Contexto

La branch `codex/homologacion-capa-canonica` ya dejo homologados:

- `001-checkout-payments` como base transaccional;
- `002-vendors-commissions` como canal seller-first;
- `003-wholesale-leads-quotes` como funnel B2B asistido;
- `004-loyalty-points-redemptions` como programa de puntos y canjes;
- `005-cms-content-blocks-marketing-surfaces` como CMS/editorial `as-is`;
- `006-campaigns-marketing-automation` como bounded context operativo de
  campanas;
- `007-customers-identity-conflicts` como maestro canonico de clientes,
  conflictos de identidad y merge operativo.

Al cerrar `007`, quedo explicito que el siguiente bounded context propio debe
quedarse en `orders`:

- `crmStage` del pedido;
- `commercialTrace`;
- el paso del pedido hacia seguimiento comercial/operativo;
- el cierre derivado del seguimiento cuando el pedido avanza o cae;
- la lectura visible de este estado dentro de `Pedidos > Operacion`.

El repo ya demuestra runtime real para este dominio:

- `apps/admin/app/pedidos/page.tsx`;
- `apps/admin/components/orders-workspace.tsx`;
- `apps/api/src/modules/orders/orders.service.ts`;
- `packages/shared/src/domain/enums.ts`;
- `packages/shared/src/types/api.ts`;
- `apps/api/test/erp-sales-flow.test.ts`.

El objetivo no es abrir un CRM comercial nuevo, sino formalizar el bounded
context real que ya existe hoy:

- `crmStage` se deriva de `orderStatus` y `paymentStatus`;
- `commercialTrace` resume la ruta comercial del pedido;
- ciertas acciones de cobro y decision operativa empujan al pedido a
  `ready_for_followup`, `followup` o `closed`;
- `Pedidos > Operacion` ya muestra `Etapa CRM`, `Seguimiento` y
  `CommercialTraceCard`;
- notifications solo aparece como efecto secundario, no como owner del slice.

## Fuentes brownfield

- `docs/product/scope.md`
- `docs/product/roadmap.md`
- `docs/product/roles-and-permissions.md`
- `docs/product/requirements-impact-plan-2026-03.md`
- `docs/architecture/modules.md`

Fuentes de contraste tecnico y de superficie real del repo:

- `apps/admin/app/pedidos/page.tsx`
- `apps/admin/components/orders-workspace.tsx`
- `apps/api/src/modules/orders/orders.service.ts`
- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/types/api.ts`
- `apps/api/test/erp-sales-flow.test.ts`

## Alcance del slice

### Dentro de alcance

- `orders` como agregado operativo principal del slice;
- `Pedidos > Operacion` como superficie visible principal;
- `crmStage` como estado derivado `as-is`;
- `commercialTrace` como puente comercial de confirmacion;
- estados `ready_for_followup`, `followup` y `closed`;
- rutas `manual_direct`, `manual_request`, `openpay_backoffice` y
  `openpay_provider`;
- estados `pending`, `confirmed` y `rejected` de `commercialTrace`;
- `CommercialTraceCard` como visualizacion canonica visible;
- acciones que alteran confirmacion y seguimiento del pedido:
  - registro manual directo;
  - aprobacion de solicitud manual;
  - rechazo de solicitud manual;
  - conciliacion `openpay` desde backoffice;
  - confirmacion `openpay` por provider;
  - transiciones operativas del pedido que empujan a `followup` o `closed`;
- limpieza de `crmStage` cuando el pedido cae o el pago falla/rechaza;
- notificaciones derivadas solo como side effect secundario.

### Fuera de alcance

- maestro de clientes;
- conflictos de identidad y merge;
- notas manuales de seguimiento;
- tareas comerciales;
- timeline CRM completo;
- campaigns;
- wholesale;
- loyalty;
- fulfillment;
- dispatch label;
- vendor assignment;
- dashboard u otros read models secundarios;
- notifications como ownership principal.

## Estrategia recomendada

La homologacion debe hacerse `as-is`, usando el comportamiento real de
`orders` como verdad operativa y dejando explicitas las fronteras del dominio.

Eso implica:

- tratar `orders` como agregado principal del slice;
- fijar `Ventas` como owner operativo principal en `Pedidos > Operacion`;
- dejar `OperadorPagos` como actor que solo empuja transiciones de cobro;
- formalizar `crmStage` como estado derivado, no editable manualmente;
- formalizar `commercialTrace` como puente comercial de confirmacion, no como
  bitacora completa de CRM;
- incluir las cuatro rutas reales hoy soportadas por el runtime;
- incluir `pending` dentro de la semantica canonica del puente comercial;
- documentar la relacion explicita entre `commercialTrace` y `crmStage`;
- mantener notifications como efecto secundario y no como owner del slice.

No conviene abrir ahora notas CRM, tareas de follow-up, timeline comercial,
seguimiento manual editable ni dashboards agregados. Este slice primero
necesita fijar el seguimiento derivado real que el repo ya opera hoy dentro
de `orders`.

## Approaches evaluados

### 1. Seguimiento operativo del pedido end-to-end

Incluye `crmStage`, `commercialTrace`, `Pedidos > Operacion` y las acciones
reales que meten o sacan al pedido del circuito de seguimiento.

Ventajas:

- calza con el runtime real;
- cierra ownership dentro de `orders`;
- fija el contrato visible y tecnico a la vez;
- deja lista la base para un futuro slice de CRM ampliado sin contaminarlo.

Costo:

- no resuelve notas, tareas ni seguimiento manual posterior;
- no abre read models agregados en dashboard.

### 2. Solo state machine de seguimiento

Incluye `crmStage` y `commercialTrace`, pero deja fuera las acciones que los
disparan.

Ventaja:

- mas estrecho y facil de nombrar.

Costo:

- se queda corto frente al runtime;
- no explica por que el pedido cambia de estado;
- debilita QA y trazabilidad.

### 3. Seguimiento + fulfillment + notifications

Incluye el seguimiento comercial y ademas fulfillment, despacho y
notifications como parte del mismo corte.

Ventaja:

- parece mas completo de entrada.

Costo:

- ya no seria un bounded context limpio;
- mezclaria varios dominios separados en el repo;
- abriria demasiado alcance para un corte brownfield `as-is`.

### Opcion elegida

Se elige la opcion `1`: seguimiento operativo del pedido end-to-end dentro de
`orders`, con `Pedidos > Operacion` como superficie visible principal.

## Ownership canonico

### `orders`

Dueno de:

- `crmStage`;
- `commercialTrace`;
- las transiciones derivadas desde pago y estado operativo;
- la lectura visible de `Etapa CRM` y `Seguimiento` dentro de la superficie de
  operacion;
- la decision de limpiar o cerrar el seguimiento cuando el pedido cae o se
  completa.

No decide:

- maestro de clientes;
- conflictos de identidad;
- notas CRM manuales;
- campanas;
- fulfillment como dominio propio;
- notifications como bounded context.

### `Pedidos > Operacion`

Dueno de:

- exponer `Etapa CRM`;
- exponer `Seguimiento`;
- exponer `CommercialTraceCard`;
- mostrar el puente comercial de confirmacion al operador;
- ejecutar acciones que cambian la confirmacion comercial y dejan el pedido
  listo o no para seguimiento.

No decide:

- timeline comercial manual;
- notas CRM;
- dashboards agregados;
- fulfillment o despacho como ownership del slice.

### Roles operativos

- `Ventas` como owner operativo principal;
- `OperadorPagos` como actor que confirma o rechaza cobros y empuja el pedido
  al circuito de seguimiento;
- `admin` y `super_admin` como override;
- notifications solo como side effect secundario.

## Reglas canonicas del slice

- `orders` es el agregado principal del slice.
- `Pedidos > Operacion` es la superficie visible principal.
- `crmStage` es estado derivado `as-is`, no workflow editable manualmente.
- `commercialTrace` es puente comercial de confirmacion, no bitacora completa
  de seguimiento.
- `commercialTrace` usa rutas:
  - `manual_direct`
  - `manual_request`
  - `openpay_backoffice`
  - `openpay_provider`
- `commercialTrace` usa estados:
  - `pending`
  - `confirmed`
  - `rejected`
- `commercialTrace.pending` forma parte canonica del runtime actual.
- `commercialTrace` explica la ruta y el hito comercial del pedido.
- `crmStage` resume en que punto operativo/comercial queda el pedido despues
  de ese hito.
- cuando el pedido cae o el pago falla/rechaza:
  - `crmStage` se limpia;
  - `commercialTrace` conserva el cierre comercial `rejected`.
- cuando el pedido llega a `Delivered` o `Completed`, el seguimiento se
  considera `closed`.
- notifications puede dispararse como efecto secundario, pero no toma
  ownership del slice.

## Arquitectura funcional final

### Dominio central

- `orders` concentra:
  - `orderStatus`
  - `paymentStatus`
  - `crmStage`
  - `commercialTrace`
- `crmStage` se deriva de la combinacion de pago y estado del pedido.
- `commercialTrace` se deriva o se explicita segun la ruta de confirmacion.

### Surface contract

- `Pedidos > Operacion` muestra:
  - `SummaryTile` de `Etapa CRM`
  - `SummaryTile` de `Seguimiento`
  - `CommercialTraceCard`
- la superficie no promete timeline CRM, notas manuales ni tareas.

### Entradas reales del runtime

- registro manual directo de pago;
- aprobacion de solicitud manual;
- rechazo de solicitud manual;
- conciliacion `openpay` desde backoffice;
- confirmacion `openpay` por provider;
- transiciones operativas del pedido que llevan a `followup` o `closed`.

### Cierre negativo

- si el pedido se cancela o el pago falla:
  - `crmStage` deja de apuntar a seguimiento activo;
  - `commercialTrace` preserva la evidencia comercial del rechazo o cierre.

## Riesgos y guardrails

### Riesgos

- mezclar este slice con CRM manual y abrir demasiado alcance;
- absorber fulfillment, dispatch o vendor assignment por convivir en la misma
  pestaña;
- tratar notifications como owner del dominio por aparecer como efecto
  secundario;
- perder la diferencia entre `commercialTrace` y un timeline comercial real.

### Guardrails

- `crmStage` no se edita manualmente;
- `commercialTrace` no se vende como bitacora completa de CRM;
- el slice solo cubre acciones que alteran confirmacion y seguimiento;
- dashboard y otros read models secundarios quedan fuera;
- clientes y conflictos de identidad siguen perteneciendo a `007`.

## Resultado esperado

El slice `008-crm-stage-order-follow-up` deja canonizado:

- el seguimiento operativo real del pedido dentro de `orders`;
- la semantica de `crmStage`;
- la semantica de `commercialTrace`;
- la relacion explicita entre ambas senales;
- la superficie visible real de `Pedidos > Operacion`;
- y la frontera limpia frente a clientes, CRM ampliado, fulfillment y
  notifications.

## Siguiente artefacto esperado

Si este diseno queda aprobado, el siguiente paso es escribir el plan de
homologacion del slice `008-crm-stage-order-follow-up` y luego abrir Fases
1-4 en la capa canonica intermedia.
