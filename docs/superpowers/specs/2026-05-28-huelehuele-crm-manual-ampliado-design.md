# Huele Huele CRM Manual Ampliado Design

Fecha: 2026-05-28.

## Objetivo

Definir el slice brownfield `009-crm-manual-ampliado` como una capa de
seguimiento manual sobre pedidos, anclada al modulo `orders`, para registrar
acciones humanas posteriores al seguimiento derivado ya homologado en
`008-crm-stage-order-follow-up`, sin convertir el dominio en un CRM general
ni moverlo hacia clientes, campañas, fulfillment o notificaciones.

## Contexto

La homologacion actual ya fijo:

- `007-customers-identity-conflicts` para maestro de clientes e identidad;
- `008-crm-stage-order-follow-up` para `crmStage` y `commercialTrace` como
  seguimiento derivado del pedido.

El gap que queda no es la etapa derivada ni la traza comercial del pedido,
sino el trabajo manual posterior que `ventas` necesita hacer sobre pedidos
ya elegibles: registrar contactos, definir siguiente paso, asignar
responsable y mantener una disciplina minima de seguimiento operativo.

## Decision De Perimetro

El slice `009` cubre:

- CRM manual ampliado **solo sobre pedidos**
- workbench manual dentro de `Pedidos > Operacion`
- listado secundario dentro del mismo modulo de `Pedidos`
- timeline manual simple
- proximo paso estructurado
- fecha objetivo de seguimiento
- tareas opcionales
- cierre y reapertura con trazabilidad

No cubre:

- timeline por cliente
- CRM general o transversal
- campañas
- mensajes enviados desde el sistema
- pipeline comercial amplio
- workbench separado fuera de `orders`

## Agregado Principal

El agregado principal del slice es `order_follow_up_case`.

Reglas canonicas:

- vive dentro del modulo `orders`
- pertenece a un solo pedido
- existe **solo un caso por pedido**
- solo puede abrirse si el pedido tiene `crmStage` relevante
- extiende el seguimiento derivado de `008`, no lo reemplaza

## Ownership

- `ventas` es owner operativo principal
- `marketing` tiene acceso operativo secundario
- `admin` y `super_admin` actuan como override
- `operador_pagos` no es owner del caso; solo afecta su lifecycle
  indirectamente a traves del pedido

## Superficies

### Superficie principal

- `Pedidos > Operacion`

El detalle del pedido aloja la experiencia principal del follow-up manual.
La intencion es mantener continuidad con el runtime actual y evitar una
segunda app mental para el usuario.

### Superficie secundaria

- vista filtrada dentro del mismo modulo `Pedidos`

Esta bandeja secundaria muestra por defecto:

- `open`
- `waiting_customer`

Y puede filtrar:

- `resolved`
- `cancelled`

No se abre una pantalla separada tipo `/crm-manual` en este corte.

## Estado Del Caso

Estados canonicos:

- `open`
- `waiting_customer`
- `resolved`
- `cancelled`

Semantica:

- `open`: el caso esta activo y el equipo tiene accion pendiente
- `waiting_customer`: el siguiente movimiento depende del cliente
- `resolved`: el seguimiento manual termino satisfactoriamente
- `cancelled`: el seguimiento deja de tener sentido por caida del pedido o
  cancelacion operativa

## Apertura Del Caso

El caso se puede abrir si:

- el pedido tiene `crmStage` relevante
- `ventas` lo abre explicitamente

Ademas:

- el sistema puede sugerir la apertura cuando el pedido queda, por ejemplo,
  `ready_for_followup`
- la sugerencia no es forzada
- no existe apertura automatica obligatoria

## Cierre Y Cancelacion Automaticos

Para mantener coherencia con `008`:

- si el pedido llega a `Delivered` o `Completed`, el caso se `resolved`
  automaticamente
- si el pedido cae, se cancela o falla comercialmente, el caso se
  `cancelled` automaticamente

Esto evita casos manuales vivos sobre pedidos ya cerrados o invalidados.

## Reapertura

El caso puede reabrirse si:

- estaba `resolved`
- el pedido sigue siendo elegible

La reapertura:

- deja una entrada `status_change`
- vuelve a exigir `nextStep`
- vuelve a exigir `followUpAt`

## Campos Canonicos Del Caso

Campos base:

- `status`
- `assignee`
- `nextStep`
- `followUpAt`
- `timeline`
- `tasks`

Reglas de disciplina:

- mientras el caso este en `open` o `waiting_customer`, `nextStep` y
  `followUpAt` son obligatorios
- cuando el caso queda `resolved` o `cancelled`, ambos campos pueden quedar
  vacios

## Timeline Manual

El caso incluye un timeline manual simple con entradas inmutables.

Cada entrada contiene:

- `type`
- `note`
- `actor`
- `createdAt`
- `referenceOrEvidence` opcional

Tipos canonicos:

- `note`
- `call`
- `whatsapp`
- `email`
- `status_change`

Reglas:

- las entradas no se editan una vez creadas
- todo cambio de estado crea una entrada `status_change` obligatoria
- se pueden registrar interacciones `whatsapp` y `email` como evidencia
  operativa, pero sin envio desde el sistema

## Tareas Opcionales

Las tareas no son obligatorias para que exista el caso.

Cada tarea contiene:

- `title`
- `status`
- `dueDate`

Estados:

- `pending`
- `done`

Reglas:

- las tareas si son editables
- sirven como apoyo operativo, no como workflow rigido

## Relacion Con `008`

`008-crm-stage-order-follow-up` sigue resolviendo:

- en que punto operativo/comercial esta el pedido
- por que ruta comercial llego a ese punto

`009-crm-manual-ampliado` agrega:

- quien lleva el seguimiento humano
- cual es el proximo paso
- cuando toca actuar
- que actividades manuales ya se hicieron

En otras palabras:

- `008` explica el estado derivado del pedido
- `009` explica la gestion manual posterior sobre ese pedido

## Guardrails

- no abrir timeline por cliente
- no mover este dominio a `customers`
- no tratarlo como pipeline comercial general
- no abrir mensajeria CRM real
- no absorber campañas
- no absorber fulfillment, dispatch ni vendedor
- no abrir multi-caso por pedido

## Arquitectura Recomendada

La opcion recomendada es:

- `order_follow_up_case` dentro de `orders`
- una sola instancia por pedido
- apertura manual con sugerencia del sistema
- cierre automatico por lifecycle del pedido
- timeline inmutable
- tareas opcionales editables

Se descartan por ahora:

- CRM manual ligado a cliente en vez de pedido
- workbench separado fuera de `Pedidos`
- automatizacion obligatoria de apertura
- mensajes enviados directamente desde este modulo

## Implicaciones Operativas

- `ventas` gana un workbench manual serio sin romper el dominio ya homologado
- la experiencia sigue centralizada en `Pedidos`
- la disciplina minima (`nextStep`, `followUpAt`, `assignee`) evita que el
  CRM manual se degrade a notas libres
- el sistema conserva coherencia automatica con el lifecycle del pedido

## Slice Siguiente Esperable

Si este slice queda homologado, el siguiente frente natural ya no es
seguimiento manual basico, sino una de estas dos cosas:

- CRM manual por cliente / timeline transversal
- automatizaciones posteriores al seguimiento manual

Pero ambos deben venir en slices distintos; no deben mezclarse en `009`.
