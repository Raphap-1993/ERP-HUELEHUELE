# ADR-003: Control De Acceso Unificado Y Navegacion Derivada

Fecha: 2026-06-09.

## Estado

Aprobado.

## Contexto

El repo ya tiene una base parcial de acceso:

- `users`, `roles`, `user_roles`, `permissions` y `role_permissions` en Prisma;
- guards y navegación filtrada por `RoleCode`;
- cuentas internas, cliente, vendedor y mayorista bajo el mismo backend.

Pero esa base sigue incompleta para una operación administrable y robusta porque:

- la autorización real depende todavía demasiado de rol hardcodeado;
- no existe catálogo canónico de scopes funcionales;
- no existen overrides de usuario temporales auditados;
- el menú se deriva de listas y arrays estáticos, no de permisos efectivos;
- negocio necesita administrar acceso desde UI sin abrir la puerta a permisos ambiguos o módulos inventados.

## Decisión

Se adopta un modelo unificado de:

- `RBAC`
- `permissions`
- `scope`
- `user overrides` temporales auditados

Reglas derivadas:

- `apps/api` es la autoridad final de autorización;
- `permissions` y `scopes` salen de catálogos canonicos por código;
- `modules` y `routes` se registran por código, no por UI;
- el admin puede gestionar usuarios, roles, asignaciones, overrides y visibilidad de menú;
- los usuarios heredan acceso principalmente por roles;
- los overrides existen solo como excepción temporal con expiración obligatoria;
- la navegación se deriva de permisos efectivos y no otorga acceso por sí sola;
- el sistema opera con `default deny`.

## Consecuencias

Positivas:

- unifica admin interno y portal autenticado bajo una sola semántica de acceso;
- permite administración real desde backoffice sin volver inseguro el sistema;
- reduce lógica dispersa tipo `if role === ...`;
- mejora auditoría y trazabilidad operativa.

Costos aceptados:

- requiere ampliar schema, contratos de sesión, guards y menú;
- obliga a una migración gradual desde `RoleCode` puro;
- exige pruebas negativas y smoke de autorización en cada corte.

## Guardrails

- no permitir permisos libres creados desde UI;
- no permitir scopes libres creados desde UI;
- no permitir módulos ni rutas creadas desde UI;
- no borrar ni renombrar `system roles`;
- no usar overrides sin fecha de expiración;
- no asumir que ocultar menú equivale a seguridad.

## Implementación Referente

La especificación canónica vive en:

- [Control De Acceso Y Gobernanza De Navegacion](./access-control-and-navigation-governance.md)
