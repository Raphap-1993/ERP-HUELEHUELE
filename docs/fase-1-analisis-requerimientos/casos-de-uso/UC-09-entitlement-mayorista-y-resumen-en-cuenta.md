# UC-09 Entitlement Mayorista Y Resumen En Cuenta

## Objetivo

Formalizar el acceso mayorista autenticado como entitlement comercial basico
montado sobre una cuenta existente o reutilizada.

## Actores

- ventas
- admin
- usuario autenticado

## Precondiciones

- el lead ya quedo `won`
- backoffice puede crear o vincular acceso comercial
- `/cuenta` sigue siendo una superficie de resumen, no de autoservicio B2B

## Flujo principal

1. El lead queda `won`.
2. Backoffice crea o vincula acceso comercial sobre la cuenta existente.
3. `/cuenta` muestra resumen mayorista basico.
4. Si la relacion se suspende, se conserva historial y solo se apaga el
   entitlement.
5. Si el lead historico se reabre, el acceso no se reactiva automaticamente.

## Reglas canonicas

- una cotizacion `accepted` no crea acceso
- el entitlement mayorista se gana solo en `won`
- si el email ya existe, se reutiliza la misma cuenta
- la suspension no borra historial ni la cuenta base

## Resultado esperado

El mayorista aprobado accede por `/cuenta` con un resumen comercial minimo,
manteniendo trazabilidad y sin abrir un portal B2B completo.
