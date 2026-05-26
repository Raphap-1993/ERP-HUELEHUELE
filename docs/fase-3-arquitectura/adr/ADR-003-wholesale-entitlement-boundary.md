# ADR-003: Wholesale Entitlement Boundary

Fecha: 2026-05-26.

## Estado

Aprobado para la fase 3 canonica brownfield del slice
`003-wholesale-leads-quotes`.

## Contexto

El repo ya soporta captura de leads mayoristas, cotizaciones y accesos
comerciales sobre `/cuenta`, pero el dominio necesita una frontera canonica que
evite mezclar:

- aceptacion de cotizacion,
- cierre comercial,
- y acceso mayorista activo.

Sin esa separacion, la operacion puede terminar abriendo acceso demasiado
pronto, duplicando cuentas o tratando `/cuenta` como portal B2B fuera de
alcance.

## Decision

Una cotizacion `accepted` no habilita acceso mayorista por si sola.

Solo un lead cerrado como `won` puede abrir el entitlement mayorista del slice.

## Guardrails Derivados

1. `accepted` no crea pedido.
2. `accepted` no crea acceso comercial.
3. `won` habilita la relacion comercial aprobada.
4. El entitlement se monta sobre una cuenta existente o reutilizada por email si
   ya existe.
5. Suspender el entitlement no borra la cuenta ni el historial comercial.
6. `/cuenta` expone resumen mayorista basico, no un portal mayorista
   autoservicio.

## Alternativas Rechazadas

### 1. Habilitar acceso desde `accepted`

Rechazada porque:

- mezcla negociacion con cierre comercial;
- puede abrir acceso a oportunidades aun no ganadas;
- dificulta la gobernanza del funnel comercial.

### 2. Crear siempre una cuenta separada para mayoristas

Rechazada porque:

- duplica identidad por email;
- complica trazabilidad entre cliente y relacion comercial aprobada;
- contradice la regla de acceso comercial ya vigente.

### 3. Convertir `/cuenta` en portal B2B desde este slice

Rechazada porque:

- abre alcance no aprobado;
- mezcla resumen comercial con autoservicio operativo;
- obliga a modelar order flow B2B fuera del brownfield actual.

## Consecuencias

### Positivas

- separa claramente quote, cierre comercial y acceso autenticado;
- evita duplicacion de cuentas;
- mantiene `/cuenta` dentro del alcance correcto;
- deja una regla facil de propagar a Fase 1, specs y QA.

### Negativas aceptadas

- algunas oportunidades con cotizacion aceptada seguiran sin acceso hasta que
  `Ventas` cierre la oportunidad como `won`;
- si el negocio quiere autoservicio mayorista real, tendra que abrir otro slice
  o ADR especifico.

## Regla De Reevaluacion

Esta ADR solo debe reabrirse si:

- el negocio aprueba un portal B2B autoservicio completo;
- se aprueba crear pedidos automaticos desde cotizacion aceptada;
- cambia la politica de identidad y deja de reutilizarse la cuenta existente por
  email.
