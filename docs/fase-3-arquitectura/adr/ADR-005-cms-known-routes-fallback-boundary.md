# ADR-005 CMS Known Routes Fallback Boundary

Fecha: 2026-05-26.

## Estado

Aprobado para la fase 3 canonica brownfield del slice
`005-cms-content-blocks-marketing-surfaces`.

## Contexto

El runtime ya soporta un CMS editorial vivo con snapshot agregado, uploads de
media y consumo publico desde storefront. El problema no es crear otro CMS,
sino fijar la frontera canonica para evitar que este slice termine mezclando:

- rutas arbitrarias y page builder libre;
- campaigns, segments, templates y CRM ampliado;
- ownership editorial con ownership transaccional de `checkout`, `cuenta`,
  mayoristas o postulaciones;
- media tecnica como si fuera un agregado CMS separado del runtime actual.

Ademas, storefront ya trata el snapshot CMS como fuente opcional y usa
fallbacks cuando la carga falla. Esa tolerancia no puede romperse al
canonizar el slice.

## Decision

El CMS brownfield de Huele Huele se canoniza como dominio editorial acotado por
rutas conocidas, con bloques tipados por ruta y fallback seguro en
`web/storefront`.

La decision incluye estas reglas:

1. Solo existen los page slugs o route IDs conocidos `home`, `catalogo`,
   `mayoristas`, `trabaja-con-nosotros`, `cuenta` y `checkout`, que hoy
   resuelven a las superficies publicas `/`, `/catalogo`, `/mayoristas`,
   `/trabaja-con-nosotros`, `/cuenta` y `/checkout`.
2. Cada ruta solo admite el set de bloques tipados ya anclado en el runtime.
3. `marketing` es el owner operativo primario del contenido; `admin` y
   `super_admin` quedan como soporte y override.
4. La media del slice sigue viajando dentro de `siteSetting`; no se crea un
   objeto top-level `cms.media` en este corte.
5. `web/storefront` debe degradar a defaults seguros si el snapshot CMS falta,
   falla o llega incompleto.
6. `checkout` y `cuenta` pueden exponer copy y SEO desde CMS, pero no ceden su
   logica de negocio.
7. Campaigns, CRM ampliado y page builder libre quedan fuera del slice.

## Guardrails Derivados

1. El CMS no crea nuevos route IDs ni paths publicos fuera del set conocido.
2. El CMS no habilita bloques arbitrarios sin contrato de ruta.
3. El snapshot CMS no puede tumbar el render publico de una ruta conocida.
4. `checkout` y `cuenta` deben mantenerse con `noindex,nofollow` cuando el CMS
   asi lo defina.
5. Los uploads de media siguen siendo una capacidad tecnica del modulo
   `media`, no un dominio editorial autonomo.
6. La autorizacion de `/admin/cms` no convierte a `admin` o `super_admin` en
   aprobadores obligatorios de cada cambio.

## Alternativas Rechazadas

### 1. Abrir un page builder libre para marketing

Rechazada porque:

- rompe la homologacion `as-is`;
- elimina la frontera de rutas conocidas;
- fuerza a modelar contratos genericos que el runtime todavia no tiene.

### 2. Separar la media CMS como agregado top-level en este slice

Rechazada porque:

- contradice la verdad brownfield actual;
- obligaria a redisenar el snapshot antes de fijar ownership;
- mezcla una refactorizacion de modelo con una homologacion de fronteras.

### 3. Hacer fallar la pagina publica si el snapshot CMS no responde

Rechazada porque:

- contradice el comportamiento tolerante ya presente en storefront;
- eleva una incidencia editorial a caida de superficie publica;
- rompe la regla de fallback seguro exigida por el slice.

## Consecuencias

### Positivas

- fija una frontera editorial clara sin reabrir campaigns ni CRM;
- deja conocido el set de rutas y bloques que el CMS puede gobernar;
- protege storefront ante fallos del snapshot;
- preserva la verdad brownfield de media embebida en `siteSetting`.

### Negativas aceptadas

- el CMS sigue sin libertad de composicion fuera de las rutas conocidas;
- la media publica queda acoplada al singleton `siteSetting` hasta un corte
  futuro;
- `admin` y `super_admin` mantienen capacidad de override, lo que exige
  disciplina operativa para no invadir el ownership de `marketing`.

## Regla De Reevaluacion

Esta ADR solo debe reabrirse si:

- producto aprueba rutas arbitrarias o un page builder real;
- se decide separar media CMS como agregado propio del snapshot;
- `checkout` o `cuenta` cambian de modelo y ceden mas que copy/SEO al CMS;
- se aprueba un workflow editorial formal con aprobacion obligatoria.
