# Spec Funcional - Customers Identity Conflicts

Fecha: 2026-05-28.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Customers Identity Conflicts](../../docs/fase-1-analisis-requerimientos/01.06-customers-identity-conflicts.md),
  [Reglas de customers e identity conflicts](../../docs/fase-1-analisis-requerimientos/reglas/customers-e-identity-conflicts.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.06-customers-identity-conflicts-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.09-customers-identity-conflicts.md),
  [ADR-007 Customers Orders Identity Boundary](../../docs/fase-3-arquitectura/adr/ADR-007-customers-orders-identity-boundary.md)

## Objetivo

Definir el slice canonico vigente de customers como paquete SDD, fijando a
`customers` como agregado principal del maestro de clientes, consolidando la
resolucion operativa de conflictos de identidad y el merge con destino
canonico, y cerrando la frontera con `orders` sin absorber `crmStage`, el
seguimiento comercial del pedido ni el ownership de la historia transaccional.

## Alcance

Incluye:

- `customers` como agregado operativo principal
- `/crm` como workbench visible del slice
- alta manual de cliente
- edicion de perfil
- estado del cliente
- direcciones
- password temporal al crear
- lectura de pedidos recientes como contexto operativo
- deteccion y resolucion de conflictos de identidad
- acciones `assign_existing`, `merge` e `ignore`
- merge manual de clientes con destino canonico
- clientes sinteticos o regularizados desde pedidos
- eliminacion operativa excepcional de clientes
- regularizacion controlada de referencias de pedido por integracion con
  `orders`

No incluye:

- `crmStage`
- seguimiento comercial del pedido
- pipeline comercial amplio
- campaigns
- wholesale
- loyalty
- timeline comercial transversal
- portal cliente
- reescritura arbitraria de snapshots historicos de `orders`

## Actores

- `ventas`
- `marketing`
- `admin`
- `super_admin`
- `customers`
- `orders`

## Reglas Funcionales Canonicas

### RF-01. Ownership operativo del slice

- `ventas` es el dueno operativo principal del workbench `/crm`
- `marketing` tiene acceso operativo cuando necesita corregir o revisar
  perfiles
- `admin` y `super_admin` conservan soporte y override
- `orders` no se promueve a owner del perfil vivo del cliente

### RF-02. `customers` es el agregado principal

- la unidad operativa central del slice es el cliente canonico
- perfil, estado, direcciones y opt-in viven en `customers`
- el slice no introduce un agregado paralelo de identidad fuera de
  `customers`

### RF-03. `/crm` es la superficie visible del slice

- `/crm` es el workbench canonico para operar clientes y conflictos
- la superficie concentra metricas, tabla de clientes, tabla de conflictos,
  detalle, merge y create/edit
- el slice no abre una segunda superficie visible para el mismo ownership

### RF-04. Prioridad canonica de identidad

- `documento` es la senal principal
- `email` y `telefono` son senales secundarias
- `nombre + direccion` funciona solo como senal debil auxiliar
- el slice no debe fusionar clientes por coincidencias blandas sin guardrails

### RF-05. Conflictos y acciones operativas

- los conflictos usan `open`, `resolved`, `ignored` y `merged`
- la resolucion operativa admite `assign_existing`, `merge` e `ignore`
- cada resolucion deja actor, notas y evidencia operativa
- un conflicto ya resuelto no debe comportarse como pendiente

### RF-06. Merge con destino canonico

- la fusion deja un cliente destino activo
- la fuente queda marcada como fusionada
- no se borra historia operativa
- no se puede fusionar si ambos clientes ya tienen documentos canonicos
  distintos

### RF-07. Clientes sinteticos o regularizados desde pedidos

- el runtime puede materializar o regularizar clientes desde snapshots de
  pedido
- esos clientes son parte valida del dominio actual
- el slice no exige que toda identidad nazca con cuenta limpia preexistente

### RF-08. Lectura de pedidos recientes como contexto

- el detalle del cliente incluye pedidos recientes
- esa lectura da contexto operativo para ventas y soporte
- esa lectura no mueve ownership de `orders` hacia `customers`

### RF-09. `deleteCustomer` como capacidad excepcional

- el runtime ya expone eliminacion de clientes
- la eliminacion no es flujo principal del slice
- el sistema debe bloquear borrados incompatibles con pedidos operativos,
  roles compartidos o uso como destino canonico

### RF-10. Frontera canonica con `orders`

- `orders` conserva `customerId`, `customerConflictId`, `crmStage` y
  `commercialTrace`
- `orders` puede regularizar referencias canonicas cuando una resolucion o
  fusion ya fue decidida por `customers`
- esa regularizacion no convierte a `orders` en owner del perfil vivo

### RF-11. Sin CRM ampliado ni pipeline comercial

- el slice no abre `crmStage`
- el slice no abre seguimiento comercial del pedido
- el slice no se extiende a campaigns, wholesale, loyalty ni CRM ampliado

## Escenarios Principales

### Escenario A. Alta y mantenimiento del perfil canonico

1. `ventas` abre `/crm`.
2. Crea un cliente nuevo o edita uno existente.
3. El sistema persiste perfil, estado, direcciones y password temporal cuando
   aplica.
4. `customers` conserva el perfil vivo del cliente.
5. El detalle muestra pedidos recientes como contexto sin mover ownership.

### Escenario B. Resolucion de conflicto con `assign_existing`

1. Un pedido genera una ambiguedad de identidad.
2. El sistema abre un conflicto con candidatos.
3. `ventas` revisa senales y elige `assign_existing`.
4. `customers` cierra el conflicto y `orders` regulariza la referencia
   operativa necesaria.
5. La historia transaccional permanece trazable.

### Escenario C. Resolucion de conflicto con `merge`

1. `ventas` detecta que dos identidades representan a la misma persona.
2. Selecciona cliente fuente y cliente destino.
3. El sistema valida documentos canonicos y guardrails de merge.
4. El destino permanece activo y la fuente queda fusionada.
5. `orders` regulariza referencias canonicas donde corresponde.

### Escenario D. Cliente sintetico nacido desde pedido

1. Un pedido llega sin cliente canonico limpio.
2. `customers` regulariza o materializa una identidad usando el snapshot del
   pedido.
3. El nuevo cliente sintetico queda operativo en `/crm`.
4. El dominio puede luego resolver conflictos, editar perfil o fusionarlo con
   un cliente canonico existente.

### Escenario E. Eliminacion operativa excepcional

1. `ventas` o `admin` intenta eliminar un cliente.
2. El sistema revisa si existe bloqueo por pedidos, roles compartidos o uso
   como destino canonico.
3. Si existe bloqueo, la accion falla.
4. Si no existe bloqueo, el cliente puede eliminarse como capacidad
   excepcional del runtime.

## Criterios De Aceptacion

| ID | Criterio |
| --- | --- |
| CA-01 | `ventas` queda fijado como owner operativo principal del slice |
| CA-02 | `customers` queda fijado como agregado principal del maestro canonico |
| CA-03 | `/crm` queda fijado como superficie visible principal del slice |
| CA-04 | la prioridad de identidad queda formalizada como `documento`, luego `email/telefono`, luego `nombre + direccion` |
| CA-05 | los conflictos usan `open`, `resolved`, `ignored` y `merged` |
| CA-06 | la resolucion operativa admite `assign_existing`, `merge` e `ignore` |
| CA-07 | el merge deja un destino activo, una fuente fusionada y bloquea documentos canonicos distintos |
| CA-08 | clientes sinteticos o regularizados desde pedidos quedan reconocidos como parte valida del runtime |
| CA-09 | el detalle del cliente incluye pedidos recientes solo como contexto operativo |
| CA-10 | `deleteCustomer` queda documentado como capacidad excepcional con bloqueos explicitos |
| CA-11 | `orders` conserva `customerId`, `customerConflictId`, `crmStage` y `commercialTrace` sin ceder ownership del perfil vivo |
| CA-12 | el slice no abre CRM ampliado, pipeline comercial ni seguimiento comercial del pedido |

## Casos Negativos Relevantes

- intentar fusionar dos clientes con documentos canonicos distintos: debe
  fallar
- intentar vender `/crm` como pipeline comercial amplio: incorrecto para este
  slice
- asumir que pedidos recientes transfieren ownership a `customers`: incorrecto
- tratar `deleteCustomer` como flujo principal del modulo: incorrecto
- asumir que el slice gobierna `crmStage` o `commercialTrace`: incorrecto
- pretender reescritura arbitraria de snapshots historicos de `orders`:
  incorrecto

## Dependencias De Negocio

- el negocio ya opera clientes, conflictos y merge desde `/crm`
- ventas necesita una fuente viva y corregible del perfil canonico del cliente
- pedidos y regularizaciones siguen generando identidades sinteticas en el
  runtime
- la trazabilidad entre cliente vivo y pedido historico debe seguir
  preservada sin mezclar ownerships
