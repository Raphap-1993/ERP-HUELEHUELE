# Control De Acceso Y Gobernanza De Navegacion

## Objetivo

Definir el modelo canonico de identidad, autorizacion, navegacion y administracion de acceso para todas las superficies de ERP Huele Huele.

Este documento reemplaza cualquier decision dispersa sobre "menus por rol", "accesos por pantalla" o logica de visibilidad hardcodeada. La regla vigente pasa a ser unica y transversal.

## Alcance

Aplica a:

- `apps/api`
- `apps/admin`
- `apps/web`
- cualquier portal autenticado futuro

Aplica sobre estas superficies:

- `web publica`
- `portal autenticado`
- `admin interno`

No cubre permisos de infraestructura, CI/CD, VPS o cuentas externas. Esos accesos siguen sus controles propios.

## Regla Canonica

El sistema usa un modelo unificado de:

- `RBAC`
- `permissions`
- `scope`
- `user overrides` temporales auditados

Las reglas duras son:

- el backend es la autoridad final de autorizacion;
- el frontend nunca otorga acceso real;
- el menu solo refleja permisos efectivos;
- `permissions` y `scopes` salen de catalogos canonicos del sistema;
- `modules` y `routes` solo se registran por codigo;
- los usuarios reciben acceso principalmente por `roles`;
- los `overrides` existen solo como excepcion temporales auditadas;
- la politica por defecto es `default deny`.

## Superficies

### Web Publica

- no requiere permisos autenticados para navegar
- consume solo contratos publicos
- puede mostrar CTA o accesos segun sesion, pero no administra autorizacion

### Portal Autenticado

- concentra cuenta, vendedor, mayorista y cualquier modulo externo autenticado
- comparte identidad, permisos y scopes con el resto del sistema
- cambia navegacion, acciones y datos visibles segun permisos efectivos

### Admin Interno

- usa el mismo marco de autorizacion
- no existe "confianza implícita" por estar dentro del admin
- permisos de seguridad quedan separados del admin operativo comun
- el shell del admin exige `surface = internal_admin` ademas del permiso efectivo del modulo

## Vocabulario

- `role`: agrupacion reusable de permisos
- `permission`: capacidad atomica del sistema
- `scope`: alcance de esa capacidad sobre recursos
- `module`: unidad funcional registrada por codigo
- `navigation item`: representacion UX de un modulo dentro de una superficie
- `override grant`: permiso adicional excepcional para un usuario
- `override revoke`: bloqueo excepcional de un permiso heredado
- `system role`: rol base protegido del sistema
- `effective permissions`: resultado final de roles, scopes y overrides vigentes

## Catalogos Canonicos

### Permissions Catalog

Cada permiso debe estar registrado por codigo y semantica estable. Ejemplos:

- `orders.read`
- `orders.manage`
- `orders.export`
- `payments.review`
- `cms.read`
- `cms.write`
- `cms.publish`
- `products.read`
- `products.write`
- `security.roles.read`
- `security.roles.manage`
- `security.users.manage`
- `security.overrides.manage`

Reglas:

- no se crean permisos como texto libre desde UI;
- el catalogo se versiona por codigo;
- cada permiso declara modulo y accion;
- un permiso nuevo requiere cambio de codigo, contrato y documentacion.

### Scope Catalog

Los scopes tambien son catalogo canonico por codigo. Ejemplos base:

- `own`
- `team`
- `branch`
- `org`
- `all`

Reglas:

- no se crean scopes libres desde UI;
- un permiso puede admitir uno o varios scopes validos;
- la API debe entender el significado operativo de cada scope;
- si un permiso no tiene scope explicito, se trata como capacidad sin alcance expandible o como `all` solo si el catalogo lo declara.

## Roles

### Reglas Generales

- un usuario puede tener multiples roles al mismo tiempo;
- los permisos efectivos se calculan por union de roles;
- un usuario puede tener `primary role` opcional para UX, reporting y trazabilidad;
- los roles se gestionan desde UI, pero su comportamiento sigue el catalogo canonico del sistema.

### System Roles

Roles base protegidos:

- `super_admin`
- `admin`
- `operador_pagos`
- `ventas`
- `marketing`
- `seller_manager`
- `vendedor`
- `mayorista`
- `cliente`

Reglas:

- no se borran desde UI;
- no se renombran desde UI;
- si hace falta una variante, se clona un rol derivado;
- su proteccion evita romper auth, auditoria y flujos base.

## Overrides

El sistema admite overrides por usuario solo como excepcion.

Tipos:

- `grant`
- `revoke`

Reglas:

- ambos requieren `expiresAt`;
- ambos requieren `reason`;
- ambos requieren `approvedBy`;
- ambos requieren auditoria;
- un override vencido deja de tener efecto automaticamente;
- `revoke` gana sobre permisos heredados de rol;
- `grant` suma permiso excepcional si no existe bloqueo superior.

Casos validos:

- cobertura temporal por vacaciones
- acceso puntual para soporte
- prueba controlada
- bloqueo temporal de una capacidad sensible

Casos invalidos:

- reemplazar el modelo normal por rol
- dejar accesos permanentes "porque funciono"
- usar overrides sin fecha de expiracion

## Modules Y Routes

Los `modules` y `routes` solo se registran por codigo.

Cada modulo debe declarar al menos:

- `moduleId`
- `surface`
- `route`
- `navGroup`
- `requiredPermissions`
- `supportedScopes`
- `isSystem`
- `isActive`

Reglas:

- UI no crea modulos nuevos;
- UI no inventa rutas nuevas;
- un modulo nuevo requiere registro tecnico y documentacion;
- luego el admin puede decidir si ese modulo se muestra, donde se ubica y con que label visible.

### Modulos canonicos sensibles

- `security`: roles, permisos, overrides y navegacion interna
- `commercial_accesses`: cuentas comerciales, credenciales web y su ciclo de vida para `seller` y `wholesale`

El permiso base del modulo `commercial_accesses` es:

- `commercial_accesses.read`
- `commercial_accesses.manage`

## Navegacion

La navegacion es una consecuencia de permisos efectivos, no una fuente de autorizacion.

UI administra:

- grupo
- orden
- label visible
- icono
- visibilidad

UI no administra:

- semantica del permiso
- creacion de modulo
- definicion de ruta
- seguridad real del recurso

Reglas:

- si el usuario no tiene permisos efectivos, el item no debe mostrarse;
- aunque el item no se muestre, la API igual debe negar acceso si el usuario intenta entrar;
- una pantalla sensible debe poder responder `403` aunque exista un error en menu o cache.

## Modelo De Resolucion

Orden canonico de resolucion:

1. validar sesion activa y usuario habilitado
2. resolver roles asignados al usuario
3. resolver permisos heredados por esos roles
4. aplicar `override revoke` activos
5. aplicar `override grant` activos
6. derivar permisos y scopes efectivos
7. evaluar policy del recurso
8. si nada concede acceso, `deny`

`super_admin` tiene bypass controlado para autorizacion funcional, pero su actividad sensible igual debe auditarse.

## Nota De Migracion

Mientras el repo termina de retirarse de gates legacy por rol, los `system roles` preservan amplitud operativa equivalente al runtime previo para no romper flujos internos existentes. El endurecimiento fino debe hacerse creando `roles derivados` o ajustando grants explicitamente, no cambiando silenciosamente el alcance esperado de `admin`, `ventas`, `marketing` o `seller_manager`.

## Administracion Desde Backoffice

El backoffice debe soportar estos flujos:

### Gestionar Usuarios

- crear usuario
- activar o desactivar usuario
- asignar uno o varios roles
- definir rol principal
- revisar permisos efectivos resultantes

### Gestionar Roles

- crear rol derivado
- editar nombre, descripcion y estado del rol derivado
- asignar permisos del catalogo
- asignar scope por permiso
- clonar rol existente

### Gestionar Overrides

- crear `grant` temporal
- crear `revoke` temporal
- exigir motivo, aprobador y expiracion
- cancelar override antes del vencimiento
- revisar historial

### Gestionar Navegacion

- asignar modulo a grupo visible
- cambiar orden
- cambiar label e icono
- activar o desactivar item visible

### Gestionar Seguridad Critica

No cualquier admin puede tocar seguridad. Requiere permisos explicitos:

- `security.roles.read`
- `security.roles.manage`
- `security.users.manage`
- `security.overrides.manage`

`super_admin` conserva control total. Un `admin` comun no administra seguridad por defecto.

## Auditoria

Todo cambio sensible debe dejar evidencia con:

- actor
- accion
- recurso
- before
- after
- motivo
- aprobador cuando aplique
- timestamp

Eventos minimos:

- rol creado
- rol editado
- permiso asignado o retirado de rol
- usuario activado o desactivado
- rol asignado o retirado de usuario
- override creado, cancelado o expirado
- configuracion de navegacion cambiada

## Contrato Backend

`apps/api` debe evolucionar hacia validaciones por `permission + scope`.

Reglas:

- no depender principalmente de `RequireRoles(...)` para seguridad futura;
- exponer permisos efectivos en sesion o endpoint de identidad;
- validar acciones sensibles en servidor aunque el frontend las oculte;
- separar claramente auth, policy resolution y rendering UX.

Contrato minimo esperado desde identidad:

- usuario
- roles asignados
- rol principal
- permisos efectivos
- scopes efectivos
- surface access

## Contrato Frontend

Frontend solo usa autorizacion para experiencia:

- mostrar u ocultar menu
- mostrar u ocultar acciones
- mostrar estados de acceso denegado
- personalizar IA por superficie

Frontend no debe:

- definir seguridad real
- inventar permisos
- resolver alcance por cuenta propia sin confirmacion de backend
- dispersar `if role === ...` como patron principal

## Estado Actual Y Brecha

El estado actual del repo ya tiene piezas parciales:

- `roles`, `permissions`, `user_roles` y `role_permissions` en Prisma
- `RoleCode` compartido
- filtros de navegacion por rol
- guards backend por rol

La brecha actual es:

- autorizacion real todavia demasiado apoyada en `RoleCode`
- no existe catalogo de scopes para acceso funcional
- no existen overrides de usuario para seguridad
- no existe registry formal de modulos con permisos requeridos
- menu admin todavia filtra por rol, no por permisos efectivos
- la UI de seguridad integral aun no existe como sistema

## Guardrails De Desarrollo

Queda prohibido:

- permisos de texto libre creados desde UI
- scopes de texto libre creados desde UI
- modulos creados desde UI
- rutas creadas desde UI
- acceso basado solo en ocultar menu
- overrides sin expiracion
- hardcodear `if role === ...` como regla principal de seguridad
- borrar o renombrar `system roles`

Queda obligatorio:

- `default deny`
- catalogos canonicos por codigo
- auditoria de cambios sensibles
- validacion server-side
- documentar permisos nuevos junto con el modulo
- registrar por codigo cada modulo y su politica de acceso

## Migracion

La migracion debe hacerse por fases:

1. formalizar catalogos y contratos compartidos
2. extender persistencia para roles, scopes, overrides y menu administrable
3. introducir resolucion de permisos efectivos en backend
4. migrar guards y navegacion desde rol a permiso
5. construir UI de seguridad en admin
6. migrar surfaces externas al portal autenticado unificado
7. retirar gradualmente decisiones legacy basadas en rol puro

Durante la migracion:

- se permite compatibilidad temporal con `adminAccessRoles`;
- no se rompe el admin actual en un solo corte;
- cada fase debe dejar pruebas, auditoria y documentacion actualizada.
