# Flujo: Postulación de Vendedor

## Objetivo

Capturar, revisar y aprobar postulaciones de personas interesadas en vender Huelegood, generando un canal formal de onboarding.

## Actores

- postulante
- web pública
- API Huelegood
- seller_manager
- notificaciones

## Precondiciones

- el formulario `trabaja con nosotros` está publicado
- existe política mínima de validación de datos
- el equipo comercial definió criterios de aprobación

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
11. `onboarded` queda reservado para una fase posterior de acceso/panel vendedor.

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
- El panel de vendedor solo se habilita cuando el onboarding está completo.

## Errores posibles

| Error | Resultado esperado |
| --- | --- |
| formulario incompleto | validación de entrada |
| datos duplicados | se marca para revisión y deduplicación |
| documentación faltante | postulación queda en `screening` |
| rechazo comercial | se notifica con razón resumida |
| error al generar código | no se marca `onboarded` hasta completar setup |

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
