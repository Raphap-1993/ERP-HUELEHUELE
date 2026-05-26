# UC-08 Cotizacion Y Cierre Comercial

## Objetivo

Formalizar la emision de cotizaciones mayoristas y el cierre comercial del lead
sin convertir la aceptacion en pedido automatico.

## Actores

- ventas
- admin

## Precondiciones

- el lead ya fue calificado como oportunidad real
- existe catalogo vigente para construir la cotizacion
- la decision comercial final sigue cerrando en `won` o `lost`

## Flujo principal

1. Ventas crea `wholesale_quote`.
2. Agrega referencias reales del catalogo y condiciones editables.
3. Envia la cotizacion.
4. Actualiza avance hasta `won` o `lost`.
5. `accepted` no crea pedido automatico.

## Reglas canonicas

- la cotizacion parte del catalogo real
- el `tier` orienta, pero no bloquea la edicion comercial
- `accepted` no crea pedido ni acceso autenticado
- el acuerdo comercial solo queda cerrado en `won`

## Resultado esperado

El funnel mayorista conserva una frontera clara entre cotizar, negociar y
cerrar comercialmente, sin abrir automatismos de pedido fuera de alcance.
