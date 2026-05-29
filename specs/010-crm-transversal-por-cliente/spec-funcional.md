# Spec Funcional - CRM Transversal Por Cliente

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - CRM Transversal Por Cliente](../../docs/fase-1-analisis-requerimientos/01.09-crm-transversal-por-cliente.md),
  [Reglas de crm transversal por cliente](../../docs/fase-1-analisis-requerimientos/reglas/crm-transversal-por-cliente.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.09-crm-transversal-por-cliente-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.12-crm-transversal-por-cliente.md),
  [ADR-010 Customers CRM Transversal Boundary](../../docs/fase-3-arquitectura/adr/ADR-010-customers-crm-transversal-boundary.md)

## Objetivo

Definir el slice canonico vigente del CRM transversal por cliente como
paquete SDD, fijando a `customers` como dominio ancla, formalizando
`customer_relationship_case`, `commercialOwner`, `assignee`,
`classification`, `origin`, `nextStep`, `followUpAt`, timeline transversal
con referencias read-only y bandeja secundaria en `/crm`, sin convertir el
dominio en campaigns, scoring ni pipeline comercial amplio.

## Alcance

Incluye:

- `customers` como dominio ancla
- `customer_relationship_case`
- un caso transversal por cliente canonico
- apertura explicita por `ventas` o `marketing`
- `commercialOwner`
- `assignee`
- `classification`
- `origin`
- `nextStep`
- `followUpAt`
- timeline transversal con tipos canonicos
- referencias read-only a pedidos y a `009`
- tareas opcionales
- bandeja filtrada de clientes con seguimiento activo dentro de `/crm`
- merge y reapertura con trazabilidad

No incluye:

- identidad canonica como dominio principal
- seguimiento manual detallado por pedido
- campaigns
- scoring automatico
- pipeline comercial amplio
- oportunidades complejas
- mensajeria enviada desde el sistema
- workbench separado fuera de `/crm`

## Actores

- `ventas`
- `marketing`
- `admin`
- `super_admin`
- `customers`

## Reglas Funcionales Canonicas

### RF-01. Ownership operativo del slice

- `ventas` es el dueno operativo principal del caso transversal
- `marketing` tiene acceso operativo secundario
- `admin` y `super_admin` conservan override
- el ownership funcional del slice permanece en `customers`

### RF-02. `customers` es el dominio ancla

- la unidad operativa central del slice es el cliente canonico
- `customer_relationship_case` vive sobre el cliente canonico
- el slice no reemplaza el maestro de identidad de `007`

### RF-03. Un solo caso por cliente canonico

- solo existe un `customer_relationship_case` por cliente canonico
- el caso no requiere pedidos previos para existir
- el slice no soporta multi-caso activo por cliente en este corte

### RF-04. Estados canonicos del caso

- el caso usa `open`
- el caso usa `waiting_customer`
- el caso usa `dormant`
- el caso usa `resolved`

### RF-05. Campos canonicos obligatorios

- el caso expone `commercialOwner`
- el caso expone `assignee`
- el caso expone `classification`
- el caso expone `origin`
- el caso expone `nextStep`
- el caso expone `followUpAt`
- mientras el caso este en `open` o `waiting_customer`, `nextStep` y
  `followUpAt` son obligatorios

### RF-06. Timeline transversal estructurado

- el timeline usa `note`, `call`, `whatsapp`, `email`, `status_change`,
  `order_reference` y `follow_up_reference`
- cada entrada manual guarda actor, fecha, nota y evidencia opcional
- las entradas del timeline son inmutables
- todo cambio de estado crea una entrada `status_change`

### RF-07. Referencias automaticas read-only

- `order_reference` aparece automaticamente cuando hay pedido relevante
- `follow_up_reference` aparece automaticamente cuando hay caso `009`
  relevante
- las referencias no se editan manualmente
- el timeline no duplica la historia completa del cliente

### RF-08. Tareas opcionales editables

- las tareas no son obligatorias para abrir el caso
- cada tarea usa `title`, `status` y `dueDate`
- las tareas usan `pending` y `done`
- las tareas si se pueden editar o marcar completas

### RF-09. Clasificacion comercial manual

- la clasificacion comercial vive en este slice y no en `007`
- el caso usa `prospect`, `active`, `inactive` y `key_account`
- la clasificacion es manual en este corte

### RF-10. Origen canonico del caso

- el caso usa `manual_outreach`
- el caso usa `post_sale_followup`
- el caso usa `reactivation`
- el caso usa `service_issue`

### RF-11. Merge y reanclaje

- si `007` fusiona clientes, el caso se reancla al cliente canonico destino
- no pueden quedar dos casos activos para el mismo cliente canonico
- el reanclaje conserva la historia comercial del caso

### RF-12. Superficie visible del slice

- el detalle del cliente en `/crm` es la superficie visible principal
- la bandeja secundaria vive dentro del mismo modulo de `/crm`
- la bandeja muestra por defecto casos `open` y `waiting_customer`
- el slice no abre una app separada de CRM comercial

### RF-13. Sin campaigns, scoring ni mensajeria real

- el slice no envia mensajes desde el sistema
- el slice no abre scoring o clasificacion automatica
- el slice no absorbe campaigns ni pipeline comercial amplio

## Escenarios Principales

### Escenario A. Apertura y clasificacion del caso

1. El cliente entra a trabajo comercial activo.
2. `ventas` o `marketing` abren el caso transversal.
3. Se asignan `commercialOwner` y `assignee`.
4. Se registran `classification`, `origin`, `nextStep` y `followUpAt`.
5. El cliente queda con un solo caso transversal activo.

### Escenario B. Seguimiento transversal en curso

1. El caso ya existe y sigue activo.
2. `ventas` o `marketing` agregan entradas manuales al timeline.
3. El timeline recibe referencias read-only a pedidos y a `009`.
4. El caso puede recibir tareas opcionales.
5. El workbench mantiene visible la disciplina comercial minima.

### Escenario C. Cierre o dormancy manual

1. `ventas` decide cerrar o pausar la relacion comercial activa.
2. El caso cambia a `resolved` o `dormant`.
3. El timeline registra `status_change`.
4. `nextStep` y `followUpAt` pueden quedar vacios.
5. La bandeja ya no lo muestra por defecto.

### Escenario D. Reapertura controlada

1. El caso estaba `resolved` o `dormant`.
2. `ventas` decide retomarlo.
3. El caso se reabre manualmente.
4. Se crea `status_change`.
5. Se vuelven a exigir `nextStep` y `followUpAt`.

### Escenario E. Merge de cliente con caso transversal

1. `007` fusiona un cliente fuente con un cliente destino.
2. El caso transversal se reancla al cliente canonico destino.
3. Se conserva la historia del caso.
4. El sistema evita duplicidad de casos activos.
5. El detalle del cliente sigue mostrando un solo workbench comercial.

## Criterios De Aceptacion

| ID | Criterio |
| --- | --- |
| CA-01 | `customers` queda fijado como dominio ancla del slice |
| CA-02 | `ventas` queda fijado como owner operativo principal |
| CA-03 | el slice queda limitado a un solo caso por cliente canonico |
| CA-04 | el caso puede existir aunque el cliente no tenga pedidos |
| CA-05 | `commercialOwner`, `assignee`, `classification`, `origin`, `nextStep` y `followUpAt` quedan formalizados |
| CA-06 | el timeline transversal queda canonizado con tipos, entradas inmutables y referencias read-only |
| CA-07 | las tareas opcionales quedan formalizadas como editables |
| CA-08 | el merge de `007` queda ligado al reanclaje del caso |
| CA-09 | la reapertura vuelve a exigir disciplina del caso |
| CA-10 | el detalle de `/crm` queda fijado como superficie principal del slice |
| CA-11 | la bandeja secundaria queda dentro de `/crm` |
| CA-12 | el slice no abre campaigns, scoring ni mensajeria real |

## Casos Negativos Relevantes

- intentar crear dos casos activos para el mismo cliente canonico:
  incorrecto
- mover la clasificacion comercial al maestro de `007`: incorrecto
- editar entradas previas del timeline: incorrecto
- tratar referencias de pedido o de `009` como entradas manuales editables:
  incorrecto
- tratar la bandeja secundaria como modulo CRM separado: incorrecto
