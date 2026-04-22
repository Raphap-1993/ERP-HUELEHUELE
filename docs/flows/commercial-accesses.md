# Flujo: Accesos Comerciales Por Cuenta

## Objetivo

Unificar la trazabilidad de acceso para vendedores y mayoristas que ya fueron aprobados por backoffice. Ambos ingresan por `/cuenta` con credenciales creadas por operación; no existe auto-registro comercial público.

## Actores

- vendedor aprobado
- mayorista aprobado
- ventas
- seller_manager
- admin
- backoffice
- API Huelegood
- auth
- auditoría
- notificaciones

## Precondiciones

- existe una postulación de vendedor aprobada o un lead mayorista calificado/cerrado como oportunidad real
- el backoffice validó identidad, email, teléfono y responsable comercial
- el perfil comercial tiene estado operativo compatible con acceso
- la cuenta se crea o vincula desde backoffice, nunca desde un formulario público de auto-registro
- el usuario recibe credenciales iniciales o enlace de activación por un canal trazable

## Superficies

- `/cuenta`: entrada web única para login comercial y vista de cuenta.
- `/panel-vendedor`: panel específico para vendedor activo.
- `/mayoristas`: captura pública de lead, no login B2B.
- `/trabaja-con-nosotros`: captura pública de postulación, no creación de credenciales.
- backoffice `/vendedores`: alta, aprobación, edición y vínculo de vendedores.
- backoffice `/mayoristas`: calificación, cotización y vínculo de mayoristas.

## Endpoints Actuales Relacionados

- `POST /auth/login`: autentica credenciales ya existentes.
- `GET /auth/me`: devuelve la sesión vigente.
- `POST /auth/logout`: cierra sesión.
- `GET /seller/panel/overview`: panel de vendedor para sesión con rol `vendedor` o `seller_manager`.
- `GET /admin/commercial-accesses`: lista accesos comerciales de vendedores y mayoristas.
- `POST /admin/commercial-accesses`: crea credenciales comerciales desde backoffice.
- `PATCH /admin/commercial-accesses/:id`: actualiza datos operativos del acceso.
- `POST /admin/commercial-accesses/:id/status`: activa, suspende o inactiva el acceso.
- `POST /admin/commercial-accesses/:id/reset-password`: genera contraseña temporal o define una nueva.
- `POST /store/vendor-applications`: captura postulación pública.
- `POST /store/wholesale-leads`: captura lead mayorista público.
- `POST /admin/vendors`: crea vendedor desde backoffice.
- `PATCH /admin/vendors/:id`: actualiza vendedor desde backoffice.
- `POST /admin/vendor-applications/:id/approve`: aprueba postulación de vendedor.
- `POST /admin/wholesale-leads/:id/status`: actualiza estado de lead mayorista.
- `POST /admin/wholesale-quotes`: crea cotización mayorista.

## Endpoints Pendientes

- `GET /admin/commercial-accesses/:id`: consulta trazabilidad del acceso.
- `POST /admin/vendors/:id/access`: atajo opcional para crear acceso de vendedor desde su ficha.
- `POST /admin/wholesale-leads/:id/access`: atajo opcional para crear acceso mayorista desde el lead aprobado.
- `GET /store/me/commercial-access`: devuelve el resumen comercial visible dentro de `/cuenta`.

## Reglas De Negocio

- `/cuenta` es login, no onboarding comercial autónomo.
- Vendedores y mayoristas no crean sus propias credenciales desde storefront.
- `POST /auth/register` no debe aceptar `accountType=seller`, `accountType=wholesale` ni equivalentes comerciales.
- Si continúa existiendo registro público de cliente final, solo puede crear rol `cliente`.
- La creación de acceso comercial exige actor backoffice autenticado y rol autorizado.
- Una cuenta comercial debe vincularse a un perfil operativo: código de `vendor` activo o lead mayorista aprobado.
- Si el email ya existe como cliente final, backoffice vincula ese usuario y agrega el rol comercial; no crea otro usuario duplicado.
- Una cuenta de vendedor no debe recibir `seller_manager` por defecto.
- Un mayorista no se convierte en vendedor ni recibe código de comisión por el solo hecho de tener cuenta.
- Toda creación, suspensión, reactivación y reset de credenciales debe registrar auditoría.
- El acceso no cambia por sí solo los estados comerciales del vendedor, lead o cotización.
- La baja operativa se modela como `inactive` o `suspended`; no se borra físicamente el usuario para conservar trazabilidad.

## Estados

### Acceso Comercial Implementado

- `active`: cuenta habilitada y vinculada.
- `inactive`: acceso revocado o deshabilitado por operación.
- `suspended`: bloqueo reversible por operación.

### Estados Objetivo Posteriores

- `pending_setup`: existe perfil comercial aprobado, pero aún no hay credenciales.
- `invited`: credenciales o enlace de activación enviados.
- `password_reset_required`: acceso válido, pero exige cambio de contraseña.
- `revoked`: acceso cerrado y no reutilizable sin nueva decisión.

### Vendedor

- `active`
- `inactive`
- `suspended`

### Mayorista

- lead: `new`, `qualified`, `quoted`, `negotiating`, `won`, `lost`
- cotización: `draft`, `sent`, `accepted`, `rejected`, `expired`

## Trazabilidad Mínima

- `commercialAccessId`
- `userId`
- `commercialType`: `seller` o `wholesale`
- `vendorId` o `wholesaleLeadId`
- `email`
- `status`
- `createdByAdminId`
- `createdAt`
- `lastLoginAt`
- `lastPasswordResetAt`
- `suspendedAt`
- `suspendedReason`
- historial de cambios de estado

## Riesgos

| Riesgo | Mitigación esperada |
| --- | --- |
| auto-registro comercial desde `/auth/register` | bloquear tipos comerciales en registro público |
| vendedor con rol `seller_manager` por defecto | separar rol operativo interno de rol comercial externo |
| mayorista tratado como cliente común sin trazabilidad B2B | vincular cuenta a lead/cuenta mayorista aprobada |
| credenciales compartidas por operación | emitir acceso individual y auditable por email |
| suspensión del perfil sin suspensión de login | sincronizar bloqueo de acceso con estado comercial |
| reset de contraseña sin evidencia | auditar actor, fecha y canal de entrega |

## Decisión Implementada

- El mayorista usa `RoleCode.Mayorista` junto con `cliente`.
- El registro público queda limitado a cliente final; tipos comerciales se crean desde backoffice.
- El admin expone `/accesos` como CRUD operativo de credenciales comerciales.
- `/cuenta` es la entrada web única; el rol deriva a panel vendedor o resumen mayorista.

## Siguientes Pasos

1. Agregar vista de resumen comercial mayorista con cotizaciones y estado de relación.
2. Añadir `GET /admin/commercial-accesses/:id` con historial de cambios.
3. Añadir atajos desde ficha de vendedor y lead mayorista.
4. Añadir pruebas de autorización para vendedor, mayorista, cliente y roles internos.
