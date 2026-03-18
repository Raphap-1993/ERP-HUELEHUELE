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
2. Completa datos personales, contacto y contexto comercial.
3. La API registra `vendor_application`.
4. Se envía confirmación de recepción.
5. Un `seller_manager` revisa la postulación.
6. Puede solicitar información adicional, rechazar o aprobar.
7. Si se aprueba, se crea `vendor`, `vendor_profile` y al menos un `vendor_code`.
8. Si el vendedor operará con cobros, se registra `vendor_bank_account`.
9. El sistema notifica el resultado y deja historial de estado.
10. Si el onboarding se completa, el vendedor puede acceder a su panel.

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
- Un postulante puede volver a postular si fue rechazado, pero no debe duplicarse un vendedor activo por identidad.
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
