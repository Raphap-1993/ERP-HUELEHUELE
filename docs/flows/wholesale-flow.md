# Flujo: Lead Mayorista / Distribuidores

## Objetivo

Capturar demanda mayorista, calificarla y convertirla en una cotización operable dentro del mismo sistema.

## Actores

- prospecto mayorista
- web pública
- API Huelegood
- ventas
- backoffice
- auth
- notificaciones

## Precondiciones

- existe bloque público mayorista o distribuidores
- el formulario está publicado y conectado a API
- existen tiers mayoristas definidos o al menos una política comercial inicial
- las credenciales mayoristas se crean desde backoffice luego de calificación; no existe auto-registro B2B

## Pasos

1. El prospecto completa formulario mayorista.
2. La API registra `wholesale_lead`.
3. El área de ventas recibe alerta y revisa datos.
4. El lead se califica y se asigna estado.
5. Si existe oportunidad, se genera `wholesale_quote`.
6. Se agregan `wholesale_quote_items` y condiciones comerciales.
7. Se envía la cotización al prospecto.
8. El equipo comercial actualiza avance hasta cerrar como `won` o `lost`.
9. Si el mayorista queda aprobado para acceso, backoffice crea o vincula credenciales comerciales.
10. El mayorista ingresa por `/cuenta` para consultar su relación comercial o próximos pasos disponibles.

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
- El formulario mayorista no crea cuenta ni credenciales.
- `/cuenta` es el acceso autenticado para mayoristas aprobados por backoffice.
- Un mayorista con cuenta no obtiene código de vendedor ni comisiones salvo una aprobación separada como vendedor.

## Endpoints esperados

### Actuales relacionados

- `POST /store/wholesale-leads`
- `GET /store/wholesale-tiers`
- `GET /admin/wholesale-leads`
- `POST /admin/wholesale-leads/:id/status`
- `GET /admin/wholesale-quotes`
- `POST /admin/wholesale-quotes`
- `POST /auth/login`
- `GET /auth/me`

### Contrato objetivo de acceso

- `POST /admin/wholesale-leads/:id/access`: crea o vincula credenciales del mayorista aprobado.
- `POST /admin/commercial-accesses`: alternativa transversal para crear acceso comercial.
- `GET /store/me/commercial-access`: devuelve resumen mayorista dentro de `/cuenta`.
- `POST /admin/commercial-accesses/:id/status`: suspende o reactiva acceso.
- `POST /admin/commercial-accesses/:id/reset-password`: emite recuperación auditable.

Ver [Accesos comerciales por cuenta](./commercial-accesses.md).

## Errores posibles

| Error | Resultado esperado |
| --- | --- |
| lead duplicado | se vincula o marca para deduplicación |
| cotización sin items válidos | no puede enviarse |
| condiciones vencidas | cotización pasa a `expired` |
| contacto inválido | seguimiento manual o descarte |
| intento de auto-registro mayorista | se rechaza y se deriva a validación backoffice |
| cuenta sin lead aprobado | se bloquea creación de acceso comercial |

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
- La brecha vigente es definir si el mayorista autenticado usa un rol nuevo o un entitlement comercial sobre una cuenta `cliente`.

## Riesgos

- confundir captura de lead con creación de cuenta B2B
- abrir precios o condiciones mayoristas a clientes no aprobados
- crear credenciales sin responsable comercial asociado
- no revocar acceso cuando el lead se pierde o la relación queda inactiva
- duplicar cuentas por email entre cliente final y mayorista

## Siguientes pasos

1. Agregar atajo `POST /admin/wholesale-leads/:id/access` desde la ficha del lead.
2. Exponer resumen mayorista en `/cuenta` sin convertirlo en portal B2B completo.
3. Agregar pruebas de lead aprobado, lead rechazado, cuenta duplicada y acceso suspendido.
