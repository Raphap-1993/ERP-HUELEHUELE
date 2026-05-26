# Product Design - Wholesale Leads Quotes

Fecha: 2026-05-26.

## Experiencia objetivo

- comercial B2B clara y seria
- seguimiento asistido por ventas, no autoservicio prematuro
- continuidad entre lead, cotizacion y relacion comercial aprobada

## Decisiones

- `Ventas` es dueno operativo principal
- `accepted` no equivale a cierre comercial ni a pedido
- `won` habilita acceso mayorista basico
- `/cuenta` refleja estado comercial, no un portal mayorista completo

## Tension principal

La UX debe dejar claro que existe una relacion comercial mayorista real, pero
sin prometer funcionalidades de autoservicio, order flow B2B ni gestion de
cotizaciones desde la cuenta autenticada.

## Resultado esperado

El slice puede evolucionar a specs y arquitectura sin perder una lectura comun
entre captura publica, operacion comercial y cuenta autenticada.
