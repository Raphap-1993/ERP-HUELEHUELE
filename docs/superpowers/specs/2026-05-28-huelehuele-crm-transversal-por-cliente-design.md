# Huele Huele CRM Transversal Por Cliente Design

Fecha: 2026-05-28.

## Objetivo

Definir el slice brownfield `010-crm-transversal-por-cliente` como una capa
de relacion comercial activa sobre el cliente canonico, anclada al dominio
`customers`, para operar seguimiento transversal por cliente sin mezclar el
maestro de identidad de `007` ni el seguimiento manual por pedido de `009`,
sin convertir el dominio en pipeline comercial amplio, campaign engine o
mensajeria real.

## Contexto

La homologacion actual ya fijo:

- `007-customers-identity-conflicts` para maestro de clientes e identidad;
- `009-crm-manual-ampliado` para seguimiento manual sobre pedidos
  especificos;
- `006-campaigns-marketing-automation` para campaigns, segments y
  templates.

El gap que queda no es la identidad del cliente ni el seguimiento puntual de
un pedido, sino la relacion comercial activa con el cliente como cuenta:
quien es el owner comercial, cual es el siguiente movimiento, cuando toca
retomarlo y como se entiende su contexto comercial sin duplicar la historia
transaccional.

## Decision De Perimetro

El slice `010` cubre:

- CRM transversal **sobre cliente canonico**
- workbench comercial dentro de `/crm`
- listado secundario dentro del mismo modulo `/crm`
- timeline transversal del cliente
- `commercialOwner`
- `assignee`
- `nextStep`
- `followUpAt`
- tareas opcionales
- clasificacion comercial simple
- origen canonico del caso
- referencias read-only a pedidos y a casos de `009`
- cierre y reapertura con trazabilidad

No cubre:

- identidad canonica del cliente como dominio principal
- seguimiento manual detallado de un pedido especifico
- pipeline comercial amplio
- oportunidades complejas
- campaigns
- scoring automatico
- mensajes enviados desde el sistema
- workbench separado fuera de `/crm`

## Agregado Principal

El agregado principal del slice es `customer_relationship_case`.

Reglas canonicas:

- vive sobre el cliente canonico
- existe **solo un caso por cliente**
- solo existe cuando el cliente entra a trabajo comercial activo
- puede existir aunque el cliente todavia no tenga pedidos
- referencia pedidos y casos de `009` como contexto, pero no los reemplaza

## Ownership

- `ventas` es owner operativo principal
- `marketing` tiene acceso operativo secundario
- `admin` y `super_admin` actuan como override
- `customers` sigue siendo el dominio del cliente canonico
- `orders` y `009` solo aportan contexto de referencia

## Superficies

### Superficie principal

- detalle del cliente dentro de `/crm`

El cliente canonico sigue siendo el centro natural del slice. La intencion es
mantener continuidad con `007` y evitar una segunda app mental para la misma
relacion comercial.

### Superficie secundaria

- listado filtrado dentro de `/crm`

Esta bandeja secundaria muestra por defecto:

- `open`
- `waiting_customer`

Y puede filtrar:

- `dormant`
- `resolved`

No se abre una pantalla separada tipo `/crm-transversal` en este corte.

## Estado Del Caso

Estados canonicos:

- `open`
- `waiting_customer`
- `dormant`
- `resolved`

Semantica:

- `open`: la relacion comercial esta activa y hay accion pendiente
- `waiting_customer`: el siguiente movimiento depende del cliente
- `dormant`: la relacion queda pausada o enfriada por decision manual
- `resolved`: el frente comercial activo ya se cerro satisfactoriamente

## Apertura Del Caso

El caso se puede abrir si:

- el cliente entra a trabajo comercial activo
- `ventas` o `marketing` lo abren explicitamente

Ademas:

- el sistema puede sugerir la apertura por senales del runtime
- la sugerencia no es forzada
- no existe apertura automatica obligatoria

## Cierre, Dormancy Y Reapertura

El caso se puede mover manualmente a:

- `resolved`
- `dormant`

Reglas:

- `dormant` es manual en este corte, no derivado por cron
- el caso puede cerrarse aunque el cliente siga teniendo pedidos o casos
  historicos
- el caso puede reabrirse desde `resolved` o `dormant`
- la reapertura deja una entrada `status_change`
- la reapertura vuelve a exigir `nextStep` y `followUpAt`

## Campos Canonicos Del Caso

Campos base:

- `status`
- `commercialOwner`
- `assignee`
- `nextStep`
- `followUpAt`
- `classification`
- `origin`
- `timeline`
- `tasks`

Reglas de disciplina:

- mientras el caso este en `open` o `waiting_customer`, `nextStep` y
  `followUpAt` son obligatorios
- cuando el caso queda `dormant` o `resolved`, ambos campos pueden quedar
  vacios

## Clasificacion Comercial

La clasificacion comercial vive en `010`, no en `007`.

Valores canonicos:

- `prospect`
- `active`
- `inactive`
- `key_account`

Reglas:

- la clasificacion es manual en este corte
- describe la relacion comercial, no la identidad del cliente

## Origen Del Caso

El caso incluye `origin` canonico.

Valores canonicos:

- `manual_outreach`
- `post_sale_followup`
- `reactivation`
- `service_issue`

Regla:

- el origen explica por que existe el caso transversal del cliente

## Timeline Transversal Del Cliente

El caso incluye un timeline manual con entradas inmutables.

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
- `order_reference`
- `follow_up_reference`

Reglas:

- las entradas no se editan una vez creadas
- todo cambio de estado crea una entrada `status_change`
- `order_reference` y `follow_up_reference` aparecen automaticamente y en
  modo read-only
- el timeline no duplica toda la historia transaccional del cliente

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
- siguen el mismo modelo simple de `009`
- sirven como apoyo operativo, no como workflow rigido

## Resumen Comercial Del Cliente

El detalle del cliente debe exponer un resumen comercial corto con:

- `commercialOwner`
- `assignee`
- `status`
- `nextStep`
- `followUpAt`
- ultimas referencias relevantes

La meta es que el usuario no tenga que leer todo el timeline para entender
el estado comercial actual del cliente.

## Relacion Con `007` Y `009`

`007-customers-identity-conflicts` sigue resolviendo:

- quien es el cliente canonico
- como se corrige su identidad
- como se fusionan clientes y se regularizan referencias

`009-crm-manual-ampliado` sigue resolviendo:

- que seguimiento humano tiene un pedido especifico
- quien lleva ese pedido
- cual es el proximo paso de ese pedido

`010-crm-transversal-por-cliente` agrega:

- quien es el owner comercial de la relacion con el cliente
- cual es el siguiente movimiento a nivel cliente
- como se ve el contexto comercial consolidado del cliente
- como se relacionan varios pedidos o varios casos `009` sin duplicarlos

En otras palabras:

- `007` explica la identidad del cliente
- `009` explica el trabajo manual sobre un pedido
- `010` explica la gestion comercial transversal del cliente

## Relacion Con Merge De Clientes

Si `007` fusiona clientes:

- el caso transversal de `010` se reancla al cliente canonico destino
- la historia del cliente fuente se conserva
- no pueden quedar dos casos transversales activos para el mismo cliente
  canonico

## Guardrails

- no mover la clasificacion comercial a `007`
- no mover el timeline transversal a `orders`
- no tratar el slice como pipeline amplio
- no abrir mensajes enviados desde el sistema
- no duplicar toda la historia de pedidos en el timeline
- no abrir mas de un caso por cliente

## Arquitectura Recomendada

La opcion recomendada es:

- `customer_relationship_case` sobre cliente canonico
- una sola instancia por cliente
- apertura manual con sugerencias del sistema
- resumen comercial corto dentro de `/crm`
- bandeja secundaria dentro del mismo modulo
- timeline inmutable con referencias read-only a `orders` y `009`
- tareas opcionales y clasificacion comercial manual

Se descartan por ahora:

- CRM transversal mezclado con identidad canonica
- workbench separado fuera de `/crm`
- clasificacion automatica
- pipeline comercial amplio u oportunidades complejas
- mensajeria enviada directamente desde este modulo
