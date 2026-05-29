# Spec Funcional - Pipeline Comercial Amplio

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Pipeline Comercial Amplio](../../docs/fase-1-analisis-requerimientos/01.10-pipeline-comercial-amplio.md),
  [Reglas de pipeline comercial amplio](../../docs/fase-1-analisis-requerimientos/reglas/pipeline-comercial-amplio.md),
  [UC-31 Apertura y etapado del caso comercial](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-31-apertura-y-etapado-del-caso-comercial.md),
  [UC-32 Bandeja y priorizacion del pipeline comercial](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-32-bandeja-y-priorizacion-del-pipeline-comercial.md),
  [UC-33 Cierre comercial won lost y reapertura](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-33-cierre-comercial-won-lost-y-reapertura.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.10-pipeline-comercial-amplio-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.13-pipeline-comercial-amplio.md),
  [ADR-011 Customers Commercial Pipeline Boundary](../../docs/fase-3-arquitectura/adr/ADR-011-customers-commercial-pipeline-boundary.md)

## Objetivo

Definir el slice canonico vigente del pipeline comercial amplio como
paquete SDD sobre `customer_relationship_case`, extendiendo el workbench
de `010` con `pipelineStage`, `priority`, `commercialChannel`,
`lostReason` y `lastPipelineActivityAt`, preservando
`commercialOwner`, `assignee`, `nextStep` y `followUpAt`, sosteniendo la
bandeja filtrable dentro de `/crm` y formalizando cierres manuales `won`
y `lost` sin abrir `commercial_opportunity`, scoring ni automatizaciones
comerciales.

## Alcance

Incluye:

- extension controlada de `010-crm-transversal-por-cliente`
- `customer_relationship_case`
- un solo caso por cliente canonico
- `commercialOwner`
- `assignee`
- `nextStep`
- `followUpAt`
- `pipelineStage`
- `priority`
- `commercialChannel`
- `lostReason`
- `lastPipelineActivityAt`
- timeline del mismo caso con trazabilidad obligatoria de cambios de etapa
- cierres manuales `won` y `lost`
- reapertura comercial desde `lost`
- bandeja comercial filtrable dentro de `/crm`
- vistas de pendientes de hoy y vencidos usando `followUpAt`

No incluye:

- `commercial_opportunity`
- forecast
- monto esperado
- probabilidad de cierre
- scoring automatico
- automatizaciones comerciales
- kanban complejo
- una app o ruta nueva fuera de `/crm`
- reescritura de `007`, `009` o `010`

## Actores

- `ventas`
- `marketing`
- `admin`
- `super_admin`
- `customers`

## Reglas Funcionales Canonicas

### RF-01. `011` extiende `010` sobre el mismo caso

- `011` no crea un agregado comercial nuevo
- `customer_relationship_case` sigue siendo el agregado principal
- `commercialOwner`, `assignee`, `nextStep` y `followUpAt` se preservan
  como contrato heredado de `010`
- el slice sigue operando un solo caso por cliente canonico

### RF-02. Ownership y superficie del slice

- `ventas` es el owner operativo principal del pipeline comercial
- `marketing` mantiene acceso operativo secundario
- `admin` y `super_admin` conservan override
- `customers` sigue siendo el dominio ancla del caso
- `/crm` sigue siendo la superficie visible principal del slice

### RF-03. `pipelineStage` es manual, no nulo y separado de `status`

- `pipelineStage` es manual por `ventas`
- `pipelineStage` nace por defecto en `new` al abrir el caso
- `pipelineStage` no puede quedar nulo mientras el caso siga activo
- `status` y `pipelineStage` son ejes distintos del mismo
  `customer_relationship_case`
- el sistema no cambia `pipelineStage` automaticamente por eventos
  tecnicos

### RF-04. Etapas canonicas y trazabilidad de etapa

- el pipeline usa `new`
- el pipeline usa `contacted`
- el pipeline usa `engaged`
- el pipeline usa `nurturing`
- el pipeline usa `won`
- el pipeline usa `lost`
- se permiten saltos manuales entre etapas
- todo cambio de `pipelineStage` deja traza obligatoria en el timeline del
  mismo caso

### RF-05. `priority` es manual y ordena la cola

- `priority` usa `low`
- `priority` usa `medium`
- `priority` usa `high`
- la prioridad no se calcula automaticamente en este corte
- `priority` sirve para ordenar la bandeja antes de abrir scoring

### RF-06. `commercialChannel` amplifica el caso y no reemplaza `origin`

- `commercialChannel` usa `storefront`
- `commercialChannel` usa `vendor`
- `commercialChannel` usa `wholesale`
- `commercialChannel` usa `manual_outreach`
- `commercialChannel` usa `reactivation`
- `commercialChannel` usa `referral`
- `commercialChannel` representa el canal principal del ciclo comercial
  activo
- `commercialChannel` convive con `origin`
- `commercialChannel` no reemplaza ni renombra `origin`
- el canal solo se corrige por decision operativa explicita

### RF-07. `nextStep`, `followUpAt` y `lastPipelineActivityAt`

- `nextStep` y `followUpAt` conservan la disciplina activa heredada de
  `010`
- mientras el caso este en `open` o `waiting_customer`, `nextStep` y
  `followUpAt` siguen siendo obligatorios
- `followUpAt` sigue siendo la unica fecha objetivo operativa del caso
- `lastPipelineActivityAt` resume actividad comercial reciente
- `lastPipelineActivityAt` se actualiza con cambios de `pipelineStage`
- `lastPipelineActivityAt` se actualiza con actividad manual relevante del
  mismo caso
- `lastPipelineActivityAt` no reemplaza la lectura completa del timeline

### RF-08. Bandeja comercial dentro de `/crm`

- la bandeja vive dentro del mismo modulo `/crm`
- la bandeja se presenta como tabla o lista filtrable
- la bandeja filtra por `commercialOwner`, `assignee`, `pipelineStage`,
  `priority`, `commercialChannel` y `status`
- la bandeja ofrece vistas de pendientes de hoy y vencidos usando
  `followUpAt`
- la bandeja puede ordenar por `lastPipelineActivityAt`
- el slice no abre una pantalla o dashboard comercial separado

### RF-09. Cierre comercial `lost`

- pasar a `lost` exige `lostReason`
- `lostReason` usa `no_response`
- `lostReason` usa `price`
- `lostReason` usa `timing`
- `lostReason` usa `competition`
- `lostReason` usa `not_fit`
- `lostReason` usa `other`
- `lost` cierra el ciclo comercial, pero no destruye el
  `customer_relationship_case`

### RF-10. Cierre comercial `won`

- `won` representa cierre comercial manual por `ventas`
- pasar a `won` exige nota de cierre
- pasar a `won` exige evidencia o referencia
- `won` cierra un ciclo comercial del mismo caso
- `won` no se deriva automaticamente por un evento tecnico

### RF-11. Reapertura controlada desde `lost`

- la reapertura comercial desde `lost` devuelve `pipelineStage` a
  `contacted`
- `lostReason` deja de aplicar al estado activo y queda solo en la traza
  historica del cierre previo
- la reapertura exige revalidar `commercialOwner`, `assignee`, `nextStep`,
  `followUpAt` y `priority`
- `commercialChannel` solo se corrige si cambia el canal principal por
  decision operativa explicita

### RF-12. Guardrails suaves entre `status` y `pipelineStage`

- cambiar `pipelineStage` no cambia automaticamente `status`
- `won` y `lost` son cierres comerciales, no cierres tecnicos del caso
- `pipelineStage = new` no debe convivir con `status = resolved`
- `pipelineStage = won` no debe convivir con `status = dormant`
- `pipelineStage = lost` no debe convivir con `status = open` o
  `waiting_customer` sin `lostReason`
- tras `won`, el sistema puede sugerir `resolved`
- tras `lost`, el sistema puede sugerir `dormant` o `resolved`

### RF-13. El slice no abre oportunidades ni scoring

- `011` no abre `commercial_opportunity`
- `011` no abre forecast
- `011` no abre probabilidad de cierre
- `011` no abre scoring automatico
- `011` no abre automatizaciones comerciales
- `011` no mueve la superficie fuera de `/crm`

## Escenarios Principales

### Escenario A. Apertura y etapado del caso

1. El cliente entra a trabajo comercial amplio.
2. `ventas` abre o retoma el `customer_relationship_case`.
3. El caso nace en `pipelineStage = new` salvo que ya exista contexto
   comercial suficiente.
4. Se definen `commercialOwner`, `assignee`, `nextStep`, `followUpAt`,
   `priority` y `commercialChannel`.
5. El timeline del mismo caso queda listo para trazar cambios de etapa.

### Escenario B. Operacion de la bandeja comercial

1. `ventas` entra a `/crm`.
2. Filtra la cola por `commercialOwner`, `assignee`, `pipelineStage`,
   `priority`, `commercialChannel` y `status`.
3. Usa pendientes de hoy y vencidos desde `followUpAt`.
4. Ordena la cola con `lastPipelineActivityAt`.
5. Selecciona el caso y ejecuta el siguiente movimiento comercial.

### Escenario C. Cierre `lost`

1. El caso ya no progresa comercialmente.
2. `ventas` mueve el caso a `pipelineStage = lost`.
3. Registra `lostReason`.
4. El timeline guarda el cambio de etapa.
5. El caso puede seguir existiendo para reactivacion o cierre operativo.

### Escenario D. Cierre `won`

1. El ciclo comercial se concreta.
2. `ventas` mueve el caso a `pipelineStage = won`.
3. Registra nota de cierre y evidencia o referencia.
4. El timeline guarda el cierre comercial.
5. El sistema puede sugerir `status = resolved` si ya no queda trabajo
   activo.

### Escenario E. Reapertura desde `lost`

1. El caso estaba en `pipelineStage = lost`.
2. `ventas` decide retomarlo.
3. El caso vuelve a `pipelineStage = contacted`.
4. `lostReason` deja de regir el estado activo y queda solo en la historia
   del cierre anterior.
5. Se revalidan `commercialOwner`, `assignee`, `nextStep`, `followUpAt`
   y `priority`.

## Criterios De Aceptacion

| ID | Criterio |
| --- | --- |
| CA-01 | `011` queda documentado como extension controlada de `010` sobre el mismo `customer_relationship_case` |
| CA-02 | `pipelineStage`, `priority`, `commercialChannel`, `lostReason` y `lastPipelineActivityAt` quedan formalizados con naming canonico |
| CA-03 | `commercialOwner`, `assignee`, `nextStep` y `followUpAt` quedan preservados como contrato heredado de `010` |
| CA-04 | `pipelineStage` queda manual, no nulo y separado de `status` |
| CA-05 | la trazabilidad obligatoria de cambios de `pipelineStage` queda ligada al timeline del mismo caso |
| CA-06 | `priority` queda limitada a `low`, `medium` y `high` |
| CA-07 | `commercialChannel` queda limitado a los seis valores canonicos y separado de `origin` |
| CA-08 | `lost` exige `lostReason` y `won` exige nota con evidencia o referencia |
| CA-09 | la reapertura desde `lost` vuelve a `contacted` y revalida disciplina activa del caso |
| CA-10 | `lastPipelineActivityAt` queda definido como resumen de actividad reciente sin abrir una segunda fecha operativa |
| CA-11 | la bandeja comercial queda fijada dentro de `/crm` con filtros y vistas de pendientes de hoy y vencidos |
| CA-12 | el slice no abre `commercial_opportunity`, scoring, forecast ni automatizaciones comerciales |

## Casos Negativos Relevantes

- intentar abrir una entidad nueva de `commercial_opportunity`: incorrecto
- mover el pipeline fuera de `customer_relationship_case`: incorrecto
- usar `commercialChannel` como renombre de `origin`: incorrecto
- abrir una segunda fecha comercial paralela a `followUpAt`: incorrecto
- cerrar `lost` sin `lostReason`: incorrecto
- cerrar `won` sin nota y evidencia o referencia: incorrecto
- abrir una pantalla comercial separada de `/crm`: incorrecto
