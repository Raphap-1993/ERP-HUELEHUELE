# Product Design - Pipeline Comercial Amplio

Fecha: 2026-05-29.

## Promesa de superficie

`Ventas` necesita operar una cola comercial amplia desde `/crm` y entender,
en una sola lectura, quien lleva el caso, en que `pipelineStage` esta, con
que `priority` se mueve, cual es su `commercialChannel`, cuando vuelve a
tocarse mediante `nextStep` y `followUpAt`, y cual fue su ultima senal en
`lastPipelineActivityAt`, sin salir del workbench del cliente ni abrir una
app comercial nueva.

## Componentes principales

- resumen de pipeline amplio dentro del detalle del cliente en `/crm`
- bandeja comercial filtrable tipo tabla o lista dentro del mismo modulo
- `commercialOwner`
- `assignee`
- `origin`
- `nextStep`
- `pipelineStage`
- `priority`
- `commercialChannel`
- `status`
- `followUpAt`
- `lastPipelineActivityAt`
- timeline con trazabilidad de cambios de etapa
- cierres manuales `won` y `lost`
- `lostReason` para cierre `lost`

## Decisiones

- `011` extiende el `customer_relationship_case` documentado en `010`; no
  reescribe el runtime actual ni crea un pipeline paralelo
- la cola comercial vive dentro de `/crm` y se opera como tabla o lista
  filtrable alineada al patron de `AdminDataTable`
- `commercialOwner`, `assignee`, `origin`, `nextStep` y `followUpAt`
  siguen anclando ownership, contexto y movimiento operativo heredado del
  caso
- `status` y `pipelineStage` coexisten como ejes distintos del mismo caso
- `commercialChannel` expresa el canal principal de la relacion y convive
  con `origin`: `origin` conserva la procedencia del caso definida en `010`,
  mientras `commercialChannel` normaliza el canal principal del pipeline
  amplio
- `followUpAt` sigue siendo la unica fecha objetivo operativa;
  `lastPipelineActivityAt` resume actividad reciente para ordenar la cola
- `won` y `lost` son cierres manuales con trazabilidad; `lost` exige
  `lostReason` y `won` exige nota con evidencia o referencia
- el slice no vende cierres automaticos, scoring ni forecast

## Contrato minimo del corte

- `pipelineStage` usa `new`, `contacted`, `engaged`, `nurturing`, `won` y
  `lost`
- al abrir el caso, `pipelineStage` nace en `new` por defecto y no puede
  quedar nulo
- si el caso se reabre desde `lost`, vuelve a `contacted`
- la reapertura desde `lost` revalida `commercialOwner`, `assignee`,
  `nextStep`, `followUpAt` y `priority`
- al reabrirse, `lostReason` deja de aplicar al estado activo y permanece
  solo en la traza historica del cierre anterior
- `priority` usa `low`, `medium` y `high`
- `commercialChannel` usa `storefront`, `vendor`, `wholesale`,
  `manual_outreach`, `reactivation` y `referral`
- `lostReason` usa `no_response`, `price`, `timing`, `competition`,
  `not_fit` y `other`
- `nextStep` y `followUpAt` siguen siendo obligatorios mientras el caso
  esta activo
- badges, filtros y formularios deben reflejar esos valores canonicos sin
  variantes paralelas

## Lecturas secundarias

- pendientes de hoy y vencidos son una lectura derivada desde `followUpAt`
- sugerencias de pasar `status` a `resolved` o `dormant` tras `won` o
  `lost` son comportamiento secundario, no contrato minimo
- la reapertura desde `lost` usa la misma traza historica del caso y no
  crea una entidad comercial nueva
- metricas agregadas por etapa, prioridad o canal son capa operativa
  secundaria y no requisito para redefinir el workbench base de `010`

## Tension principal

La superficie debe sentirse como una ampliacion seria del mismo `/crm`:
suficiente para priorizar y cerrar relacion comercial real, pero sin
prometer kanban complejo, `commercial_opportunity`, subpipelines por canal
ni un CRM enterprise separado.

## Resultado esperado

El slice puede pasar a arquitectura y SDD con una lectura comun entre caso
transversal, cola comercial amplia, filtros por ownership y etapa,
ordenamiento por `followUpAt` y `lastPipelineActivityAt`, continuidad de
`origin`, `nextStep` y `followUpAt`, y cierres manuales `won` y `lost`
sobre el mismo cliente canonico.
