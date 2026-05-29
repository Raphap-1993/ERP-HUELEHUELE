# Reglas De Commercial Opportunities

- `013` vive sobre `customer_relationship_case`
- `commercial_opportunity` no reemplaza el caso transversal del cliente
- solo puede existir una oportunidad activa por caso
- puede haber multiples oportunidades historicas cerradas
- apertura: manual o por conversion explicita desde el pipeline del caso
- no existe apertura automatica
- la oportunidad solo aplica cuando ya hay negociacion concreta con valor
  esperado
- lifecycle: `qualified`, `proposal`, `negotiation`, `won`, `lost`
- `expectedValue`, `currency` y `targetCloseAt` son obligatorios en estados
  activos
- `commercialOwner`, `assignee` y `commercialChannel` se heredan por defecto
- esos campos pueden ajustarse dentro de la oportunidad si la negociacion lo
  requiere
- `opportunityType`: `storefront_recovery`, `wholesale_deal`,
  `vendor_activation`, `reactivation`
- el tipo puede sugerirse por contexto, pero lo confirma `ventas`
- `lostReason` reutiliza la taxonomia de `011`
- `lost` puede reabrirse a `negotiation`
- `won` es cierre estable y no se reabre
- si hay un nuevo ciclo despues de `won`, se abre una nueva oportunidad
  historica
- la oportunidad puede abrirse sin artefacto fuente obligatorio
- la oportunidad puede guardar una referencia principal y referencias
  secundarias opcionales
- el deal tiene timeline y tareas propias
- la oportunidad no usa probabilidad de cierre en este corte
- la oportunidad no abre forecast ni modulo separado fuera de `/crm`
