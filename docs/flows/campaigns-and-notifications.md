# Flujo: Campañas y Notificaciones

## Objetivo

Ejecutar campañas comerciales y comunicaciones transaccionales con trazabilidad, segmentación básica y procesamiento asíncrono controlado.

## Actores

- marketing
- admin
- API Huelegood
- worker
- clientes y vendedores receptores

## Precondiciones

- existen `segments` y `templates`
- el canal de notificación está configurado
- el evento o campaña tiene un objetivo claro

## Subflujo A: campaña

### Pasos

1. Marketing crea una campaña.
2. Selecciona segmento, plantilla, canal y programación.
3. La API valida audiencia objetivo.
4. Al iniciar la corrida, se crea `campaign_run`.
5. Se materializan `campaign_recipients`.
6. El worker despacha notificaciones por lotes.
7. Los resultados se registran en `notification_logs`.
8. La corrida se cierra con métricas básicas.

### Estados

- campaña: `draft`, `scheduled`, `running`, `completed`, `cancelled`
- corrida: `queued`, `running`, `completed`, `failed`
- receptor: `pending`, `sent`, `delivered`, `failed`, `skipped`

## Subflujo B: notificación transaccional

### Pasos

1. Un evento de negocio relevante ocurre: pedido pagado, pago manual resuelto, vendedor aprobado.
2. La API emite un evento interno.
3. El módulo de notificaciones crea `notification`.
4. El worker procesa el envío.
5. El resultado queda en `notification_logs`.

## Reglas de negocio

- Las campañas deben operar sobre una audiencia persistida, no calculada de forma implícita al vuelo en cada envío.
- Debe respetarse exclusión por opt-out y reglas comerciales aplicables.
- Las notificaciones transaccionales tienen prioridad operativa sobre campañas masivas.

## Errores posibles

| Error | Resultado esperado |
| --- | --- |
| segmento vacío | campaña no se ejecuta |
| plantilla inválida | corrida bloqueada antes de despachar |
| proveedor de envío caído | reintentos con backoff |
| duplicado de disparo transaccional | idempotencia por evento y receptor |
| destinatario sin canal válido | receptor `skipped` o `failed` según política |

## Eventos disparados

- `campaign.created`
- `campaign.scheduled`
- `campaign.run.started`
- `campaign.recipient.materialized`
- `notification.created`
- `notification.sent`
- `notification.failed`

## Procesos asíncronos involucrados

- materialización de audiencia
- envío por lotes
- reintentos y backoff
- consolidación de métricas básicas

## Observaciones de implementación

- CRM básico significa segmentación táctica y trazable, no un sistema full enterprise.
- `marketing_events` debe capturar eventos relevantes para futuras campañas basadas en comportamiento.
