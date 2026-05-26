# Huele Huele Vendors Commissions Brownfield Design

Fecha: 2026-05-26.

## Objetivo

Definir el diseno del siguiente slice brownfield a homologar en
`ERP-HUELEHUELE`: `002-vendors-commissions`.

El slice debe consolidar en la capa canonica intermedia el flujo seller-first
real del producto sin redisenar el runtime ni mezclar esta homologacion con
optimizaciones futuras del negocio.

## Contexto

La branch `codex/homologacion-capa-canonica` ya dejo homologado el slice
`001-checkout-payments` como base transaccional. El siguiente bounded context
mas diferencial del producto es `vendors + commissions`, porque cruza:

- captura publica de postulacion;
- backoffice de aprobacion y gestion comercial;
- atribucion de pedidos en checkout y en pedidos existentes;
- generacion de comisiones;
- preparacion y cierre de payouts;
- panel vendedor como superficie operativa real.

El objetivo no es construir un modulo nuevo, sino formalizar el ownership,
los limites y los artefactos canonicos del flujo ya vivo.

## Fuentes brownfield

- `docs/flows/vendors-and-commissions.md`
- `docs/flows/vendor-application.md`
- `docs/flows/commercial-accesses.md`
- `docs/product/scope.md`
- `docs/product/roadmap.md`
- `docs/product/roles-and-permissions.md`
- `docs/architecture/modules.md`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/vendors/vendors.service.ts`
- `apps/api/src/modules/commissions/commissions.service.ts`
- `apps/web/components/seller-panel-workspace.tsx`
- `apps/admin/components/orders-workspace.tsx`
- `apps/admin/components/commissions-workspace.tsx`

## Alcance del slice

### Dentro de alcance

- captura publica `trabaja-con-nosotros`;
- onboarding de vendedor;
- aprobacion, rechazo, edicion y activacion del vendedor;
- identidad comercial del vendedor:
  - `vendorCode`
  - `preferredCode`
  - `collaborationType`
  - estado operativo;
- atribucion comercial del pedido;
- correccion operativa de atribucion en pedidos existentes;
- motor de comisiones;
- payout preparation, payout settlement y estados asociados;
- panel vendedor como superficie operativa vigente;
- ownership y trazabilidad entre `vendors`, `orders`, `commissions`,
  `payments` y `worker`.

### Fuera de alcance

- redisenar la propuesta seller-first del negocio;
- abrir multi-vendor por pedido;
- crear marketplace o subtiendas;
- redisenar UX publica o del panel vendedor mas alla de fijar su contrato
  canonico;
- cambiar reglas comerciales, payout windows o porcentajes como parte de esta
  homologacion;
- implementar aun ajustes financieros post-payout;
- reescribir el runtime para introducir una nueva frontera tecnica distinta a
  la ya existente entre `orders`, `vendors` y `commissions`.

## Estrategia recomendada

La homologacion debe hacerse `as-is`, usando el runtime vigente como verdad
operativa y dejando las tensiones reales declaradas como gaps.

Eso implica:

- documentar el flujo seller-first de punta a punta;
- fijar ownership canonico sin reescribir el comportamiento actual;
- aceptar que hoy existe correccion operativa de `vendorCode` en pedidos;
- explicitar la frontera donde esa correccion deja de ser una edicion comercial
  y pasa a ser un problema financiero.

No conviene implementar primero. Este slice todavia necesita quedar bien
cerrado en la capa canonica para que los siguientes cambios de codigo no mezclen
atribucion, comisiones y payouts sin un lenguaje comun.

## Ownership canonico

### `vendors`

Dueno de:

- postulaciones;
- perfiles de vendedor;
- codigo comercial y `preferredCode`;
- estado operativo del vendedor;
- vinculacion de cuenta comercial y acceso al panel vendedor.

No decide:

- estado comercial del pedido;
- confirmacion de pago;
- payout de un pedido puntual ya atribuido.

### `orders`

Dueno de:

- pedido y snapshot comercial;
- `vendorCode` efectivo del pedido;
- correccion operativa de atribucion en pedidos existentes;
- auditoria del cambio de atribucion.

No decide:

- reglas de comision;
- payout;
- rotacion del codigo maestro del vendedor.

### `commissions`

Dueno de:

- reglas de comision;
- atribucion derivada desde pedidos;
- maduracion de comisiones;
- elegibilidad financiera;
- payout items;
- payouts y reversas del lado comisional.

No decide:

- la correccion primaria del `vendorCode` del pedido;
- cambios libres de atribucion sin pasar por `orders`.

### `payments`

Dueno de:

- cobros y revision operativa de pagos manuales;
- eventos de confirmacion de pago que disparan efectos posteriores.

No decide:

- atribucion de vendedor;
- payout;
- reconciliacion comercial del seller channel.

### `worker`

Dueno de:

- ejecucion asincrona de payouts y efectos posteriores.

No decide:

- asignacion de vendedor;
- reglas de comision;
- correccion de pedidos.

## Superficies canonicas

### Publico

- `/trabaja-con-nosotros`

### Backoffice

- `/vendedores`
- `/comisiones`
- `Pedidos > Operacion` para correccion de atribucion puntual
- `/accesos` para acceso comercial vinculado

### Seller

- `/panel-vendedor`

## Regla critica: correccion de atribucion post-pedido

La correccion de `vendorCode` despues de creado el pedido se homologa como
regularizacion operativa excepcional.

### Principio

- no es una edicion libre del pedido;
- no es responsabilidad de `payments`;
- no es un atajo para reescribir historia financiera;
- entra solo por `Pedidos > Operacion`.

### Ventana permitida

La correccion se permite:

- sin friccion en `pending_payment`;
- sin friccion en `payment_under_review`;
- de forma condicionada en `paid` o `confirmed`, solo si la comision todavia no
  cruzo lock financiero.

### Lock financiero

La correccion se bloquea como operacion normal cuando:

- la comision ya esta en `payable`;
- la comision ya esta en `scheduled_for_payout`;
- la comision ya esta en `paid`;
- existe `payoutId` no cancelado para el pedido o para la comision vigente;
- existe job de payout pendiente o en ejecucion para el vendor/periodo
  comprometido;
- el pedido ya entro en reversa o cancelacion con impacto financiero cerrado.

### Guardrails

- no permitir `A -> none` si ya hubo comision materializada;
- no permitir cambio a vendedor sin regla aplicable;
- no permitir correccion hacia vendedor inexistente o inactivo;
- no usar cambio del codigo maestro del vendedor para arreglar historia;
- exigir motivo auditable y before/after completos;
- preferir `A -> B` antes que vaciar vendedor cuando el frente comercial ya
  existe.

### Consecuencia canonica

- antes del lock financiero: sigue siendo correccion de atribucion comercial;
- despues del lock financiero: deja de ser correccion de pedido y pasa a ser
  ajuste financiero o reversa compensatoria.

## Artefactos canonicos a crear

### Fase 1

- `docs/fase-1-analisis-requerimientos/` con foco en seller-first:
  - captura publica;
  - onboarding;
  - codigo vendedor;
  - atribucion de pedidos;
  - comision;
  - payout;
  - panel vendedor;
  - regla canonica de correccion post-pedido.

### Fase 2

- `docs/fase-2-ux-ui/` solo para contrato UX del runtime actual:
  - `/trabaja-con-nosotros`
  - `/panel-vendedor`
  - `/admin/vendedores`
  - `/admin/comisiones`
  - `Pedidos > Operacion` como punto de correccion de atribucion

### Fase 3

- `docs/fase-3-arquitectura/` con:
  - ownership formal entre modulos;
  - lock financiero;
  - eventos y auditoria de correccion de atribucion;
  - relacion entre `orders`, `commissions`, `payments` y `worker`.

### Fase 4

- `specs/002-vendors-commissions/`
  - `spec-funcional.md`
  - `spec-tecnica.md`
  - `spec-tareas.md`
  - `traceability.md`
  - artefactos UX/SPDD si el slice los necesita

## Riesgos declarados

- hoy el runtime permite corregir `vendorCode` en pedidos, pero el recalculo de
  comisiones no esta acoplado de forma atomica a esa accion;
- limpiar el vendedor de un pedido con comision ya materializada puede dejar
  divergencia entre pedido y comision;
- una correccion tardia puede contaminar payouts, snapshots de vendedor,
  seller panel y reportes;
- la suite de pruebas actual no cubre de forma fuerte las fronteras de
  reasignacion con la implementacion real de `commissions`.

## Criterios de aceptacion del diseno

- el slice `002-vendors-commissions` queda acotado como flujo end-to-end;
- el panel vendedor queda reconocido como superficie operativa real;
- la correccion post-pedido queda fijada con una sola regla canonica;
- el lock financiero queda explicito antes de abrir implementacion;
- se identifican claramente los artefactos canonicos a crear en Fases 1-4;
- el diseno no contradice el runtime vigente ni la homologacion previa de
  `001-checkout-payments`.
