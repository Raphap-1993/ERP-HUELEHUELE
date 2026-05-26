# UC-07 Captura Y Calificacion Mayorista

## Objetivo

Formalizar la captura publica mayorista y su calificacion operativa dentro del
funnel compartido de `wholesale` y `distributor`.

## Actores

- prospecto mayorista
- ventas
- admin

## Precondiciones

- existe formulario publico mayorista/distribuidor conectado a API
- la captura usa `interestType = wholesale | distributor`
- la revision comercial sigue siendo responsabilidad de ventas/backoffice

## Flujo principal

1. El prospecto completa el formulario mayorista.
2. La API crea `wholesale_lead`.
3. Ventas revisa, deduplica y asigna estado.
4. El lead avanza a `qualified` o se descarta.

## Reglas canonicas

- `wholesale` y `distributor` comparten el mismo modulo de captura
- los duplicados se marcan para revision; no se fusionan automaticamente
- la captura publica no crea cuenta ni credenciales comerciales
- ventas deja trazabilidad del estado y responsable comercial

## Resultado esperado

Huelegood gana un punto de entrada mayorista trazable, donde cada lead puede
revisarse, calificarse o descartarse sin confundir captura con onboarding B2B.
