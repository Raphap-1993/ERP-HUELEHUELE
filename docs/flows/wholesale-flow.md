# Flujo: Lead Mayorista / Distribuidores

## Objetivo

Capturar demanda mayorista, calificarla y convertirla en una cotización operable dentro del mismo sistema.

## Actores

- prospecto mayorista
- web pública
- API Huelegood
- ventas
- notificaciones

## Precondiciones

- existe bloque público mayorista o distribuidores
- el formulario está publicado y conectado a API
- existen tiers mayoristas definidos o al menos una política comercial inicial

## Pasos

1. El prospecto completa formulario mayorista.
2. La API registra `wholesale_lead`.
3. El área de ventas recibe alerta y revisa datos.
4. El lead se califica y se asigna estado.
5. Si existe oportunidad, se genera `wholesale_quote`.
6. Se agregan `wholesale_quote_items` y condiciones comerciales.
7. Se envía la cotización al prospecto.
8. El equipo comercial actualiza avance hasta cerrar como `won` o `lost`.

## Estados involucrados

### Lead

- `new`
- `qualified`
- `quoted`
- `negotiating`
- `won`
- `lost`

### Cotización

- `draft`
- `sent`
- `accepted`
- `rejected`
- `expired`

## Reglas de negocio

- Un lead mayorista no se convierte automáticamente en cliente B2B autoservicio.
- Los tiers definen referencias para precio o condiciones, pero la cotización sigue siendo revisable en admin.
- Debe existir trazabilidad del responsable comercial.
- `interestType` puede ser `wholesale` o `distributor`; ambos viven en el mismo módulo y comparten estado/cotización.
- `estimatedVolume` es dato comercial inicial y no reemplaza la cotización.

## Errores posibles

| Error | Resultado esperado |
| --- | --- |
| lead duplicado | se vincula o marca para deduplicación |
| cotización sin items válidos | no puede enviarse |
| condiciones vencidas | cotización pasa a `expired` |
| contacto inválido | seguimiento manual o descarte |

## Eventos disparados

- `wholesale.lead.created`
- `wholesale.lead.qualified`
- `wholesale.quote.created`
- `wholesale.quote.sent`
- `wholesale.quote.accepted`
- `wholesale.lead.won`
- `wholesale.lead.lost`

## Procesos asíncronos involucrados

- notificación al equipo de ventas
- recordatorios de seguimiento
- notificación de cotización enviada

## Observaciones de implementación

- El módulo mayorista debe integrarse con marketing para alimentar segmentos futuros.
- Los leads cerrados como `won` deben poder reutilizarse luego en campañas o onboarding comercial más avanzado.
- la landing pública puede abrir la variante distribuidor usando `?interestType=distributor`, sin crear un dominio B2B distinto.
