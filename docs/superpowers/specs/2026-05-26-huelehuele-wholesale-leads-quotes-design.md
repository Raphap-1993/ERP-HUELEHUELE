# Huele Huele Wholesale Leads Quotes Brownfield Design

Fecha: 2026-05-26.

## Objetivo

Definir el diseno del siguiente slice brownfield a homologar en
`ERP-HUELEHUELE`: `003-wholesale-leads-quotes`.

El slice debe consolidar en la capa canonica intermedia el funnel comercial
real de leads mayoristas y distribuidores, sin redisenar el runtime, sin abrir
un portal B2B autoservicio completo y sin mezclar esta homologacion con
automatizaciones futuras.

## Contexto

La branch `codex/homologacion-capa-canonica` ya dejo homologados:

- `001-checkout-payments` como base transaccional;
- `002-vendors-commissions` como canal seller-first y su frontera financiera.

El siguiente bounded context natural del producto vivo es `wholesale-leads +
quotes`, porque cierra el frente comercial B2B que ya aparece en alcance,
flujo y roadmap:

- captura publica de leads mayoristas o distribuidores;
- calificacion y seguimiento comercial por ventas;
- generacion de cotizaciones;
- cierre `won/lost`;
- acceso comercial aprobado sobre `/cuenta` como resumen basico, no como portal
  mayorista completo.

El objetivo no es construir un modulo nuevo, sino formalizar el ownership, los
estados y los artefactos canonicos del funnel ya vivo.

## Fuentes brownfield

- `docs/flows/wholesale-flow.md`
- `docs/flows/commercial-accesses.md`
- `docs/product/scope.md`
- `docs/product/roadmap.md`
- `docs/product/roles-and-permissions.md`
- `docs/architecture/modules.md`
- `docs/api/api-v1-outline.md`
- `docs/api/implemented-endpoints-inventory.md`

Fuentes de contraste tecnico y de superficie real del repo:

- `apps/admin/lib/api.ts`
- `apps/web/components/account-workspace.tsx`
- `packages/shared/src/types/api.ts`
- cualquier workspace o ruta admin vigente relacionada con leads y cotizaciones
  mayoristas cuando se abra Fase 2 / Fase 3 del slice.

## Alcance del slice

### Dentro de alcance

- formulario publico mayorista / distribuidores;
- `interestType = wholesale | distributor` dentro del mismo modulo;
- captura y persistencia del `wholesale_lead`;
- deduplicacion operativa y revision humana;
- ownership comercial de `Ventas`;
- funnel comercial del lead:
  - `new`
  - `qualified`
  - `quoted`
  - `negotiating`
  - `won`
  - `lost`;
- cotizacion mayorista:
  - basada en referencias reales del catalogo;
  - precio, volumen y condiciones editables por ventas;
  - estados:
    - `draft`
    - `sent`
    - `accepted`
    - `rejected`
    - `expired`;
- `tier mayorista` como referencia comercial editable;
- cierre comercial `won/lost`;
- acceso comercial aprobado sobre una cuenta existente o reutilizada por email;
- resumen mayorista basico dentro de `/cuenta`.

### Fuera de alcance

- portal B2B autoservicio completo;
- pedido automatico al aceptar o ganar una cotizacion;
- identidad B2B separada si ya existe cuenta cliente con el mismo email;
- pricing mayorista rigido por tier;
- fusion automatica de leads duplicados;
- aprobacion interna obligatoria para cada cotizacion;
- aceptar o rechazar cotizaciones desde `/cuenta`;
- nuevas reglas de comision o cruce con seller-first dentro del mismo slice.

## Estrategia recomendada

La homologacion debe hacerse `as-is`, usando el funnel comercial vigente como
verdad operativa y dejando explicitas las brechas reales del modelo.

Eso implica:

- homologar el funnel completo `lead -> calificacion -> cotizacion -> cierre`;
- mantener a `Ventas` como dueno operativo principal;
- tratar `wholesale` y `distributor` como variantes del mismo flujo mediante
  `interestType`;
- modelar el `tier mayorista` como referencia editable, no como tarifa
  automatica;
- mantener el acceso autenticado del mayorista en `/cuenta` como resumen basico
  de relacion comercial, no como portal de autoservicio.

No conviene abrir implementacion primero. Este slice todavia necesita fijar su
lenguaje canonico para que futuros cambios de codigo no mezclen lead capture,
quotes, accesos comerciales y cuentas cliente sin una semantica comun.

## Approaches evaluados

### 1. Funnel comercial completo as-is

Incluye captura publica, calificacion, cotizacion, cierre comercial y
entitlement mayorista basico en `/cuenta`.

Ventajas:

- cierra la narrativa end-to-end del dominio;
- sigue el producto vivo;
- evita abrir antes de tiempo un portal B2B completo.

Costo:

- obliga a modelar con claridad la diferencia entre lead historico y relacion
  comercial aprobada.

### 2. Solo lead + quote

Mas estrecho y mas rapido, pero deja fuera el acceso comercial posterior y
corta la narrativa comercial del modulo.

### 3. Lead + quote + mini portal mayorista

Abre demasiado alcance y contradice varias decisiones ya tomadas para evitar un
autoservicio B2B prematuro.

### Opcion elegida

Se elige la opcion `1`: funnel comercial completo `as-is`.

## Ownership canonico

### `ventas`

Dueno de:

- captura operativa del lead una vez que entra al admin;
- calificacion;
- deduplicacion;
- creacion y envio de cotizaciones;
- seguimiento y cierre comercial;
- decision de marcar `won` o `lost`.

No decide:

- creacion automatica de pedidos;
- acceso comercial tecnico por fuera de backoffice;
- mezcla de identidad mayorista con vendedor.

### `wholesale`

Dueno del dominio funcional de:

- `wholesale_lead`;
- `wholesale_quote`;
- `wholesale_quote_items`;
- `interestType`;
- estados comerciales y trazabilidad del funnel.

No decide:

- checkout o order flow directo;
- RBAC global del sistema;
- comisiones seller-first.

### `commercial-access`

Dueno de:

- aplicar o suspender el entitlement mayorista;
- reutilizar o vincular cuenta existente por email;
- exponer el resumen mayorista dentro de `/cuenta`.

No decide:

- calificacion del lead;
- pricing o contenido de la cotizacion;
- conversion automatica a pedido.

### `auth`

Dueno de:

- identidad de cuenta;
- sesion;
- acceso autenticado.

No decide:

- si el lead es `won` o `lost`;
- si el entitlement mayorista se habilita.

## Superficies canonicas

### Publico

- landing o bloque `mayoristas / distribuidores`
- formulario de captura mayorista

### Backoffice

- listado y detalle de leads mayoristas
- creacion y seguimiento de cotizaciones
- asignacion de tier
- cierre comercial y cambio de estado
- creacion o suspension del entitlement mayorista

### Cuenta autenticada

- `/cuenta` como entrada general
- resumen mayorista basico dentro de `/cuenta`

No existe en este slice:

- portal mayorista completo;
- aceptacion/rechazo de cotizacion desde la cuenta;
- panel B2B independiente.

## Regla critica: entitlement mayorista

La regla mas sensible del slice es separar el historico del funnel de la
relacion comercial aprobada.

### Principio

- una cotizacion `accepted` no gana acceso por si sola;
- el entitlement mayorista se gana solo en `won`;
- el entitlement se monta sobre una cuenta existente o reutilizada por email;
- la relacion mayorista aprobada no crea otra identidad si el usuario ya era
  cliente final;
- una vez ganado, el entitlement no depende del replay del funnel historico.

### Alta

Un lead puede ganar entitlement mayorista solo cuando:

- el estado del lead queda `won`;
- existe decision comercial explicita;
- backoffice crea o vincula el acceso comercial correspondiente.

### Suspension

El entitlement se suspende solo por:

- accion comercial explicita;
- relacion inactiva marcada por backoffice.

La suspension:

- conserva historial;
- no elimina la cuenta;
- solo apaga el acceso mayorista activo.

### Reapertura

- un lead `lost` puede reabrirse;
- el historico se conserva;
- la reapertura no reactiva automaticamente un entitlement suspendido.

## Reglas funcionales canonicas del slice

- `wholesale` y `distributor` comparten modulo y funnel; cambia solo
  `interestType` y las condiciones comerciales asociadas.
- los duplicados no se fusionan automaticamente; se marcan para revision.
- la cotizacion se arma sobre referencias reales del catalogo.
- ventas puede ajustar precio, volumen y condiciones.
- el `tier mayorista` orienta, pero no bloquea la edicion comercial.
- ventas puede enviar cotizaciones sin aprobacion interna previa obligatoria en
  este corte.
- `accepted` no crea pedido automatico.
- `won` significa acuerdo comercial cerrado y habilita relacion comercial
  aprobada.
- `/cuenta` solo muestra estado comercial, tier, responsable y ultima
  cotizacion o estado actual.
- un mayorista aprobado no obtiene codigo de vendedor ni comisiones por este
  slice.

## Estados canonicos

### Lead

- `new`
- `qualified`
- `quoted`
- `negotiating`
- `won`
- `lost`

### Quote

- `draft`
- `sent`
- `accepted`
- `rejected`
- `expired`

### Relacion comercial

No se fuerza un agregado nuevo en esta etapa, pero el slice debe poder expresar
al menos:

- acceso mayorista activo;
- acceso mayorista suspendido;
- historial comercial preservado.

## Riesgos y tensiones del estado actual

- confundir lead capture con auto-registro B2B;
- duplicar cuentas por email entre cliente y mayorista;
- abrir acceso mayorista a un lead aun no ganado;
- asumir que `accepted` equivale a pedido;
- mezclar el historico del funnel con el estado actual de la relacion
  comercial;
- abrir condiciones mayoristas a usuarios no aprobados.

## Artefactos canonicos a crear

### Fase 1

- documento rector del slice mayorista;
- casos de uso de captura, cotizacion, cierre y acceso comercial;
- reglas funcionales del funnel y del entitlement.

### Fase 2

- contrato UX del formulario mayorista;
- contrato UX del workspace de leads / quotes;
- contrato UX del resumen mayorista en `/cuenta`.

### Fase 3

- ownership entre `ventas`, `wholesale`, `commercial-access` y `auth`;
- frontera entre `accepted`, `won` y `order`;
- regla canonica del entitlement mayorista.

### Fase 4 / specs

- `specs/003-wholesale-leads-quotes/`
- `spec-funcional.md`
- `spec-tecnica.md`
- `spec-tareas.md`
- `traceability.md`

## Resultado esperado

Si este slice queda bien homologado:

- Huele Huele tendra una capa canonica clara para el dominio B2B comercial;
- el funnel mayorista dejara de depender solo de documentos tematicos sueltos;
- el siguiente agente podra continuar la homologacion sin reabrir decisiones de
  negocio ya cerradas;
- se podra decidir con mas criterio si el siguiente paso es otro slice
  brownfield o implementacion real sobre alguno de los slices ya canonizados.
