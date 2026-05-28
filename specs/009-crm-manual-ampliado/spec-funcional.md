# Spec Funcional - CRM Manual Ampliado

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - CRM Manual Ampliado](../../docs/fase-1-analisis-requerimientos/01.08-crm-manual-ampliado.md),
  [Reglas de crm manual ampliado](../../docs/fase-1-analisis-requerimientos/reglas/crm-manual-ampliado.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.08-crm-manual-ampliado-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.11-crm-manual-ampliado.md),
  [ADR-009 Orders Manual Follow-Up Boundary](../../docs/fase-3-arquitectura/adr/ADR-009-orders-manual-follow-up-boundary.md)

## Objetivo

Definir el slice canonico vigente del CRM manual ampliado sobre pedidos como
paquete SDD, fijando a `orders` como agregado principal, formalizando
`order_follow_up_case`, timeline manual, `assignee`, `nextStep`,
`followUpAt`, tareas opcionales y cierre o reapertura coherentes con el
lifecycle del pedido, sin convertir el dominio en CRM por cliente ni en
mensajeria comercial.

## Alcance

Incluye:

- `orders` como agregado operativo principal
- `order_follow_up_case`
- un caso manual por pedido
- apertura explicita por `ventas`
- `assignee`
- `nextStep`
- `followUpAt`
- timeline manual con tipos canonicos
- tareas opcionales
- bandeja filtrada de casos manuales dentro de `Pedidos`
- cierre automatico por lifecycle del pedido
- reapertura controlada con trazabilidad

No incluye:

- CRM por cliente
- timeline comercial transversal
- campaigns
- mensajeria enviada desde el sistema
- fulfillment
- dispatch
- vendor assignment
- dashboards

## Actores

- `ventas`
- `marketing`
- `admin`
- `super_admin`
- `orders`

## Reglas Funcionales Canonicas

### RF-01. Ownership operativo del slice

- `ventas` es el dueno operativo principal del caso manual
- `marketing` tiene acceso operativo secundario
- `admin` y `super_admin` conservan override
- el ownership funcional del slice permanece en `orders`

### RF-02. `orders` es el agregado principal

- la unidad operativa central del slice es el pedido
- `order_follow_up_case` vive dentro del pedido
- el slice no introduce un CRM transversal sobre clientes

### RF-03. Un solo caso por pedido

- solo existe un `order_follow_up_case` por pedido
- el caso solo puede abrirse sobre pedidos con `crmStage` relevante
- el slice no soporta multi-caso ni historial paralelo en este corte

### RF-04. Estados canonicos del caso

- el caso usa `open`
- el caso usa `waiting_customer`
- el caso usa `resolved`
- el caso usa `cancelled`

### RF-05. Campos canonicos obligatorios

- el caso expone `assignee`
- el caso expone `nextStep`
- el caso expone `followUpAt`
- mientras el caso este en `open` o `waiting_customer`, `nextStep` y
  `followUpAt` son obligatorios

### RF-06. Timeline manual estructurado

- el timeline usa `note`, `call`, `whatsapp`, `email` y `status_change`
- cada entrada guarda actor, fecha, nota y evidencia opcional
- las entradas del timeline son inmutables
- todo cambio de estado crea una entrada `status_change`

### RF-07. Tareas opcionales editables

- las tareas no son obligatorias para abrir el caso
- cada tarea usa `title`, `status` y `dueDate`
- las tareas usan `pending` y `done`
- las tareas si se pueden editar o marcar completas

### RF-08. Cierre automatico por lifecycle del pedido

- `Delivered` y `Completed` resuelven automaticamente el caso
- si el pedido cae, se cancela o falla comercialmente, el caso se cancela
  automaticamente
- el cierre automatico conserva la historia del timeline

### RF-09. Reapertura controlada

- el caso puede reabrirse si el pedido sigue elegible
- la reapertura crea `status_change`
- la reapertura vuelve a exigir `nextStep` y `followUpAt`

### RF-10. Superficie visible del slice

- `Pedidos > Operacion` es la superficie visible principal
- la bandeja secundaria vive dentro del mismo modulo de `Pedidos`
- la bandeja muestra por defecto casos `open` y `waiting_customer`
- el slice no abre una app separada de CRM manual

### RF-11. Sin CRM por cliente ni mensajeria real

- el slice no abre timeline por cliente
- el slice no envia mensajes desde el sistema
- el slice no absorbe campaigns, fulfillment ni dashboards

## Escenarios Principales

### Escenario A. Apertura y asignacion del caso manual

1. El pedido ya tiene `crmStage` relevante.
2. `ventas` abre el caso manual.
3. Se asigna responsable.
4. Se registran `nextStep` y `followUpAt`.
5. El pedido queda con un solo caso manual activo.

### Escenario B. Seguimiento manual en curso

1. El caso ya existe y sigue abierto.
2. `ventas` o `marketing` agregan entradas al timeline.
3. El caso puede recibir tareas opcionales.
4. El workbench mantiene visible que sigue y cuando actuar.
5. El caso continua en `open` o `waiting_customer`.

### Escenario C. Cierre por operacion humana

1. `ventas` decide cerrar el caso.
2. El caso cambia a `resolved` o `cancelled`.
3. El timeline registra `status_change`.
4. `nextStep` y `followUpAt` pueden quedar vacios.
5. La bandeja ya no lo muestra por defecto.

### Escenario D. Cierre automatico por lifecycle del pedido

1. El pedido avanza a `Delivered` o `Completed`.
2. `orders` resuelve automaticamente el caso.
3. Si el pedido cae o falla comercialmente, `orders` lo cancela.
4. La historia del caso se conserva.
5. La vista operativa refleja el nuevo estado.

### Escenario E. Reapertura controlada

1. El caso estaba `resolved`.
2. El pedido sigue siendo elegible.
3. `ventas` reabre el caso.
4. Se crea `status_change`.
5. Se vuelven a exigir `nextStep` y `followUpAt`.

## Criterios De Aceptacion

| ID | Criterio |
| --- | --- |
| CA-01 | `orders` queda fijado como agregado principal del slice |
| CA-02 | `ventas` queda fijado como owner operativo principal |
| CA-03 | el slice queda limitado a un solo caso por pedido |
| CA-04 | el caso solo se abre sobre pedidos con `crmStage` relevante |
| CA-05 | `assignee`, `nextStep` y `followUpAt` quedan formalizados |
| CA-06 | el timeline manual queda canonizado con tipos y entradas inmutables |
| CA-07 | las tareas opcionales quedan formalizadas como editables |
| CA-08 | el cierre automatico por lifecycle del pedido queda canonizado |
| CA-09 | la reapertura controlada vuelve a exigir disciplina del caso |
| CA-10 | `Pedidos > Operacion` queda fijado como superficie principal del slice |
| CA-11 | la bandeja secundaria queda dentro de `Pedidos` |
| CA-12 | el slice no abre CRM por cliente, campaigns ni mensajeria real |

## Casos Negativos Relevantes

- intentar abrir el caso sobre un pedido sin `crmStage` relevante: incorrecto
- intentar crear un segundo caso sobre el mismo pedido: incorrecto
- dejar `open` o `waiting_customer` sin `nextStep` o `followUpAt`:
  incorrecto
- editar entradas previas del timeline: incorrecto
- tratar la bandeja secundaria como modulo CRM separado: incorrecto
