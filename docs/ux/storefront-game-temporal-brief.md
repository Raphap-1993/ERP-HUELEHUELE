# Brief Operativo: Storefront Game Temporal

[README principal](../../README.md) | [Indice docs](../README.md) | [Spec de superficies](./public-storefront-surface-spec.md) | [Componentes y estados](./storefront-component-state-spec.md)

## Objetivo

Trasladar el lenguaje `storefront-v2-game` a las superficies publicas reales de compra sin convertir el storefront en un juguete ni romper contratos de producto, stock, variantes, checkout o acceso comercial.

## Tesis Del Corte

- el baseline `game` se usa como `lenguaje visual temporal`
- el runtime real sigue gobernando producto, CMS, pricing, stock, checkout y auth
- la UX nueva debe sentirse mas memorable y diferenciada
- la compra debe seguir leyendo como ecommerce serio, no como demo tematica

## Superficies De Esta Implementacion

### En alcance directo

- `/`
- `/catalogo`
- `/producto/[slug]`

### En alcance indirecto

- `/checkout`
- `/mayoristas`
- `/cuenta`
- `/panel-vendedor`

En esta ola indirecta no se reescribe su logica. Solo se alinean contratos visuales, tokens y criterio de continuidad para que no queden fuera del nuevo lenguaje.

## No Negociables

- no hardcodear catalogo vendible en produccion
- no degradar precio, stock, variante o totales por decisiones esteticas
- no usar naming arcade como copy productivo final
- no tocar la semantica de checkout, auth o overview comercial
- `variantId` sigue siendo la unidad canonica de compra

## Direccion Visual

- paneles mas marcados
- contraste y framing mas audaces
- atmosfera retro-ludica reinterpretada, no literal
- tipografia dual:
  - display/pixel para acentos, eyebrow, labels cortos
  - fuente legible para descripcion, precio, soporte y lectura larga
- motion corto y controlado

## Traduccion Del Baseline Game A Produccion

### Se conserva

- sensacion de mundo propio
- panelizacion
- chips, badges y bloques de progreso
- CTA con mas personalidad
- composiciones menos genericas

### Se elimina o modera

- quests, guilds, victory, NPC y naming de videojuego como copy central
- currency ficticia
- formularios fake
- checkout tematico desconectado del flujo real
- navigation labels no canonicos

## Instrucciones Por Rol

### `Aether`

- priorizar jerarquia, legibilidad y narrativa comercial
- usar el estilo game como atmosfera, no como disfraz

### `Neon`

- mover las rutas reales a primitivas compartidas `game-temporal`
- evitar duplicar logica de compra o estado en cada superficie

### `Pulse`

- limitar motion a enter, hover y micro feedback
- respetar `prefers-reduced-motion`

## Criterio De Aceptacion

- home real deja de depender de `storefront-v2-premium`
- catalogo y PDP reales comparten un lenguaje coherente con el baseline temporal
- la accion primaria de compra queda unificada por helper y no por texto duplicado en cada componente
- la documentacion deja claro que este look puede mutar despues sin invalidar contratos
