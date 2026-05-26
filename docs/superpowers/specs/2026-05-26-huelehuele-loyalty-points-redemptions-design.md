# Huele Huele Loyalty Points Redemptions Brownfield Design

Fecha: 2026-05-26.

## Objetivo

Definir el diseno del siguiente slice brownfield a homologar en
`ERP-HUELEHUELE`: `004-loyalty-points-redemptions`.

El slice debe consolidar en la capa canonica intermedia el programa de puntos
vigente de Huele Huele, cubriendo acumulacion, ledger, canjes, ajustes
manuales, reversas y visibilidad en cuenta, sin redisenar el runtime, sin
abrir un motor de loyalty avanzado y sin convertir `/cuenta` en un portal de
autoservicio de canjes.

## Contexto

La branch `codex/homologacion-capa-canonica` ya dejo homologados:

- `001-checkout-payments` como base transaccional;
- `002-vendors-commissions` como canal seller-first y su frontera financiera;
- `003-wholesale-leads-quotes` como funnel comercial B2B asistido.

El siguiente bounded context natural del producto vivo es `loyalty`, porque ya
aparece vivo en alcance, roadmap, runtime y UI:

- cuenta de puntos;
- movimientos `pending/available/reversed`;
- canjes con estados operativos;
- reglas activas de acumulacion;
- resolucion operativa desde `/admin/loyalty`;
- visibilidad del estado de puntos dentro de `/cuenta`.

El objetivo no es inventar un programa nuevo, sino formalizar el ownership, los
estados y los artefactos canonicos del loyalty ya operativo.

## Fuentes brownfield

- `docs/flows/loyalty-flow.md`
- `docs/product/scope.md`
- `docs/product/roadmap.md`
- `docs/product/roles-and-permissions.md`
- `docs/flows/checkout-openpay.md`
- `docs/architecture/modules.md`
- `docs/product/backlog-mvp.md`

Fuentes de contraste tecnico y de superficie real del repo:

- `apps/api/src/modules/loyalty/loyalty.service.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/admin/components/loyalty-workspace.tsx`
- `apps/web/components/account-workspace.tsx`
- `packages/shared/src/types/api.ts`

## Alcance del slice

### Dentro de alcance

- `loyalty_account` como cuenta de puntos por cliente autenticado;
- `loyalty_movement` como ledger operativo de acumulaciones, ajustes, canjes y
  reversas;
- acumulacion de puntos gobernada por una sola `loyalty_rule` activa;
- earn ligado a compras o pedidos elegibles;
- puntos `pending -> available` cuando el pedido cruza el hito elegible del
  dominio;
- reversa automatica de puntos si el pedido asociado luego se rechaza, cancela
  o revierte;
- canje como `redemption` operativa;
- reserva inmediata de puntos al crear un canje `pending`;
- resolucion operativa del canje desde `/admin/loyalty`;
- `reward` libre/manual como resultado del canje;
- ajustes manuales de puntos como capacidad operativa auditable;
- visibilidad en `/cuenta` de saldo, movimientos y estado de canjes;
- ownership principal de `marketing`, con `admin/super_admin` para excepcion y
  auditoria.

### Fuera de alcance

- multiples reglas activas de acumulacion simultaneas;
- catalogo formal de recompensas;
- autoservicio de canje desde `/cuenta`;
- descuento automatico inline en checkout por loyalty;
- expiracion fuerte como comportamiento canonico del slice;
- programa de gamificacion o campañas loyalty avanzadas;
- puntos sobre compras invitadas como caso canonico.

## Estrategia recomendada

La homologacion debe hacerse `as-is`, usando el comportamiento real del runtime
como verdad operativa y dejando explicitas las brechas del modelo.

Eso implica:

- homologar el ciclo completo `earn -> pending -> available -> redemption`;
- mantener una sola `loyalty_rule` activa a la vez;
- tratar los puntos como saldo de una cuenta cliente autenticada;
- reservar puntos en cuanto el canje queda `pending`;
- resolver el canje en `/admin/loyalty`;
- mantener `/cuenta` como superficie de visibilidad y no de autoservicio.

No conviene abrir primero un rediseño de loyalty, un catálogo de recompensas ni
un autoservicio del cliente. Este slice primero necesita fijar lenguaje canonico
para que futuros cambios no mezclen checkout, ledger, promociones y canjes sin
una semantica comun.

## Approaches evaluados

### 1. Loyalty operativo as-is

Incluye cuenta de puntos, ledger, regla activa unica, canjes pendientes,
resolucion en admin y visibilidad en `/cuenta`.

Ventajas:

- calza con el runtime real;
- cierra el dominio end-to-end;
- evita abrir un programa mas ambicioso sin base comun.

Costo:

- `/cuenta` queda como visibilidad, no como autoservicio real;
- `reward` sigue siendo libre/manual y no catalogada.

### 2. Loyalty con autoservicio ligero

Mantiene el ledger actual, pero agrega solicitud de canjes desde `/cuenta`.

Ventaja:

- mejora experiencia cliente.

Costo:

- ya abre mas UX, concurrencia y soporte;
- se aleja del estado `as-is`.

### 3. Loyalty engine comercial ampliado

Introduce multiples reglas, catalogo de recompensas y relacion directa con
campañas o segmentacion.

Ventaja:

- mas potencia para marketing.

Costo:

- ya no es homologacion brownfield; seria rediseño funcional.

### Opcion elegida

Se elige la opcion `1`: loyalty operativo `as-is`.

## Ownership canonico

### `marketing`

Dueno de:

- operacion diaria del programa loyalty;
- reglas de acumulacion vigentes;
- aprobacion o cancelacion de canjes;
- ajustes operativos normales;
- seguimiento del saldo y del estado del cliente frente al programa.

No decide:

- estados de pago del pedido;
- identidad tecnica del usuario;
- pricing o promociones del checkout.

### `loyalty`

Dueno de:

- `loyalty_account`;
- `loyalty_movement`;
- `redemption`;
- `loyalty_rule`;
- contabilidad del saldo disponible, pendiente y redimido.

No decide:

- confirmacion del pago;
- cambio primario de estado del pedido;
- autoria de la cuenta cliente.

### `orders`

Dueno de:

- determinar cuando un pedido cruza el hito elegible del dominio;
- disparar earn, settlement o reversa del loyalty asociado al pedido.

No decide:

- reglas del programa loyalty;
- aprobacion del canje;
- ajustes manuales de puntos.

### `auth` y `customers`

Dueno de:

- identidad de la cuenta cliente;
- sesion;
- vinculo entre usuario autenticado y cuenta loyalty.

No decide:

- si un pedido gana puntos;
- si un canje se aplica o cancela.

## Superficies canonicas

### Publico / cuenta

- `/cuenta` como entrada autenticada
- resumen de puntos disponibles
- puntos pendientes
- movimientos
- estado de canjes

No existe en este slice:

- boton de canje autoservicio;
- catalogo de recompensas navegable;
- aplicacion de canje durante checkout.

### Backoffice

- `/admin/loyalty`
- operacion de reglas
- ajustes manuales
- revision de cuentas
- revision y resolucion de canjes

### Integracion transaccional

- evaluacion de earn desde `orders`
- settlement cuando el pedido queda elegible
- reversa automatica cuando el pedido se invalida

## Regla critica: reserva y resolucion del canje

La regla mas sensible del slice es impedir doble gasto mientras el canje esta en
revision.

### Principio

- el cliente no puede gastar puntos dos veces sobre el mismo saldo;
- al crear un canje `pending`, los puntos se reservan de inmediato;
- los puntos reservados salen de `available` y quedan retenidos;
- el canje no se consume definitivamente hasta una decision operativa;
- la resolucion vive en `/admin/loyalty`.

### `pending`

- crea `redemption`;
- reserva puntos;
- baja `available`;
- evita nuevos canjes sobre ese mismo saldo.

### `applied`

- consume definitivamente los puntos reservados;
- deja trazabilidad del beneficio entregado;
- cierra el canje como beneficio aplicado.

### `cancelled`

- libera los puntos reservados;
- devuelve el saldo a `available`;
- conserva la auditoria del intento y de la decision.

## Reglas funcionales canonicas del slice

- los puntos pertenecen a una cuenta cliente autenticada.
- la compra invitada no es el caso canonico del programa.
- existe una sola `loyalty_rule` activa de acumulacion a la vez.
- la acumulacion depende de elegibilidad del pedido, no de cualquier compra en
  abstracto.
- los puntos nacen en `pending` y se vuelven `available` cuando el pedido queda
  efectivamente elegible.
- el canje no es inline en checkout; es un proceso operativo separado.
- el canje `pending` reserva puntos de inmediato.
- `marketing` es el dueno operativo principal del programa.
- `admin` y `super_admin` entran por excepcion y auditoria.
- la recompensa del canje es libre/manual en este estado del runtime.
- si el pedido se rechaza, cancela o revierte, la reversa de puntos es
  automatica.
- `/cuenta` muestra visibilidad del programa, pero no autoservicio de canje.

## Estados canonicos

### Loyalty movement

- `pending`
- `available`
- `reversed`
- `expired` como capacidad futura ya visible en vocabulario, no como
  comportamiento fuerte del slice

### Redemption

- `pending`
- `applied`
- `cancelled`

### Loyalty rule

No se fuerza un motor nuevo, pero el slice debe poder expresar al menos:

- regla activa unica;
- regla inactiva;
- puntos por unidad o criterio equivalente vigente.

## Riesgos y tensiones del estado actual

- asignar puntos demasiado pronto, antes del hito elegible real;
- sobregiro del saldo si el canje no reserva puntos;
- confundir canje con descuento automatico de checkout;
- mezclar loyalty con promociones o pricing del pedido;
- operar puntos sobre identidades ambiguas o cuentas no autenticadas;
- abrir autoservicio antes de tener semantica canonica del ledger;
- introducir expiracion fuerte sin politica temporal bien definida.

## Artefactos canonicos a crear

### Fase 1

- documento rector del slice loyalty;
- casos de uso de acumulacion, canje, ajustes y reversas;
- reglas funcionales del ledger y del canje.

### Fase 2

- contrato UX del resumen de loyalty en `/cuenta`;
- contrato UX de `/admin/loyalty`;
- lectura visible del programa en superficies autenticas y operativas.

### Fase 3

- ownership entre `loyalty`, `orders`, `marketing`, `auth` y `customers`;
- frontera entre earn, settlement, reversal y redemption;
- regla canonica de reserva de puntos en canjes pendientes.

### Fase 4 / specs

- `specs/004-loyalty-points-redemptions/`
- `spec-funcional.md`
- `spec-tecnica.md`
- `spec-tareas.md`
- `traceability.md`

## Resultado esperado

Si este slice queda bien homologado:

- Huele Huele tendra una capa canonica clara para el programa de puntos;
- el dominio loyalty dejara de depender solo de flujo tematico y lectura de
  runtime;
- el siguiente agente podra continuar la homologacion sin reabrir decisiones
  clave de saldo, canje y ownership;
- se podra decidir con mas criterio si el siguiente paso es `marketing/CRM`,
  `CMS` o implementacion real sobre algun slice ya canonizado.
