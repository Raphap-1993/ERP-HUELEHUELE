# Flujo: Postulación de Vendedor

## Objetivo

Capturar, revisar y aprobar postulaciones de personas interesadas en vender Huelegood, generando un canal formal de onboarding.

## Actores

- postulante
- web pública
- API Huelegood
- seller_manager
- backoffice
- auth
- notificaciones

## Precondiciones

- el formulario `trabaja con nosotros` está publicado
- existe política mínima de validación de datos
- el equipo comercial definió criterios de aprobación
- las credenciales de vendedor se crean desde backoffice; no existe auto-registro comercial público

## Pasos

1. El postulante accede al formulario `trabaja con nosotros`.
2. Completa datos personales, contacto, intención comercial y contexto libre.
3. La API registra `vendor_application` en estado `submitted`.
4. Se envía confirmación de recepción.
5. Un `seller_manager` mueve la postulación a `screening`.
6. Durante `screening`, operación confirma el `collaborationType` final: `seller` o `affiliate`.
7. Puede solicitar información adicional, rechazar o aprobar.
8. Si se aprueba, se crea `vendor` activo y al menos un `vendor_code` activo.
9. Si el vendedor operará con cobros, se registra `vendor_bank_account`.
10. El sistema deja historial de estado y trazabilidad de la decisión.
11. Backoffice crea o vincula credenciales comerciales para que el vendedor ingrese por `/cuenta`.
12. El acceso al panel vendedor queda habilitado cuando existe cuenta web con rol `vendedor` y un `vendor` activo resoluble por `vendorCode` o email.

## Estados involucrados

### Postulación

- `submitted`
- `screening`
- `approved`
- `rejected`
- `onboarded`

### Vendedor

- `active`
- `inactive`
- `suspended`

## Reglas de negocio

- No se genera código de vendedor sin aprobación previa.
- Al aprobar desde admin, operación puede definir un `preferredCode` friendly; si no lo hace, la API genera el código automáticamente.
- Un postulante puede volver a postular si fue rechazado, pero no debe duplicarse un vendedor activo por identidad.
- `phone` es obligatorio en la postulación pública.
- `applicationIntent` captura la intención original del formulario: `affiliate`, `seller`, `content_creator` u `other`.
- `content_creator` y `other` no son tipos canónicos del vendedor; al aprobar se resuelven como `seller` salvo decisión explícita distinta.
- La aprobación requiere confirmar el `collaborationType` final.
- La aprobación debe quedar auditada.
- El panel de vendedor solo se habilita para sesiones web con rol `vendedor` o `seller_manager` y vendedor activo asociado.
- El vendedor no debe auto-registrarse desde storefront ni recibir `seller_manager` por defecto.
- `/cuenta` es la entrada de sesión; `/panel-vendedor` es la vista operativa específica del vendedor.

## Endpoints esperados

### Actuales relacionados

- `POST /store/vendor-applications`
- `GET /admin/vendor-applications`
- `POST /admin/vendor-applications/:id/screen`
- `POST /admin/vendor-applications/:id/approve`
- `POST /admin/vendor-applications/:id/reject`
- `POST /admin/vendors`
- `PATCH /admin/vendors/:id`
- `POST /auth/login`
- `GET /auth/me`
- `GET /seller/panel/overview`

### Contrato objetivo de acceso

- `POST /admin/vendors/:id/access`: crea o vincula credenciales del vendedor aprobado.
- `POST /admin/commercial-accesses`: alternativa transversal para crear acceso comercial.
- `POST /admin/commercial-accesses/:id/status`: suspende o reactiva acceso.
- `POST /admin/commercial-accesses/:id/reset-password`: emite recuperación auditable.

Ver [Accesos comerciales por cuenta](./commercial-accesses.md).

## Errores posibles

| Error | Resultado esperado |
| --- | --- |
| formulario incompleto | validación de entrada |
| datos duplicados | se marca para revisión y deduplicación |
| documentación faltante | postulación queda en `screening` |
| rechazo comercial | se notifica con razón resumida |
| error al generar código | no se marca `onboarded` hasta completar setup |
| cuenta comercial faltante | vendedor aprobado queda sin acceso hasta creación desde backoffice |
| intento de auto-registro vendedor | se rechaza y se deriva a flujo backoffice |

## Eventos disparados

- `vendor.application.submitted`
- `vendor.application.screening_started`
- `vendor.application.approved`
- `vendor.application.rejected`
- `vendor.created`
- `vendor.code.generated`
- `vendor.onboarded`

## Procesos asíncronos involucrados

- notificación de nueva postulación al equipo
- envío de confirmación y resultado al postulante
- creación de tareas internas de seguimiento

## Observaciones de implementación

- El formulario debe ser corto, claro y orientado a conversión.
- La información capturada debe servir tanto para evaluación comercial como para alta operativa básica.
- En la fase actual, edad, red social y contexto libre viajan dentro de `message`; no abren campos tipados adicionales todavía.
- La entrada pública del panel vive en `/panel-vendedor`; la API canónica es `GET /seller/panel/overview`.
- La brecha vigente a cerrar es que el registro público no debe aceptar tipos comerciales; solo backoffice debe crear credenciales para vendedores.

## Riesgos

- confundir postulación pública con alta de cuenta comercial
- entregar rol interno `seller_manager` a vendedores externos
- aprobar vendedor sin crear acceso ni avisar credenciales
- permitir login a vendedor suspendido
- perder trazabilidad entre `vendor_application`, `vendor`, `user` y acceso comercial

## Siguientes pasos

1. Agregar atajo `POST /admin/vendors/:id/access` desde la ficha del vendedor.
2. Fortalecer auditoría con actor real de backoffice para creación, reset, suspensión y reactivación.
3. Cubrir pruebas de `/cuenta` y `/panel-vendedor` con vendedor activo, suspendido y sin vínculo.
