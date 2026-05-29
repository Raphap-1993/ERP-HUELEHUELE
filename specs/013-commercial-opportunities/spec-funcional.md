# Spec Funcional - Commercial Opportunities

Fecha: 2026-05-29.

[Fase 4 SDD](../../docs/fase-4-sdd/README.md) | [Spec tecnica](spec-tecnica.md) | [Spec tareas](spec-tareas.md) | [Traceability](traceability.md)

## Artefactos Relacionados

- Requerimientos:
  [Fase 1 - Commercial Opportunities](../../docs/fase-1-analisis-requerimientos/01.12-commercial-opportunities.md),
  [Reglas de commercial opportunities](../../docs/fase-1-analisis-requerimientos/reglas/commercial-opportunities.md),
  [UC-37 Apertura y conversion de la oportunidad comercial](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-37-apertura-y-conversion-de-la-oportunidad-comercial.md),
  [UC-38 Negociacion y cierre de la oportunidad comercial](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-38-negociacion-y-cierre-de-la-oportunidad-comercial.md),
  [UC-39 Reapertura e historico de oportunidades comerciales](../../docs/fase-1-analisis-requerimientos/casos-de-uso/UC-39-reapertura-e-historico-de-oportunidades-comerciales.md)
- UX/UI:
  [Fase 2 - UX/UI](../../docs/fase-2-ux-ui/02.12-commercial-opportunities-ux-ui.md),
  [Product Design](product-design.md),
  [SPDD Frontend](spdd-frontend.md)
- Arquitectura:
  [Fase 3 - Arquitectura](../../docs/fase-3-arquitectura/03.15-commercial-opportunities.md),
  [ADR-013 Customers Commercial Opportunity Boundary](../../docs/fase-3-arquitectura/adr/ADR-013-customers-commercial-opportunity-boundary.md)

## Objetivo

Definir el slice canonico vigente de `commercial_opportunity` como paquete SDD
sobre `customer_relationship_case`, formalizando un deal puntual con valor
esperado, lifecycle propio, referencias y cierre estable sin romper `010`,
`011` ni `012` y sin abrir forecast, probabilidad o un modulo separado.

## Alcance

Incluye:

- extension controlada de `010-crm-transversal-por-cliente`
- convivencia con `011-pipeline-comercial-amplio`
- convivencia con `012-scoring-y-automatizaciones-comerciales`
- `commercial_opportunity`
- una oportunidad activa por caso
- historico de oportunidades cerradas
- apertura manual
- conversion explicita desde el pipeline del caso
- lifecycle `qualified`, `proposal`, `negotiation`, `won`, `lost`
- `expectedValue`
- `currency`
- `targetCloseAt`
- `commercialOwner`
- `assignee`
- `commercialChannel`
- `opportunityType`
- `lostReason`
- referencia principal y referencias secundarias
- timeline propio
- tareas propias minimas
- superficie principal y secundaria dentro de `/crm`

No incluye:

- multiples oportunidades activas por caso
- probabilidad de cierre
- forecast
- quote engine nuevo
- pricing engine nuevo
- modulo separado de opportunities
- apertura automatica por scoring o eventos
- automatizacion fuerte del lifecycle

## Actores

- `ventas`
- `marketing`
- `admin`
- `super_admin`
- `customers`

## Reglas Funcionales Canonicas

### RF-01. `013` extiende el caso comercial del cliente

- `commercial_opportunity` vive sobre `customer_relationship_case`
- el caso del cliente sigue siendo el agregado comercial principal
- la oportunidad no reemplaza el workbench transversal del cliente
- el slice sigue operando dentro de `/crm`

### RF-02. Una sola oportunidad activa por caso

- cada `customer_relationship_case` puede tener solo una oportunidad activa
- el historico de oportunidades cerradas se conserva
- el slice no abre varios deals activos simultaneos sobre el mismo caso

### RF-03. Apertura manual o por conversion explicita

- `ventas` puede abrir la oportunidad manualmente
- `ventas` puede abrirla por conversion explicita desde el pipeline del caso
- el sistema no crea oportunidades automaticamente
- la oportunidad solo se usa cuando existe negociacion concreta con valor
  esperado

### RF-04. Lifecycle propio y manual

- la oportunidad usa `qualified`
- la oportunidad usa `proposal`
- la oportunidad usa `negotiation`
- la oportunidad usa `won`
- la oportunidad usa `lost`
- el lifecycle es manual por `ventas`
- la oportunidad no reutiliza como lifecycle principal el `pipelineStage` del
  caso padre

### RF-05. Campos obligatorios del deal activo

- `expectedValue`, `currency` y `targetCloseAt` son obligatorios en
  `qualified`, `proposal` y `negotiation`
- esos campos se preservan como snapshot al cierre
- la oportunidad no usa probabilidad de cierre en este corte

### RF-06. Ownership heredado y corregible

- `commercialOwner`, `assignee` y `commercialChannel` se heredan por defecto
  del caso padre
- esos campos pueden ajustarse en la oportunidad si el deal concreto lo exige
- `ventas` es owner operativo principal del deal
- `marketing` mantiene acceso operativo secundario

### RF-07. Tipos canonicos de oportunidad

- `storefront_recovery`
- `wholesale_deal`
- `vendor_activation`
- `reactivation`

Reglas:

- el sistema puede sugerir el tipo por contexto
- `ventas` confirma manualmente el tipo
- el tipo no abre subpipelines distintos

### RF-08. Referencias flexibles del deal

- la oportunidad puede abrirse sin artefacto obligatorio
- la oportunidad puede guardar una referencia principal
- la oportunidad puede guardar referencias secundarias opcionales
- las referencias pueden apuntar a `quote`, `order`, `lead`, nota comercial o
  evidencia de cierre

### RF-09. Timeline y tareas propias del deal

- la oportunidad tiene timeline propio
- la oportunidad tiene tareas propias minimas
- el timeline del caso general sigue separado
- las tareas del caso general siguen separadas

### RF-10. Reglas de cierre y reapertura

- `lost` exige `lostReason`
- `lost` puede reabrirse y vuelve a `negotiation`
- `won` es cierre estable y no se reabre
- un nuevo ciclo posterior a `won` requiere nueva oportunidad historica
- la reapertura conserva trazabilidad de cierre anterior

### RF-11. Impacto suave sobre el caso padre

- abrir una oportunidad puede sugerir que el caso padre este al menos en
  `engaged`
- la sugerencia no mueve automaticamente el `pipelineStage` del caso
- una oportunidad `won` puede cerrar tambien el ciclo comercial general
- una oportunidad `lost` no tumba automaticamente el caso padre

## Escenarios Principales

### Escenario A. Apertura o conversion del deal

1. Existe un `customer_relationship_case` con contexto comercial suficiente.
2. `ventas` detecta una negociacion concreta con valor esperado.
3. Abre una oportunidad manualmente o la convierte desde el pipeline del caso.
4. El deal hereda owner, assignee y channel por defecto.
5. `ventas` confirma el `opportunityType`.

### Escenario B. Negociacion y cierre del deal

1. La oportunidad entra en `qualified`, `proposal` o `negotiation`.
2. El sistema exige `expectedValue`, `currency` y `targetCloseAt`.
3. `ventas` opera timeline, tareas y referencias del deal.
4. La oportunidad cierra como `won` o `lost`.
5. Si cierra como `lost`, registra `lostReason`.

### Escenario C. Reapertura o nuevo ciclo

1. Una oportunidad `lost` revive comercialmente.
2. `ventas` la reabre manualmente.
3. La reapertura vuelve a `negotiation`.
4. Si una oportunidad `won` da paso a otro ciclo, se crea una nueva
   oportunidad historica.

## Resultado Esperado

El slice queda listo para implementacion futura como una capa minima y seria
de deal puntual sobre el cliente canonico, diferenciando relacion comercial
general de negociacion concreta sin sobredimensionar el CRM.
